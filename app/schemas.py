from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List,Literal
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
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8) # Enforce minimum password length

class User(UserBase):
    id: uuid.UUID
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
    
    
    
class ChatMessage(BaseModel):
    message: str = Field(..., min_length=1, max_length=500)

class ChatResponse(BaseModel):
    response: str
    error: Optional[str] = None

class GeneratedArticle(BaseModel):
    """Defines the structure for the generated article."""
    title: str = Field(description="A concise and engaging title for the article, relevant to the mood.")
    body: str = Field(description="The main content of the article, following the guidelines provided in the prompt (validation, perspective/strategies, tone, length, disclaimer).")
    
class LLMGeneratedArticle(BaseModel):
    """Defines the structure expected from the LLM for a single article."""
    title: str = Field(description="A concise and engaging title for the article, relevant to the mood and variation focus.")
    body: str = Field(description="The main content of the article, following the guidelines, mood, and variation focus.")

# Base schema for Article data (common fields)
class ArticleBase(BaseModel):
    title: str
    body: str
    triggering_mood: Optional[str] = None
    generation_variation_key: Optional[str] = None

# Schema for creating an Article in the DB (used by CRUD)
class ArticleCreate(ArticleBase):
    user_id: uuid.UUID
    source_journal_entry_id: Optional[int] = None
    triggering_mood: str # Make required during creation

# Schema for reading/returning an Article from the DB
class Article(ArticleBase):
    id: int
    user_id: uuid.UUID
    generated_at: datetime
    source_journal_entry_id: Optional[int] = None
    triggering_mood: str # Should be present when reading

    class Config:
        from_attributes = True

class EntryAccepted(BaseModel):
    entry_id: int = Field(..., description="The newly created journal entry’s ID")
    status_url: str = Field(
        ..., 
        description="URL where the client can check analysis status"
    )

    class Config:
        orm_mode = True
        

class EntryStatus(BaseModel):
    status: Literal["pending", "complete"] = Field(
        ..., 
        description="pending’ until AI analysis finishes, then ‘complete’"
    )
    sentiment_label: Optional[str] = Field(
        None, 
        description="AI‐derived sentiment (once complete)"
    )
    sentiment_score: Optional[float] = Field(
        None, 
        description="AI‐derived sentiment score (once complete)"
    )
    key_themes: Optional[List[str]] = Field(
        None, 
        description="Top themes extracted by AI"
    )
    suggested_strategies: Optional[List[str]] = Field(
        None, 
        description="AI‐suggested coping strategies"
    )
    ai_analysis_completed_at: Optional[datetime] = Field(
        None, 
        description="Timestamp when AI finished"
    )

    class Config:
        orm_mode = True