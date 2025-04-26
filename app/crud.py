from sqlalchemy.orm import Session
from sqlalchemy import func, desc, extract,select 
from app import models, schemas, auth
from typing import List, Optional
from datetime import datetime, timedelta, timezone
import uuid
import json # <-- Import json
from collections import Counter
# --- User CRUD ---

def get_user(db: Session, user_id: uuid.UUID) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        first_name=user.first_name, # Add this
        last_name=user.last_name    # Add this
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: uuid.UUID) -> Optional[models.User]:
    """ Deletes a user and their associated journal entries (due to cascade). """
    db_user = get_user(db, user_id=user_id)
    if db_user:
        db.delete(db_user)
        db.commit()
        return db_user
    return None


# --- Journal Entry CRUD ---

def get_journal_entry(db: Session, entry_id: int, user_id: uuid.UUID) -> Optional[models.JournalEntry]:
    """ Gets a specific journal entry only if it belongs to the user. """
    return db.query(models.JournalEntry).filter(
        models.JournalEntry.id == entry_id,
        models.JournalEntry.user_id == user_id
    ).first()

def get_user_journal_entries(
    db: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> List[models.JournalEntry]:
    """ Gets all journal entries for a specific user with pagination. """
    return db.query(models.JournalEntry)\
             .filter(models.JournalEntry.user_id == user_id)\
             .order_by(desc(models.JournalEntry.created_at))\
             .offset(skip)\
             .limit(limit)\
             .all()

def create_journal_entry(
    db: Session, entry: schemas.JournalEntryCreate, user_id: uuid.UUID
) -> models.JournalEntry:
    """ Creates a new journal entry. """
    db_entry = models.JournalEntry(**entry.model_dump(), user_id=user_id)
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

def update_journal_entry_with_ai(
    db: Session, entry_id: int, user_id: uuid.UUID, ai_results: schemas.AIAnalysisResult
) -> Optional[models.JournalEntry]:
    """ Updates an existing journal entry with AI analysis results. """
    db_entry = get_journal_entry(db, entry_id=entry_id, user_id=user_id)
    if db_entry:
        db_entry.sentiment_score = ai_results.sentiment_score
        db_entry.sentiment_label = ai_results.sentiment_label
        db_entry.key_themes = ai_results.key_themes # Assumes themes is list/JSON
        db_entry.suggested_strategies = ai_results.suggested_strategies # Assumes strategies is list/JSON
        db_entry.ai_analysis_completed_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(db_entry)
    return db_entry


def delete_journal_entry(db: Session, entry_id: int, user_id: uuid.UUID) -> Optional[models.JournalEntry]:
    """ Deletes a specific journal entry if it belongs to the user. """
    db_entry = get_journal_entry(db, entry_id=entry_id, user_id=user_id)
    if db_entry:
        db.delete(db_entry)
        db.commit()
        return db_entry
    return None

# --- Insights CRUD (Examples) ---

def get_mood_history(db: Session, user_id: uuid.UUID, days: int) -> List[schemas.MoodPoint]:
    """ Gets mood entries for the last N days. """
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    results = db.query(
            models.JournalEntry.created_at,
            models.JournalEntry.mood
        ).filter(
            models.JournalEntry.user_id == user_id,
            models.JournalEntry.created_at >= start_date,
            models.JournalEntry.mood.isnot(None)  
        ).order_by(models.JournalEntry.created_at)\
        .all()
    return [schemas.MoodPoint(date=r[0], mood=r[1]) for r in results]


def get_theme_frequency(db: Session, user_id: uuid.UUID, days: int) -> List[schemas.ThemeCloudItem]:
    """
    Gets frequency of themes from the last N days by processing in Python.
    """
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    theme_counts = Counter()

    # 1. Fetch entries with non-null key_themes within the date range
    #    Only select the key_themes column to minimize data transfer
    query = select(models.JournalEntry.key_themes).where(
        models.JournalEntry.user_id == user_id,
        models.JournalEntry.created_at >= start_date,
        models.JournalEntry.key_themes.isnot(None) # Important: Filter out nulls
    )
    results = db.execute(query).scalars().all() # Use scalars() to get just the theme lists

    # 2. Process themes in Python
    for theme_list in results:
        # Assuming key_themes is stored as a list (SQLAlchemy JSON type often handles this)
        # If it's stored as a JSON string, you might need json.loads(theme_list)
        if isinstance(theme_list, list):
            theme_counts.update(theme_list)
        elif isinstance(theme_list, str):
             # Add basic error handling in case of invalid JSON string
            try:
                parsed_list = json.loads(theme_list)
                if isinstance(parsed_list, list):
                    theme_counts.update(parsed_list)
            except json.JSONDecodeError:
                print(f"Warning: Could not parse key_themes JSON string: {theme_list}")
                # Optionally log this error

    # 3. Get the most common themes (e.g., top 50)
    top_themes = theme_counts.most_common(50)

    # 4. Format the output
    return [schemas.ThemeCloudItem(theme=theme, count=count) for theme, count in top_themes]
