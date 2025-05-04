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
    # Add this line:
    articles = relationship("Article", back_populates="owner", cascade="all, delete-orphan") 

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
    
    

class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    # Ensure UUID type matches your User model's ID type exactly
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    triggering_mood = Column(String, index=True, nullable=False) # Made non-nullable
    source_journal_entry_id = Column(Integer, ForeignKey("journal_entries.id", ondelete="SET NULL"), nullable=True, index=True) # Link to triggering entry, set null if entry deleted
    generation_variation_key = Column(String, nullable=True) # Identifier for which variation this is
    generated_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    # Link to User model
    owner = relationship("User", back_populates="articles")
    # Link to JournalEntry model (optional, if needed)
    source_entry = relationship("JournalEntry") # No back_populates unless JournalEntry needs article list

# You might add more models later, e.g., for Prompts, Settings etc.