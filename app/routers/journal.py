import logging
import uuid
from typing import List, Optional

from fastapi import (APIRouter, Depends, HTTPException, Query, status,
                     BackgroundTasks) # Added BackgroundTasks
from sqlalchemy.orm import Session

# Adjust imports based on your project structure
from app import auth, crud, services, models, schemas # Use services
from app.database import get_db # Assuming get_db yields a Session

# Setup logger
logger = logging.getLogger(__name__)

router = APIRouter(
    # Prefixing with /journal makes sense, but ensure /journal/articles is desired
    # Alternatively, create a new router for /articles
    prefix="/journal",
    tags=["Journal Entries & Articles"], # Updated tag name
    # Apply dependency globally if ALL routes need it, otherwise apply per-route
    # dependencies=[Depends(auth.get_current_user)]
)

# --- Journal Entry Endpoints ---

@router.post(
    "/",
    response_model=schemas.EntryAccepted,
    status_code=status.HTTP_201_CREATED,
    summary="Create New Journal Entry",
    dependencies=[Depends(auth.get_current_user)],
)
async def create_entry(
    entry_in: schemas.JournalEntryCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if not entry_in.mood.strip():
        raise HTTPException(status_code=422, detail="Mood cannot be empty.")
    if len(entry_in.content or "") < 10:
        raise HTTPException(status_code=422, detail="Content must be at least 10 characters long.")

    # Persist & flush
    db_entry = crud.create_journal_entry(db=db, entry=entry_in, user_id=current_user.id)
    logger.debug(f"Created journal entry ID={db_entry.id}")

    # Schedule background analysis + article-gen
    background_tasks.add_task(
        services.generate_and_save_articles_task,
        user_id=current_user.id,
        entry_id=db_entry.id,
        mood=db_entry.mood,
        entry_content=db_entry.content,
    )

    return schemas.EntryAccepted(
        entry_id=db_entry.id,
        status_url=f"/journal-entries/{db_entry.id}/status"
    )
@router.get(
    "/{entry_id}/status",
    response_model=schemas.EntryStatus,
    dependencies=[Depends(auth.get_current_user)]
)
def entry_status(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_user),
):
    entry = crud.get_journal_entry(db, entry_id, current_user.id)
    if not entry:
        raise HTTPException(404, "Not found")
    return schemas.EntryStatus(
        status="complete" if entry.ai_analysis_completed_at else "pending",
        sentiment_label=entry.sentiment_label,
        sentiment_score=entry.sentiment_score,
        ai_analysis_completed_at=entry.ai_analysis_completed_at
    )
        
@router.get(
    "/",
    response_model=List[schemas.JournalEntry],
    summary="List Journal Entries",
    description="Retrieve journal entries for the current user, ordered by most recent.",
    dependencies=[Depends(auth.get_current_user)] # Protect this route
)
async def read_entries(
    skip: int = 0,
    limit: int = 30,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """ Retrieves journal entries with pagination. """
    entries = crud.get_user_journal_entries(
        db, user_id=current_user.id, skip=skip, limit=limit
    )
    return entries


@router.get(
    "/{entry_id}",
    response_model=schemas.JournalEntry,
    summary="Get Specific Journal Entry",
    dependencies=[Depends(auth.get_current_user)] # Protect this route
)
async def read_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """ Retrieve a specific journal entry by its ID. """
    db_entry = crud.get_journal_entry(db, entry_id=entry_id, user_id=current_user.id)
    if db_entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Journal entry not found")
    return db_entry


@router.delete(
    "/{entry_id}",
    response_model=schemas.DeletionConfirmation,
    summary="Delete Journal Entry",
    dependencies=[Depends(auth.get_current_user)] # Protect this route
)
async def delete_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """ Delete a specific journal entry by its ID. """
    # Remember foreign key constraints (ondelete="SET NULL" for articles)
    db_entry = crud.delete_journal_entry(db, entry_id=entry_id, user_id=current_user.id)
    if db_entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Journal entry not found or you don't have permission")
    return schemas.DeletionConfirmation(message=f"Journal entry {entry_id} deleted successfully.")


# --- Insight & Prompt Endpoints (Keep As Is) ---

@router.get(
    "/insights/",
    response_model=schemas.HistoricalInsights,
    summary="Get Historical Insights",
    dependencies=[Depends(auth.get_current_user)] # Protect this route
)
async def get_historical_insights(
    days_mood: int = Query(30, ge=1, le=90, description="Number of days for mood history (e.g., 7, 30)"),
    days_themes: int = Query(30, ge=1, le=90, description="Number of days for theme cloud (e.g., 30)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """ Retrieve aggregated insights like mood history and theme cloud. """
    # Assuming crud.get_mood_history and crud.get_theme_frequency exist and work
    mood_history_data = crud.get_mood_history(db, user_id=current_user.id, days=days_mood)
    theme_cloud_data = crud.get_theme_frequency(db, user_id=current_user.id, days=days_themes)

    # Structure the response (Keep logic as is)
    insights = schemas.HistoricalInsights()
    if days_mood == 7:
         insights.mood_history_7d = schemas.MoodHistory(data=mood_history_data)
    elif days_mood == 30:
         insights.mood_history_30d = schemas.MoodHistory(data=mood_history_data)
    if days_themes == 30:
         insights.theme_cloud_30d = schemas.ThemeCloud(data=theme_cloud_data)

    return insights


@router.get(
    "/prompt/",
    response_model=str, # Expecting a plain string response
    summary="Get Journal Prompt",
    dependencies=[Depends(auth.get_current_user)] # Protect this route
)
async def get_journal_prompt(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """ Get a contextual journal prompt using the LLM service. """
    # Assuming services.generate_journal_prompt exists and works
    try:
        prompt = await services.generate_journal_prompt(db=db, user_id=current_user.id)
        if not prompt: # Handle case where service returns empty/None
             logger.warning(f"Journal prompt generation returned empty for user {current_user.id}")
             raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Could not generate journal prompt at this time.")
        return prompt
    except Exception as e:
        logger.error(f"Error generating journal prompt for user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Error generating journal prompt.")


# --- NEW: Endpoint to Retrieve Generated Articles ---

@router.get(
    "/articles/",
    response_model=List[schemas.Article], # Use the Article schema for reading
    summary="List Generated Articles",
    description="Retrieve articles generated for the user, newest first.",
    dependencies=[Depends(auth.get_current_user)] # Protect this route
)
async def read_generated_articles(
    skip: int = 0,
    limit: int = 10, # Default to fewer articles per page
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """ Retrieves articles generated by the background task, with pagination. """
    # Assuming crud.get_user_articles exists and works
    articles = crud.get_user_articles(db, user_id=current_user.id, skip=skip, limit=limit)
    return articles