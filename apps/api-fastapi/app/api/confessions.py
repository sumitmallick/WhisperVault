from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from typing import List, Dict, Optional
import logging
from datetime import datetime
from ..database import get_db
from .. import models, schemas
from ..services.moderation import moderate_text

logger = logging.getLogger(__name__)

try:
    from ..services.ai_moderation import moderate_confession_content
except ImportError as e:
    logger.warning(f"AI moderation not available: {e}")
    moderate_confession_content = None
try:
    from ..services.image_generator import generate_confession_image
except ImportError as e:
    logger.warning(f"Image generator not available: {e}")
    generate_confession_image = None

try:
    from ..services.social_media import schedule_social_media_post, social_media_manager
except ImportError as e:
    logger.warning(f"Social media services not available: {e}")
    schedule_social_media_post = None
    social_media_manager = None
from ..config import settings
from ..tasks import moderate_confession
from ..auth import get_current_user, get_current_active_user
from math import ceil

router = APIRouter(prefix="/confessions", tags=["confessions"])


@router.post("", response_model=schemas.ConfessionRead, status_code=status.HTTP_201_CREATED)
async def create_confession(
    payload: schemas.ConfessionCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user)
):
    """Create a new confession with AI-powered moderation"""
    
    # Enhanced AI moderation (with fallback)
    detected_language = "en"  # Default language
    
    if moderate_confession_content:
        try:
            moderation_result = await moderate_confession_content(
                content=payload.content,
                user_age=payload.age,
                user_context={"gender": payload.gender, "anonymous": payload.anonymous}
            )
            
            # Determine status based on moderation result
            if moderation_result.approved:
                status_value = models.ConfessionStatus.approved
            elif moderation_result.suggested_action == "block":
                status_value = models.ConfessionStatus.blocked
            else:
                status_value = models.ConfessionStatus.pending_moderation
            
            detected_language = moderation_result.detected_language
            
        except Exception as e:
            logger.error(f"AI moderation failed: {e}")
            # Fallback to basic moderation
            decision, _reason = moderate_text(payload.content)
            status_value = models.ConfessionStatus.approved if decision == "approved" else (
                models.ConfessionStatus.blocked if decision == "blocked" else models.ConfessionStatus.pending_moderation
            )
    else:
        # Fallback to basic moderation when AI is not available
        decision, _reason = moderate_text(payload.content)
        status_value = models.ConfessionStatus.approved if decision == "approved" else (
            models.ConfessionStatus.blocked if decision == "blocked" else models.ConfessionStatus.pending_moderation
        )

    confession = models.Confession(
        user_id=current_user.id if current_user and not payload.anonymous else None,
        gender=payload.gender,
        age=payload.age,
        content=payload.content,
        language=detected_language,
        anonymous=payload.anonymous,
        status=status_value,
    )
    db.add(confession)
    await db.commit()
    await db.refresh(confession)
    
    # Store moderation metadata in a separate table or logs
    # This could be enhanced with a ModerationLog model
    
    return confession


@router.get("", response_model=list[schemas.ConfessionRead])
async def list_confessions(limit: int = Query(20, ge=1, le=100), db: AsyncSession = Depends(get_db)):
    # Only show approved confessions for public listing
    stmt = select(models.Confession).where(
        models.Confession.status == models.ConfessionStatus.approved
    ).order_by(desc(models.Confession.created_at)).limit(limit)
    res = await db.execute(stmt)
    items = res.scalars().all()
    return items


@router.get("/my-confessions", response_model=schemas.PaginatedResponse[schemas.ConfessionRead])
async def get_my_confessions(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get current user's confessions with pagination"""
    
    # Calculate offset
    offset = (page - 1) * per_page
    
    # Get total count
    count_stmt = select(func.count(models.Confession.id)).where(
        models.Confession.user_id == current_user.id
    )
    total_result = await db.execute(count_stmt)
    total = total_result.scalar() or 0
    
    # Get confessions for current page
    stmt = select(models.Confession).where(
        models.Confession.user_id == current_user.id
    ).order_by(desc(models.Confession.created_at)).offset(offset).limit(per_page)
    
    res = await db.execute(stmt)
    items = res.scalars().all()
    
    # Calculate pagination info
    pages = ceil(total / per_page) if total > 0 else 1
    has_next = page < pages
    has_prev = page > 1
    
    return schemas.PaginatedResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        pages=pages,
        has_next=has_next,
        has_prev=has_prev
    )


