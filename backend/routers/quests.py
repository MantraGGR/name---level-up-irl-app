from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
from beanie import Document
import httpx
import json

try:
    from ..config import settings
    from ..models.user import UserProfile
    from ..models.enums import LifePillar, Priority
except ImportError:
    from config import settings
    from models.user import UserProfile
    from models.enums import LifePillar, Priority

router = APIRouter(prefix="/quests", tags=["quests"])


class Quest(Document):
    """AI-generated milestone quests for leveling up"""
    user_id: str
    title: str
    description: str
    life_pillar: LifePillar
    
    # Quest details
    target_value: Optional[float] = None  # e.g., 5000 for "$5000 saved"
    target_unit: Optional[str] = None  # e.g., "dollars", "lbs", "miles"
    current_value: float = 0
    
    # Rewards
    xp_reward: int = 100
    level_requirement: int = 1  # Minimum level to see this quest
    
    # Status
    is_active: bool = True
    is_completed: bool = False
    completed_at: Optional[datetime] = None
    
    # AI metadata
    generated_by_ai: bool = True
    difficulty: str = "medium"  # easy, medium, hard, legendary
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None
    
    class Settings:
        name = "quests"
        indexes = ["user_id", "life_pillar", "is_completed", "is_active"]


class QuestResponse(BaseModel):
    id: str
    title: str
    description: str
    life_pillar: str
    target_value: Optional[float]
    target_unit: Optional[str]
    current_value: float
    progress_percent: float
    xp_reward: int
    difficulty: str
    is_completed: bool


class UpdateQuestProgress(BaseModel):
    current_value: float


