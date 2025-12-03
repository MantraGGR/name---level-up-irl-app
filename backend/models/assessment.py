from beanie import Document
from pydantic import Field
from typing import Optional, List
from datetime import datetime


class AssessmentResults(Document):
    user_id: str
    
    # Assessment scores
    adhd_score: Optional[int] = None
    anxiety_score: Optional[int] = None
    depression_score: Optional[int] = None
    
    # Raw responses (for future analysis)
    responses: dict = {}
    
    # Generated recommendations (will be AI-generated later)
    recommendations: List[str] = []
    
    completed_date: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "assessment_results"
        indexes = ["user_id", "completed_date"]
