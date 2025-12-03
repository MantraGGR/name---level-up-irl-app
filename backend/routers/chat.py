from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import re

try:
    from ..models.user import UserProfile
    from ..models.calendar import ActionStep
    from ..models.assessment import AssessmentResults
    from ..models.enums import LifePillar, Priority
except ImportError:
    from models.user import UserProfile
    from models.calendar import ActionStep
    from models.assessment import AssessmentResults
    from models.enums import LifePillar, Priority

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatMessage(BaseModel):
    user_id: str
    message: str


class ChatResponse(BaseModel):
    response: str
    suggestions: List[str] = []
    action: Optional[str] = None
    task_created: Optional[dict] = None


# Productivity tips database
TIPS = {
    "focus": [
        "Try the Pomodoro technique: 25 min work, 5 min break 🍅",
        "Remove distractions - put your phone in another room",
        "Start with your hardest task when your energy is highest",
        "Break big tasks into smaller, 15-minute chunks",
    ],
    "motivation": [
        "Remember why you started. What's your bigger goal?",
        "Celebrate small wins - you've already made progress today!",
        "Try body doubling - work alongside someone else",
        "Set a tiny goal: just do 2 minutes, then decide if you want to continue",
    ],
    "anxiety": [
        "Take 3 deep breaths: inhale 4 sec, hold 4 sec, exhale 6 sec",
        "Ground yourself: name 5 things you can see right now",
        "It's okay to take breaks. Rest is productive too",
        "Write down what's worrying you - getting it out of your head helps",
    ],
    "energy": [
        "Stand up and stretch for 2 minutes",
        "Drink a glass of water - dehydration kills focus",
        "Get some sunlight or fresh air if possible",
        "A 10-minute walk can boost energy for 2 hours",
    ],
    "overwhelm": [
        "Pick just ONE thing to focus on right now",
        "It's okay to say no to new commitments",
        "Make a brain dump list, then pick the top 3 priorities",
        "Ask yourself: Will this matter in 5 years?",
    ]
}

PILLAR_SUGGESTIONS = {
    LifePillar.HEALTH: ["Go for a 10-min walk", "Drink water", "Do 5 stretches", "Take a screen break"],
    LifePillar.CAREER: ["Review your goals", "Clear 3 emails", "Update your task list", "Learn something new"],
    LifePillar.RELATIONSHIPS: ["Text a friend", "Call family", "Plan a hangout", "Send appreciation"],
    LifePillar.PERSONAL_GROWTH: ["Read for 15 min", "Journal your thoughts", "Learn a new skill", "Meditate 5 min"],
    LifePillar.FINANCE: ["Check your budget", "Review subscriptions", "Save $5 today", "Track expenses"],
    LifePillar.RECREATION: ["Take a fun break", "Play a quick game", "Listen to music", "Do a hobby"],
}


def get_greeting():
    hour = datetime.now().hour
    if hour < 12:
        return "Good morning"
    elif hour < 17:
        return "Good afternoon"
    else:
        return "Good evening"


def analyze_intent(message: str) -> tuple[str, dict]:
    """Analyze user message and return intent + entities"""
    msg = message.lower().strip()
    
    # Greetings
    if any(w in msg for w in ["hello", "hi", "hey", "sup", "yo"]):
        return "greeting", {}
    
    # Help
    if any(w in msg for w in ["help", "what can you do", "commands", "options"]):
        return "help", {}
    
    # Task creation
    if any(w in msg for w in ["create task", "add task", "new task", "make task", "remind me"]):
        return "create_task", {"raw": message}
    
    # Focus/productivity
    if any(w in msg for w in ["focus", "concentrate", "distracted", "can't focus", "procrastinat"]):
        return "tip", {"category": "focus"}
    
    # Motivation
    if any(w in msg for w in ["motivat", "lazy", "don't want to", "unmotivated", "stuck"]):
        return "tip", {"category": "motivation"}
    
    # Anxiety/stress
    if any(w in msg for w in ["anxious", "anxiety", "stressed", "stress", "worried", "panic"]):
        return "tip", {"category": "anxiety"}
    
    # Energy
    if any(w in msg for w in ["tired", "exhausted", "no energy", "sleepy", "fatigue"]):
        return "tip", {"category": "energy"}
    
    # Overwhelmed
    if any(w in msg for w in ["overwhelm", "too much", "can't handle", "drowning"]):
        return "tip", {"category": "overwhelm"}
    
    # Stats/progress
    if any(w in msg for w in ["stats", "progress", "level", "xp", "how am i doing"]):
        return "stats", {}
    
    # Tasks
    if any(w in msg for w in ["tasks", "todo", "what should i do", "what's next", "quests"]):
        return "tasks", {}
    
    # Pillar specific
    for pillar in LifePillar:
        if pillar.value.replace("_", " ") in msg or pillar.value in msg:
            return "pillar", {"pillar": pillar}
    
    # Default
    return "unknown", {}


async def get_user_context(user_id: str) -> dict:
    """Get user's context for personalized responses"""
    user = await UserProfile.find_one({"user_id": user_id})
    assessment = await AssessmentResults.find_one({"user_id": user_id})
    pending_tasks = await ActionStep.find({"user_id": user_id, "completed": False}).to_list()
    
    return {
        "user": user,
        "assessment": assessment,
        "pending_tasks": pending_tasks,
        "task_count": len(pending_tasks)
    }


