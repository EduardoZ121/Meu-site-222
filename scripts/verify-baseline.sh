#!/usr/bin/env bash
# Falha se o repo regressar para cópia Emergent/raiz ou quebrar invariantes do site estável.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONT="$ROOT/frontend"
ERR=0

fail() { echo "verify-baseline: FAIL — $1" >&2; ERR=1; }

echo "verify-baseline: checking $ROOT"

# Raiz limpa — sem segunda app
for forbidden in index.html package.json craco.config.js yarn.lock frontend-completo.zip; do
  if [[ -f "$ROOT/$forbidden" ]]; then
    fail "ficheiro proibido na raiz: $forbidden (usar só frontend/)"
  fi
done
for forbidden_dir in components images; do
  if [[ -d "$ROOT/$forbidden_dir" ]]; then
    fail "pasta proibida na raiz: $forbidden_dir/"
  fi
done

# HTML de produção
INDEX="$FRONT/public/index.html"
if [[ ! -f "$INDEX" ]]; then
  fail "em falta: frontend/public/index.html"
else
  grep -q "Remake Pixel — Estúdio AI" "$INDEX" || fail "título Remake Pixel em index.html"
  grep -qi emergent "$INDEX" && fail "referência Emergent em frontend/public/index.html"
fi

# Hero estável
HERO="$FRONT/src/sections/Hero.jsx"
if [[ ! -f "$HERO" ]]; then
  fail "em falta: Hero.jsx"
else
  grep -q 'useI18n' "$HERO" || fail "Hero.jsx deve usar useI18n"
  grep -q '/images/hero-bg.jpg' "$HERO" || fail "Hero.jsx deve usar /images/hero-bg.jpg"
  grep -qi '<video' "$HERO" && fail "Hero.jsx não deve ter vídeo"
  grep -qi 'hero-cover\|hero-new' "$HERO" && fail "Hero.jsx não deve usar hero-cover/hero-new"
fi

# Sem dependência Emergent no build frontend
PKG="$FRONT/package.json"
grep -q '@emergentbase/visual-edits' "$PKG" 2>/dev/null && fail "remover @emergentbase/visual-edits de frontend/package.json"
grep -q 'emergent-main' "$FRONT/craco.config.js" 2>/dev/null && fail "remover visual-edits de craco.config.js"

# Vercel aponta ao projeto certo
if [[ -f "$FRONT/.vercel/project.json" ]]; then
  grep -q '"projectName":"remakepix"' "$FRONT/.vercel/project.json" || fail "Vercel project deve ser remakepix"
fi

if [[ "$ERR" -ne 0 ]]; then
  exit 1
fi

echo "verify-baseline: OK — único projeto em frontend/, baseline intacta"
