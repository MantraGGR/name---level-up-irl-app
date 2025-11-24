from fastapi import APIRouter, HTTPException
from typing import Optional, Dict
from pydantic import BaseModel

try:
    from ..models.assessment import AssessmentResults
except ImportError:
    from models.assessment import AssessmentResults

router = APIRouter(prefix="/assessments", tags=["assessments"])


class AssessmentCreate(BaseModel):
    user_id: str
    adhd_score: Optional[int] = None
    anxiety_score: Optional[int] = None
    depression_score: Optional[int] = None
    responses: Dict = {}


class AssessmentResponse(BaseModel):
    id: str
    user_id: str
    adhd_score: Optional[int]
    anxiety_score: Optional[int]
    depression_score: Optional[int]
    recommendations: list


@router.post("/", response_model=AssessmentResponse)
async def create_assessment(assessment_data: AssessmentCreate):
    """Submit assessment results"""
    # Generate basic recommendations based on scores
    recommendations = []
    
    if assessment_data.adhd_score and assessment_data.adhd_score > 15:
        recommendations.append("Consider breaking tasks into smaller, manageable chunks")
        recommendations.append("Use timers and reminders for task management")
    
    if assessment_data.anxiety_score and assessment_data.anxiety_score > 15:
        recommendations.append("Practice mindfulness and breathing exercises")
        recommendations.append("Schedule regular breaks throughout the day")
    
    if assessment_data.depression_score and assessment_data.depression_score > 15:
        recommendations.append("Set small, achievable daily goals")
        recommendations.append("Maintain a consistent sleep schedule")
    
    assessment = AssessmentResults(
        user_id=assessment_data.user_id,
        adhd_score=assessment_data.adhd_score,
        anxiety_score=assessment_data.anxiety_score,
        depression_score=assessment_data.depression_score,
        responses=assessment_data.responses,
        recommendations=recommendations
    )
    await assessment.insert()
    
    return AssessmentResponse(
        id=str(assessment.id),
        user_id=assessment.user_id,
        adhd_score=assessment.adhd_score,
        anxiety_score=assessment.anxiety_score,
        depression_score=assessment.depression_score,
        recommendations=assessment.recommendations
    )


@router.get("/user/{user_id}", response_model=AssessmentResponse)
async def get_user_assessment(user_id: str):
    """Get latest assessment for a user"""
    assessment = await AssessmentResults.find(
        {"user_id": user_id}
    ).sort([("completed_date", -1)]).first_or_none()
    
    if not assessment:
        raise HTTPException(status_code=404, detail="No assessment found for this user")
    
    return AssessmentResponse(
        id=str(assessment.id),
        user_id=assessment.user_id,
        adhd_score=assessment.adhd_score,
        anxiety_score=assessment.anxiety_score,
        depression_score=assessment.depression_score,
        recommendations=assessment.recommendations
    )
