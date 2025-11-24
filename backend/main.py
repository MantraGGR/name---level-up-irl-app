from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv

try:
    from .config import settings
    # from .database import init_db, close_db
except ImportError:
    from config import settings
    # from database import init_db, close_db

load_dotenv()

'''
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    #await init_db()
    yield
    # Shutdown
    #await close_db()
'''

app = FastAPI(
    title="Gamified Productivity API",
    version="0.1.0",
    #lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "message": "Gamified Productivity API",
        "status": "running",
        "version": "0.1.0"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "database": "connected"}