@router.get("/{confession_id}", response_model=schemas.ConfessionRead)
async def get_confession(confession_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(models.Confession).where(models.Confession.id == confession_id)
    res = await db.execute(stmt)
    confession = res.scalar_one_or_none()
    if not confession:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Confession not found")
    return confession


@router.post("/{confession_id}/generate-image")
async def generate_confession_images(
    confession_id: int,
    platforms: List[str] = Body(..., description="List of platforms to generate images for"),
    theme: str = Body("dark", description="Visual theme for the images"),
    db: AsyncSession = Depends(get_db)
):
    """Generate branded images for confession across multiple platforms"""
    
    # Get the confession
    stmt = select(models.Confession).where(models.Confession.id == confession_id)
    res = await db.execute(stmt)
    confession = res.scalar_one_or_none()
    if not confession:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Confession not found")
    
    # Only generate images for approved confessions
    if confession.status != models.ConfessionStatus.approved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Can only generate images for approved confessions"
        )
    
    if not generate_confession_image:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Image generation service not available"
        )
    
    try:
        # Generate images for specified platforms
        demographics = {"age": confession.age, "gender": confession.gender}
        
        image_results = generate_confession_image(
            confession_id=confession.id,
            content=confession.content,
            platforms=platforms,
            theme=theme,
            demographics=demographics
        )
        
        return {
            "confession_id": confession_id,
            "platforms": platforms,
            "theme": theme,
            "images": image_results,
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate images: {str(e)}"
        )


@router.post("/{confession_id}/post-to-social")
async def post_confession_to_social_media(
    confession_id: int,
    platforms: List[str] = Body(..., description="List of platforms to post to"),
    generate_images: bool = Body(True, description="Whether to generate images before posting"),
    theme: str = Body("dark", description="Theme for generated images"),
    delay_minutes: int = Body(0, description="Delay posting by specified minutes"),
    db: AsyncSession = Depends(get_db)
):
    """Post confession to social media platforms with optional image generation"""
    
    # Get the confession
    stmt = select(models.Confession).where(models.Confession.id == confession_id)
    res = await db.execute(stmt)
    confession = res.scalar_one_or_none()
    if not confession:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Confession not found")
    
    # Only post approved confessions
    if confession.status != models.ConfessionStatus.approved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Can only post approved confessions to social media"
        )
    
    if not schedule_social_media_post:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Social media service not available"
        )
    
    try:
        image_paths = {}
        
        # Generate images if requested
        if generate_images and generate_confession_image:
            demographics = {"age": confession.age, "gender": confession.gender}
            
            image_results = generate_confession_image(
                confession_id=confession.id,
                content=confession.content,
                platforms=platforms,
                theme=theme,
                demographics=demographics
            )
            
            # Extract image paths for social media posting
            for platform, result in image_results.items():
                if "image_path" in result:
                    image_paths[platform] = result["image_path"]
        
        # Schedule social media posting
        posting_result = await schedule_social_media_post(
            confession_id=confession.id,
            content=confession.content,
            platforms=platforms,
            image_paths=image_paths,
            delay_seconds=delay_minutes * 60
        )
        
        # Create publish job record
        publish_job = models.PublishJob(
            confession_id=confession.id,
            platforms_csv=",".join(platforms),
            asset_path=str(image_paths) if image_paths else None,
            status=models.PublishStatus.queued
        )
        db.add(publish_job)
        await db.commit()
        
        return {
            "confession_id": confession_id,
            "platforms": platforms,
            "images_generated": generate_images,
            "posting_scheduled": True,
            "task_id": posting_result.get("task_id"),
            "publish_job_id": publish_job.id,
            "scheduled_for": delay_minutes,
            "status": "queued"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to schedule social media posting: {str(e)}"
        )


@router.get("/{confession_id}/social-status")
async def get_social_media_status(confession_id: int, db: AsyncSession = Depends(get_db)):
    """Get social media posting status for a confession"""
    
    # Get publish jobs for this confession
    stmt = select(models.PublishJob).where(
        models.PublishJob.confession_id == confession_id
    ).order_by(desc(models.PublishJob.created_at))
    
    res = await db.execute(stmt)
    publish_jobs = res.scalars().all()
    
    if not publish_jobs:
        return {
            "confession_id": confession_id,
            "social_media_posts": [],
            "status": "not_posted"
        }
    
    jobs_data = []
    for job in publish_jobs:
        jobs_data.append({
            "job_id": job.id,
            "platforms": job.platforms_csv.split(","),
            "status": job.status.value,
            "created_at": job.created_at.isoformat(),
            "updated_at": job.updated_at.isoformat(),
            "error": job.error
        })
    
    return {
        "confession_id": confession_id,
        "social_media_posts": jobs_data,
        "latest_status": publish_jobs[0].status.value if publish_jobs else "unknown"
    }


@router.get("/social-media/platform-status")
async def get_platform_status():
    """Get status of all social media platforms"""
    if not social_media_manager:
        return {
            "facebook": {"configured": False, "poster_available": False, "rate_limit_status": "unavailable"},
            "instagram": {"configured": False, "poster_available": False, "rate_limit_status": "unavailable"},
            "twitter": {"configured": False, "poster_available": False, "rate_limit_status": "unavailable"}
        }
    
    return social_media_manager.get_platform_status()
