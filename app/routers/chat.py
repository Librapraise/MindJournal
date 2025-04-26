from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
import logging

from app import crud, schemas, auth, models, services
from app.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/chat",
    tags=["AI chat-bot"],
    dependencies=[Depends(auth.get_current_user)]  # Protect all routes
)


@router.post("/query", response_model=schemas.ChatResponse)
async def chat_query(
    message: schemas.ChatMessage,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """
    Send a message to the AI chat-bot and get a response.
    
    The bot maintains a supportive, empathetic tone while respecting professional boundaries.
    No medical advice or diagnosis is provided.
    """
    try:
        # Optional: Get recent chat history from database
        # chat_history = crud.get_recent_chat_history(db, current_user.id, limit=3)   
        # For now, we'll proceed without chat history
        response = await services.generate_chat_response(
            message=message.message,
            chat_history=None  # Add chat history here if implemented
        )
        
        if response:
            # Optional: Store the interaction in database
            # crud.save_chat_interaction(db, current_user.id, message.message, response)
            return schemas.ChatResponse(response=response)
        else:
            return schemas.ChatResponse(
                response="I apologize, but I'm having trouble understanding. Could you try rephrasing?",
                error="Failed to generate response"
            )
            
    except Exception as e:
        logger.error(f"Chat error for user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process chat message"
        )
