# Personal Blog (`personal-blog`) — Agent Guide

Personal technology blog for Vitor (`vitorecomp/personal-blog`, planned for `blog.vitorx86.dev`), built on **Ghost 5** (`ghost:5-alpine`) with a custom Ghost Handlebars theme (**`vitorx86-garage`**) crafted in the **"Hacker's Garage"** terminal design system of [`vitorx86.dev`](https://vitorx86.dev) (documented in [`DESIGN.md`](./DESIGN.md) and [`PRODUCT.md`](./PRODUCT.md)).

## Commands

- **Validate Ghost theme**: `npm run validate` (runs `node scripts/validate-theme.mjs`)
- **Validate with official Ghost `gscan` v5**:
  ```bash
  podman run --rm -v "$PWD/themes/vitorx86-garage:/theme:ro" docker.io/library/ghost:5-alpine \
    node -e 'const g=require("/var/lib/ghost/current/node_modules/gscan");g.check("/theme",{checkVersion:"v5"}).then(r=>{const f=g.format(r,{checkVersion:"v5"});console.log({errors:f.results.error.length,warnings:f.results.warning.length});if(f.results.error.length||f.results.warning.length)process.exit(1);})'
  ```
- **Package theme archive (`dist/vitorx86-garage.zip`)**: `npm run build` (or `npm run package`)

### Container Workflows (Podman & Docker)

- **Podman Compose (prod / dev)**:
  - Production: `podman-compose -f podman-compose.yml up --build -d` (`npm run podman:up`)
  - Development (live theme bind-mount): `podman-compose -f podman-compose.yml --profile dev up --build dev` (`npm run podman:dev`)
  - Always pass `-f podman-compose.yml` when running `podman-compose`.
- **Docker Compose (prod / dev)**:
  - Production: `docker compose up --build -d` (`npm run docker:up`)
  - Development (live theme bind-mount): `docker compose --profile dev up --build dev` (`npm run docker:dev`)

## Architecture & Key Files

- [`DESIGN.md`](./DESIGN.md) & [`PRODUCT.md`](./PRODUCT.md): Canonical design tokens (`JetBrains Mono`, `#111827` terminal-ink, `#0d9488`/`#2dd4bf` prompt-teal, `#4ade80` phosphor-green, `#FFFAFA` snow-paper) and product principles shared with `vitorx86.dev` and `cases.vitorx86.dev`.
- [`themes/vitorx86-garage/`](./themes/vitorx86-garage): Custom Ghost 5 Handlebars theme:
  - [`package.json`](./themes/vitorx86-garage/package.json): Ghost 5 theme manifest and custom theme settings (`default_color_scheme`, `hero_command`, `hero_headline`, `hero_subheadline`, `show_topic_channels`, `github_url`, `portfolio_url`, `main_site_url`).
  - [`default.hbs`](./themes/vitorx86-garage/default.hbs): Root HTML shell with `JetBrains Mono`, theme persistence script, navbar, and footer.
  - [`index.hbs`](./themes/vitorx86-garage/index.hbs): Homepage with terminal hero, `neofetch` telemetry card, dispatches stream (or zero-article diagnostic console), technology topic channels, and Midnight Garage showcase banner.
  - [`post.hbs`](./themes/vitorx86-garage/post.hbs), [`page.hbs`](./themes/vitorx86-garage/page.hbs), [`page-about.hbs`](./themes/vitorx86-garage/page-about.hbs), [`tag.hbs`](./themes/vitorx86-garage/tag.hbs), [`author.hbs`](./themes/vitorx86-garage/author.hbs), [`error.hbs`](./themes/vitorx86-garage/error.hbs), [`error-404.hbs`](./themes/vitorx86-garage/error-404.hbs): Core Ghost templates.
  - [`partials/`](./themes/vitorx86-garage/partials): Reusable Handlebars partials (`header.hbs`, `footer.hbs`, `navigation.hbs`, `post-card.hbs`, `empty-posts.hbs`, `topic-channels.hbs`, `pagination.hbs`).
  - [`assets/css/screen.css`](./themes/vitorx86-garage/assets/css/screen.css) & [`assets/js/main.js`](./themes/vitorx86-garage/assets/js/main.js): Theme stylesheet (including all Ghost Koenig card classes) and interactive terminal script.
- [`scripts/configure-ghost-defaults.mjs`](./scripts/configure-ghost-defaults.mjs): Patches Ghost's `default-settings.json` and `fixtures.json` during container build so Ghost initializes with `active_theme = 'vitorx86-garage'`, 4 technology topic tags, and **0 initial articles** (removing Ghost's default `"Coming soon"` post).
- [`scripts/reconcile-ghost-db.mjs`](./scripts/reconcile-ghost-db.mjs): Pre-boot database reconciler executed by `docker-entrypoint-vitorx86.sh` that upgrades any existing SQLite or Cloud SQL MySQL database (e.g. one initialized by a stock `ghost:5-alpine` image during initial Terraform provisioning) to `active_theme = 'vitorx86-garage'`, removes the stock `"Coming soon"` post, updates the `/about/` page, and seeds the 4 technology topic tags.
- [`scripts/docker-entrypoint-vitorx86.sh`](./scripts/docker-entrypoint-vitorx86.sh): Entrypoint wrapper that ensures `vitorx86-garage` is synced into `/var/lib/ghost/content/themes/vitorx86-garage` and runs `reconcile-ghost-db.mjs` before launching Ghost.
- [`Dockerfile`](./Dockerfile), [`docker-compose.yml`](./docker-compose.yml), [`podman-compose.yml`](./podman-compose.yml): Container definitions for local and production deployment (Cloud Run + Artifact Registry + shared Load Balancer Terraform live in `personal-infra/cloud/`).

## Conventions & Guardrails

- **Design System Fidelity (`DESIGN.md`)**: Follow the `vitorx86.dev` terminal grammar (`~$ <command>` eyebrows, `$ ./script.sh` CTAs, `./slug` links, `JetBrains Mono` as the sole typeface, and `#111827` floating terminal cards).
- **Zero Fabricated Articles**: Do not commit fake or placeholder blog posts into fixtures unless explicitly asked by the user. Articles are authored via Ghost Admin (`/ghost`).
- **Verification**: Always run `npm run build` and `gscan` v5 verification after modifying files in `themes/vitorx86-garage/`.
