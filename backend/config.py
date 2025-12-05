from pydantic_settings import BaseSettings
from typing import List, Union
import os


class Settings(BaseSettings):
    # MongoDB
    mongodb_url: str
    mongodb_db_name: str = "gamified_productivity"
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    
    # JWT
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440
    
    # Google OAuth
    google_client_id: str
    google_client_secret: str
    google_redirect_uri: str = "http://localhost:8000/auth/google/callback"
    
    # Gemini AI
    gemini_api_key: str = ""
    
    # CORS - accepts comma-separated string or list
    cors_origins: Union[str, List[str]] = "http://localhost:3000"
    
    # App
    app_name: str = "Gamified Productivity App"
    debug: bool = True
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from string or list"""
        if isinstance(self.cors_origins, str):
            return [origin.strip() for origin in self.cors_origins.split(",")]
        return self.cors_origins
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()


