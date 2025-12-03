from beanie import Document
from pydantic import Field
from typing import Optional, List
from datetime import datetime

try:
    from .enums import LifePillar, Priority
except ImportError:
    from enums import LifePillar, Priority


class CalendarEvent(Document):
    user_id: str
    event_id: str  # Google Calendar event ID
    
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    attendees: List[str] = []
    
    # Life pillar categorization
    life_pillar_tags: List[LifePillar] = []
    
    # Sync metadata
    last_synced: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "calendar_events"
        indexes = ["user_id", "event_id", "start_time"]


class ActionStep(Document):
    user_id: str
    step_id: str = Field(default_factory=lambda: str(datetime.utcnow().timestamp()))
    
    title: str
    description: str
    estimated_duration: int  # minutes
    
    life_pillar: LifePillar
    priority: Priority = Priority.MEDIUM
    
    # Rewards
    xp_reward: int = 10
    
    # Status
    completed: bool = False
    completed_at: Optional[datetime] = None
    due_date: Optional[datetime] = None
    
    # AI generation metadata
    generated_by_ai: bool = False
    source_event_id: Optional[str] = None  # If generated from calendar event
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "action_steps"
        indexes = ["user_id", "completed", "life_pillar", "due_date"]
