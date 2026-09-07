#!/usr/bin/env bash
# Publish Kuteka Sprint A+B to EduardoZ121/Site_Angola when write is available.
# Meu-site-222 is bridge only. Never use Vicente fork.
set -euo pipefail

ROOT="${1:-.}"
TOKEN="${SITE_ANGOLA_PUSH_TOKEN:-${GH_TOKEN:-}}"
BASE_REF="${BASE_REF:-main}"
EXPECTED_BASE="${EXPECTED_BASE:-ce203d4f}"
TIP_NOTE="c5da1e6d"
BRANCH="cursor/sprint-ab-beta-inbox-f96b"
# Unified single diff (git apply). Prefer full (includes prebuilt); fallback src + rebuild.
PATCH_FULL="${ROOT}/tmp-transfer/kuteka-sprint-ab-unified.patch"
PATCH_SRC="${ROOT}/tmp-transfer/kuteka-sprint-ab-unified-src.patch"

if [[ -z "$TOKEN" ]]; then
  echo "Missing SITE_ANGOLA_PUSH_TOKEN or GH_TOKEN" >&2
  exit 1
fi

WORKDIR=$(mktemp -d)
trap 'rm -rf "$WORKDIR"' EXIT
git clone --depth=80 "https://x-access-token:${TOKEN}@github.com/EduardoZ121/Site_Angola.git" "$WORKDIR/repo"
cd "$WORKDIR/repo"
git fetch origin "$BASE_REF"
git checkout "$BASE_REF"
HEAD=$(git rev-parse --short=8 HEAD)
if [[ "$HEAD" != "${EXPECTED_BASE:0:8}"* && "$HEAD" != "$EXPECTED_BASE" ]]; then
  echo "WARN: base HEAD=$HEAD expected ~$EXPECTED_BASE — review before merge" >&2
fi

git checkout -b "$BRANCH"

if [[ -f "$PATCH_FULL" ]] && git apply --check "$PATCH_FULL" 2>/dev/null; then
  git apply --index "$PATCH_FULL"
elif [[ -f "$PATCH_SRC" ]]; then
  git apply --index "$PATCH_SRC"
  if [[ -x scripts/build-static-web.sh ]]; then
    bash scripts/build-static-web.sh || true
    if [[ -d apps/web/out ]]; then
      rm -rf prebuilt/web-out
      cp -a apps/web/out prebuilt/web-out
      git add -A prebuilt/web-out || true
    fi
  fi
else
  echo "Missing unified patches under tmp-transfer/" >&2
  exit 1
fi

git status -sb | head
git commit -m "$(cat <<'MSG'
feat(web): sprint a+b beta messaging, kocc inbox and harden

Sprint A: beta notice, inventory clarity, security headers.
Sprint B: feedback inbox independent of metrics, complaint bridge,
submit/path guards, kind labels, Help sec context, actor hint.
Does not apply 0043/0044/0045 or ticket workflow (GOV-BF pending).
MSG
)"
git push -u origin "$BRANCH"

if command -v gh >/dev/null; then
  gh pr create --repo EduardoZ121/Site_Angola --base "$BASE_REF" --head "$BRANCH" \
    --title "feat(web): Sprint A+B Beta messaging and KOCC inbox" \
    --body "$(cat <<BODY
## Summary
- Sprint A P0 + Sprint B P0 harden (inbox ≠ metrics, complaint bridge, guards, actor hint)
- Tip reference: ${TIP_NOTE}

## Explicitly NOT in this PR
- 0043 / 0044 / 0045 · GOV-BF ticket workflow

## Test plan
See SMOKE_SPRINT_AB.md after merge+deploy: smoke A then B (ajuda → KOCC inbox).
BODY
)" || echo "PR create skipped — branch pushed: $BRANCH"
fi

echo "DONE: $BRANCH pushed. Next: CI → merge policy → smoke A → smoke B."
