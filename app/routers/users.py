from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
import uuid

from app import crud, schemas, auth, models
from app.database import get_db

router = APIRouter(
    prefix="/users",
    tags=["Users & Authentication"],
)

@router.post("/", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
async def create_new_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user.
    """
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    return crud.create_user(db=db, user=user)


@router.post("/token", response_model=schemas.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    """
    Authenticate user and return JWT token.
    Uses form data (username = email, password).
    """
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")

    access_token = auth.create_access_token(
        data={"sub": str(user.id)} # Store user ID (as string) in 'sub' claim
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    """
    Get current authenticated user's profile.
    """
    return current_user

# --- GDPR Style Data Controls ---

@router.get("/me/export", response_model=schemas.UserDataExport)
async def export_my_data(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export all data (profile and journal entries) for the current user.
    """
    entries = crud.get_user_journal_entries(db, user_id=current_user.id, limit=10000) # Get all entries
    return schemas.UserDataExport(
        user_info=schemas.User.model_validate(current_user), # Convert model to schema
        journal_entries=[schemas.JournalEntry.model_validate(entry) for entry in entries]
    )


@router.delete("/me", response_model=schemas.DeletionConfirmation)
async def delete_my_account(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete the current user's account and all associated data.
    THIS IS PERMANENT.
    """
    user_id_to_delete = current_user.id
    # Optional: Count entries before deleting for confirmation message
    entry_count = db.query(models.JournalEntry).filter(models.JournalEntry.user_id == user_id_to_delete).count()

    deleted_user = crud.delete_user(db, user_id=user_id_to_delete)

    if deleted_user:
        return schemas.DeletionConfirmation(
            message="User account and all associated data successfully deleted.",
            deleted_user_id=user_id_to_delete,
            deleted_entry_count=entry_count
        )
    else:
        # This case should ideally not happen if get_current_user works, but good practice
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found for deletion.")