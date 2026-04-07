#!/usr/bin/env bash
set -euo pipefail

echo "Running TypeScript check (src/)..."

TMP_OUTPUT="$(mktemp)"
trap 'rm -f "$TMP_OUTPUT"' EXIT

npx tsc --noEmit 2>&1 | tee "$TMP_OUTPUT"
TS_EXIT=${PIPESTATUS[0]}

if [ "$TS_EXIT" -eq 0 ]; then
  echo "No TypeScript errors in src/"
  exit 0
fi

if rg -q '^src/' "$TMP_OUTPUT"; then
  echo "TypeScript errors in src/:"
  rg '^src/' "$TMP_OUTPUT"
  exit 2
fi

echo "TypeScript check failed outside src/ (configuration/dependency error)."
cat "$TMP_OUTPUT"
exit "$TS_EXIT"
