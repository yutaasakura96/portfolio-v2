#!/usr/bin/env bash
# Restore the Neon dev branch to match production (parent).
# Uses the Neon REST API: POST /branches/{id}/restore with source_branch_id.
# Requires: NEON_API_KEY, NEON_PROJECT_ID, NEON_DEV_BRANCH_ID, NEON_PROD_BRANCH_ID in .env or exported.
set -euo pipefail

# Load from .env if present
if [ -f .env ]; then
  export $(grep -E '^NEON_(API_KEY|PROJECT_ID|DEV_BRANCH_ID|PROD_BRANCH_ID)=' .env | xargs)
fi

: "${NEON_API_KEY:?Set NEON_API_KEY in .env or environment}"
: "${NEON_PROJECT_ID:?Set NEON_PROJECT_ID in .env or environment}"
: "${NEON_DEV_BRANCH_ID:?Set NEON_DEV_BRANCH_ID in .env or environment}"
: "${NEON_PROD_BRANCH_ID:?Set NEON_PROD_BRANCH_ID in .env or environment}"

echo "Restoring Neon dev branch to prod..."

http_code=$(curl -s -o /tmp/neon-reset-response.json -w "%{http_code}" -X POST \
  "https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/branches/${NEON_DEV_BRANCH_ID}/restore" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer ${NEON_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"source_branch_id\": \"${NEON_PROD_BRANCH_ID}\"}")

if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
  echo "Done — dev branch restored from prod (HTTP ${http_code})"
else
  echo "Failed (HTTP ${http_code}):"
  cat /tmp/neon-reset-response.json
  exit 1
fi
