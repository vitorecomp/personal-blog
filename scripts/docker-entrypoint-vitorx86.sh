#!/usr/bin/env bash
set -euo pipefail

# Configure Ghost to bind to 0.0.0.0 and respect Cloud Run's $PORT (defaults to 2368)
export server__host="${server__host:-0.0.0.0}"
export server__port="${PORT:-${server__port:-2368}}"

GHOST_CONTENT_DIR="${GHOST_CONTENT:-/var/lib/ghost/content}"

# Optional Cloud Run GCS FUSE persistence sync directory (keeps SQLite on local
# container filesystem for POSIX locking while persisting data/images to GCS)
if [ -n "${GHOST_STORAGE_SYNC_DIR:-}" ] && [ -d "${GHOST_STORAGE_SYNC_DIR}" ]; then
  mkdir -p "${GHOST_CONTENT_DIR}/data" "${GHOST_CONTENT_DIR}/images" "${GHOST_CONTENT_DIR}/files" "${GHOST_CONTENT_DIR}/settings"
  mkdir -p "${GHOST_STORAGE_SYNC_DIR}/data" "${GHOST_STORAGE_SYNC_DIR}/images" "${GHOST_STORAGE_SYNC_DIR}/files" "${GHOST_STORAGE_SYNC_DIR}/settings"

  for subdir in data images files settings; do
    if [ -d "${GHOST_STORAGE_SYNC_DIR}/${subdir}" ] && [ -n "$(ls -A "${GHOST_STORAGE_SYNC_DIR}/${subdir}" 2>/dev/null || true)" ]; then
      cp -R "${GHOST_STORAGE_SYNC_DIR}/${subdir}/." "${GHOST_CONTENT_DIR}/${subdir}/"
    fi
  done
  chown -R node:node "${GHOST_CONTENT_DIR}"

  sync_to_storage() {
    for subdir in data images files settings; do
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

exec /usr/local/bin/docker-entrypoint.sh "$@"
