from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from beanie import Document

try:
    from ..models.user import UserProfile
    from ..models.enums import LifePillar
except ImportError:
    from models.user import UserProfile
    from models.enums import LifePillar

router = APIRouter(prefix="/ultimate-goals", tags=["ultimate-goals"])


class UltimateMilestone(BaseModel):
    id: str
    title: str
    description: str
    order: int
    xp_reward: int
    is_completed: bool = False
    completed_at: Optional[datetime] = None


class UltimateGoal(Document):
    user_id: str
    pillar: LifePillar
    title: str
    description: str
    icon: str
    milestones: List[UltimateMilestone] = []
    current_milestone_index: int = 0
    total_xp_earned: int = 0
    is_completed: bool = False
    is_custom: bool = False  # True for user-created goals
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "ultimate_goals"
        indexes = ["user_id", "pillar"]


# Predefined Ultimate Goals for each pillar
ULTIMATE_GOALS = {
    LifePillar.FINANCE: {
        "title": "$20M Net Worth",
        "description": "Build generational wealth and achieve complete financial freedom",
        "icon": "💎",
        "milestones": [
            {"title": "Emergency Fund", "description": "Save 6 months of expenses ($10K+)", "xp": 200},
            {"title": "Debt Free", "description": "Pay off all consumer debt", "xp": 300},
            {"title": "First $100K", "description": "Reach $100,000 net worth", "xp": 500},
            {"title": "Six Figures Saved", "description": "Have $100K in investments", "xp": 400},
            {"title": "First Business", "description": "Start a profitable side business", "xp": 600},
            {"title": "Quarter Millionaire", "description": "Reach $250,000 net worth", "xp": 500},
            {"title": "Half Millionaire", "description": "Reach $500,000 net worth", "xp": 600},
            {"title": "Millionaire", "description": "Join the two comma club - $1,000,000", "xp": 1000},
            {"title": "Multi-Millionaire", "description": "Reach $5,000,000 net worth", "xp": 1500},
            {"title": "Deca-Millionaire", "description": "Reach $10,000,000 net worth", "xp": 2000},
            {"title": "Ultimate Wealth", "description": "Achieve $20,000,000 net worth", "xp": 5000},
        ]
    },
    LifePillar.HEALTH: {
        "title": "Top 1% Athlete",
        "description": "Achieve elite physical performance in the top 1% of your age group",
        "icon": "🏆",
        "milestones": [
            {"title": "Consistent Training", "description": "Work out 4x/week for 3 months straight", "xp": 200},
            {"title": "Basic Strength", "description": "Bench 135lbs, Squat 185lbs, Deadlift 225lbs", "xp": 300},
            {"title": "Run a 5K", "description": "Complete a 5K run without stopping", "xp": 250},
            {"title": "Intermediate Lifts", "description": "Bench 185lbs, Squat 275lbs, Deadlift 315lbs", "xp": 400},
            {"title": "Sub-25 5K", "description": "Run a 5K in under 25 minutes", "xp": 350},
            {"title": "Advanced Strength", "description": "Bench 225lbs, Squat 315lbs, Deadlift 405lbs", "xp": 500},
            {"title": "Half Marathon", "description": "Complete a half marathon", "xp": 450},
            {"title": "Elite Lifts", "description": "Bench 275lbs, Squat 405lbs, Deadlift 495lbs", "xp": 700},
            {"title": "Sub-20 5K", "description": "Run a 5K in under 20 minutes", "xp": 600},
            {"title": "1000lb Club", "description": "Combined Bench+Squat+Deadlift over 1000lbs", "xp": 800},
            {"title": "Top 1% Athlete", "description": "Achieve elite status in strength AND endurance", "xp": 2000},
        ]
    },
    LifePillar.CAREER: {
        "title": "Industry Leader",
        "description": "Become a recognized leader and expert in your field",
        "icon": "👔",
        "milestones": [
            {"title": "Skill Foundation", "description": "Master the core skills of your profession", "xp": 200},
            {"title": "First Promotion", "description": "Get promoted or level up in your career", "xp": 300},
            {"title": "Industry Certification", "description": "Earn a respected certification in your field", "xp": 350},
            {"title": "Mentor Others", "description": "Start mentoring junior colleagues", "xp": 250},
            {"title": "Six Figure Salary", "description": "Reach $100K+ annual income", "xp": 500},
            {"title": "Leadership Role", "description": "Become a team lead or manager", "xp": 450},
            {"title": "Public Speaking", "description": "Speak at an industry conference", "xp": 400},
            {"title": "Published Expert", "description": "Publish articles or a book in your field", "xp": 500},
            {"title": "Executive Level", "description": "Reach director/VP level or equivalent", "xp": 700},
            {"title": "Board/Advisory", "description": "Join a board or become an advisor", "xp": 600},
            {"title": "Industry Leader", "description": "Recognized as a top expert in your field", "xp": 1500},
        ]
    },
    LifePillar.RELATIONSHIPS: {
        "title": "Inner Circle of 10",
        "description": "Build deep, meaningful relationships with 10 ride-or-die people",
        "icon": "💫",
        "milestones": [
            {"title": "Self-Awareness", "description": "Understand your attachment style and patterns", "xp": 150},
            {"title": "Communication Skills", "description": "Master active listening and vulnerability", "xp": 200},
            {"title": "First Deep Friend", "description": "Develop one truly deep friendship", "xp": 300},
            {"title": "Family Healing", "description": "Improve or make peace with family relationships", "xp": 350},
            {"title": "Romantic Partner", "description": "Find a healthy, loving romantic relationship", "xp": 400},
            {"title": "Friend Group", "description": "Build a core group of 3-4 close friends", "xp": 350},
            {"title": "Community Leader", "description": "Become someone others look up to", "xp": 300},
            {"title": "Mentor Relationship", "description": "Have both a mentor and be a mentor", "xp": 250},
            {"title": "Support Network", "description": "Have 7+ people you can call at 3am", "xp": 400},
            {"title": "Legacy Relationships", "description": "Relationships that will last decades", "xp": 450},
            {"title": "Inner Circle", "description": "10 ride-or-die people in your life", "xp": 1000},
        ]
    },
    LifePillar.PERSONAL_GROWTH: {
        "title": "Renaissance Human",
        "description": "Master multiple disciplines and achieve self-actualization",
        "icon": "🧠",
        "milestones": [
            {"title": "Reading Habit", "description": "Read 12 books in a year", "xp": 200},
            {"title": "Meditation Practice", "description": "Meditate daily for 90 days", "xp": 250},
            {"title": "New Language", "description": "Become conversational in a new language", "xp": 400},
            {"title": "Creative Skill", "description": "Learn an instrument, art, or creative skill", "xp": 350},
            {"title": "Public Speaking", "description": "Overcome fear and speak confidently", "xp": 300},
            {"title": "Therapy/Coaching", "description": "Complete a year of therapy or coaching", "xp": 350},
            {"title": "Teaching Others", "description": "Teach a skill or course to others", "xp": 300},
            {"title": "Second Mastery", "description": "Become proficient in a second field", "xp": 500},
            {"title": "Wisdom Seeker", "description": "Study philosophy, psychology, spirituality", "xp": 400},
            {"title": "Life Philosophy", "description": "Develop your own coherent life philosophy", "xp": 450},
            {"title": "Renaissance Human", "description": "Multi-disciplinary mastery achieved", "xp": 1500},
        ]
    },
    LifePillar.RECREATION: {
        "title": "Life Maximizer",
        "description": "Experience the richness of life through adventure and play",
        "icon": "🌍",
        "milestones": [
            {"title": "New Hobby", "description": "Pick up and stick with a new hobby", "xp": 150},
            {"title": "Solo Adventure", "description": "Take a solo trip or adventure", "xp": 200},
            {"title": "Bucket List Start", "description": "Complete 3 bucket list items", "xp": 250},
            {"title": "Skill Hobby", "description": "Get good at a recreational skill (golf, chess, etc)", "xp": 300},
            {"title": "10 Countries", "description": "Visit 10 different countries", "xp": 400},
            {"title": "Extreme Sport", "description": "Try skydiving, scuba, or similar", "xp": 350},
            {"title": "Create Something", "description": "Build, make, or create something lasting", "xp": 300},
            {"title": "25 Countries", "description": "Visit 25 different countries", "xp": 500},
            {"title": "Master Hobbyist", "description": "Become excellent at a recreational pursuit", "xp": 400},
            {"title": "Epic Experience", "description": "Have a once-in-a-lifetime experience", "xp": 450},
            {"title": "Life Maximizer", "description": "Living life to the absolute fullest", "xp": 1000},
        ]
    },
}



