# syntax=docker/dockerfile:1

FROM docker.io/library/ghost:5-alpine

# Install the custom vitorx86-garage theme into Ghost's seed content directory
COPY --chown=node:node themes/vitorx86-garage /var/lib/ghost/content.orig/themes/vitorx86-garage

# Configure Ghost defaults:
# - active_theme = "vitorx86-garage"
# - vitorx86.dev site title, description, navigation & #0d9488 accent color
# - 4 technology topic channels
# - 0 initial articles/posts (removes Ghost's default "Coming soon" post)
COPY scripts/configure-ghost-defaults.mjs /usr/local/bin/configure-ghost-defaults.mjs
COPY scripts/docker-entrypoint-vitorx86.sh /usr/local/bin/docker-entrypoint-vitorx86.sh

RUN chmod +x /usr/local/bin/configure-ghost-defaults.mjs /usr/local/bin/docker-entrypoint-vitorx86.sh && \
    node /usr/local/bin/configure-ghost-defaults.mjs && \
    chown node:node \
      /var/lib/ghost/current/core/server/data/schema/default-settings/default-settings.json \
      /var/lib/ghost/current/core/server/data/schema/fixtures/fixtures.json

ENV NODE_ENV=production
ENV url=http://localhost:2368

EXPOSE 2368
ENTRYPOINT ["/usr/local/bin/docker-entrypoint-vitorx86.sh"]
CMD ["node", "current/index.js"]
