#!/bin/bash
# ============================================================
# Hyakumonogatari — Deploy Script
# ============================================================
#
# Usage:
#   ./deploy.sh <tag>                      # Deploy with default snow connection
#   ./deploy.sh <tag> <snow-connection>    # Deploy with specific connection
#
# Examples:
#   ./deploy.sh v1                         # First deploy
#   ./deploy.sh v2                         # Update deploy
#   ./deploy.sh v$(date +%Y%m%d%H%M%S)     # Timestamped tag
#
# Prerequisites:
#   - Docker Desktop running
#   - snow CLI installed and configured
#
# ============================================================

set -e

# ── Configuration ──

APP_NAME="HYAKUMONOGATARI"
APP_PKG="HYAKUMONOGATARI_PKG"
APP_DB="HYAKUMONOGATARI_DB"
APP_SCHEMA="APP_SCHEMA"
APP_REPO="HYAKUMONOGATARI_REPO"
CONTAINER_NAME="hyakumonogatari"

# Registry path will be completed after getting account info
STAGE="@${APP_PKG}.APP_SRC.STAGE"

# Files to upload to stage
DEPLOY_FILES=(
    "deploy/manifest.yml"
    "deploy/service_spec.yml"
    "deploy/scripts/setup.sql"
    "deploy/scripts/config.sql"
    "deploy/scripts/services.sql"
)

# Streamlit files
STREAMLIT_FILES=(
    "deploy/streamlit/setup_ui.py"
)

# ── Parse arguments ──

TAG="${1:?Usage: deploy.sh <tag> [snow-connection]}"
VERSION=$(echo "$TAG" | tr '[:lower:]' '[:upper:]' | sed 's/[^A-Z0-9_]/_/g')
CONNECTION="${2:-}"

if [ -n "$CONNECTION" ]; then
    CONN_FLAG="-c ${CONNECTION}"
else
    CONN_FLAG=""
fi

# Get account name for registry path
ACCOUNT=$(snow sql ${CONN_FLAG} -q "SELECT CURRENT_ACCOUNT()" --format json 2>/dev/null | grep -oP '(?<="CURRENT_ACCOUNT\(\)":")[^"]*' || echo "")
if [ -z "$ACCOUNT" ]; then
    # Fallback: try to get from config
    ACCOUNT=$(snow connection show ${CONN_FLAG} 2>/dev/null | grep account | awk '{print $2}' || echo "YOUR_ACCOUNT")
fi
ACCOUNT_LOWER=$(echo "$ACCOUNT" | tr '[:upper:]' '[:lower:]')
REGISTRY_PATH="${ACCOUNT_LOWER}.registry.snowflakecomputing.com/${APP_DB}/${APP_SCHEMA}/${APP_REPO}/${CONTAINER_NAME}"

echo "============================================"
echo "  Deploying ${APP_NAME} as ${VERSION}"
echo "  Tag: ${TAG}"
echo "  Registry: ${REGISTRY_PATH}:${TAG}"
echo "  Connection: ${CONNECTION:-default}"
echo "============================================"

# ── Step 1: Build Docker image ──

echo ""
echo "--- Step 1: Build Docker image ---"
docker build -t "${CONTAINER_NAME}:latest" -f deploy/Dockerfile .

# ── Step 2: Tag and push to Snowflake registry ──

echo ""
echo "--- Step 2: Push image to registry ---"
docker tag "${CONTAINER_NAME}:latest" "${REGISTRY_PATH}:${TAG}"

REGISTRY_HOST="${ACCOUNT_LOWER}.registry.snowflakecomputing.com"
snow spcs image-registry token ${CONN_FLAG} --format=JSON 2>/dev/null | \
    docker login "${REGISTRY_HOST}" --username 0sessiontoken --password-stdin

docker push "${REGISTRY_PATH}:${TAG}"

# ── Step 3: Update manifest and service_spec with new tag ──

echo ""
echo "--- Step 3: Update manifest/spec to :${TAG} ---"
IMAGE_PATH="/${APP_DB}/${APP_SCHEMA}/${APP_REPO}/${CONTAINER_NAME}:${TAG}"

