from enum import Enum


class LifePillar(str, Enum):
    HEALTH = "health"
    CAREER = "career"
    RELATIONSHIPS = "relationships"
    PERSONAL_GROWTH = "personal_growth"
    FINANCE = "finance"
    RECREATION = "recreation"


class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class EquipmentType(str, Enum):
    HELMET = "helmet"
    ARMOR = "armor"
    WEAPON = "weapon"
    ACCESSORY = "accessory"
    OUTFIT = "outfit"
