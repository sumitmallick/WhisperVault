# WhisperVault

# WhisperVault - Enhanced Confession Platform

# 🤫 WhisperVault

A secure, anonymous confession platform built with Next.js and FastAPI, featuring AI-powered content moderation, social media integration, and enterprise-grade cloud deployment.

## 🌟 Features

- **Anonymous Confessions**: Secure, anonymous confession submission with user authentication
- **AI Content Moderation**: Multi-language toxicity detection, hate speech filtering, and sentiment analysis
- **Social Media Integration**: Automatic posting to Facebook, Instagram, and Twitter
- **Admin Dashboard**: Comprehensive moderation tools and analytics
- **Real-time Updates**: Live confession status updates and notifications
- **Mobile Responsive**: Optimized for all devices and screen sizes
- **Enterprise Security**: JWT authentication, CORS protection, and security headers

## 🏗️ Architecture

### Frontend (Next.js 14)
- TypeScript for type safety
- Tailwind CSS for styling
- Server-side rendering and static generation
- Progressive Web App capabilities

### Backend (FastAPI)
- Async/await for high performance
- SQLAlchemy ORM with PostgreSQL
- JWT-based authentication
- Background job processing with Celery

### AI & Machine Learning
- Detoxify for multilingual toxicity detection
- Transformers for hate speech classification
- LangDetect for language identification
- Profanity filtering with custom patterns

### Infrastructure
- AWS ECS Fargate for container orchestration
- Application Load Balancer with SSL termination
- RDS PostgreSQL with automated backups
- ElastiCache Redis for caching and sessions
- CloudFront CDN for global content delivery
- S3 for static asset storage

## 🚀 Quick Start

### Local Development
```bash
# Clone the repository
git clone https://github.com/sumitmallick/WhisperVault.git
cd WhisperVault

# Start the development environment
docker-compose up -d

# Access the application
# Web: http://localhost:3000
# API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Production Deployment

For complete AWS cloud deployment, see [DEPLOYMENT.md](DEPLOYMENT.md)

```bash
# Quick production deployment
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export DOMAIN_NAME="yourdomain.com"

./deploy.sh
```

## 🚀 Features

### Core Platform
- ✅ **Anonymous & Authenticated Confessions** - Users can post anonymously or with their accounts
- ✅ **Multi-language Support** - Supports confessions in any language
- ✅ **Unlimited Content Length** - No restrictions on confession length
- ✅ **Demographic Collection** - Collects user gender (inclusive options) and age

### AI-Powered Moderation
- ✅ **Toxicity Detection** - Multi-language toxicity analysis using Detoxify
- ✅ **Profanity Filtering** - Advanced profanity detection and scoring
- ✅ **Hate Speech Detection** - AI-powered hate speech classification
- ✅ **Pattern Recognition** - Regex-based harmful content detection
- ✅ **Age-Appropriate Filtering** - Special filtering for users under 18
- ✅ **Multi-tier Decision Making** - Automatic approval, manual review, or blocking

### Social Media Integration
- ✅ **Multi-Platform Posting** - Facebook, Instagram, and X (Twitter) integration
- ✅ **Branded Image Generation** - Convert confessions to shareable images
- ✅ **Rate Limiting** - Intelligent rate limiting per platform
- ✅ **Background Processing** - Celery-based async social media posting
- ✅ **Platform Status Monitoring** - Real-time platform health checks
- ✅ **Retry Mechanisms** - Automatic retry for failed posts

### Image Generation
- ✅ **Multi-Platform Templates** - Custom templates for each social platform
- ✅ **Theme Support** - Dark, light, and gradient themes
- ✅ **Brand Integration** - WhisperVault branding on all generated images
- ✅ **Text Wrapping** - Intelligent text wrapping for long confessions
- ✅ **Demographic Display** - Optional user demographics on images

### Admin Dashboard
- ✅ **Moderation Queue** - Review flagged content with AI insights
- ✅ **Social Media Management** - Monitor and retry failed posts
- ✅ **Platform Status** - Real-time status of all integrations
- ✅ **Batch Operations** - Approve/reject multiple items
- ✅ **Analytics** - Moderation statistics and insights

## 🛠 Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - Async ORM with PostgreSQL
- **Celery** - Background task processing
- **Redis** - Caching and task queue
- **JWT Authentication** - Secure user authentication

### AI & ML
- **Detoxify** - Multi-language toxicity detection
- **Transformers** - Hugging Face transformers for NLP
- **LangDetect** - Language detection
- **Profanity-Check** - Advanced profanity detection

### Social Media APIs
- **Facebook SDK** - Facebook page posting
- **InstagramAPI** - Instagram business posting
- **Tweepy** - Twitter/X posting

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling

## 📋 Quick Start

### Backend Setup
```bash
cd apps/api-fastapi
pip install -r requirements.txt
cp .env.example .env  # Configure your credentials
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd apps/web-next
npm install
npm run dev
```

### Social Media Setup
1. Configure Facebook, Instagram, and Twitter API credentials in `.env`
2. Start Redis server for background tasks
3. Start Celery worker: `celery -A app.services.social_media worker --loglevel=info`

## 🔧 Key Features Implemented

### 1. Enhanced Content Moderation
- Multi-language AI toxicity detection
- Profanity and hate speech filtering
- Automatic content classification
- Admin review dashboard

### 2. Social Media Automation
- Branded image generation for confessions
- Multi-platform posting (Facebook, Instagram, Twitter)
- Rate limiting and queue management
- Background processing with Celery

### 3. User Experience
- Comprehensive gender options (14+ inclusive choices)
- Social media sharing controls in submission form
- Real-time posting status updates
- Professional About page with contact integration

### 4. Admin Tools
- Moderation queue with AI insights
- Social media job monitoring
- Platform status dashboard
- Bulk operations for content management

## 🚨 Content Moderation Flow

1. **User Submission** → Confession submitted with demographics
2. **AI Analysis** → Multi-layer AI moderation analysis  
3. **Decision Engine** → Automatic approval/rejection/manual review
4. **Admin Review** → Manual review for flagged content
5. **Social Publishing** → Approved content posted to social media

## 📱 Social Media Features

- **Automatic Image Generation** - Creates branded images from text confessions
- **Multi-Platform Support** - Posts to Facebook, Instagram, and Twitter simultaneously
- **Rate Limiting** - Prevents API limits with intelligent queuing
- **Error Handling** - Automatic retry for failed posts
- **Admin Monitoring** - Real-time status of all social media operations

## 🛡️ Security & Privacy

- **Anonymous by Default** - All confessions anonymous unless opted in
- **AI-Powered Safety** - Multi-layer content moderation
- **Secure Authentication** - JWT tokens with bcrypt password hashing
- **Age-Appropriate Content** - Special filtering for users under 18

## 🔄 Background Processing

The platform uses Celery for background task processing:
- Content moderation analysis
- Social media posting
- Image generation
- Rate limit management
- Platform health monitoring

## 📊 Admin Dashboard

Comprehensive admin interface includes:
- **Moderation Queue** - Review flagged content with AI scores
- **Social Media Jobs** - Monitor posting status and retry failures  
- **Platform Status** - Real-time health checks for all integrations
- **Analytics** - Moderation and posting statistics

---

**WhisperVault** - Empowering anonymous expression with responsible moderation and social reach.

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