# Quest templates for each pillar with scaling difficulty
QUEST_TEMPLATES = {
    LifePillar.HEALTH: [
        {"title": "Squat {value} lbs", "unit": "lbs", "base_value": 95, "scale": 1.3, "base_xp": 150},
        {"title": "Bench Press {value} lbs", "unit": "lbs", "base_value": 65, "scale": 1.3, "base_xp": 150},
        {"title": "Deadlift {value} lbs", "unit": "lbs", "base_value": 135, "scale": 1.3, "base_xp": 150},
        {"title": "Run {value} miles in a week", "unit": "miles", "base_value": 5, "scale": 1.2, "base_xp": 100},
        {"title": "Complete {value} workouts", "unit": "workouts", "base_value": 10, "scale": 1.5, "base_xp": 120},
        {"title": "Drink {value} oz of water daily for a week", "unit": "oz", "base_value": 64, "scale": 1.1, "base_xp": 80},
        {"title": "Sleep 8 hours for {value} consecutive days", "unit": "days", "base_value": 7, "scale": 1.3, "base_xp": 100},
        {"title": "Do {value} pushups in one set", "unit": "pushups", "base_value": 20, "scale": 1.4, "base_xp": 80},
        {"title": "Hold a plank for {value} seconds", "unit": "seconds", "base_value": 60, "scale": 1.3, "base_xp": 70},
    ],
    LifePillar.FINANCE: [
        {"title": "Save ${value}", "unit": "dollars", "base_value": 500, "scale": 2.0, "base_xp": 200},
        {"title": "Invest ${value}", "unit": "dollars", "base_value": 250, "scale": 2.0, "base_xp": 250},
        {"title": "Pay off ${value} in debt", "unit": "dollars", "base_value": 500, "scale": 1.8, "base_xp": 300},
        {"title": "Go {value} days without unnecessary purchases", "unit": "days", "base_value": 7, "scale": 1.4, "base_xp": 100},
        {"title": "Create {value} income streams", "unit": "streams", "base_value": 1, "scale": 1.5, "base_xp": 500},
        {"title": "Track expenses for {value} days", "unit": "days", "base_value": 14, "scale": 1.3, "base_xp": 80},
        {"title": "Negotiate a ${value} raise or discount", "unit": "dollars", "base_value": 100, "scale": 2.0, "base_xp": 300},
    ],
    LifePillar.CAREER: [
        {"title": "Complete {value} professional courses", "unit": "courses", "base_value": 1, "scale": 1.5, "base_xp": 200},
        {"title": "Apply to {value} jobs/opportunities", "unit": "applications", "base_value": 5, "scale": 1.4, "base_xp": 100},
        {"title": "Network with {value} professionals", "unit": "people", "base_value": 3, "scale": 1.5, "base_xp": 120},
        {"title": "Complete {value} work projects", "unit": "projects", "base_value": 1, "scale": 1.3, "base_xp": 250},
        {"title": "Learn {value} new skills", "unit": "skills", "base_value": 1, "scale": 1.4, "base_xp": 180},
        {"title": "Get {value} certifications", "unit": "certifications", "base_value": 1, "scale": 1.5, "base_xp": 400},
        {"title": "Mentor someone for {value} hours", "unit": "hours", "base_value": 5, "scale": 1.3, "base_xp": 150},
    ],
    LifePillar.RELATIONSHIPS: [
        {"title": "Have {value} meaningful conversations", "unit": "conversations", "base_value": 5, "scale": 1.3, "base_xp": 80},
        {"title": "Plan {value} dates or hangouts", "unit": "events", "base_value": 2, "scale": 1.4, "base_xp": 100},
        {"title": "Call {value} friends or family members", "unit": "calls", "base_value": 3, "scale": 1.3, "base_xp": 70},
        {"title": "Write {value} thank you notes", "unit": "notes", "base_value": 3, "scale": 1.4, "base_xp": 60},
        {"title": "Attend {value} social events", "unit": "events", "base_value": 2, "scale": 1.3, "base_xp": 90},
        {"title": "Help {value} people with something", "unit": "people", "base_value": 3, "scale": 1.4, "base_xp": 100},
        {"title": "Reconnect with {value} old friends", "unit": "friends", "base_value": 2, "scale": 1.3, "base_xp": 120},
    ],
    LifePillar.PERSONAL_GROWTH: [
        {"title": "Read {value} books", "unit": "books", "base_value": 1, "scale": 1.5, "base_xp": 150},
        {"title": "Meditate for {value} days straight", "unit": "days", "base_value": 7, "scale": 1.4, "base_xp": 100},
        {"title": "Journal for {value} days", "unit": "days", "base_value": 14, "scale": 1.3, "base_xp": 90},
        {"title": "Learn {value} new things", "unit": "things", "base_value": 5, "scale": 1.4, "base_xp": 80},
        {"title": "Complete {value} online courses", "unit": "courses", "base_value": 1, "scale": 1.5, "base_xp": 200},
        {"title": "Practice a skill for {value} hours", "unit": "hours", "base_value": 10, "scale": 1.4, "base_xp": 120},
        {"title": "Wake up before 7am for {value} days", "unit": "days", "base_value": 7, "scale": 1.3, "base_xp": 100},
    ],
    LifePillar.RECREATION: [
        {"title": "Try {value} new hobbies", "unit": "hobbies", "base_value": 1, "scale": 1.4, "base_xp": 100},
        {"title": "Visit {value} new places", "unit": "places", "base_value": 2, "scale": 1.3, "base_xp": 120},
        {"title": "Complete {value} creative projects", "unit": "projects", "base_value": 1, "scale": 1.4, "base_xp": 150},
        {"title": "Have {value} screen-free days", "unit": "days", "base_value": 2, "scale": 1.3, "base_xp": 80},
        {"title": "Play {value} hours of sports/games", "unit": "hours", "base_value": 5, "scale": 1.2, "base_xp": 70},
        {"title": "Take {value} day trips", "unit": "trips", "base_value": 1, "scale": 1.4, "base_xp": 100},
        {"title": "Learn {value} new recipes", "unit": "recipes", "base_value": 3, "scale": 1.3, "base_xp": 80},
    ],
}

DIFFICULTY_MULTIPLIERS = {
    "easy": 0.7,
    "medium": 1.0,
    "hard": 1.5,
    "legendary": 2.5
}



