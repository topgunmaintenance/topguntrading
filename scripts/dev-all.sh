#!/usr/bin/env bash
# TopGun Trading — run the API and Web dev servers in parallel.
#
# Usage:  pnpm dev:all
#
# - Starts @topgun/api on http://localhost:4000
# - Starts @topgun/web on http://localhost:3000
# - Prints URLs, streams interleaved logs, and shuts both down on Ctrl+C.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

API_PORT="${API_PORT:-4000}"
WEB_PORT="${WEB_PORT:-3000}"

# ANSI colors (disable if not a TTY).
if [[ -t 1 ]]; then
  BOLD=$'\033[1m'; DIM=$'\033[2m'; CYAN=$'\033[36m'; GREEN=$'\033[32m'; RESET=$'\033[0m'
else
  BOLD=""; DIM=""; CYAN=""; GREEN=""; RESET=""
fi

printf '\n'
printf '%sTopGun Trading — dev:all%s\n' "$BOLD" "$RESET"
printf '%s────────────────────────%s\n' "$DIM" "$RESET"
printf '  %sAPI%s  →  %shttp://localhost:%s%s\n' "$CYAN" "$RESET" "$GREEN" "$API_PORT" "$RESET"
printf '  %sWeb%s  →  %shttp://localhost:%s%s\n' "$CYAN" "$RESET" "$GREEN" "$WEB_PORT" "$RESET"
printf '\n%sPress Ctrl+C to stop both.%s\n\n' "$DIM" "$RESET"

# Track child PIDs so we can clean them up on exit.
pids=()

cleanup() {
  printf '\n%sShutting down dev servers…%s\n' "$DIM" "$RESET"
  for pid in "${pids[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done
  # Give them a moment, then force-kill anything that's still alive.
  sleep 1
  for pid in "${pids[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill -9 "$pid" 2>/dev/null || true
    fi
  done
}
trap cleanup EXIT INT TERM

# Prefix each line of output with [api] / [web] so the interleaved
# stream is readable. `stdbuf -oL` keeps output line-buffered.
prefix() {
  local label="$1"
  local color="$2"
  while IFS= read -r line; do
    printf '%s[%s]%s %s\n' "$color" "$label" "$RESET" "$line"
  done
}

( pnpm --filter @topgun/api dev 2>&1 | prefix "api" "$CYAN" ) &
pids+=($!)

( pnpm --filter @topgun/web dev 2>&1 | prefix "web" "$GREEN" ) &
pids+=($!)

# Wait for either child to exit, then tear the rest down.
wait -n
