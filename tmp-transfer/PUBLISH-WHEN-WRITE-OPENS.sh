#!/usr/bin/env bash
# Publish Kuteka Sprint A+B to EduardoZ121/Site_Angola when write is available.
# Prefer Option A: Cursor GitHub App credentials (no SITE_ANGOLA_PUSH_TOKEN).
# Meu-site-222 is bridge only. Never use Vicente fork.
set -euo pipefail

ROOT="${1:-/workspace}"
TOKEN="${SITE_ANGOLA_PUSH_TOKEN:-}"
BASE_REF="${BASE_REF:-main}"
EXPECTED_BASE="${EXPECTED_BASE:-ce203d4f}"
TIP_NOTE="c5da1e6d"
BRANCH="cursor/sprint-ab-beta-inbox-f96b"
LOCAL_TIP="${LOCAL_TIP:-/tmp/site-angola-publish}"
PATCH_FULL="${ROOT}/tmp-transfer/kuteka-sprint-ab-unified.patch"
PATCH_SRC="${ROOT}/tmp-transfer/kuteka-sprint-ab-unified-src.patch"

probe_push() {
  # Dry probe: ask GitHub if we can create a ref (does not create content).
  # Returns 0 if write looks open enough to attempt push.
  local code
  code=$(gh api repos/EduardoZ121/Site_Angola --jq '.permissions.push' 2>/dev/null || echo false)
  if [[ "$code" == "true" ]]; then
    return 0
  fi
  # Fallback: try a no-op push of an existing remote tip (will fail fast if denied).
  return 1
}

push_local_tip_option_a() {
  # Option A: push already-validated local tip branch if remote accepts cursor credentials.
  if [[ ! -d "$LOCAL_TIP/.git" ]]; then
    echo "No local tip at $LOCAL_TIP" >&2
    return 1
  fi
  cd "$LOCAL_TIP"
  local tip
  tip=$(git rev-parse --short=8 HEAD)
  echo "Option A: attempting push of local tip $tip → $BRANCH"
  # Prefer HTTPS without embedding secrets; rely on env/credential helper from Cursor App.
  git remote set-url origin "https://github.com/EduardoZ121/Site_Angola.git" 2>/dev/null || true
  if git push -u origin "HEAD:refs/heads/${BRANCH}"; then
    echo "PUSH_OK tip=$tip branch=$BRANCH"
    return 0
  fi
  echo "Option A direct push failed" >&2
  return 1
}

publish_via_patch_with_token() {
  if [[ -z "$TOKEN" ]]; then
    echo "No SITE_ANGOLA_PUSH_TOKEN — skipping token path (Option B disabled unless explicitly authorized)" >&2
    return 1
  fi
  local WORKDIR
  WORKDIR=$(mktemp -d)
  trap 'rm -rf "$WORKDIR"' RETURN
  git clone --depth=80 "https://x-access-token:${TOKEN}@github.com/EduardoZ121/Site_Angola.git" "$WORKDIR/repo"
  cd "$WORKDIR/repo"
  git fetch origin "$BASE_REF"
  git checkout "$BASE_REF"
  local HEAD
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
    return 1
  fi
  git commit -m "$(cat <<'MSG'
feat(web): sprint a+b beta messaging, kocc inbox and harden

Sprint A: beta notice, inventory clarity, security headers.
Sprint B: feedback inbox independent of metrics, complaint bridge,
submit/path guards, kind labels, Help sec context, actor hint.
Does not apply 0043/0044/0045 or ticket workflow (GOV-BF pending).
MSG
)"
  git push -u origin "$BRANCH"
}

create_pr_if_possible() {
  if ! command -v gh >/dev/null; then
    return 0
  fi
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
}

echo "=== Kuteka publish probe ($(date -u +%Y-%m-%dT%H:%MZ)) ==="
echo "Official SoT: EduardoZ121/Site_Angola | tip ref: $TIP_NOTE | branch: $BRANCH"

# 1) Option A first — never invent forks; never Vicente.
if push_local_tip_option_a; then
  create_pr_if_possible
  echo "DONE (Option A): $BRANCH pushed. Next: CI → merge → smoke A → smoke B."
  exit 0
fi

# 2) Option B only if token already present AND explicitly authorized by founder.
if [[ -n "$TOKEN" ]]; then
  echo "SITE_ANGOLA_PUSH_TOKEN present — using authorized token path"
  publish_via_patch_with_token
  create_pr_if_possible
  echo "DONE (token path): $BRANCH pushed. Next: CI → merge → smoke A → smoke B."
  exit 0
fi

echo "BLOCKED: Cursor GitHub App write not available on EduardoZ121/Site_Angola." >&2
echo "Founder action (Option A): install/configure https://github.com/apps/cursor on that repo" >&2
echo "  Contents: Read and write; Pull requests: Read and write; link repo in Cursor environment." >&2
exit 2
