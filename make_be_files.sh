#!/usr/bin/env bash
set -euo pipefail

touch apps/api-fastapi/app/config.py
touch apps/api-fastapi/app/database.py
touch apps/api-fastapi/app/models.py
touch apps/api-fastapi/app/schemas.py
mkdir -p apps/api-fastapi/app/api
touch apps/api-fastapi/app/api/confessions.py
