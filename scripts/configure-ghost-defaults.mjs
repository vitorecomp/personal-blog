#!/usr/bin/env node
/**
 * Patches Ghost 5's built-in default-settings.json and fixtures.json during
 * container image build so that a fresh Ghost database initializes with:
 * - Active theme: `vitorx86-garage`
 * - Site metadata: `vitorx86.dev // blog` & `#0d9488` Prompt Teal accent
 * - Technology topic tags (`systems-and-cli`, `ai-and-agents`, `hardware-and-garage`, `cloud-and-devops`)
 * - ZERO initial articles/posts (removes Ghost's default "Coming soon" post)
 */

import fs from 'node:fs'
import path from 'node:path'

const GHOST_CURRENT = process.env.GHOST_CURRENT || '/var/lib/ghost/current'
const GHOST_INSTALL = process.env.GHOST_INSTALL || '/var/lib/ghost'

const configProdPath = path.join(GHOST_INSTALL, 'config.production.json')
const defaultSettingsPath = path.join(
  GHOST_CURRENT,
  'core/server/data/schema/default-settings/default-settings.json'
)
const fixturesPath = path.join(
  GHOST_CURRENT,
  'core/server/data/schema/fixtures/fixtures.json'
)

function patchConfigProduction() {
  if (!fs.existsSync(configProdPath)) {
    return
  }
  const cfg = JSON.parse(fs.readFileSync(configProdPath, 'utf8'))
  cfg.server = {
    ...(cfg.server || {}),
    host: '0.0.0.0'
  }
  cfg.security = {
    ...(cfg.security || {}),
    staffDeviceVerification: false
  }
  fs.writeFileSync(configProdPath, JSON.stringify(cfg, null, 2) + '\n')
  console.log('[configure-ghost-defaults] Patched config.production.json -> staffDeviceVerification: false')
}

function patchDefaultSettings() {
  if (!fs.existsSync(defaultSettingsPath)) {
    throw new Error(`default-settings.json not found at ${defaultSettingsPath}`)
  }

  const settings = JSON.parse(fs.readFileSync(defaultSettingsPath, 'utf8'))

  if (settings.theme && settings.theme.active_theme) {
    settings.theme.active_theme.defaultValue = 'vitorx86-garage'
  }

  if (settings.site) {
    if (settings.site.title) {
      settings.site.title.defaultValue = 'vitorx86.dev // blog'
    }
    if (settings.site.description) {
      settings.site.description.defaultValue =
        'Engineering dispatches on systems programming (Rust, Go, C++), AI agents & MCP, Linux internals, cloud infrastructure, and embedded hardware builds.'
    }
    if (settings.site.accent_color) {
      settings.site.accent_color.defaultValue = '#0d9488'
    }
    if (settings.site.navigation) {
      settings.site.navigation.defaultValue = JSON.stringify([
        { label: 'dispatches', url: '/' },
        { label: 'topics', url: '/#topics' },
        { label: 'about', url: '/about/' },
        { label: 'portfolio', url: 'https://cases.vitorx86.dev' },
        { label: 'vitorx86.dev', url: 'https://vitorx86.dev' }
      ])
    }
    if (settings.site.secondary_navigation) {
      settings.site.secondary_navigation.defaultValue = JSON.stringify([
        { label: 'vitorx86.dev', url: 'https://vitorx86.dev' },
        { label: 'portfolio', url: 'https://cases.vitorx86.dev' },
        { label: 'github', url: 'https://github.com/vitorecomp' },
        { label: 'linkedin', url: 'https://www.linkedin.com/in/vieiravitor' },
        { label: 'rss', url: '/rss/' }
      ])
    }
  }

  fs.writeFileSync(defaultSettingsPath, JSON.stringify(settings, null, 4) + '\n')
  console.log('[configure-ghost-defaults] Patched default-settings.json -> vitorx86-garage')
}

