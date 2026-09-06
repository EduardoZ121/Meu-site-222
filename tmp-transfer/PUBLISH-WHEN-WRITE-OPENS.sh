#!/usr/bin/env bash
# Publish Kuteka Sprint A then B to EduardoZ121/Site_Angola when write is available.
# Meu-site-222 is bridge only. Never use Vicente fork.
set -euo pipefail

ROOT="${1:-.}"
TOKEN="${SITE_ANGOLA_PUSH_TOKEN:-${GH_TOKEN:-}}"
BASE_REF="${BASE_REF:-main}"
EXPECTED_BASE="${EXPECTED_BASE:-ce203d4f}"
TIP_NOTE="1eb3ffe3"
BRANCH="cursor/sprint-ab-beta-inbox-f96b"
PATCH="${ROOT}/tmp-transfer/kuteka-sprint-ab-combined.patch  # includes prebuilt; use -src for review-only"

if [[ -z "$TOKEN" ]]; then
  echo "Missing SITE_ANGOLA_PUSH_TOKEN or GH_TOKEN" >&2
  exit 1
fi
if [[ ! -f "$PATCH" ]]; then
  echo "Missing patch: $PATCH" >&2
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
git apply --index "$PATCH"
git commit -m "$(cat <<'MSG'
feat(web): sprint a+b beta messaging, kocc inbox and harden

Sprint A: beta notice, inventory clarity, security headers.
Sprint B: feedback inbox independent of metrics, complaint bridge,
submit/path guards, kind labels, Help sec context, header lock tests.
Does not apply 0043/0044 or ticket workflow (GOV-BF pending).
MSG
)"
git push -u origin "$BRANCH"

if command -v gh >/dev/null; then
  gh pr create --repo EduardoZ121/Site_Angola --base "$BASE_REF" --head "$BRANCH" \
    --title "feat(web): Sprint A+B Beta messaging and KOCC inbox" \
    --body "$(cat <<'BODY'
## Summary
- Sprint A P0: Beta messaging, inventory clarity, security headers
- Sprint B P0 + harden: KOCC inbox (≠ metrics), complaint bridge, submit guards, Sugestão labels, Help \`?sec=\`, render.yaml header lock

## Explicitly NOT in this PR
- Proposals 0043 / 0044 (Founder GOV)
- Ticket workflow (status/assignee/resolution) — GOV-BF-01…05

## Test plan
See \`tmp-transfer/SMOKE_SPRINT_AB.md\` / \`REGRESSION-LOCAL.md\` after merge+deploy:
1. Smoke A (banner, welcome, inventory, headers)
2. Smoke B (ajuda submit → KOCC counters → inbox; inbox visible if metrics fail)

Local tip reference: '"$TIP_NOTE"'
BODY
)" || echo "PR create skipped/failed — branch pushed: $BRANCH"
fi

echo "DONE: branch $BRANCH pushed. Sequence after CI: smoke A → smoke B Inbox/KOCC."
