"""
Advanced AI-powered content moderation service for WhisperVault
Handles toxicity detection, profanity filtering, and multi-language support
"""

import asyncio
import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime

import torch
HAS_DETOXIFY = False
HAS_TRANSFORMERS = False
HAS_LANGDETECT = False
HAS_PROFANITY_CHECK = False

# Lazy loading of AI/ML dependencies to avoid import delays
def lazy_import_detoxify():
    global HAS_DETOXIFY
    try:
        if not HAS_DETOXIFY:
            from detoxify import detoxify
            HAS_DETOXIFY = True
        return detoxify
    except ImportError:
        return None

def lazy_import_transformers():
    global HAS_TRANSFORMERS
    try:
        if not HAS_TRANSFORMERS:
            from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
            HAS_TRANSFORMERS = True
        return pipeline, AutoTokenizer, AutoModelForSequenceClassification
    except ImportError:
        return None, None, None

def lazy_import_langdetect():
    global HAS_LANGDETECT
    try:
        if not HAS_LANGDETECT:
            from langdetect import detect
            from langdetect.lang_detect_exception import LangDetectException
            HAS_LANGDETECT = True
        return detect, LangDetectException
    except ImportError:
        try:
            from langdetect.detector_factory import LangDetectException
            return None, LangDetectException
        except ImportError:
            return None, None

def lazy_import_profanity_check():
    global HAS_PROFANITY_CHECK
    try:
        if not HAS_PROFANITY_CHECK:
            from profanity_check import predict, predict_prob
            HAS_PROFANITY_CHECK = True
        return predict, predict_prob
    except ImportError:
        return None, None

logger = logging.getLogger(__name__)


class ModerationResult:
    def __init__(
        self,
        approved: bool,
        confidence: float,
        detected_language: str,
        toxicity_scores: Dict[str, float],
        profanity_probability: float,
        flagged_categories: List[str],
        suggested_action: str,
        moderation_notes: str = ""
    ):
        self.approved = approved
        self.confidence = confidence
        self.detected_language = detected_language
        self.toxicity_scores = toxicity_scores
        self.profanity_probability = profanity_probability
        self.flagged_categories = flagged_categories
        self.suggested_action = suggested_action
        self.moderation_notes = moderation_notes
        self.timestamp = datetime.utcnow()


