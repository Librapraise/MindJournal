from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app import crud, schemas, auth, models, services
from app.database import get_db

router = APIRouter(
    prefix="/journal",
    tags=["Journal Entries & Insights"],
    dependencies=[Depends(auth.get_current_user)] # Protect all routes in this router
)

@router.post("/", response_model=schemas.JournalEntry, status_code=status.HTTP_201_CREATED)
async def create_entry(
    entry: schemas.JournalEntryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """
    Create a new journal entry. AI analysis is triggered asynchronously (or synchronously here).
    """
    # 1. Create the basic entry in DB
    db_entry = crud.create_journal_entry(db=db, entry=entry, user_id=current_user.id)

    # --- Trigger AI Analysis ---
    # Option A: Synchronous (Waits for AI before responding - simpler, but slow)
    try:
        ai_results = await services.analyze_journal_entry_with_ai(db_entry.content)
        if ai_results and ai_results.sentiment_label: # Check if AI returned valid data
            updated_entry = crud.update_journal_entry_with_ai(
                db=db, entry_id=db_entry.id, user_id=current_user.id, ai_results=ai_results
            )
            if updated_entry:
                 return updated_entry # Return entry with AI results
            else:
                # Handle case where update failed (shouldn't happen if entry was just created)
                # Log error and return original entry or raise internal error
                print(f"Error: Failed to update entry {db_entry.id} with AI results after creation.")
                return db_entry # Return entry without AI results in case of update error
        else:
            # AI analysis failed or returned empty, return original entry
             print(f"Warning: AI analysis did not return valid results for entry {db_entry.id}. Returning original.")
             return db_entry

    except Exception as e:
        # Log the error, but still return the created entry
        print(f"Error during AI analysis for entry {db_entry.id}: {e}")
        return db_entry # Return the entry even if AI fails

    # Option B: Asynchronous (Respond quickly, AI updates later via background task)
    # Requires setting up background tasks (e.g., using FastAPI's BackgroundTasks, Celery, ARQ)
    # background_tasks.add_task(process_ai_analysis, db_entry.id, current_user.id)
    # return db_entry # Return immediately

@router.get("/", response_model=List[schemas.JournalEntry])
async def read_entries(
    skip: int = 0,
    limit: int = 30, # Default to fetching last 30 entries
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """
    Retrieve journal entries for the current user, ordered by most recent.
    Supports pagination.
    """
    entries = crud.get_user_journal_entries(
        db, user_id=current_user.id, skip=skip, limit=limit
    )
    return entries

@router.get("/{entry_id}", response_model=schemas.JournalEntry)
async def read_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """
    Retrieve a specific journal entry by its ID.
    Ensures the entry belongs to the current user.
    """
    db_entry = crud.get_journal_entry(db, entry_id=entry_id, user_id=current_user.id)
    if db_entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Journal entry not found")
    return db_entry

@router.delete("/{entry_id}", response_model=schemas.DeletionConfirmation)
async def delete_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """
    Delete a specific journal entry by its ID.
    Ensures the entry belongs to the current user.
    """
    db_entry = crud.delete_journal_entry(db, entry_id=entry_id, user_id=current_user.id)
    if db_entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Journal entry not found or you don't have permission")
    return schemas.DeletionConfirmation(message=f"Journal entry {entry_id} deleted successfully.")


@router.get("/insights/", response_model=schemas.HistoricalInsights)
async def get_historical_insights(
    days_mood: int = Query(30, ge=1, le=90, description="Number of days for mood history (e.g., 7, 30)"),
    days_themes: int = Query(30, ge=1, le=90, description="Number of days for theme cloud (e.g., 30)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """
    Retrieve aggregated insights like mood history and theme cloud.
    """
    mood_history_data = crud.get_mood_history(db, user_id=current_user.id, days=days_mood)
    print(mood_history_data)
    theme_cloud_data = crud.get_theme_frequency(db, user_id=current_user.id, days=days_themes)

    # Structure the response
    insights = schemas.HistoricalInsights()
    if days_mood == 7:
         insights.mood_history_7d = schemas.MoodHistory(data=mood_history_data)
    elif days_mood == 30:
         insights.mood_history_30d = schemas.MoodHistory(data=mood_history_data)
    # Add logic if other day ranges are requested or combine if needed

    if days_themes == 30:
         insights.theme_cloud_30d = schemas.ThemeCloud(data=theme_cloud_data)
    # Add logic for other day ranges for themes

    return insights


@router.get("/prompt/", response_model=str)
async def get_journal_prompt(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """
    Get a contextual journal prompt.
    """
    prompt = await services.generate_journal_prompt(db, user_id=current_user.id)
    return prompt # Return prompt as a plain string

