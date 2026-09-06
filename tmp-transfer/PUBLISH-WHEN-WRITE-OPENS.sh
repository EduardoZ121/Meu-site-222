#!/usr/bin/env bash
# Run ONLY with write credentials to EduardoZ121/Site_Angola (or SITE_ANGOLA_PUSH_TOKEN).
set -euo pipefail
ROOT="${1:-.}"
REMOTE_URL="${SITE_ANGOLA_GIT_URL:-https://github.com/EduardoZ121/Site_Angola.git}"
TOKEN="${SITE_ANGOLA_PUSH_TOKEN:-${GH_TOKEN:-}}"
BRANCH_A="cursor/sprint-a-beta-experience-f96b"
BASE_REF="${BASE_REF:-main}"

if [[ -z "$TOKEN" ]]; then
  echo "Missing SITE_ANGOLA_PUSH_TOKEN or GH_TOKEN" >&2
  exit 1
fi

WORKDIR=$(mktemp -d)
trap 'rm -rf "$WORKDIR"' EXIT
git clone --depth=50 "https://x-access-token:${TOKEN}@github.com/EduardoZ121/Site_Angola.git" "$WORKDIR/repo"
cd "$WORKDIR/repo"
git checkout "$BASE_REF"
git checkout -b "$BRANCH_A"
git apply "$ROOT/tmp-transfer/kuteka-sprint-ab-combined-src.patch"
# Optionally apply full combined including prebuilt:
# git apply "$ROOT/tmp-transfer/kuteka-sprint-ab-combined.patch"
git add -A
git commit -m "feat(web): sprint a+b beta experience, inbox and harden"
git push -u origin "$BRANCH_A"
echo "Pushed $BRANCH_A — open PR to $BASE_REF, then smoke A then B."
