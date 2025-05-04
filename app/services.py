import logging
import json
import random # Added import
import uuid # Added import
from enum import Enum
from typing import Optional, List, Tuple # Added for return type hint

from app.core.config import settings
from app.schemas import AIAnalysisResult, JournalEntry , GeneratedArticle, LLMGeneratedArticle, ArticleCreate, Article
from app import crud # Added import
from sqlalchemy.orm import Session # Added import
from typing import Optional, List, Dict # Added Dict
from datetime import datetime, timedelta # Added datetime imports
from collections import Counter # Added Counter
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

# LangChain components
from langchain_openai import ChatOpenAI # Updated import path
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
        case LLMProvider.OPENAI:
            if not settings.OPENAI_API_KEY:
                logger.error("OpenAI API key is not configured.")
                raise ValueError("OpenAI API key not configured")

            return ChatOpenAI(
                openai_api_key=settings.OPENAI_API_KEY,
                model="gpt-4", # Consider newer/cheaper models like gpt-4o or gpt-3.5-turbo if sufficient
                temperature=0.5,
                max_tokens=300, # Max tokens for the *completion*
            )


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


ARTICLE_GENERATION_TEMPLATE = """You are an empathetic AI writer specializing in mental well-being topics.
Your task is to generate content for a short, supportive, and informative article (blog post style) about the mood: **{mood}**.

The target audience is someone who has been frequently experiencing this mood recently.

Guidelines for the article body:
- **Acknowledge and Validate:** Start by acknowledging that experiencing '{mood}' is a valid human emotion.
- **Explore Gently:** Briefly discuss what this mood might feel like or common situations that trigger it (without making assumptions about the reader).
- **Offer Perspective/Strategies (Mood Dependent):**
    - If the mood is generally considered negative (e.g., Sad, Anxious, Stressed, Angry, Overwhelmed): Offer 2-3 general, gentle, and actionable coping strategies or reflective points. Examples: mindfulness, small acts of self-care, journaling, connecting with others, gentle movement, focusing on controllables. Frame these as *possibilities* to explore, not directives.
    - If the mood is generally considered positive (e.g., Happy, Grateful, Calm, Hopeful, Content): Suggest ways to savor or cultivate this feeling. Examples: reflecting on the source, sharing the feeling, practicing gratitude, incorporating related activities.
    - If the mood is neutral (e.g., Neutral, Reflective): Discuss the value of neutral states, self-awareness, or finding balance.
- **Tone:** Empathetic, understanding, hopeful, and non-clinical.
- **Length:** Keep the article body relatively concise, aiming for roughly {article_length_target} words.
- **Disclaimer:** Include a sentence like: "If these feelings are persistent or overwhelming, seeking support from a mental health professional can be very helpful." near the end of the body.
- **Crucially:** Do **NOT** provide medical advice, diagnosis, or treatment recommendations. Do **NOT** suggest specific medications or therapies.

Mood to focus on: {mood}
Desired article length category: {article_length}

Output Format Instructions:
{format_instructions}

Provide the generated title and body content according to the format instructions.
"""

mood_history_article_parser = PydanticOutputParser(pydantic_object=GeneratedArticle)

article_generation_prompt = ChatPromptTemplate.from_template(
    template=ARTICLE_GENERATION_TEMPLATE,
    partial_variables={"format_instructions": mood_history_article_parser.get_format_instructions()}
)

