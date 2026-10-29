# `~/vitorx86/blog` — Personal Technology Blog (`blog.vitorx86.dev`)

Technology blog and engineering dispatches for **Vitor** ([vitorx86.dev](https://vitorx86.dev) / [`@vitorecomp`](https://github.com/vitorecomp)), powered by **Ghost 5** (`ghost:5-alpine`) and the custom **`vitorx86-garage`** Handlebars theme.

Designed in the **"Hacker's Garage"** terminal aesthetic of [`vitorx86.dev`](https://vitorx86.dev) (`JetBrains Mono`, `~$` command prompts, `#111827` floating terminal windows, `#0d9488` prompt teal, and `#4ade80` phosphor green actions).

## Features

- **Ghost 5 Publishing Engine**: Turnkey Ghost 5 container pre-configured with `vitorx86-garage` as the active theme, `#0d9488` accent color, and `vitorx86.dev` navigation links (`./dispatches`, `./topics`, `./about`, `./portfolio`, `./vitorx86.dev`).
- **Zero-Article Initial State**: Automatically strips Ghost's default `"Coming soon"` placeholder post during initialization so the blog starts cleanly with **0 articles** and displays a terminal diagnostic empty state (`~$ ls -la ~/blog/posts -> total 0`) until the first article is published in `/ghost`.
- **Technology Topic Channels**: Pre-seeded with 4 technology tags ready for authoring in Ghost Admin:
  - `~/blog/topics/systems-and-cli` (`#systems-and-cli` — Rust, Go, C++, search engines, Linux CLI)
  - `~/blog/topics/ai-and-agents` (`#ai-and-agents` — Autonomous agents, MCP servers, local LLMs)
  - `~/blog/topics/hardware-and-garage` (`#hardware-and-garage` — ESP32, embedded firmware, CAN-Bus, robotics)
  - `~/blog/topics/cloud-and-devops` (`#cloud-and-devops` — GCP, Terraform, Linux/Wayland, Neovim)
- **Light & Dark Garage Modes**: Defaults to Snow Paper (`#FFFAFA`) with floating `#111827` terminal cards and includes an instant `--dark` / `--light` terminal toggle in the navbar.
- **Native Ghost Search & RSS**: Supports Ghost's native search modal (`$ grep` button or pressing `/`) and full RSS syndication (`/rss/`).

## Running with Podman & Podman Compose

```bash
# Production build & server (http://localhost:2368)
podman-compose -f podman-compose.yml up --build -d

# Development server with live theme bind-mount (http://localhost:2368)
podman-compose -f podman-compose.yml --profile dev up --build dev

# Stop containers
podman-compose -f podman-compose.yml --profile dev down
```

## Running with Docker & Docker Compose

```bash
# Production build & server (http://localhost:2368)
docker compose up --build -d

# Development server with live theme bind-mount (http://localhost:2368)
docker compose --profile dev up --build dev

# Stop containers
docker compose --profile dev down
```

Once running:
- **Public Blog**: `http://localhost:2368`
- **Ghost Admin (to write & publish articles)**: `http://localhost:2368/ghost`
- **Port Padding (`PORT_PAD`)**: Pass `PORT_PAD=1` (or `PORT_PAD=10000` with `npm run podman:up` / `npm run docker:up`) to shift the exposed host port to `12368` (`http://localhost:12368`).

## Validating & Packaging the Theme (`dist/vitorx86-garage.zip`)

To validate the custom Ghost 5 theme structure and package it into a `.zip` archive (for uploading directly to any external Ghost instance):

```bash
npm run build
# Outputs: dist/vitorx86-garage.zip
```

## Cloud Deployment (`personal-infra`)

Production Cloud Run deployment, Artifact Registry image builds, and shared Global HTTPS Load Balancer routing (`blog.vitorx86.dev`) are managed in [`personal-infra`](https://github.com/vitorecomp/personal-infra) (`cloud/personal-blog/` and `cloud/infra/`).

## License

MIT
