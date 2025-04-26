import logging
import json
import random # Added import
import uuid # Added import
from enum import Enum
from typing import Optional # Added for return type hint

from app.core.config import settings
from app.schemas import AIAnalysisResult
from app import crud # Added import
from sqlalchemy.orm import Session # Added import

# LangChain components
# from langchain_openai import ChatOpenAI # Updated import path
from langchain_google_genai import ChatGoogleGenerativeAI # Updated import path
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import PydanticOutputParser
# Removed LLMChain as we'll use LCEL pipe syntax
# from langchain.chains import LLMChain

logger = logging.getLogger(__name__)

class LLMProvider(str, Enum):
    OPENAI = "openai"
    GEMINI = "gemini"

def get_llm(provider: LLMProvider = LLMProvider.OPENAI):
    """
    Factory function to create LLM instance.
    Makes it easy to swap between different LLM providers.
    """
    match provider:
        # case LLMProvider.OPENAI:
        #     if not settings.OPENAI_API_KEY:
        #         logger.error("OpenAI API key is not configured.")
        #         raise ValueError("OpenAI API key not configured")

        #     return ChatOpenAI(
        #         openai_api_key=settings.OPENAI_API_KEY,
        #         model="gpt-4", # Consider newer/cheaper models like gpt-4o or gpt-3.5-turbo if sufficient
        #         temperature=0.5,
        #         max_tokens=300, # Max tokens for the *completion*
        #     )

        case LLMProvider.GEMINI:
            if not settings.GOOGLE_API_KEY:
                logger.error("Google API key is not configured.")
                raise ValueError("Google API key not configured")

            # Ensure google-generativeai is installed
            try:
                return ChatGoogleGenerativeAI(
                    google_api_key=settings.GOOGLE_API_KEY,
                    model="gemini-1.5-flash",
                    temperature=0.5,
                    max_output_tokens=300,
                    top_p=0.8,
                    top_k=40,
                    convert_system_message_to_human=True # Often helpful for Gemini
                )
            except ImportError:
                 logger.error("Google GenAI requires 'pip install langchain-google-genai'")
                 raise ValueError("Google GenAI dependencies not installed.")

        case _:
            raise ValueError(f"Unsupported LLM provider: {provider}")

# Create a parser based on the AIAnalysisResult Pydantic model
output_parser = PydanticOutputParser(pydantic_object=AIAnalysisResult)

# Define the prompt template
# Added partial_variables to inject format instructions automatically
ANALYSIS_TEMPLATE = """You are an empathetic AI journaling companion. Analyze the following journal entry.

Identify the overall sentiment (positive, negative, neutral) and provide a score from -1.0 (very negative) to 1.0 (very positive).
Extract the key themes or topics discussed (as a list of strings).
Suggest 1-3 brief, actionable, and empathetic coping strategies or reflection points relevant to the themes (as a list of strings).

Format instructions:
{format_instructions}

Journal Entry:
{text}
"""

prompt = ChatPromptTemplate.from_template(
    template=ANALYSIS_TEMPLATE,
    partial_variables={"format_instructions": output_parser.get_format_instructions()}
)

async def analyze_journal_entry_with_ai(
    text: str,
    provider: LLMProvider = LLMProvider.GEMINI
) -> Optional[AIAnalysisResult]: # Changed return type hint
    """
    Sends journal entry text to LLM for analysis and returns structured results.
    Allows specifying which LLM provider to use.

    Returns:
        AIAnalysisResult: The structured analysis results.
        None: If an error occurred during analysis or parsing.
    """
    if not text or not text.strip():
        logger.warning("Attempted to analyze empty journal entry.")
        return None # Don't analyze empty text

    try:
        # Get the LLM based on provider
        llm = get_llm(provider)

        # Create the chain using LCEL pipe syntax
        # This automatically handles passing inputs and parsing outputs
        chain = prompt | llm | output_parser

        logger.info(f"Sending request to {provider} for analysis...")
        # Run the chain asynchronously, passing the 'text' input variable
        analysis_result = await chain.ainvoke({"text": text})

        logger.info(f"AI analysis successful using {provider} for entry prefix: {text[:50]}...")
        return analysis_result

    except Exception as e:
        # Catch potential LLM API errors, parsing errors, or config errors from get_llm
        # Log the specific error and the provider being used
        logger.error(f"An error occurred during {provider} analysis: {e}", exc_info=True)
        # Consider logging the failing 'text' (or a prefix) if privacy allows and it helps debugging
        # logger.error(f"Failed text prefix: {text[:100]}...")
        return None # Return None on failure

async def generate_journal_prompt(db: Session, user_id: uuid.UUID) -> str:
    """Generates a contextual journal prompt based on recent entries."""
    # Example prompts (consider making these more diverse or configurable)
    default_prompts = [
        "What are you grateful for today, and why?",
        "Describe one small moment that brought you joy or peace recently.",
        "What's one thing you accomplished today, and how did it make you feel?",
        "If you could talk to your past self from one year ago, what encouragement or advice would you offer?",
        "What is currently weighing on your mind? What's one small, manageable step you could take regarding it?",
        "Describe a recent challenge. What did you learn from navigating it?",
        "What activity helps you feel recharged or centered?",
        "Is there anything you need to forgive yourself or someone else for?",
        "What are you looking forward to in the coming days or weeks?",
        "Reflect on a boundary you set recently. How did it feel?",
    ]

    try:
        # Assuming get_user_journal_entries returns entries ordered newest first
        recent_entries = crud.get_user_journal_entries(db, user_id=user_id, limit=3)

        if recent_entries and recent_entries[0].mood:
            # Make mood comparison case-insensitive and more robust
            last_mood = recent_entries[0].mood.strip().lower()
            negative_indicators = {"negative", "sad", "anxious", "stressed", "angry", "frustrated"}
            # Check if any part of the mood string matches known negative indicators
            if any(indicator in last_mood for indicator in negative_indicators):
                # Provide a prompt focused on shifting perspective or self-compassion
                return random.choice([
                    "Reflect on one positive interaction or observation from today, however small.",
                    "What's one act of kindness (from you or towards you) you experienced recently?",
                    "Describe something you appreciate about yourself today.",
                    "Think about a past challenge you overcame. What strength did you use then that you can access now?"
                ])
        # If no recent entries or mood is not negative/not set, return a default prompt
        return random.choice(default_prompts)

    except Exception as e:
        logger.error(f"Error generating prompt for user {user_id}: {e}", exc_info=True)
        # Fallback to a default prompt on any error
        return random.choice(default_prompts)