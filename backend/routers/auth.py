from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from datetime import datetime, timedelta
from jose import jwt
import httpx

try:
    from ..config import settings
    from ..models.user import UserProfile, GoogleTokens
except ImportError:
    from config import settings
    from models.user import UserProfile, GoogleTokens

router = APIRouter(prefix="/auth", tags=["authentication"])


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str


def create_access_token(data: dict):
    """Create JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return encoded_jwt


@router.get("/google/login")
async def google_login():
    """Redirect to Google OAuth login"""
    google_auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={settings.google_client_id}&"
        f"redirect_uri={settings.google_redirect_uri}&"
        f"response_type=code&"
        f"scope=openid email profile&"
        f"access_type=offline&"
        f"prompt=consent"
    )
    return RedirectResponse(url=google_auth_url)


@router.get("/google/callback")
async def google_callback(code: str):
    """Handle Google OAuth callback"""
    # Exchange code for tokens
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": settings.google_redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        
        if token_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get access token")
        
        tokens = token_response.json()
        access_token = tokens.get("access_token")
        refresh_token = tokens.get("refresh_token")
        
        # Get user info from Google
        user_info_response = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        
        if user_info_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user info")
        
        user_info = user_info_response.json()
        email = user_info.get("email")
        name = user_info.get("name")
        google_id = user_info.get("id")
    
    # Check if user exists
    user = await UserProfile.find_one({"email": email})
    
    if not user:
        # Create new user
        user = UserProfile(
            user_id=google_id,
            email=email,
            full_name=name,
            google_tokens=GoogleTokens(
                access_token=access_token,
                refresh_token=refresh_token,
                token_expiry=datetime.utcnow() + timedelta(seconds=tokens.get("expires_in", 3600))
            )
        )
        await user.insert()
    else:
        # Update tokens
        user.google_tokens = GoogleTokens(
            access_token=access_token,
            refresh_token=refresh_token or user.google_tokens.refresh_token if user.google_tokens else None,
            token_expiry=datetime.utcnow() + timedelta(seconds=tokens.get("expires_in", 3600))
        )
        await user.save()
    
    # Create JWT token for our app
    jwt_token = create_access_token({"sub": user.user_id, "email": user.email})
    
    # Redirect to frontend with token
    return RedirectResponse(url=f"http://localhost:3000/auth/success?token={jwt_token}")


@router.post("/token", response_model=TokenResponse)
async def login_with_token(token: str):
    """Verify JWT token and return user info"""
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        user_id = payload.get("sub")
        email = payload.get("email")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        return TokenResponse(
            access_token=token,
            user_id=user_id,
            email=email
        )
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.get("/me")
async def get_current_user(token: str):
    """Get current user from JWT token"""
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await UserProfile.find_one({"user_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "user_id": user.user_id,
            "email": user.email,
            "full_name": user.full_name,
            "life_pillar_levels": user.life_pillar_levels,
            "total_xp": user.total_xp
        }
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
