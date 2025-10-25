"""
Social media integration service for WhisperVault
Handles posting to Facebook, Instagram, and X (Twitter) with rate limiting
"""

import asyncio
import logging
from typing import Dict, List, Optional, Union
from datetime import datetime, timedelta
import json
import os
from pathlib import Path

try:
    import tweepy
except ImportError:
    tweepy = None

try:
    import facebook
except ImportError:
    facebook = None

try:
    from instagrapi import Client as InstagramClient
except ImportError:
    InstagramClient = None

try:
    from celery import Celery
    celery_app = Celery('social_media', broker='redis://localhost:6379/0')
except ImportError:
    Celery = None
    celery_app = None

try:
    import redis
    redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
except ImportError:
    redis = None
    redis_client = None

logger = logging.getLogger(__name__)

# Initialize Redis and Celery if available
if redis_client is None:
    logger.warning("Redis not available - rate limiting and background tasks disabled")

if celery_app is None:
    logger.warning("Celery not available - background tasks disabled")


class SocialMediaCredentials:
    """Centralized credentials management"""
    
    def __init__(self):
        # Facebook credentials
        self.facebook_access_token = os.getenv("FACEBOOK_ACCESS_TOKEN")
        self.facebook_page_id = os.getenv("FACEBOOK_PAGE_ID")
        
        # Instagram credentials  
        self.instagram_username = os.getenv("INSTAGRAM_USERNAME")
        self.instagram_password = os.getenv("INSTAGRAM_PASSWORD")
        
        # Twitter/X credentials
        self.twitter_api_key = os.getenv("TWITTER_API_KEY")
        self.twitter_api_secret = os.getenv("TWITTER_API_SECRET")
        self.twitter_access_token = os.getenv("TWITTER_ACCESS_TOKEN")
        self.twitter_access_token_secret = os.getenv("TWITTER_ACCESS_TOKEN_SECRET")
        self.twitter_bearer_token = os.getenv("TWITTER_BEARER_TOKEN")

    def validate_credentials(self) -> Dict[str, bool]:
        """Validate all social media credentials"""
        return {
            "facebook": bool(self.facebook_access_token and self.facebook_page_id),
            "instagram": bool(self.instagram_username and self.instagram_password),
            "twitter": bool(all([
                self.twitter_api_key,
                self.twitter_api_secret,
                self.twitter_access_token,
                self.twitter_access_token_secret
            ]))
        }


class RateLimitManager:
    """Manage rate limits for different social media platforms"""
    
    def __init__(self, redis_client):
        self.redis = redis_client
        
        # Platform rate limits (per hour)
        self.limits = {
            "facebook": {"posts": 25, "window": 3600},
            "instagram": {"posts": 25, "window": 3600},
            "twitter": {"posts": 50, "window": 3600}
        }

    async def can_post(self, platform: str) -> bool:
        """Check if we can post to the platform without hitting rate limits"""
        key = f"rate_limit:{platform}:posts"
        current_count = self.redis.get(key)
        
        if current_count is None:
            return True
        
        limit = self.limits.get(platform, {}).get("posts", 10)
        return int(current_count) < limit

    async def record_post(self, platform: str):
        """Record a post to track rate limits"""
        key = f"rate_limit:{platform}:posts"
        window = self.limits.get(platform, {}).get("window", 3600)
        
        pipe = self.redis.pipeline()
        pipe.incr(key)
        pipe.expire(key, window)
        pipe.execute()

    async def get_next_available_time(self, platform: str) -> Optional[datetime]:
        """Get the next time we can post to the platform"""
        key = f"rate_limit:{platform}:posts"
        ttl = self.redis.ttl(key)
        
        if ttl > 0:
            return datetime.utcnow() + timedelta(seconds=ttl)
        return None