async def generate_article_based_on_mood(
    db: Session,
    user_id: uuid.UUID,
    provider: LLMProvider = LLMProvider.GEMINI,
    time_period_days: int = 30,
    article_length: str = "short"
) -> Optional[Tuple[GeneratedArticle, str]]: # Return Tuple including mood
    """
    Generates a *single* supportive article based on the user's most frequent
    mood over a specified period. Returns article object and the mood string.
    (This is the function generating ONE article based on HISTORY)
    """
    logger.info(f"Starting HISTORICAL article generation for user {user_id} over {time_period_days} days.")

    # --- START: Missing Logic ---
    most_frequent_mood = None
    article_length_target = "200-300" # Default

    try:
        # 1. Fetch recent entries with moods
        start_date = datetime.utcnow() - timedelta(days=time_period_days)
        # Ensure crud.get_user_journal_entries exists and works as expected
        # Fetch enough entries to cover the period, filtering happens next
        all_entries = crud.get_user_journal_entries(db, user_id=user_id, limit=200) # Adjust limit if needed

        # Filter entries by date and ensure they have a non-empty mood
        recent_entries_with_mood = [
            entry for entry in all_entries
            if entry.created_at >= start_date and entry.mood and entry.mood.strip()
        ]

        if not recent_entries_with_mood:
            logger.warning(f"No entries with non-empty moods found for user {user_id} in the last {time_period_days} days.")
            return None # Not enough data

        logger.debug(f"Found {len(recent_entries_with_mood)} entries with moods for HISTORICAL analysis for user {user_id}.")

        # 2. Calculate mood frequency
        mood_counts = Counter(entry.mood for entry in recent_entries_with_mood)
        if not mood_counts:
             logger.warning(f"Mood counts are empty even after fetching entries for user {user_id}.")
             return None # Should not happen if previous check passed, but safeguard

        # Find the most frequent mood
        # most_common returns list of tuples [('mood', count), ...]
        most_frequent_mood_tuple = mood_counts.most_common(1)
        if not most_frequent_mood_tuple:
             logger.warning(f"Could not determine most frequent mood for user {user_id}.")
             return None

        most_frequent_mood, freq = most_frequent_mood_tuple[0]
        logger.info(f"Most frequent mood for user {user_id} (last {time_period_days} days) is '{most_frequent_mood}' ({freq} times).")

        # 3. Map article length string to target word count (approximate)
        length_map = {"short": "200-300", "medium": "400-500"}
        article_length_target = length_map.get(article_length.lower(), "200-300") # Default to short

    except Exception as e:
        logger.error(f"Database error fetching entries or calculating mood frequency for user {user_id}: {e}", exc_info=True)
        return None
    # --- END: Missing Logic ---

    # Ensure we actually found a mood before proceeding
    if not most_frequent_mood:
        logger.error(f"No most frequent mood identified for user {user_id}, cannot generate article.")
        return None

    # 4. Generate article using LLM and Pydantic Parser
    try:
        # Specify service_type for potentially different LLM settings
        llm = get_llm()
        chain = article_generation_prompt | llm | mood_history_article_parser

        logger.info(f"Requesting HISTORICAL article generation from {provider} for mood '{most_frequent_mood}'...")

        # Invoke the chain with the calculated variables
        generated_article_obj: GeneratedArticle = await chain.ainvoke({
             "mood": most_frequent_mood,          # Now correctly passed
             "article_length": article_length,
             "article_length_target": article_length_target # Now correctly passed
        })

        # Validate the parsed output
        if generated_article_obj and generated_article_obj.title and generated_article_obj.body:
            # Optional: Basic length check on the body
            if len(generated_article_obj.body) < 50:
                 logger.warning(f"{provider} returned a very short HISTORICAL article body for mood '{most_frequent_mood}'. Returning object anyway.")

            logger.info(f"Successfully generated and parsed HISTORICAL article about '{most_frequent_mood}' using {provider}.")
            # Return the Pydantic object AND the mood string
            return generated_article_obj, most_frequent_mood
        else:
            # This case means the LLM output didn't match the Pydantic schema
            logger.warning(f"{provider} failed to produce structured output or returned empty fields for HISTORICAL article mood '{most_frequent_mood}'.")
            return None

    except Exception as e:
        # Catch potential LLM API errors OR Pydantic parsing errors
        logger.error(f"Error during HISTORICAL article generation/parsing using {provider} for mood '{most_frequent_mood}': {e}", exc_info=True)
        return None

# --- NEW: Single Article Generation Service (for Background Task) ---
single_article_output_parser = PydanticOutputParser(pydantic_object=LLMGeneratedArticle)

