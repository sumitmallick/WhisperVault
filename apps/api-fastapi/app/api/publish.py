from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from ..database import get_db
from .. import models, schemas
from ..config import settings
from ..tasks import render_and_publish

router = APIRouter(prefix="/publish", tags=["publish"]) 


@router.post("/{confession_id}", response_model=schemas.PublishJobRead, status_code=status.HTTP_202_ACCEPTED)
async def queue_publish(confession_id: int, payload: schemas.PublishRequest, db: AsyncSession = Depends(get_db)):
    stmt = select(models.Confession).where(models.Confession.id == confession_id)
    res = await db.execute(stmt)
    confession = res.scalar_one_or_none()
    if not confession:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Confession not found")
    if confession.status != models.ConfessionStatus.approved:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Confession must be approved to publish")

    platforms_csv = ",".join(payload.platforms)
    job = models.PublishJob(confession_id=confession_id, platforms_csv=platforms_csv)
    db.add(job)
    await db.commit()
    await db.refresh(job)

    if settings.redis_url:
        try:
            render_and_publish.delay(job.id)
        except Exception:
            pass

    return job


@router.get("/jobs/{job_id}", response_model=schemas.PublishJobRead)
async def get_publish_job(job_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(models.PublishJob).where(models.PublishJob.id == job_id)
    res = await db.execute(stmt)
    job = res.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publish job not found")
    return job


@router.get("/jobs", response_model=list[schemas.PublishJobRead])
async def list_publish_jobs(limit: int = Query(20, ge=1, le=100), db: AsyncSession = Depends(get_db)):
    stmt = select(models.PublishJob).order_by(desc(models.PublishJob.created_at)).limit(limit)
    res = await db.execute(stmt)
    jobs = res.scalars().all()
    return jobs
