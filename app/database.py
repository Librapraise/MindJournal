from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    # Check if DATABASE_URL is loaded correctly
    if not settings.DATABASE_URL:
        raise ValueError("DATABASE_URL not found in environment variables or .env file")
    logger.info(f"Database URL: {settings.DATABASE_URL[:15]}...") # Log partial URL for security

    # For standard sync psycopg2 driver:
    engine = create_engine(settings.DATABASE_URL)

    # If using asyncpg:
    # from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    # engine = create_async_engine(settings.DATABASE_URL)
    # SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    Base = declarative_base()
    logger.info("Database engine and session created successfully.")

except Exception as e:
    logger.error(f"Error creating database engine or session: {e}", exc_info=True)
    # Exit or raise critical error if DB connection is essential at startup
    raise RuntimeError(f"Failed to initialize database connection: {e}")


# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# If using asyncpg:
# async def get_async_db():
#     async with SessionLocal() as session:
#         yield session