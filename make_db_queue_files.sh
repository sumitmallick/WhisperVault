#!/usr/bin/env bash
set -euo pipefail

# Ensure packages
: > apps/api-fastapi/app/__init__.py
mkdir -p apps/api-fastapi/app/api
: > apps/api-fastapi/app/api/__init__.py

# Core modules
: > apps/api-fastapi/app/config.py
: > apps/api-fastapi/app/database.py
: > apps/api-fastapi/app/models.py
: > apps/api-fastapi/app/schemas.py

# API routes
: > apps/api-fastapi/app/api/confessions.py

# Optional Celery (stub to be added later)
: > apps/api-fastapi/app/tasks.py
