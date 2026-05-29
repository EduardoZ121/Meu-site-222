#!/usr/bin/env bash
# Corre DEPOIS de comprares remake.com e o ligares na Vercel.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export REACT_APP_SITE_ORIGIN="${REACT_APP_SITE_ORIGIN:-https://www.remake.com}"
export REACT_APP_BRAND_NAME="${REACT_APP_BRAND_NAME:-Remake}"
export SITE_URL="${SITE_URL:-$REACT_APP_SITE_ORIGIN}"
export SUPPORT_EMAIL="${SUPPORT_EMAIL:-suporte@remake.com}"

node "$ROOT/scripts/sync-site-origin.js"
REACT_APP_SITE_ORIGIN="$REACT_APP_SITE_ORIGIN" node "$ROOT/scripts/merge-vercel-redirects.js"

echo ""
echo "Variáveis na Vercel → remakepix → Environment Variables (Production):"
echo "  REACT_APP_SITE_ORIGIN=$REACT_APP_SITE_ORIGIN"
echo "  REACT_APP_BRAND_NAME=$REACT_APP_BRAND_NAME"
echo "  SITE_URL=$SITE_URL"
echo "  SUPPORT_EMAIL=$SUPPORT_EMAIL"
echo ""
echo "Commit vercel.json (redirects fundidos), push e Redeploy Production."
echo "Guia: docs/DOMAIN-REMAKE-COM.md"
