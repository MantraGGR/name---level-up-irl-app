from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
import httpx
import json

try:
    from ..config import settings
    from ..models.user import UserProfile
    from ..models.calendar import CalendarEvent, ActionStep
    from ..models.enums import LifePillar, Priority
except ImportError:
    from config import settings
    from models.user import UserProfile
    from models.calendar import CalendarEvent, ActionStep
    from models.enums import LifePillar, Priority

router = APIRouter(prefix="/calendar", tags=["calendar"])


class CalendarEventResponse(BaseModel):
    id: str
    event_id: str
    title: str
    description: Optional[str]
    start_time: datetime
    end_time: datetime
    life_pillar_tags: List[str]


class ActionStepResponse(BaseModel):
    id: str
    title: str
    description: str
    life_pillar: str
    priority: str
    xp_reward: int
    estimated_duration: int
    completed: bool
    source_event_id: Optional[str]


async def refresh_google_token(user: UserProfile) -> str:
    """Refresh Google access token if expired"""
    if not user.google_tokens:
        raise HTTPException(status_code=401, detail="No Google tokens found")
    
    # Check if token is expired
    if user.google_tokens.token_expiry > datetime.utcnow():
        return user.google_tokens.access_token
    
    # Refresh the token
    if not user.google_tokens.refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token - please re-authenticate")
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "refresh_token": user.google_tokens.refresh_token,
                "grant_type": "refresh_token",
            },
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Failed to refresh token")
        
        tokens = response.json()
        user.google_tokens.access_token = tokens["access_token"]
        user.google_tokens.token_expiry = datetime.utcnow() + timedelta(seconds=tokens.get("expires_in", 3600))
        await user.save()
        
        return tokens["access_token"]


async def categorize_event_with_ai(event_title: str, event_description: str = "") -> List[LifePillar]:
    """Use Gemini to categorize event into life pillars"""
    if not settings.gemini_api_key:
        # Fallback to simple keyword matching
        return categorize_event_simple(event_title, event_description)
    
    prompt = f"""Categorize this calendar event into one or more life pillars.
Life pillars: health, career, relationships, personal_growth, finance, recreation

Event: {event_title}
Description: {event_description}

Return ONLY a JSON array of matching pillars, e.g. ["health", "personal_growth"]
"""
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={settings.gemini_api_key}",
                json={"contents": [{"parts": [{"text": prompt}]}]},
                timeout=10.0
            )
            
            if response.status_code == 200:
                result = response.json()
                text = result["candidates"][0]["content"]["parts"][0]["text"]
                pillars = json.loads(text.strip())
                return [LifePillar(p) for p in pillars if p in [e.value for e in LifePillar]]
    except Exception as e:
        print(f"[AI] Categorization failed: {e}")
    
    return categorize_event_simple(event_title, event_description)


def categorize_event_simple(title: str, description: str = "") -> List[LifePillar]:
    """Simple keyword-based categorization fallback"""
    text = f"{title} {description}".lower()
    pillars = []
    
    if any(w in text for w in ["gym", "workout", "doctor", "health", "exercise", "run", "yoga"]):
        pillars.append(LifePillar.HEALTH)
    if any(w in text for w in ["meeting", "work", "project", "deadline", "interview", "client"]):
        pillars.append(LifePillar.CAREER)
    if any(w in text for w in ["dinner", "lunch", "friend", "family", "party", "date", "call"]):
        pillars.append(LifePillar.RELATIONSHIPS)
    if any(w in text for w in ["course", "learn", "study", "read", "class", "training"]):
        pillars.append(LifePillar.PERSONAL_GROWTH)
    if any(w in text for w in ["bank", "budget", "invest", "tax", "payment", "bill"]):
        pillars.append(LifePillar.FINANCE)
    if any(w in text for w in ["game", "movie", "concert", "hobby", "fun", "relax", "vacation"]):
        pillars.append(LifePillar.RECREATION)
    
    return pillars if pillars else [LifePillar.PERSONAL_GROWTH]