async def generate_quests_with_ai(user: UserProfile, pillar: LifePillar, count: int = 3) -> List[dict]:
    """Use AI to generate personalized quests based on user's level and history"""
    level = user.life_pillar_levels.get(pillar, 1)
    
    # Get templates for this pillar
    templates = QUEST_TEMPLATES.get(pillar, [])
    if not templates:
        return []
    
    # If no Gemini API key, use template-based generation
    if not settings.gemini_api_key:
        return generate_quests_from_templates(pillar, level, count)
    
    prompt = f"""You are a life coach creating achievement quests for a gamified productivity app.

User's current {pillar.value.replace('_', ' ')} level: {level}
Total XP in this area: {user.total_xp.get(pillar, 0)}

Generate {count} challenging but achievable quests for this life pillar. Each quest should:
1. Have a specific, measurable target (numbers matter!)
2. Scale appropriately for level {level} (higher levels = harder goals)
3. Be motivating and rewarding
4. Include realistic timeframes

Return ONLY valid JSON array:
[
  {{
    "title": "Quest title with {{value}} placeholder",
    "description": "Motivating description of why this matters",
    "target_value": 100,
    "target_unit": "unit name",
    "xp_reward": 150,
    "difficulty": "medium"
  }}
]

Difficulties: easy (beginner friendly), medium (challenging), hard (serious commitment), legendary (life-changing)

Examples for {pillar.value}:
- Health: "Squat 225 lbs", "Run a 5K under 25 minutes"
- Finance: "Save $5000", "Build a $10,000 emergency fund"
- Career: "Get promoted", "Complete AWS certification"
- Relationships: "Plan 5 meaningful dates", "Reconnect with 10 old friends"
- Personal Growth: "Read 12 books this year", "Meditate for 30 days straight"
- Recreation: "Visit 5 new countries", "Learn to play guitar"
"""
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={settings.gemini_api_key}",
                json={"contents": [{"parts": [{"text": prompt}]}]},
                timeout=15.0
            )
            
            if response.status_code == 200:
                result = response.json()
                text = result["candidates"][0]["content"]["parts"][0]["text"]
                start = text.find("[")
                end = text.rfind("]") + 1
                if start >= 0 and end > start:
                    quests = json.loads(text[start:end])
                    return quests[:count]
    except Exception as e:
        print(f"[QUESTS] AI generation failed: {e}")
    
    return generate_quests_from_templates(pillar, level, count)


def generate_quests_from_templates(pillar: LifePillar, level: int, count: int) -> List[dict]:
    """Generate quests from templates based on user level"""
    import random
    
    templates = QUEST_TEMPLATES.get(pillar, [])
    if not templates:
        return []
    
    # Select random templates
    selected = random.sample(templates, min(count, len(templates)))
    quests = []
    
    for template in selected:
        # Scale value based on level
        scaled_value = int(template["base_value"] * (template["scale"] ** (level - 1)))
        
        # Determine difficulty based on level scaling
        if level <= 2:
            difficulty = "easy"
        elif level <= 5:
            difficulty = "medium"
        elif level <= 10:
            difficulty = "hard"
        else:
            difficulty = "legendary"
        
        # Scale XP reward
        xp_reward = int(template["base_xp"] * DIFFICULTY_MULTIPLIERS[difficulty] * (1 + (level - 1) * 0.1))
        
        quests.append({
            "title": template["title"].format(value=scaled_value),
            "description": f"Level {level} {pillar.value.replace('_', ' ')} challenge. Complete this to prove your dedication!",
            "target_value": scaled_value,
            "target_unit": template["unit"],
            "xp_reward": xp_reward,
            "difficulty": difficulty
        })
    
    return quests



@router.post("/generate/{user_id}")
async def generate_quests(user_id: str, pillar: Optional[str] = None):
    """Generate AI-powered quests for a user"""
    user = await UserProfile.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    created_quests = []
    
    # Generate for specific pillar or all pillars
    pillars_to_generate = [LifePillar(pillar)] if pillar else list(LifePillar)
    
    for p in pillars_to_generate:
        # Check how many active quests user has for this pillar
        active_count = await Quest.find({
            "user_id": user_id,
            "life_pillar": p,
            "is_active": True,
            "is_completed": False
        }).count()
        
        # Generate up to 3 quests per pillar
        quests_needed = max(0, 3 - active_count)
        if quests_needed == 0:
            continue
        
        quest_data = await generate_quests_with_ai(user, p, quests_needed)
        
        for q in quest_data:
            quest = Quest(
                user_id=user_id,
                title=q["title"],
                description=q.get("description", ""),
                life_pillar=p,
                target_value=q.get("target_value"),
                target_unit=q.get("target_unit"),
                xp_reward=q.get("xp_reward", 100),
                difficulty=q.get("difficulty", "medium"),
                level_requirement=user.life_pillar_levels.get(p, 1)
            )
            await quest.insert()
            created_quests.append(quest)
    
    return {
        "message": f"Generated {len(created_quests)} quests",
        "quests": [{"title": q.title, "pillar": q.life_pillar.value, "xp": q.xp_reward} for q in created_quests]
    }


