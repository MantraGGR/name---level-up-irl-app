from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

try:
    from ..models.calendar import ActionStep
    from ..models.enums import LifePillar, Priority
except ImportError:
    from models.calendar import ActionStep
    from models.enums import LifePillar, Priority

router = APIRouter(prefix="/tasks", tags=["tasks"])


class TaskCreate(BaseModel):
    user_id: str
    title: str
    description: str
    life_pillar: LifePillar
    priority: Priority = Priority.MEDIUM
    estimated_duration: int = 30
    xp_reward: int = 10
    due_date: Optional[datetime] = None


class TaskResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: str
    life_pillar: LifePillar
    priority: Priority
    estimated_duration: int
    xp_reward: int
    completed: bool
    due_date: Optional[datetime] = None
    created_at: datetime


@router.post("/", response_model=TaskResponse)
async def create_task(task_data: TaskCreate):
    """Create a new task"""
    task = ActionStep(
        user_id=task_data.user_id,
        title=task_data.title,
        description=task_data.description,
        life_pillar=task_data.life_pillar,
        priority=task_data.priority,
        estimated_duration=task_data.estimated_duration,
        xp_reward=task_data.xp_reward,
        due_date=task_data.due_date
    )
    await task.insert()
    
    return TaskResponse(
        id=str(task.id),
        user_id=task.user_id,
        title=task.title,
        description=task.description,
        life_pillar=task.life_pillar,
        priority=task.priority,
        estimated_duration=task.estimated_duration,
        xp_reward=task.xp_reward,
        completed=task.completed,
        due_date=task.due_date,
        created_at=task.created_at
    )


@router.get("/user/{user_id}", response_model=List[TaskResponse])
async def get_user_tasks(user_id: str, completed: Optional[bool] = None):
    """Get all tasks for a user"""
    query_filter = {"user_id": user_id}
    
    if completed is not None:
        query_filter["completed"] = completed
    
    tasks = await ActionStep.find(query_filter).to_list()
    
    return [
        TaskResponse(
            id=str(task.id),
            user_id=task.user_id,
            title=task.title,
            description=task.description,
            life_pillar=task.life_pillar,
            priority=task.priority,
            estimated_duration=task.estimated_duration,
            xp_reward=task.xp_reward,
            completed=task.completed,
            due_date=task.due_date,
            created_at=task.created_at
        )
        for task in tasks
    ]


@router.patch("/{task_id}/complete")
async def complete_task(task_id: str):
    """Mark a task as completed and award XP to user"""
    try:
        from ..models.user import UserProfile
    except ImportError:
        from models.user import UserProfile
    
    task = await ActionStep.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task.completed:
        raise HTTPException(status_code=400, detail="Task already completed")
    
    # Mark task as completed
    task.completed = True
    task.completed_at = datetime.utcnow()
    await task.save()
    
    # Award XP to user
    user = await UserProfile.find_one({"user_id": task.user_id})
    if user:
        # Add XP to the corresponding pillar
        pillar = task.life_pillar
        current_xp = user.total_xp.get(pillar, 0)
        new_xp = current_xp + task.xp_reward
        user.total_xp[pillar] = new_xp
        
        # Recalculate level (100 XP per level)
        user.life_pillar_levels[pillar] = max(1, new_xp // 100 + 1)
        
        await user.save()
    
    return {
        "task_id": task_id,
        "completed": True,
        "xp_earned": task.xp_reward,
        "life_pillar": task.life_pillar
    }


@router.delete("/{task_id}")
async def delete_task(task_id: str):
    """Delete a task"""
    task = await ActionStep.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    await task.delete()
    return {"message": "Task deleted successfully"}
