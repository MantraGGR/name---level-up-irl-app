from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from beanie import Document
import httpx
import json

try:
    from ..config import settings
    from ..models.user import UserProfile
    from ..models.enums import LifePillar
except ImportError:
    from config import settings
    from models.user import UserProfile
    from models.enums import LifePillar

router = APIRouter(prefix="/goals", tags=["goals"])


class MilestoneQuest(BaseModel):
    """A quest within a goal's roadmap"""
    id: str
    title: str
    description: str
    order: int
    xp_reward: int = 100
    is_completed: bool = False
    completed_at: Optional[datetime] = None
    unlocked: bool = False  # Only unlocked when previous quest is done


class LongTermGoal(Document):
    """A user's long-term life goal with AI-generated roadmap"""
    user_id: str
    
    # Goal details
    title: str  # e.g., "Make $10 million"
    description: str  # User's original input
    life_pillar: LifePillar
    
    # AI analysis
    ai_analysis: str  # AI's response about the goal
    estimated_timeframe: str  # e.g., "5-10 years"
    difficulty_rating: str  # ambitious, challenging, achievable
    
    # Quest roadmap
    milestones: List[MilestoneQuest] = []
    current_milestone_index: int = 0
    
    # Progress
    total_xp_earned: int = 0
    is_completed: bool = False
    completed_at: Optional[datetime] = None
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "long_term_goals"
        indexes = ["user_id", "life_pillar", "is_completed"]


class CreateGoalRequest(BaseModel):
    goal_description: str  # User's dream/goal in their own words
    life_pillar: str = "finance"


class GoalResponse(BaseModel):
    id: str
    title: str
    description: str
    life_pillar: str
    ai_analysis: str
    estimated_timeframe: str
    difficulty_rating: str
    milestones: List[dict]
    current_milestone_index: int
    progress_percent: float
    total_xp_earned: int
    is_completed: bool



async def generate_goal_roadmap_with_ai(goal_description: str, pillar: LifePillar, user: UserProfile) -> dict:
    """Use AI to analyze the goal and create a step-by-step roadmap"""
    
    user_level = user.life_pillar_levels.get(pillar, 1)
    
    prompt = f"""You are a life coach and strategic planner. A user has shared their long-term goal:

"{goal_description}"

Life area: {pillar.value.replace('_', ' ')}
User's current level in this area: {user_level}

Analyze this goal and create a realistic roadmap. Return ONLY valid JSON:
{{
    "title": "Short catchy title for the goal (max 50 chars)",
    "analysis": "2-3 sentences acknowledging the goal, its ambition level, and encouragement. Be supportive but realistic.",
    "timeframe": "Estimated time to achieve (e.g., '2-3 years', '5-10 years')",
    "difficulty": "One of: achievable, challenging, ambitious, legendary",
    "milestones": [
        {{
            "title": "First milestone title",
            "description": "What this milestone involves and why it matters",
            "xp_reward": 150
        }},
        // Include 5-8 milestones that progressively build toward the goal
        // Each should be a significant achievement, not a small task
        // Order them logically - each builds on the previous
    ]
}}

Example milestones for "$10 million" goal:
1. "Build Your Foundation" - Learn financial literacy, create budget, eliminate bad debt
2. "Start Your First Business" - Identify opportunity, create MVP, launch
3. "Land Your First Paying Customer" - Validate the business model
4. "Reach $10K Monthly Revenue" - Scale initial success
5. "Build a Team" - Hire first employees, delegate
6. "Hit $1 Million Net Worth" - Major milestone checkpoint
7. "Scale to $100K/Month" - Systematic growth
8. "Reach $10 Million" - The ultimate goal

Make milestones specific to their actual goal. XP rewards should range from 100-500 based on difficulty.
"""
    
    if not settings.gemini_api_key:
        return generate_default_roadmap(goal_description, pillar)
    
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
                # Extract JSON
                start = text.find("{")
                end = text.rfind("}") + 1
                if start >= 0 and end > start:
                    return json.loads(text[start:end])
    except Exception as e:
        print(f"[GOALS] AI generation failed: {e}")
    
    return generate_default_roadmap(goal_description, pillar)


def generate_default_roadmap(goal_description: str, pillar: LifePillar) -> dict:
    """Fallback roadmap when AI is unavailable"""
    return {
        "title": goal_description[:50],
        "analysis": "This is an exciting goal! Breaking it down into smaller milestones will help you stay motivated and track progress. Let's create a roadmap together.",
        "timeframe": "1-5 years",
        "difficulty": "challenging",
        "milestones": [
            {"title": "Research & Planning", "description": "Study what it takes to achieve this goal. Learn from others who've done it.", "xp_reward": 100},
            {"title": "Build Foundation", "description": "Develop the core skills and resources needed.", "xp_reward": 150},
            {"title": "Take First Action", "description": "Make your first real move toward the goal.", "xp_reward": 200},
            {"title": "Achieve First Win", "description": "Get your first tangible result or milestone.", "xp_reward": 250},
            {"title": "Scale & Grow", "description": "Build on your success and expand.", "xp_reward": 300},
            {"title": "Reach Your Goal", "description": "The final milestone - you made it!", "xp_reward": 500}
        ]
    }



