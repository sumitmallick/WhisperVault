#!/usr/bin/env bash
set -euo pipefail

mkdir -p "apps/web-next/src/app/(routes)/submit"
mkdir -p "apps/web-next/src/app/(routes)/jobs"
mkdir -p apps/web-next/src/components
mkdir -p apps/web-next/src/lib
mkdir -p apps/web-next/public
mkdir -p apps/web-next/src/app

# Core config files
: > apps/web-next/package.json
: > apps/web-next/next.config.js
: > apps/web-next/tailwind.config.ts
: > apps/web-next/postcss.config.js
: > apps/web-next/tsconfig.json

# App files
: > apps/web-next/src/app/layout.tsx
: > apps/web-next/src/app/page.tsx
: > "apps/web-next/src/app/(routes)/submit/page.tsx"
: > "apps/web-next/src/app/(routes)/jobs/page.tsx"
: > apps/web-next/src/components/ui.tsx
: > apps/web-next/src/app/globals.css

echo "Web scaffold created."
