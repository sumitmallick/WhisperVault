from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Generic, TypeVar
from datetime import datetime

T = TypeVar('T')


class ConfessionCreate(BaseModel):
    gender: str = Field(..., max_length=16)
    age: int
    content: str
    language: Optional[str] = Field(default=None, max_length=16)
    anonymous: bool = True


class ConfessionRead(BaseModel):
    id: int
    user_id: Optional[int]
    gender: str
    age: int
    content: str
    language: Optional[str]
    anonymous: bool
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PublishRequest(BaseModel):
    platforms: List[str]  # e.g., ["fb","ig"]


class PublishJobRead(BaseModel):
    id: int
    confession_id: int
    platforms_csv: str
    asset_path: Optional[str]
    status: str
    error: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    per_page: int
    pages: int
    has_next: bool
    has_prev: bool


class UserBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserRead(UserBase):
    id: int
    is_active: bool
    is_superuser: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=6)


# Auth schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class LoginRequest(BaseModel):
    username: str  # This will be email
    password: str
