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


class OnboardingComplete(BaseModel):
    display_name: Optional[str] = None
    pillar_scores: Optional[Dict[str, int]] = None


def calculate_onboarding_boosts(pillar_scores: Dict[str, int], mental_health: Dict[str, int]) -> Dict:
    """
    Calculate XP boosts and levels based on onboarding assessment.
    
    Algorithm:
    - Base XP: pillar_score * 15 (0-120 XP per pillar, max score is 8)
    - Honesty bonus: If user admits struggles (low scores), give bonus XP for self-awareness
    - Balance bonus: If scores are balanced across pillars, give bonus
    - Challenge boost: Lower scoring pillars get XP multiplier to encourage improvement
    - Mental health consideration: Adjust difficulty/XP rewards based on ADHD/anxiety/depression
    """
    boosts = {
        "base_xp": {},
        "honesty_bonus": {},
        "challenge_boost": {},
        "balance_bonus": 0,
        "total_xp": {},
        "levels": {},
        "xp_multiplier": 1.0,  # Global XP multiplier for future tasks
        "recommended_task_size": "medium",  # small/medium/large
    }
    
    if not pillar_scores:
        return boosts
    
    scores = list(pillar_scores.values())
    avg_score = sum(scores) / len(scores) if scores else 4
    min_score = min(scores) if scores else 0
    max_score = max(scores) if scores else 8
    score_variance = max_score - min_score
    
    for pillar, score in pillar_scores.items():
        # Base XP: score * 15 (0-120 range)
        base = score * 15
        boosts["base_xp"][pillar] = base
        
        # Honesty bonus: Low scores (0-2) get +25 XP for self-awareness
        honesty = 25 if score <= 2 else (15 if score <= 3 else 0)
        boosts["honesty_bonus"][pillar] = honesty
        
        # Challenge boost: Pillars below average get bonus XP to encourage work
        # The lower the score relative to average, the higher the boost
        if score < avg_score:
            challenge = int((avg_score - score) * 10)
        else:
            challenge = 0
        boosts["challenge_boost"][pillar] = challenge
        
        # Total XP for this pillar
        total = base + honesty + challenge
        boosts["total_xp"][pillar] = total
        
        # Calculate level (100 XP per level, minimum level 1)
        boosts["levels"][pillar] = max(1, total // 100 + 1)
    
    # Balance bonus: If pillars are balanced (low variance), give flat bonus
    if score_variance <= 2:
        boosts["balance_bonus"] = 50  # Add to all pillars
        for pillar in boosts["total_xp"]:
            boosts["total_xp"][pillar] += 50
            boosts["levels"][pillar] = max(1, boosts["total_xp"][pillar] // 100 + 1)
    
    # Mental health adjustments for future task XP
    adhd = mental_health.get("adhd", 0)
    anxiety = mental_health.get("anxiety", 0)
    depression = mental_health.get("depression", 0)
    
    # Higher mental health scores = more challenges = higher XP multiplier as reward
    mental_total = adhd + anxiety + depression
    if mental_total >= 15:
        boosts["xp_multiplier"] = 1.5  # 50% more XP for completing tasks
        boosts["recommended_task_size"] = "small"  # Recommend smaller tasks
    elif mental_total >= 8:
        boosts["xp_multiplier"] = 1.25
        boosts["recommended_task_size"] = "medium"
    else:
        boosts["xp_multiplier"] = 1.0
        boosts["recommended_task_size"] = "large"
    
    return boosts


@router.post("/complete-onboarding/{user_id}")
async def complete_onboarding(user_id: str, data: Optional[OnboardingComplete] = None):
    """Mark user onboarding as complete after taking the quiz"""
    try:
        from ..models.user import UserProfile
        from ..models.enums import LifePillar
    except ImportError:
        from models.user import UserProfile
        from models.enums import LifePillar
    
    user = await UserProfile.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.has_completed_onboarding = True
    
    # Update display name if provided
    if data and data.display_name:
        user.full_name = data.display_name
    
    # Get mental health scores from latest assessment
    assessment = await AssessmentResults.find_one({"user_id": user_id})
    mental_health = {
        "adhd": assessment.adhd_score or 0 if assessment else 0,
        "anxiety": assessment.anxiety_score or 0 if assessment else 0,
        "depression": assessment.depression_score or 0 if assessment else 0,
    }
    
    # Calculate boosts using the algorithm
    boosts = calculate_onboarding_boosts(
        data.pillar_scores if data else {},
        mental_health
    )
    
    # Apply XP and levels to user
    pillar_mapping = {
        'health': LifePillar.HEALTH,
        'finance': LifePillar.FINANCE,
        'relationships': LifePillar.RELATIONSHIPS,
        'career': LifePillar.CAREER,
        'personal_growth': LifePillar.PERSONAL_GROWTH,
        'recreation': LifePillar.RECREATION,
    }
    
    for key, pillar in pillar_mapping.items():
        if key in boosts["total_xp"]:
            user.total_xp[pillar] = boosts["total_xp"][key]
            user.life_pillar_levels[pillar] = boosts["levels"][key]
    
    # Store XP multiplier in preferences for future use
    user.preferences.xp_multiplier = boosts["xp_multiplier"]
    user.preferences.recommended_task_size = boosts["recommended_task_size"]
    
    await user.save()
    
    return {
        "message": "Onboarding completed", 
        "user_id": user_id, 
        "display_name": user.full_name,
        "boosts": boosts,
        "summary": {
            "total_starting_xp": sum(boosts["total_xp"].values()),
            "xp_multiplier": boosts["xp_multiplier"],
            "recommended_task_size": boosts["recommended_task_size"],
            "balance_bonus_applied": boosts["balance_bonus"] > 0
        }
    }