@router.post("/", response_model=ChatResponse)
async def chat(message: ChatMessage):
    """Chat with the productivity assistant"""
    import random
    
    intent, entities = analyze_intent(message.message)
    context = await get_user_context(message.user_id)
    user = context.get("user")
    
    # Handle different intents
    if intent == "greeting":
        name = user.full_name.split()[0] if user and user.full_name else "adventurer"
        tasks = context["task_count"]
        response = f"{get_greeting()}, {name}! 👋 "
        if tasks > 0:
            response += f"You have {tasks} quest{'s' if tasks != 1 else ''} waiting. Ready to level up?"
        else:
            response += "Ready to conquer some quests today?"
        return ChatResponse(
            response=response,
            suggestions=["Show my tasks", "I need motivation", "Create a task"]
        )
    
    elif intent == "help":
        return ChatResponse(
            response="I'm your productivity companion! Here's what I can help with:\n\n"
                     "🎯 **Tasks** - Create tasks, see what's next\n"
                     "💪 **Motivation** - Get pumped up when you're stuck\n"
                     "🧘 **Focus** - Tips for concentration\n"
                     "😰 **Anxiety** - Calming techniques\n"
                     "⚡ **Energy** - Beat the fatigue\n"
                     "📊 **Stats** - Check your progress\n\n"
                     "Just tell me what you need!",
            suggestions=["I can't focus", "Show my stats", "I'm overwhelmed"]
        )
    
    elif intent == "tip":
        category = entities.get("category", "focus")
        tips = TIPS.get(category, TIPS["focus"])
        tip = random.choice(tips)
        return ChatResponse(
            response=tip,
            suggestions=["Give me another tip", "Create a task", "Show my tasks"]
        )
    
    elif intent == "stats":
        if not user:
            return ChatResponse(response="I couldn't find your profile. Try refreshing the page.")
        
        total_xp = sum(user.total_xp.values())
        avg_level = round(sum(user.life_pillar_levels.values()) / len(user.life_pillar_levels))
        best_pillar = max(user.life_pillar_levels, key=user.life_pillar_levels.get)
        
        response = f"📊 **Your Stats**\n\n"
        response += f"⭐ Total XP: {total_xp:,}\n"
        response += f"🏆 Average Level: {avg_level}\n"
        response += f"💪 Strongest: {best_pillar.value.replace('_', ' ').title()}\n"
        response += f"📋 Pending Quests: {context['task_count']}\n\n"
        response += "Keep grinding! Every task completed levels you up."
        
        return ChatResponse(
            response=response,
            suggestions=["Show my tasks", "I need motivation", "What should I work on?"]
        )
    
    elif intent == "tasks":
        tasks = context["pending_tasks"][:5]
        if not tasks:
            return ChatResponse(
                response="You have no pending quests! 🎉 Time to sync your calendar or create new tasks.",
                suggestions=["Create a task", "Give me a tip"]
            )
        
        response = "📋 **Your Active Quests:**\n\n"
        for i, task in enumerate(tasks, 1):
            response += f"{i}. **{task.title}** (+{task.xp_reward} XP)\n"
        
        return ChatResponse(
            response=response,
            suggestions=["I'll work on the first one", "I need motivation", "I'm overwhelmed"]
        )
    
    elif intent == "pillar":
        pillar = entities.get("pillar", LifePillar.PERSONAL_GROWTH)
        suggestions = PILLAR_SUGGESTIONS.get(pillar, [])
        level = user.life_pillar_levels.get(pillar, 1) if user else 1
        xp = user.total_xp.get(pillar, 0) if user else 0
        
        response = f"**{pillar.value.replace('_', ' ').title()}** - Level {level} ({xp} XP)\n\n"
        response += "Quick wins for this pillar:\n"
        for s in suggestions:
            response += f"• {s}\n"
        
        return ChatResponse(
            response=response,
            suggestions=[f"Create {pillar.value} task", "Show all stats", "Different pillar"]
        )
    
    elif intent == "create_task":
        # Extract task from message
        raw = entities.get("raw", message.message)
        # Remove trigger words
        task_text = re.sub(r"(create|add|new|make)\s*(a\s*)?(task|quest|todo)(\s*to)?", "", raw, flags=re.I).strip()
        
        if len(task_text) < 3:
            return ChatResponse(
                response="What task would you like to create? Just tell me what you need to do!",
                suggestions=["Exercise for 30 min", "Review my notes", "Call mom"]
            )
        
        # Create the task
        task = ActionStep(
            user_id=message.user_id,
            title=task_text.capitalize(),
            description=f"Task created via chat: {task_text}",
            estimated_duration=15,
            life_pillar=LifePillar.PERSONAL_GROWTH,
            priority=Priority.MEDIUM,
            xp_reward=15,
            generated_by_ai=False
        )
        await task.insert()
        
        return ChatResponse(
            response=f"✅ Quest created: **{task_text.capitalize()}**\n\nComplete it to earn +15 XP!",
            suggestions=["Show my tasks", "Create another task", "I need motivation"],
            action="task_created",
            task_created={"id": str(task.id), "title": task.title, "xp": task.xp_reward}
        )
    
    else:
        # Unknown intent - give helpful response
        responses = [
            "I'm not sure what you mean, but I'm here to help! Try asking about tasks, motivation, or focus tips.",
            "Hmm, I didn't catch that. Want me to show your tasks or give you a productivity tip?",
            "I'm still learning! Try saying 'help' to see what I can do.",
        ]
        return ChatResponse(
            response=random.choice(responses),
            suggestions=["Help", "Show my tasks", "I need motivation"]
        )
