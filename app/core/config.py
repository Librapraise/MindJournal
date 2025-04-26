import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv
from typing import List

# Load .env file variables
load_dotenv()

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    OPENAI_API_KEY: str
    GOOGLE_API_KEY: str = ""
    DEFAULT_LLM_PROVIDER: str = "gemini"  # or "openai"
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"] # Default if not in .env

    class Config:
        env_file = ".env"
     

settings = Settings()
