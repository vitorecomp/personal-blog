# Product

<!-- impeccable:product-schema 1 -->

## Platform

web (Ghost 5 CMS + custom `vitorx86-garage` Ghost Handlebars theme)

## Users

Software engineers, open-source contributors, technical readers, and recruiters visiting from [vitorx86.dev](https://vitorx86.dev) (`./blog` / `blog.vitorx86.dev`) or [cases.vitorx86.dev](https://cases.vitorx86.dev) to read Vitor's writing on systems engineering, Rust, Go, C++, AI agents, Linux internals, cloud infrastructure, and embedded hardware projects.

## Product Purpose

Serve as the official technology blog (`blog.vitorx86.dev`) for Vitor (`vitorx86` / `@vitorecomp`), powered by **Ghost 5** for authoring, publishing, RSS syndication, and native search, while preserving the exact **"Hacker's Garage"** terminal aesthetic of `vitorx86.dev`.

## Capabilities and Constraints

- **Ghost 5 Publishing Engine**: Runs on official Ghost 5 (`ghost:5-alpine`) with automated bootstrap script (`scripts/ghost-entrypoint.mjs`) that installs and activates the custom `vitorx86-garage` theme, seeds site metadata and technology topic tags, and removes Ghost's default "Coming soon" dummy post.
- **Zero-Article Initial State**: Ships with **no articles published yet** (`total 0` posts). The homepage and topic channels render a crafted terminal empty-state log (`~$ ls -la ~/blog/posts`) alongside the technology topic taxonomy (`~/systems-and-cli`, `~/ai-and-agents`, `~/hardware-and-garage`, `~/cloud-and-devops`, `~/rust-and-go`), ready for Vitor to publish the first dispatch via Ghost Admin (`/ghost`).
- **Custom Ghost Theme (`themes/vitorx86-garage`)**: Full Handlebars theme (`default.hbs`, `index.hbs`, `post.hbs`, `page.hbs`, `tag.hbs`, `author.hbs`, `error.hbs`, and modular partials) validated with Ghost's official `gscan` validator.
- **Containerized Workflows**: First-class support for both **Docker Compose** (`docker-compose.yml`) and **Podman Compose** (`podman-compose.yml` with `in_pod: false`).
