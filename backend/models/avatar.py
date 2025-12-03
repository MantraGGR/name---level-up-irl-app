from beanie import Document
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

try:
    from .enums import EquipmentType, LifePillar
except ImportError:
    from enums import EquipmentType, LifePillar


class FaceScanData(BaseModel):
    scan_image_url: Optional[str] = None
    mesh_data: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AnimationConfig(BaseModel):
    animation_name: str
    animation_path: str
    trigger_condition: str


class Equipment(Document):
    item_id: str = Field(..., unique=True)
    name: str
    type: EquipmentType
    
    # Level requirements per pillar
    required_level: Dict[LifePillar, int] = {}
    
    # 3D model info
    asset_path: str  # Changed from model_path to avoid Pydantic warning
    texture_path: Optional[str] = None
    
    # Unlock conditions
    unlock_condition: str
    is_default: bool = False
    
    # Metadata
    description: Optional[str] = None
    rarity: str = "common"  # common, rare, epic, legendary
    
    class Settings:
        name = "equipment"
        indexes = ["item_id", "type"]
    
    class Config:
        protected_namespaces = ()


class AvatarConfiguration(Document):
    user_id: str = Field(..., unique=True)
    
    # Base model
    base_model_path: str = "/models/default_avatar.glb"  # Changed from model_path
    
    # Face customization
    face_scan_data: Optional[FaceScanData] = None
    
    # Equipped items
    equipped_items: List[str] = []  # List of equipment item_ids
    
    # Animations
    animations: List[AnimationConfig] = []
    
    # Custom properties
    customizations: Dict[str, Any] = {}
    
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "avatar_configurations"
        indexes = ["user_id"]
    
    class Config:
        protected_namespaces = ()
