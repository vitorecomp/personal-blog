#!/usr/bin/env bash
set -euo pipefail

# Configure Ghost to bind to 0.0.0.0 and respect Cloud Run's $PORT (defaults to 2368)
export server__host="${server__host:-0.0.0.0}"
export server__port="${PORT:-${server__port:-2368}}"

# Resolve public Ghost URL:
# 1. Explicit GHOST_URL override from Compose/CLI
# 2. Localhost URL matching the (optionally PORT_PAD-prefixed) HOST_PORT from Compose
if [ -n "${GHOST_URL:-}" ]; then
  export url="${GHOST_URL}"
elif [ -n "${HOST_PORT:-}" ]; then
  export url="http://localhost:${HOST_PORT}"
fi

# Disable email-based staff device verification by default so /ghost login
# works without requiring an external SMTP server
export security__staffDeviceVerification="${security__staffDeviceVerification:-false}"

# Default to SQLite for local container runs when database__client is not set
# (Production on Cloud Run sets database__client=mysql for Cloud SQL MySQL 8.0)
export database__client="${database__client:-sqlite3}"
if [ "${database__client}" = "sqlite3" ]; then
  export database__connection__filename="${database__connection__filename:-/var/lib/ghost/content/data/ghost.db}"
fi

GHOST_CONTENT_DIR="${GHOST_CONTENT:-/var/lib/ghost/content}"

# Optional Cloud Run GCS FUSE persistence sync directory for uploaded media/images
if [ -n "${GHOST_STORAGE_SYNC_DIR:-}" ] && [ -d "${GHOST_STORAGE_SYNC_DIR}" ]; then
  mkdir -p "${GHOST_CONTENT_DIR}/images" "${GHOST_CONTENT_DIR}/files" "${GHOST_CONTENT_DIR}/settings"
  mkdir -p "${GHOST_STORAGE_SYNC_DIR}/images" "${GHOST_STORAGE_SYNC_DIR}/files" "${GHOST_STORAGE_SYNC_DIR}/settings"

  for subdir in images files settings; do
    if [ -d "${GHOST_STORAGE_SYNC_DIR}/${subdir}" ] && [ -n "$(ls -A "${GHOST_STORAGE_SYNC_DIR}/${subdir}" 2>/dev/null || true)" ]; then
      cp -R "${GHOST_STORAGE_SYNC_DIR}/${subdir}/." "${GHOST_CONTENT_DIR}/${subdir}/"
    fi
  done
  chown -R node:node "${GHOST_CONTENT_DIR}"

  sync_to_storage() {
    for subdir in images files settings; do
      if [ -d "${GHOST_CONTENT_DIR}/${subdir}" ] && [ -n "$(ls -A "${GHOST_CONTENT_DIR}/${subdir}" 2>/dev/null || true)" ]; then
        cp -R "${GHOST_CONTENT_DIR}/${subdir}/." "${GHOST_STORAGE_SYNC_DIR}/${subdir}/" 2>/dev/null || true
      fi
    done
  }

  # Background periodic sync + graceful shutdown sync
  (
    trap 'sync_to_storage; exit 0' TERM INT
    while true; do
      sleep "${GHOST_STORAGE_SYNC_INTERVAL:-30}" &
      wait $! || true
      sync_to_storage
    done
  ) &
fi

# Ensure the custom vitorx86-garage theme is always synced into Ghost's active
# content/themes directory before handing off to Ghost's official entrypoint.
THEME_SRC="/var/lib/ghost/content.orig/themes/vitorx86-garage"
THEME_DEST="${GHOST_CONTENT_DIR}/themes/vitorx86-garage"

if [ -d "$THEME_SRC" ]; then
  mkdir -p "$(dirname "$THEME_DEST")"
  # If THEME_DEST is not a bind mount from the host, sync the theme files
  if ! mountpoint -q "$THEME_DEST" 2>/dev/null; then
    rm -rf "$THEME_DEST"
    cp -R "$THEME_SRC" "$THEME_DEST"
    chown -R node:node "$THEME_DEST"
  fi
fi

# Reconcile any existing database (e.g. Cloud SQL MySQL initialized by a stock
# ghost:5-alpine image during initial Terraform apply) so active_theme is
# vitorx86-garage and the stock "Coming soon" post is removed before Ghost boots.
if [ -f /usr/local/bin/reconcile-ghost-db.mjs ]; then
  node /usr/local/bin/reconcile-ghost-db.mjs || true
fi

exec /usr/local/bin/docker-entrypoint.sh "$@"
