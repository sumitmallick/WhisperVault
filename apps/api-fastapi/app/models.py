from enum import Enum as PyEnum
from datetime import datetime

from sqlalchemy import String, Integer, Text, Enum, DateTime, Boolean, func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class ConfessionStatus(PyEnum):
    draft = "draft"
    pending_moderation = "pending_moderation"
    blocked = "blocked"
    approved = "approved"
    published = "published"


class PublishStatus(PyEnum):
    queued = "queued"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class PublishPlatform(PyEnum):
    fb = "fb"
    ig = "ig"
    x = "x"


class Confession(Base):
    __tablename__ = "confessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    gender: Mapped[str] = mapped_column(String(16), nullable=False)
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str | None] = mapped_column(String(16), nullable=True)
    anonymous: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    status: Mapped[ConfessionStatus] = mapped_column(
        Enum(ConfessionStatus), nullable=False, default=ConfessionStatus.pending_moderation
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class PublishJob(Base):
    __tablename__ = "publish_jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    confession_id: Mapped[int] = mapped_column(ForeignKey("confessions.id"), nullable=False)
    platforms_csv: Mapped[str] = mapped_column(String(64), nullable=False)
    asset_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    status: Mapped[PublishStatus] = mapped_column(Enum(PublishStatus), nullable=False, default=PublishStatus.queued)
    error: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
