#!/usr/bin/env bash
# Regenerate the API client from the learniverse-api OpenAPI schema.
# - If ../learniverse-api exists: export the schema straight from code (no server needed).
# - Otherwise: read $OPENAPI_INPUT (default http://localhost:8000/openapi.json).
set -euo pipefail
cd "$(dirname "$0")/.."

API_REPO="../learniverse-api"
if [[ -z "${OPENAPI_INPUT:-}" && -d "$API_REPO" ]]; then
  TMP="$(mktemp --suffix=.json)"
  trap 'rm -f "$TMP"' EXIT
  (cd "$API_REPO" && uv run python scripts/export_openapi.py "$TMP" >/dev/null)
  export OPENAPI_INPUT="$TMP"
fi

pnpm exec openapi-ts
echo "Generated src/lib/api from ${OPENAPI_INPUT:-http://localhost:8000/openapi.json}"
