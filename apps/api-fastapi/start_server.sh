#!/bin/bash

# WhisperVault Startup Script
# This script starts the backend with proper error handling

echo "🚀 Starting WhisperVault Backend..."
echo "=================================="

# Check if we're in the right directory
if [ ! -f "app/main.py" ]; then
    echo "❌ Error: Not in the FastAPI directory. Please run from apps/api-fastapi/"
    exit 1
fi

# Check Python environment
echo "🐍 Checking Python environment..."
if ! command -v python &> /dev/null; then
    echo "❌ Python not found. Please ensure Python is installed."
    exit 1
fi

# Check if virtual environment is activated
if [ -z "$VIRTUAL_ENV" ]; then
    echo "⚠️  Warning: Virtual environment not detected. Attempting to activate..."
    if [ -f "../../venv/bin/activate" ]; then
        source ../../venv/bin/activate
        echo "✅ Virtual environment activated"
    else
        echo "❌ Virtual environment not found. Please create and activate one."
        exit 1
    fi
fi

# Install basic dependencies if needed
echo "📦 Checking basic dependencies..."
python -c "import fastapi, sqlalchemy, uvicorn" 2>/dev/null || {
    echo "⚠️  Installing basic dependencies..."
    pip install fastapi sqlalchemy uvicorn asyncpg alembic pydantic python-jose passlib python-multipart bcrypt
}

# Check optional AI dependencies
echo "🤖 Checking AI dependencies (optional)..."
python -c "import detoxify" 2>/dev/null && echo "✅ Detoxify available" || echo "⚠️  Detoxify not available - AI moderation disabled"
python -c "import transformers" 2>/dev/null && echo "✅ Transformers available" || echo "⚠️  Transformers not available - Advanced NLP disabled"
python -c "import langdetect" 2>/dev/null && echo "✅ LangDetect available" || echo "⚠️  LangDetect not available - Language detection disabled"

# Check social media dependencies
echo "📱 Checking social media dependencies (optional)..."
python -c "import facebook" 2>/dev/null && echo "✅ Facebook SDK available" || echo "⚠️  Facebook SDK not available"
python -c "import tweepy" 2>/dev/null && echo "✅ Tweepy available" || echo "⚠️  Tweepy not available"
python -c "import instagrapi" 2>/dev/null && echo "✅ InstagramAPI available" || echo "⚠️  InstagramAPI not available"

# Check Redis and Celery
echo "🔄 Checking background task dependencies (optional)..."
python -c "import redis" 2>/dev/null && echo "✅ Redis client available" || echo "⚠️  Redis not available - Background tasks disabled"
python -c "import celery" 2>/dev/null && echo "✅ Celery available" || echo "⚠️  Celery not available - Background tasks disabled"

echo "=================================="
echo "🎯 Starting server with graceful error handling..."
echo "   - Core features: Always available"
echo "   - AI Moderation: Available if dependencies installed"
echo "   - Social Media: Available if APIs configured"
echo "   - Background Tasks: Available if Redis/Celery configured"
echo ""

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000