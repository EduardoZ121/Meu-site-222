#!/usr/bin/env bash
# Baixa e funde pacote Emergent, preservando fixes locais críticos.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
URL="${1:-https://f7ff41d4-db82-4dcc-89d9-033ad23f2f70.preview.emergentagent.com/api/download-site}"
TMP="$(mktemp -d)"
ZIP="$TMP/emergent.zip"

if [[ -f "$URL" ]]; then
  echo "Using local zip: $URL"
  cp "$URL" "$ZIP"
else
  echo "Downloading $URL ..."
  curl -fsSL "$URL" -o "$ZIP"
fi
unzip -q "$ZIP" -d "$TMP/src"

PROTECT=(
  "frontend/api/lib/imageQualityPrompts.cjs"
  "frontend/src/sections/Hero.jsx"
  "frontend/src/components/landing/HeroScrollCue.jsx"
  "frontend/src/styles/discover.css"
  "frontend/src/components/ImageUploadZone.jsx"
  "frontend/src/lib/mangaFlowRefStorage.js"
)

BACKUP="$TMP/backup"
mkdir -p "$BACKUP"
for f in "${PROTECT[@]}"; do
  if [[ -f "$ROOT/$f" ]]; then
    mkdir -p "$BACKUP/$(dirname "$f")"
    cp "$ROOT/$f" "$BACKUP/$f"
  fi
done

echo "Merging into $ROOT (excluding node_modules, build, .git) ..."
rsync -a \
  --exclude node_modules \
  --exclude build \
  --exclude .git \
  --exclude api \
  --exclude .env.local \
  --exclude .env.production.local \
  --exclude .env.assistloop \
  "$TMP/src/" "$ROOT/"

for f in "${PROTECT[@]}"; do
  if [[ -f "$BACKUP/$f" ]]; then
    cp "$BACKUP/$f" "$ROOT/$f"
    echo "  restored protected: $f"
  fi
done

echo "Done. Review diff, run: cd frontend && yarn build"