class FacebookPoster:
    """Handle Facebook page posting"""
    
    def __init__(self, credentials: SocialMediaCredentials):
        self.credentials = credentials
        self.graph = None
        if credentials.facebook_access_token:
            self.graph = facebook.GraphAPI(access_token=credentials.facebook_access_token)

    async def post_confession(
        self, 
        content: str, 
        image_path: Optional[str] = None,
        confession_id: int = None
    ) -> Dict[str, Union[str, bool]]:
        """Post confession to Facebook page"""
        if not self.graph:
            return {"success": False, "error": "Facebook API not configured"}
        
        try:
            post_data = {
                "message": content
            }
            
            if image_path and Path(image_path).exists():
                # Post with image
                with open(image_path, 'rb') as image_file:
                    result = self.graph.put_photo(
                        image=image_file,
                        message=content,
                        album_path=f"{self.credentials.facebook_page_id}/photos"
                    )
            else:
                # Text-only post
                result = self.graph.put_object(
                    parent_object=self.credentials.facebook_page_id,
                    connection_name="feed",
                    **post_data
                )
            
            return {
                "success": True,
                "post_id": result.get("id"),
                "platform": "facebook",
                "posted_at": datetime.utcnow().isoformat()
            }
            
        except facebook.GraphAPIError as e:
            logger.error(f"Facebook posting error: {e}")
            return {
                "success": False,
                "error": f"Facebook API error: {str(e)}",
                "platform": "facebook"
            }
        except Exception as e:
            logger.error(f"Unexpected Facebook error: {e}")
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}",
                "platform": "facebook"
            }


class InstagramPoster:
    """Handle Instagram posting"""
    
    def __init__(self, credentials: SocialMediaCredentials):
        self.credentials = credentials
        self.client = None
        if credentials.instagram_username and credentials.instagram_password:
            self.client = InstagramClient()
            try:
                self.client.login(credentials.instagram_username, credentials.instagram_password)
            except Exception as e:
                logger.error(f"Instagram login failed: {e}")
                self.client = None

    async def post_confession(
        self, 
        content: str, 
        image_path: str,
        confession_id: int = None
    ) -> Dict[str, Union[str, bool]]:
        """Post confession to Instagram (requires image)"""
        if not self.client:
            return {"success": False, "error": "Instagram client not configured"}
        
        if not image_path or not Path(image_path).exists():
            return {"success": False, "error": "Instagram requires an image"}
        
        try:
            # Instagram caption length limit
            caption = content[:2200] if len(content) > 2200 else content
            
            # Add hashtags
            hashtags = "#confession #anonymous #whispervault #story #share"
            full_caption = f"{caption}\n\n{hashtags}"
            
            # Upload photo
            result = self.client.photo_upload(image_path, full_caption)
            
            return {
                "success": True,
                "post_id": result.id,
                "platform": "instagram",
                "posted_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Instagram posting error: {e}")
            return {
                "success": False,
                "error": f"Instagram error: {str(e)}",
                "platform": "instagram"
            }


class TwitterPoster:
    """Handle Twitter/X posting"""
    
    def __init__(self, credentials: SocialMediaCredentials):
        self.credentials = credentials
        self.api = None
        self.client = None
        
        if all([credentials.twitter_api_key, credentials.twitter_api_secret,
                credentials.twitter_access_token, credentials.twitter_access_token_secret]):
            
            # Initialize Twitter API v1.1 for media upload
            auth = tweepy.OAuthHandler(
                credentials.twitter_api_key,
                credentials.twitter_api_secret
            )
            auth.set_access_token(
                credentials.twitter_access_token,
                credentials.twitter_access_token_secret
            )
            self.api = tweepy.API(auth)
            
            # Initialize Twitter API v2 for posting
            self.client = tweepy.Client(
                bearer_token=credentials.twitter_bearer_token,
                consumer_key=credentials.twitter_api_key,
                consumer_secret=credentials.twitter_api_secret,
                access_token=credentials.twitter_access_token,
                access_token_secret=credentials.twitter_access_token_secret
            )

    async def post_confession(
        self, 
        content: str, 
        image_path: Optional[str] = None,
        confession_id: int = None
    ) -> Dict[str, Union[str, bool]]:
        """Post confession to Twitter/X"""
        if not self.client:
            return {"success": False, "error": "Twitter client not configured"}
        
        try:
            # Twitter character limit
            tweet_content = content[:280] if len(content) > 280 else content
            
            media_ids = []
            if image_path and Path(image_path).exists() and self.api:
                # Upload image
                media = self.api.media_upload(image_path)
                media_ids = [media.media_id]
            
            # Create tweet
            if media_ids:
                result = self.client.create_tweet(text=tweet_content, media_ids=media_ids)
            else:
                result = self.client.create_tweet(text=tweet_content)
            
            return {
                "success": True,
                "post_id": result.data['id'],
                "platform": "twitter",
                "posted_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Twitter posting error: {e}")
            return {
                "success": False,
                "error": f"Twitter error: {str(e)}",
                "platform": "twitter"
            }


