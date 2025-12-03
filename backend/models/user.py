from beanie import Document
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict
from datetime import datetime

try:
    from .enums import LifePillar
except ImportError:
    from enums import LifePillar


class GoogleTokens(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_expiry: datetime


class UserPreferences(BaseModel):
    theme: str = "default"
    notifications_enabled: bool = True
    calendar_sync_enabled: bool = True
    ai_recommendations_enabled: bool = True


class UserProfile(Document):
    user_id: str = Field(..., unique=True)
    email: EmailStr
    full_name: Optional[str] = None
    google_tokens: Optional[GoogleTokens] = None
    
    # Assessment results stored as references
    assessment_results: Dict[str, str] = {}  # assessment_type -> assessment_id
    
    # Life pillar progression
    life_pillar_levels: Dict[LifePillar, int] = {
        LifePillar.HEALTH: 1,
        LifePillar.CAREER: 1,
        LifePillar.RELATIONSHIPS: 1,
        LifePillar.PERSONAL_GROWTH: 1,
        LifePillar.FINANCE: 1,
        LifePillar.RECREATION: 1,
    }
    total_xp: Dict[LifePillar, int] = {
        LifePillar.HEALTH: 0,
        LifePillar.CAREER: 0,
        LifePillar.RELATIONSHIPS: 0,
        LifePillar.PERSONAL_GROWTH: 0,
        LifePillar.FINANCE: 0,
        LifePillar.RECREATION: 0,
    }
    
    # Avatar reference
    avatar_config_id: Optional[str] = None
    
    preferences: UserPreferences = Field(default_factory=UserPreferences)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "user_profiles"
        indexes = ["user_id", "email"]