class AIContentModerator:
    def __init__(self):
        self.toxicity_model = None
        self.hate_speech_classifier = None
        self.sentiment_analyzer = None
        self._initialize_models()
        
        # Moderation thresholds
        self.toxicity_threshold = 0.7
        self.profanity_threshold = 0.8
        self.hate_speech_threshold = 0.6
        
        # Blocked content patterns
        self.blocked_patterns = [
            r'\b(?:kill|murder|suicide|self-harm)\b.*\b(?:yourself|myself|themselves)\b',
            r'\b(?:bomb|explosion|terrorist|attack)\b',
            r'\b(?:rape|assault|abuse)\b.*\b(?:threat|plan|going to)\b',
        ]

    def _initialize_models(self):
        """Initialize AI models for content moderation"""
        try:
            logger.info("AI Moderation service initialized with lazy loading")
            
            # Initialize models as None - they'll be loaded lazily when first used
            self.toxicity_model = None
            self.hate_speech_classifier = None
            self.sentiment_analyzer = None
            
            logger.info("AI moderation models initialization completed")
            
        except Exception as e:
            logger.error(f"Failed to initialize moderation models: {e}")
            # Fallback to basic moderation
            self.toxicity_model = None
            self.hate_speech_classifier = None
            self.sentiment_analyzer = None

    async def moderate_content(
        self, 
        content: str, 
        user_age: int = None, 
        context: Dict = None
    ) -> ModerationResult:
        """
        Comprehensive content moderation using multiple AI models
        
        Args:
            content: Text content to moderate
            user_age: Age of the user (for age-appropriate filtering)  
            context: Additional context for moderation decisions
            
        Returns:
            ModerationResult with detailed analysis
        """
        try:
            # Detect language
            detected_language = await self._detect_language(content)
            
            # Run parallel moderation checks
            results = await asyncio.gather(
                self._check_toxicity(content),
                self._check_profanity(content),
                self._check_hate_speech(content),
                self._check_explicit_patterns(content),
                self._analyze_sentiment(content),
                return_exceptions=True
            )
            
            toxicity_scores, profanity_prob, hate_speech_result, pattern_flags, sentiment = results
            
            # Aggregate results
            flagged_categories = []
            confidence_scores = []
            
            # Toxicity analysis
            if toxicity_scores and max(toxicity_scores.values()) > self.toxicity_threshold:
                flagged_categories.extend([
                    cat for cat, score in toxicity_scores.items() 
                    if score > self.toxicity_threshold
                ])
                confidence_scores.append(max(toxicity_scores.values()))
            
            # Profanity check
            if profanity_prob > self.profanity_threshold:
                flagged_categories.append("profanity")
                confidence_scores.append(profanity_prob)
            
            # Hate speech detection
            if hate_speech_result and hate_speech_result.get('score', 0) > self.hate_speech_threshold:
                flagged_categories.append("hate_speech")
                confidence_scores.append(hate_speech_result['score'])
            
            # Pattern-based flags
            if pattern_flags:
                flagged_categories.extend(pattern_flags)
                confidence_scores.append(0.9)  # High confidence for pattern matches
            
            # Age-based filtering
            if user_age and user_age < 18:
                adult_content_score = self._check_adult_content(content, toxicity_scores)
                if adult_content_score > 0.5:
                    flagged_categories.append("adult_content")
                    confidence_scores.append(adult_content_score)
            
            # Determine approval status
            approved = len(flagged_categories) == 0
            overall_confidence = max(confidence_scores) if confidence_scores else 0.0
            
            # Determine suggested action
            suggested_action = self._determine_action(flagged_categories, overall_confidence)
            
            return ModerationResult(
                approved=approved,
                confidence=overall_confidence,
                detected_language=detected_language,
                toxicity_scores=toxicity_scores or {},
                profanity_probability=profanity_prob,
                flagged_categories=flagged_categories,
                suggested_action=suggested_action,
                moderation_notes=self._generate_moderation_notes(flagged_categories, content)
            )
            
        except Exception as e:
            logger.error(f"Content moderation failed: {e}")
            # Return conservative result on error
            return ModerationResult(
                approved=False,
                confidence=0.0,
                detected_language="unknown",
                toxicity_scores={},
                profanity_probability=0.0,
                flagged_categories=["moderation_error"],
                suggested_action="manual_review",
                moderation_notes=f"Moderation system error: {str(e)}"
            )

    async def _detect_language(self, content: str) -> str:
        """Detect the language of the content"""
        detect, LangDetectError = lazy_import_langdetect()
        if not detect:
            return "en"  # Default to English if langdetect not available
        
        try:
            return detect(content)
        except (LangDetectError, Exception) if LangDetectError else (Exception,):
            return "unknown"

    async def _check_toxicity(self, content: str) -> Optional[Dict[str, float]]:
        """Check content toxicity using Detoxify"""
        if not self.toxicity_model:
            # Try to load Detoxify lazily
            detoxify = lazy_import_detoxify()
            if detoxify:
                try:
                    self.toxicity_model = detoxify.Detoxify('multilingual')
                    logger.info("Detoxify model loaded lazily")
                except Exception as e:
                    logger.warning(f"Failed to load Detoxify model: {e}")
                    return None
            else:
                return None
        
        try:
            return self.toxicity_model.predict(content)
        except Exception as e:
            logger.error(f"Toxicity check failed: {e}")
            return None

    async def _check_profanity(self, content: str) -> float:
        """Check profanity probability"""
        try:
            predict, profanity_prob = lazy_import_profanity_check()
            if profanity_prob:
                return profanity_prob([content])[0]
            else:
                return 0.0
        except Exception as e:
            logger.error(f"Profanity check failed: {e}")
            return 0.0

    async def _check_hate_speech(self, content: str) -> Optional[Dict]:
        """Check for hate speech using transformer model"""
        if not self.hate_speech_classifier:
            # Try to load transformers lazily
            pipeline, _, _ = lazy_import_transformers()
            if pipeline:
                try:
                    self.hate_speech_classifier = pipeline(
                        "text-classification",
                        model="unitary/toxic-bert",
                        device=-1  # Use CPU to avoid CUDA issues
                    )
                    logger.info("Hate speech classifier loaded lazily")
                except Exception as e:
                    logger.warning(f"Failed to load hate speech classifier: {e}")
                    return None
            else:
                return None
        
        try:
            result = self.hate_speech_classifier(content)
            return result[0] if result else None
        except Exception as e:
            logger.error(f"Hate speech check failed: {e}")
            return None

    async def _check_explicit_patterns(self, content: str) -> List[str]:
        """Check for explicit harmful patterns using regex"""
        import re
        
        flags = []
        content_lower = content.lower()
        
        for pattern in self.blocked_patterns:
            if re.search(pattern, content_lower, re.IGNORECASE):
                flags.append("harmful_pattern")
                break
        
        # Check for personal information
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        phone_pattern = r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b'
        
        if re.search(email_pattern, content):
            flags.append("personal_info")
        if re.search(phone_pattern, content):
            flags.append("personal_info")
        
        return flags

    async def _analyze_sentiment(self, content: str) -> Optional[Dict]:
        """Analyze sentiment of the content"""
        if not self.sentiment_analyzer:
            # Try to load sentiment analyzer lazily
            pipeline, _, _ = lazy_import_transformers()
            if pipeline:
                try:
                    self.sentiment_analyzer = pipeline(
                        "sentiment-analysis",
                        model="cardiffnlp/twitter-roberta-base-sentiment-latest",
                        device=-1  # Use CPU to avoid CUDA issues
                    )
                    logger.info("Sentiment analyzer loaded lazily")
                except Exception as e:
                    logger.warning(f"Failed to load sentiment analyzer: {e}")
                    return None
            else:
                return None
        
        try:
            return self.sentiment_analyzer(content)[0]
        except Exception as e:
            logger.error(f"Sentiment analysis failed: {e}")
            return None

    def _check_adult_content(self, content: str, toxicity_scores: Dict) -> float:
        """Check for adult content based on toxicity and keywords"""
        adult_keywords = ['sex', 'sexual', 'porn', 'adult', 'explicit', 'nsfw']
        content_lower = content.lower()
        
        keyword_score = sum(1 for keyword in adult_keywords if keyword in content_lower) / len(adult_keywords)
        toxicity_score = toxicity_scores.get('sexually_explicit', 0) if toxicity_scores else 0
        
        return max(keyword_score, toxicity_score)

    def _determine_action(self, flagged_categories: List[str], confidence: float) -> str:
        """Determine the recommended moderation action"""
        if not flagged_categories:
            return "approve"
        
        high_risk_categories = ["harmful_pattern", "hate_speech", "threat"]
        
        if any(cat in high_risk_categories for cat in flagged_categories):
            return "block"
        elif confidence > 0.8:
            return "block"
        elif confidence > 0.6:
            return "manual_review"
        else:
            return "flag_for_review"

    def _generate_moderation_notes(self, flagged_categories: List[str], content: str) -> str:
        """Generate human-readable moderation notes"""
        if not flagged_categories:
            return "Content passed all moderation checks"
        
        category_descriptions = {
            "toxicity": "Contains toxic language or harmful content",
            "profanity": "Contains profane or inappropriate language",
            "hate_speech": "Contains hate speech or discriminatory language",
            "harmful_pattern": "Contains patterns associated with harmful intent",
            "personal_info": "Contains personal information that should be redacted",
            "adult_content": "Contains adult or sexually explicit content"
        }
        
        notes = []
        for category in flagged_categories:
            if category in category_descriptions:
                notes.append(category_descriptions[category])
        
        return "; ".join(notes)


# Global moderation instance
ai_moderator = AIContentModerator()


async def moderate_confession_content(
    content: str, 
    user_age: int = None, 
    user_context: Dict = None
) -> ModerationResult:
    """
    Public interface for moderating confession content
    
    Args:
        content: The confession text to moderate
        user_age: Age of the user submitting the confession
        user_context: Additional context about the user or submission
        
    Returns:
        ModerationResult with detailed moderation analysis
    """
    return await ai_moderator.moderate_content(content, user_age, user_context)