class SocialMediaManager:
    """Main social media management class"""
    
    def __init__(self):
        self.credentials = SocialMediaCredentials()
        self.rate_limiter = RateLimitManager(redis_client)
        
        # Initialize platform posters
        self.facebook_poster = FacebookPoster(self.credentials)
        self.instagram_poster = InstagramPoster(self.credentials)
        self.twitter_poster = TwitterPoster(self.credentials)
        
        self.posters = {
            "facebook": self.facebook_poster,
            "instagram": self.instagram_poster,
            "twitter": self.twitter_poster
        }

    async def post_to_platforms(
        self,
        platforms: List[str],
        content: str,
        image_paths: Dict[str, str] = None,
        confession_id: int = None
    ) -> Dict[str, Dict]:
        """Post confession to multiple social media platforms"""
        results = {}
        image_paths = image_paths or {}
        
        for platform in platforms:
            if platform not in self.posters:
                results[platform] = {
                    "success": False,
                    "error": f"Unsupported platform: {platform}"
                }
                continue
            
            # Check rate limits
            if not await self.rate_limiter.can_post(platform):
                next_time = await self.rate_limiter.get_next_available_time(platform)
                results[platform] = {
                    "success": False,
                    "error": "Rate limit exceeded",
                    "next_available": next_time.isoformat() if next_time else None
                }
                continue
            
            # Get appropriate image for platform
            image_path = image_paths.get(platform)
            
            # Post to platform
            poster = self.posters[platform]
            result = await poster.post_confession(content, image_path, confession_id)
            
            if result.get("success"):
                await self.rate_limiter.record_post(platform)
            
            results[platform] = result
        
        return results

    def get_platform_status(self) -> Dict[str, Dict]:
        """Get status of all social media platforms"""
        credentials_status = self.credentials.validate_credentials()
        
        status = {}
        for platform in ["facebook", "instagram", "twitter"]:
            status[platform] = {
                "configured": credentials_status.get(platform, False),
                "poster_available": platform in self.posters,
                "rate_limit_status": "unknown"  # Could be enhanced to check current limits
            }
        
        return status


# Background task for posting to social media
@celery_app.task(bind=True, max_retries=3)
def post_confession_to_social_media(
    self, 
    confession_id: int, 
    content: str, 
    platforms: List[str],
    image_paths: Dict[str, str] = None
):
    """Celery task for background social media posting"""
    try:
        social_manager = SocialMediaManager()
        
        # Run async function in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        results = loop.run_until_complete(
            social_manager.post_to_platforms(
                platforms, content, image_paths, confession_id
            )
        )
        
        loop.close()
        
        # Log results
        logger.info(f"Social media posting results for confession {confession_id}: {results}")
        
        return {
            "confession_id": confession_id,
            "results": results,
            "completed_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Social media posting task failed: {e}")
        # Retry the task
        raise self.retry(countdown=60, exc=e)


# Global social media manager instance
social_media_manager = SocialMediaManager()


async def schedule_social_media_post(
    confession_id: int,
    content: str,
    platforms: List[str],
    image_paths: Dict[str, str] = None,
    delay_seconds: int = 0
) -> Dict[str, str]:
    """
    Schedule a confession to be posted to social media platforms
    
    Args:
        confession_id: Unique confession identifier
        content: The confession text content
        platforms: List of target platforms
        image_paths: Dictionary mapping platforms to image file paths
        delay_seconds: Delay before posting (for scheduling)
        
    Returns:
        Dictionary with task information and scheduling status
    """
    try:
        # Schedule the background task
        task = post_confession_to_social_media.apply_async(
            args=[confession_id, content, platforms, image_paths],
            countdown=delay_seconds
        )
        
        return {
            "task_id": task.id,
            "confession_id": confession_id,
            "platforms": platforms,
            "scheduled_at": datetime.utcnow().isoformat(),
            "status": "scheduled"
        }
        
    except Exception as e:
        logger.error(f"Failed to schedule social media post: {e}")
        return {
            "error": str(e),
            "confession_id": confession_id,
            "status": "failed"
        }