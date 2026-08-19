#!/usr/bin/env bash
# Ignored Build Step for Vercel.
# Exit 0 = skip this deployment. Exit 1 = continue the build.
#
# This exists because the "Frequency Music Essay" deploy hook was rebuilding
# production every ~8 hours against an unchanged git SHA (~4 minutes each).

set -u

PREV="${VERCEL_GIT_PREVIOUS_SHA:-}"
CURR="${VERCEL_GIT_COMMIT_SHA:-}"

if [[ -n "$PREV" && -n "$CURR" && "$PREV" == "$CURR" ]]; then
  echo "Skip: git SHA $CURR matches the previous deployment (deploy hook / empty rebuild)."
  exit 0
fi

if [[ -z "$PREV" || -z "$CURR" ]]; then
  echo "Build: no previous/current SHA available."
  exit 1
fi

if ! git cat-file -e "${PREV}^{commit}" 2>/dev/null; then
  echo "Build: previous SHA is not in this clone."
  exit 1
fi

# Skip when the diff is only docs, plans, CI, or editor config — none of those
# change the production site. Keep src/content/** markdown in the build path.
if git diff --quiet "$PREV" "$CURR" -- \
  . \
  ':!docs' \
  ':!plans' \
  ':!ai-docs' \
  ':!.github' \
  ':!.cursor' \
  ':!.claude' \
  ':!.taskmaster' \
  ':!CLAUDE.md' \
  ':!README.md'
then
  echo "Skip: no production source files changed between $PREV and $CURR."
  exit 0
fi

echo "Build: source files changed between $PREV and $CURR."
exit 1
