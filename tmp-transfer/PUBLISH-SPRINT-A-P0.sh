#!/usr/bin/env bash
# Requires WRITE access to EduardoZ121/Site_Angola.
set -euo pipefail
REPO_URL="${REPO_URL:-https://github.com/EduardoZ121/Site_Angola.git}"
BRANCH="cursor/sprint-a-beta-experience-f96b"
BASE="https://raw.githubusercontent.com/EduardoZ121/Meu-site-222/cursor/transfer-kuteka-sprint-a-p0-f96b/tmp-transfer"
WORKDIR="${WORKDIR:-/tmp/site-angola-sprint-a-publish}"

rm -rf "$WORKDIR"
git clone "$REPO_URL" "$WORKDIR"
cd "$WORKDIR"
git checkout -b "$BRANCH"
curl -fsSL "$BASE/kuteka-sprint-a-p0.patch" -o /tmp/kuteka-sprint-a-p0.patch
git am --3way < /tmp/kuteka-sprint-a-p0.patch
git push -u origin "$BRANCH"
gh pr create --repo EduardoZ121/Site_Angola --base main --head "$BRANCH" \
  --title "feat(web): Sprint A P0 — Beta messaging, inventory clarity, security headers" \
  --body "## Summary
Publishes **Sprint A P0** onto official Site_Angola (source of truth).

- Public Beta notice + authenticated Beta welcome
- Inventory labels: unpublished ≠ public market
- Public docs CTA → sign-in → Beta feedback
- Security headers + prebuilt refresh (\`kuteka-config.js\` preserved)

## Validation
Vitest + tsc + static export already green on packaged commit.

Do **not** bot-merge if human approval is required."
echo "PR created for Sprint A on $BRANCH"
