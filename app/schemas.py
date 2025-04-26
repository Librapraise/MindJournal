from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
import uuid

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[str] = None # Store user_id (as string) in token


# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=8) # Enforce minimum password length

class User(UserBase):
    id: uuid.UUID
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True # Replaces orm_mode = True in Pydantic v2


# --- Journal Entry Schemas ---
class JournalEntryBase(BaseModel):
    mood: str = Field(..., description="Emoji or string representing mood")
    content: str = Field(..., min_length=10, max_length=1000, description="Journal entry text (adjust lengths as needed)") # Added length constraints

class JournalEntryCreate(JournalEntryBase):
    pass # Inherits mood and content

# Schema for AI Analysis results to be stored/returned
class AIAnalysisResult(BaseModel):
    sentiment_score: Optional[float] = None
    sentiment_label: Optional[str] = None
    key_themes: Optional[List[str]] = None
    suggested_strategies: Optional[List[str]] = None

class JournalEntry(JournalEntryBase, AIAnalysisResult): # Include AI fields in response
    id: int
    user_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    ai_analysis_completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Insight Schemas ---
class MoodPoint(BaseModel):
    date: datetime
    mood: str # Or maybe map mood to a numeric value for charting?

class MoodHistory(BaseModel):
    data: List[MoodPoint]

class ThemeCloudItem(BaseModel):
    theme: str
    count: int

class ThemeCloud(BaseModel):
    data: List[ThemeCloudItem]

class HistoricalInsights(BaseModel):
    mood_history_7d: Optional[MoodHistory] = None
    mood_history_30d: Optional[MoodHistory] = None
    theme_cloud_30d: Optional[ThemeCloud] = None

# --- Data Control Schemas ---
class UserDataExport(BaseModel):
    user_info: User
    journal_entries: List[JournalEntry]

class DeletionConfirmation(BaseModel):
    message: str
    deleted_user_id: Optional[uuid.UUID] = None
    deleted_entry_count: Optional[int] = None