@router.get("/user/{user_id}", response_model=List[QuestResponse])
async def get_user_quests(user_id: str, pillar: Optional[str] = None, completed: Optional[bool] = None):
    """Get all quests for a user"""
    query = {"user_id": user_id, "is_active": True}
    
    if pillar:
        query["life_pillar"] = LifePillar(pillar)
    if completed is not None:
        query["is_completed"] = completed
    
    quests = await Quest.find(query).sort([("created_at", -1)]).to_list()
    
    return [
        QuestResponse(
            id=str(q.id),
            title=q.title,
            description=q.description,
            life_pillar=q.life_pillar.value,
            target_value=q.target_value,
            target_unit=q.target_unit,
            current_value=q.current_value,
            progress_percent=min(100, (q.current_value / q.target_value * 100) if q.target_value else 0),
            xp_reward=q.xp_reward,
            difficulty=q.difficulty,
            is_completed=q.is_completed
        )
        for q in quests
    ]


@router.patch("/progress/{quest_id}")
async def update_quest_progress(quest_id: str, progress: UpdateQuestProgress):
    """Update progress on a quest"""
    from bson import ObjectId
    
    quest = await Quest.find_one({"_id": ObjectId(quest_id)})
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    
    quest.current_value = progress.current_value
    
    # Check if quest is completed
    if quest.target_value and quest.current_value >= quest.target_value:
        quest.is_completed = True
        quest.completed_at = datetime.utcnow()
        
        # Award XP to user
        user = await UserProfile.find_one({"user_id": quest.user_id})
        if user:
            pillar = quest.life_pillar
            user.total_xp[pillar] = user.total_xp.get(pillar, 0) + quest.xp_reward
            
            # Check for level up (100 XP per level)
            new_level = (user.total_xp[pillar] // 100) + 1
            if new_level > user.life_pillar_levels.get(pillar, 1):
                user.life_pillar_levels[pillar] = new_level
            
            await user.save()
    
    await quest.save()
    
    return {
        "id": str(quest.id),
        "current_value": quest.current_value,
        "target_value": quest.target_value,
        "progress_percent": min(100, (quest.current_value / quest.target_value * 100) if quest.target_value else 0),
        "is_completed": quest.is_completed,
        "xp_earned": quest.xp_reward if quest.is_completed else 0
    }


@router.post("/complete/{quest_id}")
async def complete_quest(quest_id: str):
    """Mark a quest as complete and award XP"""
    from bson import ObjectId
    
    quest = await Quest.find_one({"_id": ObjectId(quest_id)})
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    
    if quest.is_completed:
        raise HTTPException(status_code=400, detail="Quest already completed")
    
    quest.is_completed = True
    quest.completed_at = datetime.utcnow()
    if quest.target_value:
        quest.current_value = quest.target_value
    await quest.save()
    
    # Award XP to user
    user = await UserProfile.find_one({"user_id": quest.user_id})
    if user:
        pillar = quest.life_pillar
        user.total_xp[pillar] = user.total_xp.get(pillar, 0) + quest.xp_reward
        
        # Check for level up
        new_level = (user.total_xp[pillar] // 100) + 1
        old_level = user.life_pillar_levels.get(pillar, 1)
        leveled_up = new_level > old_level
        
        if leveled_up:
            user.life_pillar_levels[pillar] = new_level
        
        await user.save()
        
        return {
            "message": "Quest completed!",
            "xp_earned": quest.xp_reward,
            "pillar": pillar.value,
            "new_total_xp": user.total_xp[pillar],
            "leveled_up": leveled_up,
            "new_level": new_level if leveled_up else old_level
        }
    
    return {"message": "Quest completed!", "xp_earned": quest.xp_reward}


@router.delete("/{quest_id}")
async def delete_quest(quest_id: str):
    """Delete/abandon a quest"""
    from bson import ObjectId
    
    quest = await Quest.find_one({"_id": ObjectId(quest_id)})
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    
    await quest.delete()
    return {"message": "Quest abandoned"}
