from __future__ import annotations

from celery import Celery
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import asyncio
import os

from .config import settings
from .database import AsyncSessionLocal
from .models import Confession, ConfessionStatus, PublishJob, PublishStatus
from .services.moderation import moderate_text
from .services.renderer import render_confession_image


celery_app: Celery | None = None

if settings.redis_url:
    celery_app = Celery(
        "confessions",
        broker=settings.redis_url,
        backend=settings.redis_url,
        include=["app.tasks"],
    )
else:
    celery_app = None


async def _moderate_and_update(confession_id: int):
    async with AsyncSessionLocal() as db:  # type: AsyncSession
        stmt = select(Confession).where(Confession.id == confession_id)
        res = await db.execute(stmt)
        confession = res.scalar_one_or_none()
        if not confession:
            return
        decision, _reason = moderate_text(confession.content)
        confession.status = (
            ConfessionStatus.approved if decision == "approved"
            else ConfessionStatus.blocked if decision == "blocked"
            else ConfessionStatus.pending_moderation
        )
        await db.commit()


async def _render_and_publish(job_id: int):
    async with AsyncSessionLocal() as db:
        # load job and confession
        stmt = select(PublishJob).where(PublishJob.id == job_id)
        res = await db.execute(stmt)
        job = res.scalar_one_or_none()
        if not job:
            return
        job.status = PublishStatus.processing
        await db.commit()

        stmt2 = select(Confession).where(Confession.id == job.confession_id)
        res2 = await db.execute(stmt2)
        confession = res2.scalar_one_or_none()
        if not confession:
            job.status = PublishStatus.failed
            job.error = "Confession missing"
            await db.commit()
            return

        try:
            filename = f"confession_{confession.id}_job_{job.id}.png"
            asset_path = render_confession_image(confession.content, filename)
            job.asset_path = asset_path
            job.status = PublishStatus.completed
            await db.commit()
        except Exception as e:
            job.status = PublishStatus.failed
            job.error = str(e)
            await db.commit()


if celery_app:
    @celery_app.task(name="moderate_confession")
    def moderate_confession(confession_id: int):
        asyncio.run(_moderate_and_update(confession_id))

    @celery_app.task(name="render_and_publish")
    def render_and_publish(job_id: int):
        asyncio.run(_render_and_publish(job_id))
else:
    class _Shim:
        def delay(self, *args, **kwargs):
            return None
    moderate_confession = _Shim()  # type: ignore
    render_and_publish = _Shim()  # type: ignore