@router.post("/initialize/{user_id}")
async def initialize_ultimate_goals(user_id: str):
    """Create all ultimate goals for a new user"""
    user = await UserProfile.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    created = []
    for pillar, goal_data in ULTIMATE_GOALS.items():
        # Check if already exists
        existing = await UltimateGoal.find_one({"user_id": user_id, "pillar": pillar})
        if existing:
            continue
        
        milestones = [
            UltimateMilestone(
                id=f"{pillar.value}_{i}",
                title=m["title"],
                description=m["description"],
                order=i,
                xp_reward=m["xp"]
            )
            for i, m in enumerate(goal_data["milestones"])
        ]
        
        goal = UltimateGoal(
            user_id=user_id,
            pillar=pillar,
            title=goal_data["title"],
            description=goal_data["description"],
            icon=goal_data["icon"],
            milestones=milestones
        )
        await goal.insert()
        created.append(pillar.value)
    
    return {"message": f"Initialized {len(created)} ultimate goals", "pillars": created}


@router.get("/user/{user_id}")
async def get_ultimate_goals(user_id: str):
    """Get all ultimate goals for a user"""
    goals = await UltimateGoal.find({"user_id": user_id}).to_list()
    
    # If no goals exist, initialize them
    if not goals:
        await initialize_ultimate_goals(user_id)
        goals = await UltimateGoal.find({"user_id": user_id}).to_list()
    
    return [
        {
            "id": str(g.id),
            "pillar": g.pillar.value,
            "title": g.title,
            "description": g.description,
            "icon": g.icon,
            "milestones": [
                {
                    "id": m.id,
                    "title": m.title,
                    "description": m.description,
                    "order": m.order,
                    "xp_reward": m.xp_reward,
                    "is_completed": m.is_completed
                }
                for m in g.milestones
            ],
            "current_milestone_index": g.current_milestone_index,
            "progress_percent": (g.current_milestone_index / len(g.milestones) * 100) if g.milestones else 0,
            "total_xp_earned": g.total_xp_earned,
            "is_completed": g.is_completed,
            "is_custom": getattr(g, 'is_custom', False)
        }
        for g in goals
    ]


