from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Boolean, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid
from sqlalchemy.dialects.postgresql import UUID # For PostgreSQL specific UUID type

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True) # Optional: for soft deletes or activation

    journal_entries = relationship("JournalEntry", back_populates="owner", cascade="all, delete-orphan")

class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    mood = Column(String, index=True) # Store emoji representation or a mapped value
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Fields for AI Analysis results
    sentiment_score = Column(Float, nullable=True) # e.g., -1.0 to 1.0
    sentiment_label = Column(String, nullable=True) # e.g., "Positive", "Negative", "Neutral"
    key_themes = Column(JSON, nullable=True) # Store list of themes identified
    suggested_strategies = Column(JSON, nullable=True) # Store list of coping strategies
    ai_analysis_completed_at = Column(DateTime(timezone=True), nullable=True)

    owner = relationship("User", back_populates="journal_entries")

# You might add more models later, e.g., for Prompts, Settings etc.