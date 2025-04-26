from datetime import datetime, timedelta, timezone
from typing import Optional
import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.core.config import settings
from app.database import get_db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2PasswordBearer points to the URL where the client can send username/password
# to get a token (we'll define this route in routers/users.py)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/token")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against a hashed password."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hashes a plain password."""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Creates a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> models.User:
    """Dependency to get the current authenticated user from the token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: Optional[str] = payload.get("sub") # We store user_id in 'sub'
        if user_id is None:
            raise credentials_exception

        # Validate if it's a valid UUID string before querying
        try:
            user_uuid = uuid.UUID(user_id)
        except ValueError:
             raise credentials_exception

        token_data = schemas.TokenData(user_id=user_id)

    except (JWTError, ValidationError) as e:
        print(f"Token validation error: {e}") # Log the error for debugging
        raise credentials_exception

    user = crud.get_user(db, user_id=user_uuid) # Fetch user by UUID
    if user is None:
        raise credentials_exception
    if not user.is_active: # Optional: Check if user is active
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return user

# Optional: Dependency for superuser/admin checks if needed later
# async def get_current_active_superuser(current_user: models.User = Depends(get_current_user)):
#     if not crud.is_superuser(current_user):
#         raise HTTPException(
#             status_code=403, detail="The user doesn't have enough privileges"
#         )
#     return current_user