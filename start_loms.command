#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACK_PID=""
FRONT_PID=""

cleanup() {
  if [[ -n "$BACK_PID" ]]; then
    kill "$BACK_PID" 2>/dev/null || true
  fi
  if [[ -n "$FRONT_PID" ]]; then
    kill "$FRONT_PID" 2>/dev/null || true
  fi
}
trap cleanup INT TERM EXIT

(
  cd "$ROOT/backend"
  npm start
) &
BACK_PID=$!

(
  cd "$ROOT/frontend"
  npm run dev -- --host
) &
FRONT_PID=$!

echo "Backend PID: $BACK_PID"
echo "Frontend PID: $FRONT_PID"
echo "Backend: http://127.0.0.1:5001"
echo "Frontend: http://localhost:3000"
echo "Press Ctrl+C in this window to stop both servers."

wait "$BACK_PID" "$FRONT_PID"