function patchFixtures() {
  if (!fs.existsSync(fixturesPath)) {
    throw new Error(`fixtures.json not found at ${fixturesPath}`)
  }

  const fixtures = JSON.parse(fs.readFileSync(fixturesPath, 'utf8'))

  // 1. Replace default "News" tag with vitorx86.dev technology channels
  const tagModel = fixtures.models.find((m) => m.name === 'Tag')
  if (tagModel) {
    tagModel.entries = [
      {
        name: 'Systems, Search & CLI',
        slug: 'systems-and-cli',
        description:
          'Low-level systems programming, vector indexes (turbovec), full-text search engines (ruscene), and high-performance Linux CLI tools (go-ls) in Rust, Go, and C++.',
        parent_id: null,
        meta_title: 'Systems, Search & CLI — vitorx86.dev // blog',
        meta_description:
          'Systems programming, Rust, Go, C++, search engines, and Linux CLI engineering dispatches by Vitor.'
      },
      {
        name: 'AI, Agents & MCP',
        slug: 'ai-and-agents',
        description:
          'Agentic architectures, Model Context Protocol (MCP) servers, local LLM companions (Alissa), OCR pipelines, and evolutionary training experiments.',
        parent_id: null,
        meta_title: 'AI, Agents & MCP — vitorx86.dev // blog',
        meta_description:
          'AI engineering, autonomous agents, Model Context Protocol (MCP), and local LLM dispatches by Vitor.'
      },
      {
        name: 'Hardware, Embedded & Garage',
        slug: 'hardware-and-garage',
        description:
          'Custom ESP32 smartwatch OS builds, embedded C/C++ firmware, CAN-Bus telemetry sensors, robotics, and backyard race car electronics.',
        parent_id: null,
        meta_title: 'Hardware, Embedded & Garage — vitorx86.dev // blog',
        meta_description:
          'Embedded hardware, ESP32 firmware, robotics, and automotive garage telemetry builds by Vitor.'
      },
      {
        name: 'Cloud, Linux & DevTools',
        slug: 'cloud-and-devops',
        description:
          'Terraform infrastructure, Google Cloud architectures, Sway/Wayland Linux setups, Neovim from scratch, and developer productivity automation.',
        parent_id: null,
        meta_title: 'Cloud, Linux & DevTools — vitorx86.dev // blog',
        meta_description:
          'Cloud infrastructure, Terraform, Linux systems, and developer tooling dispatches by Vitor.'
      }
    ]
  }

  // 2. Remove the default "Coming soon" post so the blog starts with ZERO articles
  const postModel = fixtures.models.find((m) => m.name === 'Post')
  if (postModel && Array.isArray(postModel.entries)) {
    const aboutMobiledoc = JSON.stringify({
      version: '0.3.1',
      atoms: [],
      cards: [],
      markups: [
        ['a', ['href', 'https://vitorx86.dev']],
        ['a', ['href', 'https://cases.vitorx86.dev']],
        ['a', ['href', 'https://github.com/vitorecomp']]
      ],
      sections: [
        [
          1,
          'p',
          [
            [
              0,
              [],
              0,
              'Welcome to the technology blog of Vitor Vieira ('
            ],
            [0, [0], 1, 'vitorx86.dev'],
            [
              0,
              [],
              0,
              '). This publication is where I document deep dives into systems programming (Rust, Go, C++), autonomous AI agents & Model Context Protocol (MCP) servers, Linux & Neovim internals, cloud infrastructure, and embedded hardware builds from the garage.'
            ]
          ]
        ],
        [
          1,
          'p',
          [
            [
              0,
              [],
              0,
              'While the first articles are being prepared, you can explore documentation for 80+ open-source repositories on '
            ],
            [0, [1], 1, 'cases.vitorx86.dev'],
            [0, [], 0, ' or browse the source code directly on '],
            [0, [2], 1, 'github.com/vitorecomp'],
            [0, [], 0, '.']
          ]
        ]
      ],
      ghostVersion: '4.0'
    })

    postModel.entries = postModel.entries
      .filter((entry) => entry.type !== 'post' && entry.slug !== 'coming-soon')
      .map((entry) => {
        if (entry.slug === 'about') {
          return {
            ...entry,
            title: 'About vitorx86.dev // blog',
            mobiledoc: aboutMobiledoc
          }
        }
        return entry
      })
  }

  // 3. Clean up Post -> Tag fixture relations that referenced "coming-soon"
  if (Array.isArray(fixtures.relations)) {
    fixtures.relations = fixtures.relations.filter(
      (rel) => !(rel.from && rel.from.model === 'Post' && rel.to && rel.to.model === 'Tag')
    )
  }

  fs.writeFileSync(fixturesPath, JSON.stringify(fixtures, null, 4) + '\n')
  console.log('[configure-ghost-defaults] Patched fixtures.json -> 0 articles, 4 tech topic tags')
}

patchConfigProduction()
patchDefaultSettings()
patchFixtures()