SINGLE_ARTICLE_TEMPLATE = """You are an empathetic AI writer specializing in mental well-being topics.
Generate content for a short, supportive article about the mood: **{mood}**.
Focus the article specifically on: **{variation_focus}**.

The target audience is someone experiencing the '{mood}' mood.

Guidelines for the article body:
- Acknowledge and Validate the '{mood}' feeling.
- Explore the specific focus area ('{variation_focus}') in relation to the mood.
- If the mood is generally negative, offer gentle, actionable perspectives or strategies relevant to the focus.
- If the mood is generally positive, suggest ways to savor or cultivate it, related to the focus.
- Maintain an empathetic, understanding, hopeful, and non-clinical tone.
- Keep the article body concise (around 200-300 words).
- Include a sentence like: "If feelings related to '{mood}' are persistent or overwhelming, seeking support from a mental health professional can be helpful." near the end.
- Do NOT provide medical advice, diagnosis, or treatment.

Mood: {mood}
Specific Focus for this Article: {variation_focus}

Output Format Instructions:
{format_instructions}

Provide the generated title and body content according to the format instructions.
"""
single_article_prompt = ChatPromptTemplate.from_template(
    template=SINGLE_ARTICLE_TEMPLATE,
    partial_variables={"format_instructions": single_article_output_parser.get_format_instructions()}
)

async def generate_single_article_for_mood(
    mood: str,
    variation_focus: str, # New parameter for desired variation
    provider: LLMProvider = LLMProvider.GEMINI
) -> Optional[LLMGeneratedArticle]:
    """
    Generates a single structured article for a specific mood and focus.
    (Used by the background task)
    """
    if not mood or not variation_focus:
        logger.warning("Missing mood or variation_focus for single article generation.")
        return None

    try:
        # Use specific settings for article generation
        llm = get_llm(provider)
        chain = single_article_prompt | llm | single_article_output_parser

        logger.info(f"Requesting single article from {provider} for mood '{mood}' with focus '{variation_focus}'...")

        llm_output: LLMGeneratedArticle = await chain.ainvoke({
            "mood": mood,
            "variation_focus": variation_focus
        })

        if llm_output and llm_output.title and llm_output.body:
            logger.info(f"Successfully generated LLM output for article (mood: {mood}, focus: {variation_focus}).")
            return llm_output
        else:
            logger.warning(f"LLM returned incomplete data for article (mood: {mood}, focus: {variation_focus}).")
            return None

    except Exception as e:
        logger.error(f"Error generating single article (mood: {mood}, focus: {variation_focus}): {e}", exc_info=True)
        return None

# Use the specific LLM output schema defined in schemas.py
single_article_output_parser = PydanticOutputParser(pydantic_object=LLMGeneratedArticle)

SINGLE_ARTICLE_TEMPLATE = """You are an empathetic AI writer specializing in mental well-being topics.
Generate content for a short, supportive article about the mood: **{mood}**.
Focus the article specifically on: **{variation_focus}**.

The target audience is someone experiencing the '{mood}' mood.

Guidelines for the article body:
- Acknowledge and Validate the '{mood}' feeling.
- Explore the specific focus area ('{variation_focus}') in relation to the mood.
- If the mood is generally negative, offer gentle, actionable perspectives or strategies relevant to the focus.
- If the mood is generally positive, suggest ways to savor or cultivate it, related to the focus.
- Maintain an empathetic, understanding, hopeful, and non-clinical tone.
- Keep the article body concise (around 200-300 words).
- Include a sentence like: "If feelings related to '{mood}' are persistent or overwhelming, seeking support from a mental health professional can be helpful." near the end.
- Do NOT provide medical advice, diagnosis, or treatment.

Mood: {mood}
Specific Focus for this Article: {variation_focus}

Output Format Instructions:
{format_instructions}

Provide the generated title and body content according to the format instructions.
"""

single_article_prompt = ChatPromptTemplate.from_template(
    template=SINGLE_ARTICLE_TEMPLATE,
    partial_variables={"format_instructions": single_article_output_parser.get_format_instructions()}
)