# Update manifest.yml
sed -i "s|${CONTAINER_NAME}:v[0-9a-zA-Z_]*|${CONTAINER_NAME}:${TAG}|g" deploy/manifest.yml

# Update service_spec.yml
sed -i "s|${CONTAINER_NAME}:v[0-9a-zA-Z_]*|${CONTAINER_NAME}:${TAG}|g" deploy/service_spec.yml

echo "  Updated image tag to ${TAG}"

# ── Step 4: Upload all files to stage ──

echo ""
echo "--- Step 4: Upload files to stage ---"

for f in "${DEPLOY_FILES[@]}"; do
    if [ -f "$f" ]; then
        # Map file to correct stage path
        STAGE_PATH="${STAGE}/"
        if [[ "$f" == *"scripts/"* ]]; then
            STAGE_PATH="${STAGE}/scripts/"
        fi
        echo "  PUT ${f} -> ${STAGE_PATH}"
        snow sql ${CONN_FLAG} -q "PUT 'file://${f}' ${STAGE_PATH} OVERWRITE=TRUE AUTO_COMPRESS=FALSE" 2>&1 | tail -1
    else
        echo "  SKIP ${f} (not found)"
    fi
done

for f in "${STREAMLIT_FILES[@]}"; do
    if [ -f "$f" ]; then
        echo "  PUT ${f} -> streamlit/"
        snow sql ${CONN_FLAG} -q "PUT 'file://${f}' ${STAGE}/streamlit/ OVERWRITE=TRUE AUTO_COMPRESS=FALSE" 2>&1 | tail -1
    fi
done

# ── Step 5: Deregister old version + register new ──

echo ""
echo "--- Step 5: Register version ${VERSION} ---"

# Deregister (ignore error if version doesn't exist)
snow sql ${CONN_FLAG} -q \
    "ALTER APPLICATION PACKAGE ${APP_PKG} DEREGISTER VERSION ${VERSION}" 2>&1 | tail -1 || true

# Register
snow sql ${CONN_FLAG} -q \
    "ALTER APPLICATION PACKAGE ${APP_PKG} REGISTER VERSION ${VERSION} USING '${STAGE}'" 2>&1 | tail -1

# ── Step 6: Upgrade or create application ──

echo ""
echo "--- Step 6: Deploy application ---"

# Set release directive
snow sql ${CONN_FLAG} -q \
    "USE ROLE ACCOUNTADMIN; ALTER APPLICATION PACKAGE ${APP_PKG} SET DEFAULT RELEASE DIRECTIVE VERSION = ${VERSION} PATCH = 0" 2>&1 | tail -1

# Try UPGRADE first
UPGRADE_RESULT=$(snow sql ${CONN_FLAG} -q \
    "USE ROLE ACCOUNTADMIN; ALTER APPLICATION ${APP_NAME} UPGRADE" 2>&1)

if echo "$UPGRADE_RESULT" | grep -q "error\|Error\|does not exist"; then
    echo "  UPGRADE not available — creating fresh application"
    snow sql ${CONN_FLAG} -q \
        "USE ROLE ACCOUNTADMIN; CREATE WAREHOUSE IF NOT EXISTS SETUP_WH WAREHOUSE_SIZE='XSMALL' AUTO_SUSPEND=60 AUTO_RESUME=TRUE; USE WAREHOUSE SETUP_WH; CREATE APPLICATION ${APP_NAME} FROM APPLICATION PACKAGE ${APP_PKG} USING VERSION ${VERSION}" 2>&1 | tail -3
else
    echo "  UPGRADE succeeded — consumer settings preserved"
    echo "$UPGRADE_RESULT" | tail -1
fi

# ── Step 7: Verify ──

echo ""
echo "--- Step 7: Verify ---"
snow sql ${CONN_FLAG} -q \
    "SELECT CURRENT_ACCOUNT() AS account; SHOW APPLICATIONS LIKE '${APP_NAME}'" 2>&1 | head -10

echo ""
echo "=== Deploy complete: ${APP_NAME} ${VERSION} ==="
echo ""
echo "Next steps:"
echo "  1. Open the app in Snowsight: Data Products > Apps > ${APP_NAME}"
echo "  2. Complete the Setup wizard (4 steps)"
echo "  3. Approve EAI in Configurations tab"
echo "  4. Create the service"