class CreateCustomGoalRequest(BaseModel):
    title: str
    description: str
    pillar: str
    icon: str = "🎯"


async def generate_custom_roadmap_with_ai(title: str, description: str, pillar: LifePillar, user_level: int) -> List[dict]:
    """Use AI to generate milestones for a custom ultimate goal"""
    import httpx
    import json
    
    try:
        from ..config import settings
    except ImportError:
        from config import settings
    
    prompt = f"""You are a life coach creating a roadmap for someone's ultimate life goal.

Goal: {title}
Description: {description}
Life area: {pillar.value.replace('_', ' ')}
User's current level: {user_level}

Create 8-12 progressive milestones that build toward this ultimate goal. Each milestone should be a significant achievement.

Return ONLY valid JSON array:
[
    {{"title": "First milestone", "description": "What this involves", "xp": 200}},
    {{"title": "Second milestone", "description": "Building on the first", "xp": 300}},
    // ... more milestones, increasing in difficulty
    {{"title": "Final milestone - Goal Achieved", "description": "The ultimate achievement", "xp": 2000}}
]

Make milestones:
- Specific and measurable
- Progressive (each builds on previous)
- Realistic but ambitious
- XP rewards: 150-500 for early milestones, 500-2000 for later ones
"""
    
    if not settings.gemini_api_key:
        return generate_default_milestones(title)
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={settings.gemini_api_key}",
                json={"contents": [{"parts": [{"text": prompt}]}]},
                timeout=30.0
            )
            
            if response.status_code == 200:
                result = response.json()
                text = result["candidates"][0]["content"]["parts"][0]["text"]
                start = text.find("[")
                end = text.rfind("]") + 1
                if start >= 0 and end > start:
                    return json.loads(text[start:end])
    except Exception as e:
        print(f"[ULTIMATE_GOALS] AI generation failed: {e}")
    
    return generate_default_milestones(title)


def generate_default_milestones(title: str) -> List[dict]:
    """Fallback milestones when AI is unavailable"""
    return [
        {"title": "Research & Learn", "description": f"Study what it takes to achieve: {title}", "xp": 150},
        {"title": "Create Your Plan", "description": "Develop a detailed action plan", "xp": 200},
        {"title": "Build Foundation", "description": "Develop core skills and resources", "xp": 250},
        {"title": "First Major Step", "description": "Take significant action toward your goal", "xp": 300},
        {"title": "Early Win", "description": "Achieve your first tangible result", "xp": 350},
        {"title": "Build Momentum", "description": "Consistently make progress", "xp": 400},
        {"title": "Overcome Obstacles", "description": "Push through challenges", "xp": 450},
        {"title": "Major Milestone", "description": "Reach a significant checkpoint", "xp": 600},
        {"title": "Final Push", "description": "The last stretch toward your goal", "xp": 800},
        {"title": "Goal Achieved!", "description": f"You did it: {title}", "xp": 2000},
    ]


