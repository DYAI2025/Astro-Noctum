#!/usr/bin/env bash
set -euo pipefail

# tsconfig.json already includes only src/, so any compiler error here is a src error.
# We intentionally do not mask the tsc exit code to avoid false negatives in CI.
echo "Running TypeScript check (src/)..."
npx tsc --noEmit --pretty false

echo "No TypeScript errors in src/."
