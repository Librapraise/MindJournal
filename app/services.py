import logging
import json
import random # Added import
import uuid # Added import
from enum import Enum
from typing import Optional, List # Added for return type hint

from app.core.config import settings
from app.schemas import AIAnalysisResult, JournalEntry 
from app import crud # Added import
from sqlalchemy.orm import Session # Added import

# LangChain components
# from langchain_openai import ChatOpenAI # Updated import path
from langchain_google_genai import ChatGoogleGenerativeAI # Updated import path
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import PydanticOutputParser
from langchain.schema.output_parser import StrOutputParser
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


# Default prompts for fallback
DEFAULT_PROMPTS = [
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

# New prompt template for generating journal prompts using the LLM
PROMPT_GENERATION_TEMPLATE = """You are an AI assistant designed to generate thoughtful and empathetic journal prompts.

Based on the following context from the user's recent journal entries (if provided), create a *single*, concise, and open-ended journal prompt (1-2 sentences) to encourage reflection.

If recent entries suggest negative feelings (sadness, stress, anxiety), consider a prompt focusing on self-compassion, resilience, or finding small positives.
If recent entries are positive, perhaps suggest a prompt about savoring joy, expressing gratitude, or future aspirations.
If context is neutral or unavailable, generate a general reflective prompt.

Maintain a supportive and encouraging tone. Output *only* the generated prompt text, nothing else.

Recent Context:
{context}

Generated Prompt:"""

prompt_generation_prompt = ChatPromptTemplate.from_template(PROMPT_GENERATION_TEMPLATE)

def _format_context_for_llm(entries: List[JournalEntry]) -> str:
    """Helper function to format recent entries into a context string for the LLM."""
    if not entries:
        return "No recent entries available."

    context_parts = []
    # Limit context size to avoid overwhelming the LLM or hitting token limits
    max_context_entries = 2 # Use last 2 entries for context
    max_text_snippet = 150 # Max characters per entry snippet

    for entry in entries[:max_context_entries]:
        entry_desc = f"- Entry from {entry.created_at.strftime('%Y-%m-%d')}:"
        if entry.mood:
            entry_desc += f" Mood '{entry.mood}'."
        if entry.content:
            snippet = entry.content[:max_text_snippet]
            # Add ellipsis if truncated
            snippet += "..." if len(entry.content) > max_text_snippet else ""
            entry_desc += f" Content starts with: \"{snippet}\"."
        # Future enhancement: Could also include themes/sentiment from AIAnalysisResult if available and linked
        context_parts.append(entry_desc)

    return "\n".join(context_parts) if context_parts else "No recent entries available."


async def generate_journal_prompt(
    db: Session,
    user_id: uuid.UUID,
    provider: LLMProvider = LLMProvider.GEMINI # Allow specifying provider
) -> str:
    """
    Generates a contextual journal prompt using an LLM based on recent entries.
    Falls back to default prompts if LLM fails or no context is available.
    """
    recent_entries: List[JournalEntry] = []
    context_str = "No recent entries available."

    try:
        # 1. Fetch recent entries (assuming newest first)
        # Ensure your crud function returns objects with created_at, mood, content
        recent_entries = crud.get_user_journal_entries(db, user_id=user_id, limit=3) # Fetch a few for context
        logger.debug(f"Fetched {len(recent_entries)} recent entries for user {user_id}")

        # 2. Format context for the LLM
        context_str = _format_context_for_llm(recent_entries)
        logger.debug(f"Formatted context for LLM: {context_str}")

    except Exception as e:
        logger.error(f"Error fetching or formatting recent entries for user {user_id}: {e}", exc_info=True)
        # Proceed without context, LLM will generate a general prompt

    try:
        # 3. Get LLM instance
        llm = get_llm(provider)

        # 4. Create LLM chain for prompt generation
        # We want simple string output, so use StrOutputParser
        chain = prompt_generation_prompt | llm | StrOutputParser()

        logger.info(f"Requesting journal prompt from {provider} with context...")

        # 5. Invoke LLM chain
        generated_prompt = await chain.ainvoke({"context": context_str})

        # 6. Clean up and validate the output
        generated_prompt = generated_prompt.strip()

        if generated_prompt:
            logger.info(f"Successfully generated prompt using {provider}: '{generated_prompt}'")
            return generated_prompt
        else:
            logger.warning(f"{provider} returned an empty prompt, falling back to default.")
            # Fall through to fallback mechanism

    except Exception as e:
        logger.error(f"Error generating prompt using {provider} for user {user_id}: {e}", exc_info=True)
        # Fall through to fallback mechanism

    # 7. Fallback: Return a random default prompt if LLM fails or returns empty
    logger.info(f"Falling back to default prompt for user {user_id}")
    return random.choice(DEFAULT_PROMPTS)

CHAT_TEMPLATE = """You are an empathetic AI mental health companion. 
Respond to the user's message while following these guidelines:

- Be supportive and understanding
- Provide practical, actionable suggestions when appropriate
- Maintain professional boundaries (no medical advice, diagnosis, or treatment)
- If user expresses serious crisis/harm, always recommend professional help
- Keep responses concise (max 150 words)

User's previous messages for context (if any):
{chat_history}

Current message:
{message}

Response:"""

chat_prompt = ChatPromptTemplate.from_template(CHAT_TEMPLATE)

async def generate_chat_response(
    message: str,
    chat_history: List[dict] = None,
    provider: LLMProvider = LLMProvider.GEMINI
) -> Optional[str]:
    """
    Generate a response to a user's chat message.
    
    Args:
        message: The user's current message
        chat_history: List of previous messages [{"role": "user"|"assistant", "content": "msg"}]
        provider: The LLM provider to use
    
    Returns:
        str: The AI's response
        None: If an error occurred
    """
    if not message or not message.strip():
        logger.warning("Attempted to process empty message")
        return None

    try:
        # Format chat history for context
        history_text = ""
        if chat_history:
            history_text = "\n".join([
                f"{msg['role']}: {msg['content']}"
                for msg in chat_history[-3:]  # Only use last 3 messages for context
            ])

        # Get LLM instance
        llm = get_llm(provider)

        # Create chain with string output
        chain = chat_prompt | llm | StrOutputParser()

        # Generate response
        logger.info(f"Sending chat request to {provider}")
        response = await chain.ainvoke({
            "message": message,
            "chat_history": history_text
        })

        response = response.strip()
        if response:
            logger.info(f"Successfully generated chat response using {provider}")
            return response
        
        logger.warning(f"{provider} returned empty response")
        return "I apologize, but I'm having trouble generating a response. Could you try rephrasing your message?"

    except Exception as e:
        logger.error(f"Error generating chat response using {provider}: {e}", exc_info=True)
        return "I apologize, but I'm experiencing technical difficulties. Please try again later."
