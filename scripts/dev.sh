#!/usr/bin/env bash
# Start Vite (3000) and Express (3001) together.
# Ctrl+C stops both cleanly. One tab, one command.
set -u

cleanup() {
  echo ""
  echo "[dev] Stopping processes..."
  [[ -n "${VITE_PID:-}" ]] && kill "$VITE_PID" 2>/dev/null || true
  [[ -n "${EXPRESS_PID:-}" ]] && kill "$EXPRESS_PID" 2>/dev/null || true
  wait 2>/dev/null || true
  exit 0
}
trap cleanup INT TERM

# Express first so the Vite proxy has something to hit on first request.
# --env-file requires Node 20.6+. NODE_ENV=development gates prod-only checks.
if [[ ! -f .env ]]; then
  echo "[dev] .env missing — copy .env.example to .env and fill in SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY" >&2
  exit 1
fi
NODE_ENV=development PORT=3001 node --env-file=.env server.mjs &
EXPRESS_PID=$!

# Give Express a second to bind or fail fast.
sleep 1
if ! kill -0 "$EXPRESS_PID" 2>/dev/null; then
  echo "[dev] Express failed to start — check .env and server.mjs" >&2
  exit 1
fi

vite --port=3000 --host=0.0.0.0 &
VITE_PID=$!

# Wait on either child; if one dies, kill the other and exit with its status.
wait -n
STATUS=$?
cleanup
exit $STATUS
