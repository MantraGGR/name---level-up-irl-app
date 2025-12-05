from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv

try:
    from .config import settings
    from .database import init_db, close_db
except ImportError:
    from config import settings
    from database import init_db, close_db

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        await init_db()
        print("✓ Database connected successfully")
    except Exception as e:
        print(f"⚠️  Database connection failed: {e}")
        print(f"⚠️  Full error: {type(e).__name__}: {e}")
        # Re-raise in debug mode so we know there's an issue
        if settings.debug:
            raise RuntimeError(f"Database connection required but failed: {e}")
    yield
    # Shutdown
    try:
        await close_db()
    except:
        pass


app = FastAPI(
    title="Gamified Productivity API",
    version="0.1.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "message": "Mantra GProductivity App",
        "status": "running",
        "version": "0.1.0"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "database": "connected"}


# Include routers
try:
    from .routers import users, tasks, assessments, auth, calendar, chat, quests, goals, ultimate_goals
except ImportError:
    from routers import users, tasks, assessments, auth, calendar, chat, quests, goals, ultimate_goals

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(tasks.router)
app.include_router(assessments.router)
app.include_router(calendar.router)
app.include_router(chat.router)
app.include_router(quests.router)
app.include_router(goals.router)
app.include_router(ultimate_goals.router)
