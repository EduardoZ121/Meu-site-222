#!/usr/bin/env bash
# Verifica o que falta antes de activar remake.com (não compra o domínio).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== Remake.com — estado da preparação ==="
echo ""

ok=0
warn=0

check_file() {
  if [[ -f "$1" ]]; then
    echo "  [ok] $1"
    ok=$((ok + 1))
  else
    echo "  [falta] $1"
    warn=$((warn + 1))
  fi
}

check_file "frontend/src/lib/siteConfig.js"
check_file "docs/DOMAIN-REMAKE-COM.md"
check_file "docs/env.remake.com.example"
check_file "vercel.redirects.remake.com.json"
check_file "scripts/activate-remake-domain.sh"
check_file "scripts/sync-site-origin.js"
check_file "scripts/merge-vercel-redirects.js"

echo ""
echo "--- O que TU tens de fazer (não automatizável) ---"
echo "  1. Comprar remake.com num registrador (Cloudflare, Namecheap, etc.)"
echo "  2. Vercel → projeto remakepix → Domains → adicionar remake.com + www"
echo "  3. Configurar DNS (CNAME www → Vercel)"
echo "  4. Vercel → Environment Variables (Production):"
echo "       REACT_APP_SITE_ORIGIN=https://www.remake.com"
echo "       REACT_APP_BRAND_NAME=Remake"
echo "       SITE_URL=https://www.remake.com"
echo "       SUPPORT_EMAIL=suporte@remake.com  (se tiveres email nesse domínio)"
echo "  5. Correr: ./scripts/activate-remake-domain.sh"
echo "  6. Google OAuth + S3 CORS (ver docs/DOMAIN-REMAKE-COM.md)"
echo "  7. Redeploy Production"
echo ""
echo "Site actual (sem domínio novo): https://www.remakepix.com"
echo "Guia: docs/DOMAIN-REMAKE-COM.md"
echo ""

if [[ "$warn" -gt 0 ]]; then
  exit 1
fi
