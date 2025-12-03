from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
import certifi

try:
    from .config import settings
except ImportError:
    from config import settings

mongodb_client: AsyncIOMotorClient = None
db_initialized: bool = False


async def init_db():
    """Initialize database connection"""
    global mongodb_client, db_initialized
    
    print(f"[DB] Attempting to connect to MongoDB: {settings.mongodb_url[:50]}...")
    
    # Check if using local MongoDB (no SSL needed) or Atlas (SSL required)
    # Docker uses service name "mongodb", also check for absence of mongodb+srv (Atlas)
    is_local = (
        "localhost" in settings.mongodb_url or 
        "127.0.0.1" in settings.mongodb_url or
        "mongodb://" in settings.mongodb_url  # Standard mongodb:// is local/docker, Atlas uses mongodb+srv://
    )
    
    if is_local:
        # Local MongoDB - no SSL
        mongodb_client = AsyncIOMotorClient(
            settings.mongodb_url,
            serverSelectionTimeoutMS=10000
        )
    else:
        # MongoDB Atlas - use SSL with certifi
        mongodb_client = AsyncIOMotorClient(
            settings.mongodb_url,
            tlsCAFile=certifi.where(),
            tlsAllowInvalidCertificates=True,
            serverSelectionTimeoutMS=10000
        )
    
    # Test connection
    await mongodb_client.admin.command('ping')
    print("[DB] MongoDB ping successful")
    
    database = mongodb_client[settings.mongodb_db_name]
    
    # Import all models
    try:
        from .models.user import UserProfile
        from .models.calendar import CalendarEvent, ActionStep
        from .models.avatar import AvatarConfiguration, Equipment
        from .models.assessment import AssessmentResults
    except ImportError:
        from models.user import UserProfile
        from models.calendar import CalendarEvent, ActionStep
        from models.avatar import AvatarConfiguration, Equipment
        from models.assessment import AssessmentResults
    
    # Initialize Beanie
    await init_beanie(
        database=database,
        document_models=[
            UserProfile,
            CalendarEvent,
            ActionStep,
            AvatarConfiguration,
            Equipment,
            AssessmentResults
        ]
    )
    
    db_initialized = True
    print(f"✓ Connected to MongoDB: {settings.mongodb_db_name}")
    print(f"[DB] Beanie initialized with document models")


async def close_db():
    """Close database connection"""
    global mongodb_client
    if mongodb_client:
        mongodb_client.close()
        print("✓ Closed MongoDB connection")


def get_database():
    """Get database instance"""
    return mongodb_client[settings.mongodb_db_name]
