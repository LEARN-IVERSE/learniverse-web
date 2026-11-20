#!/usr/bin/env bash
# Share LEARNIVERSE on the internet through ngrok so a few people can try it. Stop with Ctrl-C.
#
#   ./scripts/share-public.sh                  # random ngrok URL (changes on every start)
#   NGROK_URL=my-name.ngrok-free.dev ./scripts/share-public.sh   # your free static dev domain
#
# What it does: starts the tunnel to the web app, then the API (production mode, secure cookie, CORS /
# CSRF origin and storage URLs set to the public address) and the production build of the web app.
# Only port 3000 is tunnelled; the API, database and storage stay on 127.0.0.1 and are reached through the
# web app's /api and /storage proxies. Needs: ngrok (signed in), uv, pnpm, python3, curl, docker services up.
set -euo pipefail
cd "$(dirname "$0")/.."
WEB_DIR="$PWD"
API_DIR="$(cd ../learniverse-api && pwd)"
LOG_DIR="${TMPDIR:-/tmp}/learniverse-share"
mkdir -p "$LOG_DIR"

for tool in ngrok uv pnpm python3 curl; do
  command -v "$tool" >/dev/null || { echo "Missing tool: $tool" >&2; exit 1; }
done
for port in 3000 8000 4040; do
  if ss -ltn | grep -q ":$port "; then
    echo "Port $port is already in use. Stop the dev servers (and any ngrok) first." >&2
    exit 1
  fi
done

PIDS=()
cleanup() {
  echo; echo "Stopping..."
  for pid in "${PIDS[@]}"; do kill -- "-$pid" 2>/dev/null || kill "$pid" 2>/dev/null || true; done
  # Wrappers (uv, pnpm) can leave their child behind; both ports were free when we started, so whatever
  # still listens there is ours.
  for port in 3000 8000; do
    for pid in $(ss -ltnp 2>/dev/null | grep ":$port " | grep -o 'pid=[0-9]*' | cut -d= -f2); do
      kill "$pid" 2>/dev/null || true
    done
  done
}
trap cleanup EXIT INT TERM
start() { # start <name> <command...>: run in its own process group, log to $LOG_DIR/<name>.log
  local name="$1"; shift
  setsid "$@" >"$LOG_DIR/$name.log" 2>&1 &
  PIDS+=("$!")
}

# 1. Tunnel first: the API needs to know the public address.
start ngrok ngrok http 3000 ${NGROK_URL:+--url="$NGROK_URL"} --log=stdout --log-level=warn
PUBLIC_URL=""
for _ in $(seq 1 40); do
  PUBLIC_URL="$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null \
    | python3 -c 'import json,sys; t=json.load(sys.stdin)["tunnels"]; print(t[0]["public_url"] if t else "")' 2>/dev/null || true)"
  [ -n "$PUBLIC_URL" ] && break
  sleep 0.5
done
[ -n "$PUBLIC_URL" ] || { echo "ngrok did not start. See $LOG_DIR/ngrok.log" >&2; exit 1; }
PUBLIC_URL="${PUBLIC_URL/http:\/\//https://}"

# 2. API in production mode with the public address.
(cd "$API_DIR" && start api env \
  APP_ENV=production WEB_ORIGIN="$PUBLIC_URL" SESSION_COOKIE_SECURE=true \
  S3_PUBLIC_BASE_URL="$PUBLIC_URL/storage" OTEL_EXPORTER_OTLP_ENDPOINT= \
  uv run fastapi run app/main.py --host 127.0.0.1 --port 8000)

# 3. Production build of the web app (needs the API only at run time).
echo "Building the web app..."
pnpm build >"$LOG_DIR/build.log" 2>&1 || { echo "Build failed. See $LOG_DIR/build.log" >&2; exit 1; }
start web pnpm start --port 3000

for _ in $(seq 1 60); do
  curl -sf -o /dev/null http://127.0.0.1:3000/login && curl -sf -o /dev/null http://127.0.0.1:8000/v1/health && break
  sleep 0.5
done

cat <<MSG

LEARNIVERSE is public at: $PUBLIC_URL

  1. Google sign-in: add  $PUBLIC_URL  to "Authorized JavaScript origins" of the OAuth client
     (Google Cloud Console > APIs & Services > Credentials) before testers try to sign in.
  2. ngrok shows a "Visit Site" warning page once per browser; testers just click it.
  3. Logs: $LOG_DIR/   Stop everything with Ctrl-C.
MSG
wait
