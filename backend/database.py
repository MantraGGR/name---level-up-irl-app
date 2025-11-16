from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

try:
    from .config import settings
except ImportError:
    from config import settings

mongodb_client: AsyncIOMotorClient = None


async def init_db():
    """Initialize database connection"""
    global mongodb_client
    
    mongodb_client = AsyncIOMotorClient(settings.mongodb_url)
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
    
    print(f"✓ Connected to MongoDB: {settings.mongodb_db_name}")


async def close_db():
    """Close database connection"""
    global mongodb_client
    if mongodb_client:
        mongodb_client.close()
        print("✓ Closed MongoDB connection")


def get_database():
    """Get database instance"""
    return mongodb_client[settings.mongodb_db_name]
