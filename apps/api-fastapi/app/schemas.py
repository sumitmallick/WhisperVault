from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ConfessionCreate(BaseModel):
    gender: str = Field(..., max_length=16)
    age: int
    content: str
    language: Optional[str] = Field(default=None, max_length=16)
    anonymous: bool = True


class ConfessionRead(BaseModel):
    id: int
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
