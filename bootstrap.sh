#!/usr/bin/env bash
set -euo pipefail

# Create directories
mkdir -p apps/api-fastapi/app
mkdir -p apps/web-next
mkdir -p infra/aws/terraform

# Create files (API)
: > apps/api-fastapi/requirements.txt
: > apps/api-fastapi/app/main.py
: > apps/api-fastapi/Dockerfile
: > apps/api-fastapi/.env.example

# Create files (Web)
: > apps/web-next/package.json
: > apps/web-next/next.config.js
: > apps/web-next/.env.example

# Infra placeholder
: > infra/aws/terraform/.gitkeep

# Root files
: > docker-compose.yaml
: > README.md

echo "Scaffold completed."