@router.post("/sync/{user_id}")
async def sync_calendar(user_id: str, days_ahead: int = 7):
    """Sync Google Calendar events for a user"""
    user = await UserProfile.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    access_token = await refresh_google_token(user)
    
    # Fetch calendar events
    time_min = datetime.utcnow().isoformat() + "Z"
    time_max = (datetime.utcnow() + timedelta(days=days_ahead)).isoformat() + "Z"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://www.googleapis.com/calendar/v3/calendars/primary/events",
            headers={"Authorization": f"Bearer {access_token}"},
            params={
                "timeMin": time_min,
                "timeMax": time_max,
                "singleEvents": "true",
                "orderBy": "startTime",
                "maxResults": 50
            }
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch calendar events")
        
        events_data = response.json()
    
    synced_events = []
    for event in events_data.get("items", []):
        event_id = event.get("id")
        title = event.get("summary", "Untitled Event")
        description = event.get("description", "")
        
        # Parse start/end times
        start = event.get("start", {})
        end = event.get("end", {})
        start_time = datetime.fromisoformat(start.get("dateTime", start.get("date", "")).replace("Z", "+00:00"))
        end_time = datetime.fromisoformat(end.get("dateTime", end.get("date", "")).replace("Z", "+00:00"))
        
        # Categorize with AI
        pillars = await categorize_event_with_ai(title, description)
        
        # Upsert event
        existing = await CalendarEvent.find_one({"user_id": user_id, "event_id": event_id})
        if existing:
            existing.title = title
            existing.description = description
            existing.start_time = start_time
            existing.end_time = end_time
            existing.life_pillar_tags = pillars
            existing.last_synced = datetime.utcnow()
            await existing.save()
            synced_events.append(existing)
        else:
            new_event = CalendarEvent(
                user_id=user_id,
                event_id=event_id,
                title=title,
                description=description,
                start_time=start_time,
                end_time=end_time,
                life_pillar_tags=pillars
            )
            await new_event.insert()
            synced_events.append(new_event)
    
    return {"synced": len(synced_events), "events": [e.title for e in synced_events]}


@router.get("/events/{user_id}", response_model=List[CalendarEventResponse])
async def get_calendar_events(user_id: str, days_ahead: int = 7):
    """Get synced calendar events for a user"""
    cutoff = datetime.utcnow() + timedelta(days=days_ahead)
    events = await CalendarEvent.find({
        "user_id": user_id,
        "start_time": {"$gte": datetime.utcnow(), "$lte": cutoff}
    }).sort([("start_time", 1)]).to_list()
    
    return [
        CalendarEventResponse(
            id=str(e.id),
            event_id=e.event_id,
            title=e.title,
            description=e.description,
            start_time=e.start_time,
            end_time=e.end_time,
            life_pillar_tags=[p.value for p in e.life_pillar_tags]
        )
        for e in events
    ]


async def generate_action_steps_with_ai(
    event: CalendarEvent, 
    user_assessment: dict = None
) -> List[dict]:
    """Use Gemini to generate actionable steps from a calendar event"""
    
    assessment_context = ""
    if user_assessment:
        if user_assessment.get("adhd_score", 0) > 10:
            assessment_context += "User has ADHD tendencies - break tasks into smaller chunks, use timers. "
        if user_assessment.get("anxiety_score", 0) > 10:
            assessment_context += "User has anxiety - include calming prep steps, buffer time. "
        if user_assessment.get("depression_score", 0) > 10:
            assessment_context += "User has depression tendencies - make steps achievable, include self-care. "
    
    prompt = f"""You are a productivity coach creating actionable steps for a calendar event.
{assessment_context}

Event: {event.title}
Description: {event.description or 'No description'}
Start Time: {event.start_time}
Duration: {(event.end_time - event.start_time).total_seconds() / 60} minutes
Categories: {[p.value for p in event.life_pillar_tags]}

Create 2-4 specific, actionable preparation steps. Each step should:
- Be concrete and achievable
- Take 5-30 minutes
- Help the user prepare for or follow up on this event

Return ONLY valid JSON array:
[
  {{"title": "Step title", "description": "What to do", "duration": 15, "pillar": "career", "priority": "medium", "xp": 15}},
  ...
]

Pillars: health, career, relationships, personal_growth, finance, recreation
Priorities: low, medium, high, urgent
"""
    
    if not settings.gemini_api_key:
        return generate_default_steps(event)
    
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
                # Extract JSON from response
                start = text.find("[")
                end = text.rfind("]") + 1
                if start >= 0 and end > start:
                    return json.loads(text[start:end])
    except Exception as e:
        print(f"[AI] Step generation failed: {e}")
    
    return generate_default_steps(event)