@router.post("/create-custom/{user_id}")
async def create_custom_ultimate_goal(user_id: str, request: CreateCustomGoalRequest):
    """Create a custom ultimate goal with AI-generated roadmap"""
    user = await UserProfile.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    try:
        pillar = LifePillar(request.pillar)
    except ValueError:
        pillar = LifePillar.PERSONAL_GROWTH
    
    user_level = user.life_pillar_levels.get(pillar, 1)
    
    # Generate milestones with AI
    milestone_data = await generate_custom_roadmap_with_ai(
        request.title, request.description, pillar, user_level
    )
    
    milestones = [
        UltimateMilestone(
            id=f"custom_{pillar.value}_{i}_{datetime.utcnow().timestamp()}",
            title=m["title"],
            description=m["description"],
            order=i,
            xp_reward=m.get("xp", 200 + i * 100)
        )
        for i, m in enumerate(milestone_data)
    ]
    
    goal = UltimateGoal(
        user_id=user_id,
        pillar=pillar,
        title=request.title,
        description=request.description,
        icon=request.icon,
        milestones=milestones,
        is_custom=True
    )
    await goal.insert()
    
    return {
        "id": str(goal.id),
        "title": goal.title,
        "pillar": pillar.value,
        "milestones_count": len(milestones),
        "first_milestone": milestones[0].title if milestones else None
    }


@router.delete("/{goal_id}")
async def delete_ultimate_goal(goal_id: str):
    """Delete a custom ultimate goal"""
    from bson import ObjectId
    
    goal = await UltimateGoal.find_one({"_id": ObjectId(goal_id)})
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    # Only allow deleting custom goals
    if not getattr(goal, 'is_custom', False):
        raise HTTPException(status_code=400, detail="Cannot delete predefined goals")
    
    await goal.delete()
    return {"message": "Goal deleted"}


@router.post("/complete/{goal_id}/{milestone_id}")
async def complete_ultimate_milestone(goal_id: str, milestone_id: str):
    """Complete a milestone in an ultimate goal"""
    from bson import ObjectId
    
    goal = await UltimateGoal.find_one({"_id": ObjectId(goal_id)})
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    # Find milestone
    milestone_index = None
    for i, m in enumerate(goal.milestones):
        if m.id == milestone_id:
            milestone_index = i
            break
    
    if milestone_index is None:
        raise HTTPException(status_code=404, detail="Milestone not found")
    
    milestone = goal.milestones[milestone_index]
    
    if milestone.is_completed:
        raise HTTPException(status_code=400, detail="Already completed")
    
    # Must complete in order
    if milestone_index > 0 and not goal.milestones[milestone_index - 1].is_completed:
        raise HTTPException(status_code=400, detail="Complete previous milestone first")
    
    # Complete it
    milestone.is_completed = True
    milestone.completed_at = datetime.utcnow()
    goal.total_xp_earned += milestone.xp_reward
    goal.current_milestone_index = milestone_index + 1
    
    # Check if goal complete
    if milestone_index == len(goal.milestones) - 1:
        goal.is_completed = True
    
    await goal.save()
    
    # Award XP
    user = await UserProfile.find_one({"user_id": goal.user_id})
    leveled_up = False
    new_level = 1
    if user:
        pillar = goal.pillar
        user.total_xp[pillar] = user.total_xp.get(pillar, 0) + milestone.xp_reward
        new_level = (user.total_xp[pillar] // 100) + 1
        if new_level > user.life_pillar_levels.get(pillar, 1):
            user.life_pillar_levels[pillar] = new_level
            leveled_up = True
        await user.save()
    
    return {
        "message": "Milestone completed!",
        "milestone": milestone.title,
        "xp_earned": milestone.xp_reward,
        "pillar": goal.pillar.value,
        "goal_completed": goal.is_completed,
        "leveled_up": leveled_up,
        "new_level": new_level if leveled_up else None,
        "next_milestone": goal.milestones[milestone_index + 1].title if milestone_index + 1 < len(goal.milestones) else None
    }
