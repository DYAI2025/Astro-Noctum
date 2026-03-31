#!/usr/bin/env bash
set -euo pipefail

echo "Running TypeScript check (src/)..."

TMP_OUTPUT="$(mktemp)"
trap 'rm -f "$TMP_OUTPUT"' EXIT

npx tsc --noEmit 2>&1 | tee "$TMP_OUTPUT" || true

if rg -q '^src/' "$TMP_OUTPUT"; then
  echo "TypeScript errors in src/:"
  rg '^src/' "$TMP_OUTPUT"
  exit 2
fi

echo "No TypeScript errors in src/"
