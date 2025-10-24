from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from ..database import get_db
from .. import models, schemas
from ..services.moderation import moderate_text
from ..config import settings
from ..tasks import moderate_confession

router = APIRouter(prefix="/confessions", tags=["confessions"])


@router.post("", response_model=schemas.ConfessionRead, status_code=status.HTTP_201_CREATED)
async def create_confession(payload: schemas.ConfessionCreate, db: AsyncSession = Depends(get_db)):
    # Default to synchronous moderation decision
    decision, _reason = moderate_text(payload.content)
    status_value = models.ConfessionStatus.approved if decision == "approved" else (
        models.ConfessionStatus.blocked if decision == "blocked" else models.ConfessionStatus.pending_moderation
    )

    confession = models.Confession(
        gender=payload.gender,
        age=payload.age,
        content=payload.content,
        language=payload.language,
        anonymous=payload.anonymous,
        status=status_value,
    )
    db.add(confession)
    await db.commit()
    await db.refresh(confession)

    # If Redis is configured and async moderation is preferred, enqueue task for re-evaluation
    if settings.redis_url and settings.prefer_async_moderation:
        try:
            moderate_confession.delay(confession.id)
        except Exception:
            # Ignore queue errors in local; resource remains with initial status
            pass

    return confession


@router.get("", response_model=list[schemas.ConfessionRead])
async def list_confessions(limit: int = Query(20, ge=1, le=100), db: AsyncSession = Depends(get_db)):
    stmt = select(models.Confession).order_by(desc(models.Confession.created_at)).limit(limit)
    res = await db.execute(stmt)
    items = res.scalars().all()
    return items


@router.get("/{confession_id}", response_model=schemas.ConfessionRead)
async def get_confession(confession_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(models.Confession).where(models.Confession.id == confession_id)
    res = await db.execute(stmt)
    confession = res.scalar_one_or_none()
    if not confession:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Confession not found")
    return confession
