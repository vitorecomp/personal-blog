#!/usr/bin/env bash
set -euo pipefail

# Ensure the custom vitorx86-garage theme is always synced into Ghost's active
# content/themes directory before handing off to Ghost's official entrypoint.
THEME_SRC="/var/lib/ghost/content.orig/themes/vitorx86-garage"
THEME_DEST="${GHOST_CONTENT:-/var/lib/ghost/content}/themes/vitorx86-garage"

if [ -d "$THEME_SRC" ]; then
  mkdir -p "$(dirname "$THEME_DEST")"
  # If THEME_DEST is not a bind mount from the host, sync the theme files
  if ! mountpoint -q "$THEME_DEST" 2>/dev/null; then
    rm -rf "$THEME_DEST"
    cp -R "$THEME_SRC" "$THEME_DEST"
  fi
fi

exec /usr/local/bin/docker-entrypoint.sh "$@"