async def generate_single_article_for_mood(
    mood: str,
    variation_focus: str, # New parameter for desired variation
    provider: LLMProvider = LLMProvider.GEMINI
) -> Optional[LLMGeneratedArticle]:
    """
    Generates a single structured article for a specific mood and focus.
    (Used by the background task)
    """
    if not mood or not variation_focus:
        logger.warning("Missing mood or variation_focus for single article generation.")
        return None

    try:
        # Use specific settings for article generation
        llm = get_llm(provider)
        chain = single_article_prompt | llm | single_article_output_parser

        logger.info(f"Requesting single article from {provider} for mood '{mood}' with focus '{variation_focus}'...")

        llm_output: LLMGeneratedArticle = await chain.ainvoke({
            "mood": mood,
            "variation_focus": variation_focus
        })

        if llm_output and llm_output.title and llm_output.body:
            logger.info(f"Successfully generated LLM output for article (mood: {mood}, focus: {variation_focus}).")
            return llm_output
        else:
            logger.warning(f"LLM returned incomplete data for article (mood: {mood}, focus: {variation_focus}).")
            return None

    except Exception as e:
        logger.error(f"Error generating single article (mood: {mood}, focus: {variation_focus}): {e}", exc_info=True)
        return None

# --- NEW: Background Task Function ---

ARTICLE_VARIATIONS = [
    "Understanding the Feeling",
    "Simple Coping Strategies",
    "Practicing Self-Compassion",
    "Shifting Your Perspective",
    "Finding Small Positives/Gratitude", # Combined for brevity
    "Connecting with Support/Resources", # Combined
] # Keep it at 6 variations

async def generate_and_save_articles_task(
    user_id: uuid.UUID,
    entry_id: int,
    mood: str,
    entry_content: str
):
    task_name = f"BG Task (Entry {entry_id} Analysis & Article Gen)"
    logger.info(f"{task_name} Started for user {user_id}, mood '{mood}'.")

    articles_generated_count = 0
    articles_saved_count = 0
    analysis_update_successful = False
    article_schemas_to_save: List[ArticleCreate] = []

    # Setup DB session
    engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
    LocalSessionMaker = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    db_session: Session = LocalSessionMaker()

    try:
        # Step 1: AI Analysis
        try:
            ai_results: Optional[AIAnalysisResult] = await analyze_journal_entry_with_ai(entry_content)
        except Exception:
            ai_results = None

        # Step 2: Update entry with analysis
        if ai_results and ai_results.sentiment_label:
            updated = crud.update_journal_entry_with_ai(
                db=db_session,
                entry_id=entry_id,
                user_id=user_id,
                ai_results=ai_results
            )
            analysis_update_successful = bool(updated)

        # Step 3: Generate six article variants
        for focus in ARTICLE_VARIATIONS:
            try:
                gen = await generate_single_article_for_mood(mood=mood, variation_focus=focus)
                if gen:
                    articles_generated_count += 1
                    article_schemas_to_save.append(
                        ArticleCreate(
                            user_id=user_id,
                            title=gen.title,
                            body=gen.body,
                            triggering_mood=mood,
                            source_journal_entry_id=entry_id,
                            generation_variation_key=focus
                        )
                    )
            except Exception:
                continue

        # Step 4: Bulk save and commit
        if article_schemas_to_save:
            created_models = crud.create_articles_bulk(
                db=db_session,
                articles_to_create=article_schemas_to_save
            )
            # Ensure transaction is committed (if CRUD didn't already)
            db_session.commit()
            articles_saved_count = len(created_models)

    except Exception as e:
        logger.error(f"{task_name} Unexpected error: {e}", exc_info=True)
        db_session.rollback()
    finally:
        db_session.close()
        engine.dispose()

    logger.info(
        f"{task_name} Finished. Analysis Updated: {analysis_update_successful}. "
        f"Generated: {articles_generated_count}/6, Saved: {articles_saved_count}."
    )