def generate_default_steps(event: CalendarEvent) -> List[dict]:
    """Generate default steps when AI is unavailable"""
    pillar = event.life_pillar_tags[0].value if event.life_pillar_tags else "personal_growth"
    return [
        {
            "title": f"Prepare for: {event.title}",
            "description": f"Review any materials or notes needed for {event.title}",
            "duration": 15,
            "pillar": pillar,
            "priority": "medium",
            "xp": 10
        },
        {
            "title": f"Follow up: {event.title}",
            "description": f"Document key takeaways and next actions from {event.title}",
            "duration": 10,
            "pillar": pillar,
            "priority": "medium",
            "xp": 10
        }
    ]


@router.post("/generate-steps/{user_id}")
async def generate_action_steps(user_id: str, event_id: Optional[str] = None):
    """Generate AI-powered action steps from calendar events"""
    user = await UserProfile.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's assessment for personalization
    try:
        from ..models.assessment import AssessmentResults
    except ImportError:
        from models.assessment import AssessmentResults
    
    assessment = await AssessmentResults.find_one({"user_id": user_id})
    assessment_data = None
    if assessment:
        assessment_data = {
            "adhd_score": assessment.adhd_score,
            "anxiety_score": assessment.anxiety_score,
            "depression_score": assessment.depression_score
        }
    
    # Get events to process
    if event_id:
        events = [await CalendarEvent.find_one({"user_id": user_id, "event_id": event_id})]
        events = [e for e in events if e]
    else:
        # Get upcoming events without generated steps
        events = await CalendarEvent.find({
            "user_id": user_id,
            "start_time": {"$gte": datetime.utcnow(), "$lte": datetime.utcnow() + timedelta(days=3)}
        }).to_list()
    
    if not events:
        return {"message": "No events to process", "steps_created": 0}
    
    created_steps = []
    for event in events:
        # Check if steps already exist for this event
        existing = await ActionStep.find_one({"user_id": user_id, "source_event_id": event.event_id})
        if existing:
            continue
        
        # Generate steps with AI
        steps_data = await generate_action_steps_with_ai(event, assessment_data)
        
        for step in steps_data:
            action_step = ActionStep(
                user_id=user_id,
                title=step["title"],
                description=step["description"],
                estimated_duration=step.get("duration", 15),
                life_pillar=LifePillar(step.get("pillar", "personal_growth")),
                priority=Priority(step.get("priority", "medium")),
                xp_reward=step.get("xp", 10),
                generated_by_ai=True,
                source_event_id=event.event_id,
                due_date=event.start_time - timedelta(hours=1)
            )
            await action_step.insert()
            created_steps.append(action_step)
    
    return {
        "message": f"Generated {len(created_steps)} action steps",
        "steps_created": len(created_steps),
        "steps": [{"title": s.title, "xp": s.xp_reward} for s in created_steps]
    }


@router.get("/action-steps/{user_id}", response_model=List[ActionStepResponse])
async def get_action_steps(user_id: str, completed: Optional[bool] = None):
    """Get AI-generated action steps for a user"""
    query = {"user_id": user_id, "generated_by_ai": True}
    if completed is not None:
        query["completed"] = completed
    
    steps = await ActionStep.find(query).sort([("due_date", 1)]).to_list()
    
    return [
        ActionStepResponse(
            id=str(s.id),
            title=s.title,
            description=s.description,
            life_pillar=s.life_pillar.value,
            priority=s.priority.value,
            xp_reward=s.xp_reward,
            estimated_duration=s.estimated_duration,
            completed=s.completed,
            source_event_id=s.source_event_id
        )
        for s in steps
    ]
