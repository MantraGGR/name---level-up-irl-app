from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel, EmailStr

try:
    from ..models.user import UserProfile
    from ..models.enums import LifePillar
except ImportError:
    from models.user import UserProfile
    from models.enums import LifePillar

router = APIRouter(prefix="/users", tags=["users"])


class UserCreate(BaseModel):
    email: EmailStr
    user_id: str
    full_name: Optional[str] = None


class UserResponse(BaseModel):
    user_id: str
    email: str
    username: str
    full_name: Optional[str] = None
    level: int
    xp: int
    coins: int
    life_pillar_levels: dict
    total_xp: dict


@router.post("/", response_model=UserResponse)
async def create_user(user_data: UserCreate):
    """Create a new user"""
    # Check if user already exists
    existing = await UserProfile.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    # Create new user
    user = UserProfile(
        user_id=user_data.user_id,
        email=user_data.email,
        full_name=user_data.full_name
    )
    await user.insert()
    
    return UserResponse(
        user_id=user.user_id,
        email=user.email,
        username=user.user_id,  # Use user_id as username
        full_name=user.full_name,
        level=1,
        xp=0,
        coins=0,
        life_pillar_levels=user.life_pillar_levels,
        total_xp=user.total_xp
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    """Get user by ID"""
    user = await UserProfile.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        user_id=user.user_id,
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        level=max(user.life_pillar_levels.values()),
        xp=sum(user.total_xp.values()),
        coins=0,
        life_pillar_levels=user.life_pillar_levels,
        total_xp=user.total_xp
    )


@router.get("/", response_model=List[UserResponse])
async def list_users(limit: int = 10):
    """List all users"""
    users = await UserProfile.find_all().limit(limit).to_list()
    
    return [
        UserResponse(
            user_id=user.user_id,
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            level=max(user.life_pillar_levels.values()),
            xp=sum(user.total_xp.values()),
            coins=0,
            life_pillar_levels=user.life_pillar_levels,
            total_xp=user.total_xp
        )
        for user in users
    ]


@router.post("/{user_id}/xp")
async def add_xp(user_id: str, pillar: LifePillar, amount: int):
    """Add XP to a user's life pillar"""
    user = await UserProfile.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Add XP
    user.total_xp[pillar] = user.total_xp.get(pillar, 0) + amount
    
    # Check for level up (100 XP per level)
    new_level = user.total_xp[pillar] // 100 + 1
    if new_level > user.life_pillar_levels[pillar]:
        user.life_pillar_levels[pillar] = new_level
    
    await user.save()
    
    return {
        "user_id": user_id,
        "pillar": pillar,
        "xp_added": amount,
        "total_xp": user.total_xp[pillar],
        "level": user.life_pillar_levels[pillar],
        "leveled_up": new_level > user.life_pillar_levels[pillar]
    }
