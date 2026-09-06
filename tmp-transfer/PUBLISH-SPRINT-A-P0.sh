#!/usr/bin/env bash
# Run on a machine/token with WRITE access to EduardoZ121/Site_Angola.
set -euo pipefail
REPO_URL="${REPO_URL:-https://github.com/EduardoZ121/Site_Angola.git}"
BRANCH="cursor/sprint-a-beta-experience-f96b"
PATCH_URL="https://raw.githubusercontent.com/EduardoZ121/Meu-site-222/cursor/transfer-kuteka-sprint-a-p0-f96b/tmp-transfer/kuteka-sprint-a-p0.patch"
WORKDIR="${WORKDIR:-/tmp/site-angola-sprint-a-publish}"

rm -rf "$WORKDIR"
git clone "$REPO_URL" "$WORKDIR"
cd "$WORKDIR"
git checkout -b "$BRANCH"
curl -fsSL "$PATCH_URL" -o /tmp/kuteka-sprint-a-p0.patch
git am --3way < /tmp/kuteka-sprint-a-p0.patch
git push -u origin "$BRANCH"
gh pr create --repo EduardoZ121/Site_Angola --base main --head "$BRANCH" \
  --title "feat(web): Sprint A P0 — Beta messaging, inventory clarity, security headers" \
  --body "$(cat <<'BODY'
## Summary
Publishes the already-implemented **Sprint A P0** for Kuteka Beta Experience onto official \`Site_Angola\` (no product redesign).

- Public Beta notice (landing) + authenticated Beta welcome
- Inventory labels: unpublished inventory ≠ public market
- Public docs CTA → sign-in → Beta feedback (existing KOCC path)
- Security headers (middleware + next.config + render.yaml)
- Regenerated \`prebuilt/web-out\` with \`kuteka-config.js\` preserved

## Validation already run on the packaged commit
- Vitest: 129/129
- \`tsc --noEmit\`: OK
- Static export: OK
- Source diff vs main: **no source deletions** (only additive/copy/header changes + prebuilt chunk refresh)

## Do not merge via bot if human approval is required
Please review & merge when ready, then confirm Render deploy.
BODY
)"
echo "PR created. Branch: $BRANCH"
