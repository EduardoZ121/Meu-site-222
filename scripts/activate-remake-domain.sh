#!/usr/bin/env bash
# Corre DEPOIS de comprares remake.com e o ligares na Vercel.
set -euo pipefail
export REACT_APP_SITE_ORIGIN="${REACT_APP_SITE_ORIGIN:-https://www.remake.com}"
export REACT_APP_BRAND_NAME="${REACT_APP_BRAND_NAME:-Remake}"
node "$(dirname "$0")/sync-site-origin.js"
echo ""
echo "Próximo passo: na Vercel → remakepix → Environment Variables (Production):"
echo "  REACT_APP_SITE_ORIGIN=$REACT_APP_SITE_ORIGIN"
echo "  REACT_APP_BRAND_NAME=$REACT_APP_BRAND_NAME"
echo ""
echo "Depois funde vercel.redirects.remake.com.json em vercel.json → redirects e faz redeploy."
echo "Guia completo: docs/DOMAIN-REMAKE-COM.md"
