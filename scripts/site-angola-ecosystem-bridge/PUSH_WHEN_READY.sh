#!/usr/bin/env bash
set -euo pipefail
REPO="${SITE_ANGOLA_REPO:-EduardoZ121/Site_Angola}"
BRANCH="cursor/kuteka-ecosystem-execution-f96b"
WORKDIR="${1:-/tmp/site-angola-retry}"
TOKEN="${SITE_ANGOLA_PUSH_TOKEN:-${GH_TOKEN:-${GITHUB_TOKEN:-}}}"
if [[ -z "${TOKEN}" ]]; then
  echo "Missing SITE_ANGOLA_PUSH_TOKEN (classic PAT with repo scope on ${REPO})"
  exit 2
fi
if [[ ! -d "${WORKDIR}/.git" ]]; then
  echo "Missing workdir ${WORKDIR}"
  exit 3
fi
cd "${WORKDIR}"
git remote set-url origin "https://x-access-token:${TOKEN}@github.com/${REPO}.git"
git push -u origin "${BRANCH}"
echo "Pushed ${BRANCH}."
echo "https://github.com/${REPO}/compare/main...${BRANCH}?expand=1"