@router.post("/create/{user_id}")
async def create_long_term_goal(user_id: str, request: CreateGoalRequest):
    """Create a new long-term goal with AI-generated roadmap"""
    user = await UserProfile.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Parse pillar
    try:
        pillar = LifePillar(request.life_pillar)
    except ValueError:
        pillar = LifePillar.PERSONAL_GROWTH
    
    # Generate roadmap with AI
    roadmap = await generate_goal_roadmap_with_ai(request.goal_description, pillar, user)
    
    # Create milestone quests
    milestones = []
    for i, m in enumerate(roadmap.get("milestones", [])):
        milestones.append(MilestoneQuest(
            id=f"milestone_{i}_{datetime.utcnow().timestamp()}",
            title=m["title"],
            description=m["description"],
            order=i,
            xp_reward=m.get("xp_reward", 100 + i * 50),
            is_completed=False,
            unlocked=(i == 0)  # Only first milestone is unlocked
        ))
    
    # Create the goal
    goal = LongTermGoal(
        user_id=user_id,
        title=roadmap.get("title", request.goal_description[:50]),
        description=request.goal_description,
        life_pillar=pillar,
        ai_analysis=roadmap.get("analysis", ""),
        estimated_timeframe=roadmap.get("timeframe", "Unknown"),
        difficulty_rating=roadmap.get("difficulty", "challenging"),
        milestones=milestones
    )
    await goal.insert()
    
    return {
        "id": str(goal.id),
        "title": goal.title,
        "ai_analysis": goal.ai_analysis,
        "estimated_timeframe": goal.estimated_timeframe,
        "difficulty_rating": goal.difficulty_rating,
        "milestones_count": len(milestones),
        "first_milestone": milestones[0].title if milestones else None
    }


@router.get("/user/{user_id}", response_model=List[GoalResponse])
async def get_user_goals(user_id: str, completed: Optional[bool] = None):
    """Get all long-term goals for a user"""
    query = {"user_id": user_id}
    if completed is not None:
        query["is_completed"] = completed
    
    goals = await LongTermGoal.find(query).sort([("created_at", -1)]).to_list()
    
    return [
        GoalResponse(
            id=str(g.id),
            title=g.title,
            description=g.description,
            life_pillar=g.life_pillar.value,
            ai_analysis=g.ai_analysis,
            estimated_timeframe=g.estimated_timeframe,
            difficulty_rating=g.difficulty_rating,
            milestones=[{
                "id": m.id,
                "title": m.title,
                "description": m.description,
                "order": m.order,
                "xp_reward": m.xp_reward,
                "is_completed": m.is_completed,
                "unlocked": m.unlocked
            } for m in g.milestones],
            current_milestone_index=g.current_milestone_index,
            progress_percent=(g.current_milestone_index / len(g.milestones) * 100) if g.milestones else 0,
            total_xp_earned=g.total_xp_earned,
            is_completed=g.is_completed
        )
        for g in goals
    ]


@router.post("/complete-milestone/{goal_id}/{milestone_id}")
async def complete_milestone(goal_id: str, milestone_id: str):
    """Complete a milestone and unlock the next one"""
    from bson import ObjectId
    
    goal = await LongTermGoal.find_one({"_id": ObjectId(goal_id)})
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    # Find the milestone
    milestone_index = None
    for i, m in enumerate(goal.milestones):
        if m.id == milestone_id:
            milestone_index = i
            break
    
    if milestone_index is None:
        raise HTTPException(status_code=404, detail="Milestone not found")
    
    milestone = goal.milestones[milestone_index]
    
    if milestone.is_completed:
        raise HTTPException(status_code=400, detail="Milestone already completed")
    
    if not milestone.unlocked:
        raise HTTPException(status_code=400, detail="Milestone not yet unlocked")
    
    # Complete the milestone
    milestone.is_completed = True
    milestone.completed_at = datetime.utcnow()
    goal.total_xp_earned += milestone.xp_reward
    goal.current_milestone_index = milestone_index + 1
    goal.updated_at = datetime.utcnow()
    
    # Unlock next milestone
    if milestone_index + 1 < len(goal.milestones):
        goal.milestones[milestone_index + 1].unlocked = True
        next_milestone = goal.milestones[milestone_index + 1].title
    else:
        # All milestones complete - goal achieved!
        goal.is_completed = True
        goal.completed_at = datetime.utcnow()
        next_milestone = None
    
    await goal.save()
    
    # Award XP to user
    user = await UserProfile.find_one({"user_id": goal.user_id})
    leveled_up = False
    new_level = 1
    if user:
        pillar = goal.life_pillar
        user.total_xp[pillar] = user.total_xp.get(pillar, 0) + milestone.xp_reward
        new_level = (user.total_xp[pillar] // 100) + 1
        if new_level > user.life_pillar_levels.get(pillar, 1):
            user.life_pillar_levels[pillar] = new_level
            leveled_up = True
        await user.save()
    
    return {
        "message": "Milestone completed!",
        "milestone_title": milestone.title,
        "xp_earned": milestone.xp_reward,
        "pillar": goal.life_pillar.value,
        "next_milestone": next_milestone,
        "goal_completed": goal.is_completed,
        "leveled_up": leveled_up,
        "new_level": new_level if leveled_up else None,
        "progress_percent": (goal.current_milestone_index / len(goal.milestones) * 100) if goal.milestones else 100
    }


@router.delete("/{goal_id}")
async def delete_goal(goal_id: str):
    """Delete/abandon a long-term goal"""
    from bson import ObjectId
    
    goal = await LongTermGoal.find_one({"_id": ObjectId(goal_id)})
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    await goal.delete()
    return {"message": "Goal abandoned"}
