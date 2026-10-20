---
name: blog.vitorx86.dev (personal-blog)
description: Technology blog and engineering dispatches for vitorx86.dev — "The Hacker's Garage" applied to Ghost 5 publishing.
colors:
  terminal-ink: "#111827"
  panel-graphite: "#1f2937"
  midnight-garage: "#14142f"
  blueprint-line: "#3b3b78"
  snow-paper: "#FFFAFA"
  prompt-teal: "#0d9488"
  prompt-teal-dark: "#0f766e"
  prompt-teal-bright: "#2dd4bf"
  phosphor-green: "#4ade80"
  ink-body: "#374151"
  fog-body: "#d1d5db"
  steel-muted: "#6b7280"
  silver-muted: "#9ca3af"
  hairline-gray: "#e5e7eb"
  anime-indigo: "#a5b4fc"
  jacket-pink: "#f9a8d4"
typography:
  display:
    fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.025em"
  body:
    fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.78
---

# Design System: blog.vitorx86.dev (`personal-blog`)

## Overview

**Creative North Star: "The Hacker's Garage — Engineering Log"**

This Ghost 5 publication is the technology blog companion to [vitorx86.dev](https://vitorx86.dev) and [cases.vitorx86.dev](https://cases.vitorx86.dev). It pairs Ghost's publishing engine with the exact visual DNA of `vitorx86.dev`:

- **The One Font Rule**: `JetBrains Mono` carries the entire typographic hierarchy across the terminal navbar, hero console, topic index, post windows, long-form article prose (`68ch` measure), and code blocks.
- **Terminal Grammar**: Sections open with two-tone `~$ <command>` prompt lockups, navigation uses `./slug` executable links (`./blog`, `./topics`, `./portfolio`, `./vitorx86.dev`, `./github`, `./rss`), and interactive buttons read like shell commands (`$ ./search_posts.sh`, `$ ./subscribe_rss.sh`, `$ ./read_post.sh`).
- **Floating Terminal Objects**: Post cards, topic channels, empty-state diagnostic consoles, and article headers are `#111827` (`terminal-ink`) windows with traffic-light chrome (`#ef4444`, `#eab308`, `#22c55e`), `~/blog/<slug>.md` paths, intentional offset shadows, and `#4ade80` (`phosphor-green`) executable actions.
- **Light & Dark Garage Modes**: Defaults to Snow Paper (`#FFFAFA`) with a faint 45° blueprint grid and floating dark `#111827` terminal objects, with an instant toggle to Midnight/Terminal Dark (`#111827` / `#14142f`) persisted in `localStorage`.
- **House & Topic Accents**: Prompt Teal (`#0f766e` on light, `#2dd4bf` on dark) and Phosphor Green (`#4ade80`) are the house accents; Anime Indigo (`#a5b4fc`) highlights AI & Agents topics, and Jacket Pink (`#f9a8d4`) highlights Hardware & Garage topics.

## Craft Floor Invariants

1. **Contrast Verification**: Body copy on Snow Paper (`#374151` on `#FFFAFA`) exceeds 10:1 contrast; prompt teal text on light uses `#0f766e` (5.4:1 contrast) and on dark uses `#2dd4bf` (10.1:1 contrast).
2. **Reading Measure & Rhythm**: Long-form Ghost post content (`gh-content`) is constrained to `68ch` with `1.78` line-height, generous top margins before headings (`2.5rem` top vs `0.85rem` bottom), and `JetBrains Mono` rhythm.
3. **Touch Targets**: All interactive links, topic pills, search triggers, and theme toggles enforce a minimum `44x44px` hit target.
4. **Anti-Pattern Refusals**: No gradient text, no thick colored side-stripe borders (`>1px`), no zero-offset neon halos, and no fabricated placeholder articles.
