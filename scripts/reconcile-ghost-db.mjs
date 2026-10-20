#!/usr/bin/env node
/**
 * Reconciles an already-initialized Ghost 5 database (SQLite or Cloud SQL MySQL)
 * that may have been bootstrapped by a stock `ghost:5-alpine` image during
 * initial Terraform provisioning.
 *
 * Idempotent guarantees:
 * 1. Switches `active_theme` from stock `'source'` / `'casper'` to `'vitorx86-garage'`.
 * 2. Replaces factory boilerplate site settings (`title`, `description`,
 *    `accent_color`, `navigation`, `secondary_navigation`) with `vitorx86.dev` values.
 * 3. Removes Ghost's default `"Coming soon"` starter post (`slug = 'coming-soon'`)
 *    and its relational join records so the blog has 0 fabricated articles.
 * 4. Updates the default `"About this site"` page to `"About vitorx86.dev // blog"`.
 * 5. Replaces the default `"News"` tag with the 4 technology topic channels.
 */

import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const GHOST_CURRENT = process.env.GHOST_CURRENT || '/var/lib/ghost/current'
const requireFromGhost = createRequire(path.join(GHOST_CURRENT, 'index.js'))

const TECH_TAGS = [
  {
    name: 'Systems, Search & CLI',
    slug: 'systems-and-cli',
    description:
      'Low-level systems programming, vector indexes (turbovec), full-text search engines (ruscene), and high-performance Linux CLI tools (go-ls) in Rust, Go, and C++.',
    meta_title: 'Systems, Search & CLI — vitorx86.dev // blog',
    meta_description:
      'Systems programming, Rust, Go, C++, search engines, and Linux CLI engineering dispatches by Vitor.'
  },
  {
    name: 'AI, Agents & MCP',
    slug: 'ai-and-agents',
    description:
      'Agentic architectures, Model Context Protocol (MCP) servers, local LLM companions (Alissa), OCR pipelines, and evolutionary training experiments.',
    meta_title: 'AI, Agents & MCP — vitorx86.dev // blog',
    meta_description:
      'AI engineering, autonomous agents, Model Context Protocol (MCP), and local LLM dispatches by Vitor.'
  },
  {
    name: 'Hardware, Embedded & Garage',
    slug: 'hardware-and-garage',
    description:
      'Custom ESP32 smartwatch OS builds, embedded C/C++ firmware, CAN-Bus telemetry sensors, robotics, and backyard race car electronics.',
    meta_title: 'Hardware, Embedded & Garage — vitorx86.dev // blog',
    meta_description:
      'Embedded hardware, ESP32 firmware, robotics, and automotive garage telemetry builds by Vitor.'
  },
  {
    name: 'Cloud, Linux & DevTools',
    slug: 'cloud-and-devops',
    description:
      'Terraform infrastructure, Google Cloud architectures, Sway/Wayland Linux setups, Neovim from scratch, and developer productivity automation.',
    meta_title: 'Cloud, Linux & DevTools — vitorx86.dev // blog',
    meta_description:
      'Cloud infrastructure, Terraform, Linux systems, and developer tooling dispatches by Vitor.'
  }
]

const ABOUT_MOBILEDOC = JSON.stringify({
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
        [0, [], 0, 'Welcome to the technology blog of Vitor Vieira ('],
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

const ABOUT_HTML =
  '<p>Welcome to the technology blog of Vitor Vieira (<a href="https://vitorx86.dev">vitorx86.dev</a>). This publication is where I document deep dives into systems programming (Rust, Go, C++), autonomous AI agents &amp; Model Context Protocol (MCP) servers, Linux &amp; Neovim internals, cloud infrastructure, and embedded hardware builds from the garage.</p><p>While the first articles are being prepared, you can explore documentation for 80+ open-source repositories on <a href="https://cases.vitorx86.dev">cases.vitorx86.dev</a> or browse the source code directly on <a href="https://github.com/vitorecomp">github.com/vitorecomp</a>.</p>'

const ABOUT_PLAINTEXT =
  'Welcome to the technology blog of Vitor Vieira (vitorx86.dev). This publication is where I document deep dives into systems programming (Rust, Go, C++), autonomous AI agents & Model Context Protocol (MCP) servers, Linux & Neovim internals, cloud infrastructure, and embedded hardware builds from the garage.\n\nWhile the first articles are being prepared, you can explore documentation for 80+ open-source repositories on cases.vitorx86.dev or browse the source code directly on github.com/vitorecomp.'

function createKnexInstance() {
  const createKnex = requireFromGhost('knex')
  const dbClient = (process.env.database__client || 'sqlite3').toLowerCase()

  if (dbClient === 'mysql' || dbClient === 'mysql2') {
    const connection = {
      user: process.env.database__connection__user || 'ghost',
      password: process.env.database__connection__password || '',
      database: process.env.database__connection__database || 'ghost'
    }
    if (process.env.database__connection__socketPath) {
      connection.socketPath = process.env.database__connection__socketPath
    } else {
      connection.host = process.env.database__connection__host || '127.0.0.1'
      connection.port = Number(process.env.database__connection__port || 3306)
    }
    return createKnex({
      client: 'mysql2',
      connection
    })
  }

  const filename =
    process.env.database__connection__filename ||
    '/var/lib/ghost/content/data/ghost.db'
  if (!fs.existsSync(filename)) {
    return null
  }

  return createKnex({
    client: 'sqlite3',
    connection: { filename },
    useNullAsDefault: true
  })
}

async function reconcile() {
  const knex = createKnexInstance()
  if (!knex) {
    return
  }

  try {
    const hasSettings = await knex.schema.hasTable('settings')
    if (!hasSettings) {
      return
    }

    const now = new Date()

    // 1. Reconcile settings table (`active_theme`, `title`, `description`, `accent_color`, `navigation`)
    try {
      const themeUpdated = await knex('settings')
        .where({ key: 'active_theme' })
        .whereIn('value', ['source', 'casper'])
        .update({ value: 'vitorx86-garage', updated_at: now })
      if (themeUpdated > 0) {
        console.log(
          '[reconcile-ghost-db] Activated theme vitorx86-garage in settings table'
        )
      }

      await knex('settings')
        .where({ key: 'title' })
        .whereIn('value', ['Ghost', 'vitorx86.dev'])
        .update({ value: 'vitorx86.dev // blog', updated_at: now })

      await knex('settings')
        .where({ key: 'description' })
        .whereIn('value', [
          'Thoughts, stories and ideas.',
          'Thoughts, stories and ideas'
        ])
        .update({
          value:
            'Engineering dispatches on systems programming (Rust, Go, C++), AI agents & MCP, Linux internals, cloud infrastructure, and embedded hardware builds.',
          updated_at: now
        })

      await knex('settings')
        .where({ key: 'accent_color', value: '#FF1A75' })
        .update({ value: '#0d9488', updated_at: now })

      await knex('settings')
        .where({
          key: 'navigation',
          value: '[{"label":"Home","url":"/"},{"label":"About","url":"/about/"}]'
        })
        .update({
          value: JSON.stringify([
            { label: 'dispatches', url: '/' },
            { label: 'topics', url: '/#topics' },
            { label: 'about', url: '/about/' },
            { label: 'portfolio', url: 'https://cases.vitorx86.dev' },
            { label: 'vitorx86.dev', url: 'https://vitorx86.dev' }
          ]),
          updated_at: now
        })

      await knex('settings')
        .where({
          key: 'secondary_navigation',
          value: '[{"label":"Sign up","url":"#/portal/"}]'
        })
        .update({
          value: JSON.stringify([
            { label: 'vitorx86.dev', url: 'https://vitorx86.dev' },
            { label: 'portfolio', url: 'https://cases.vitorx86.dev' },
            { label: 'github', url: 'https://github.com/vitorecomp' },
            {
              label: 'linkedin',
              url: 'https://www.linkedin.com/in/vieiravitor'
            },
            { label: 'rss', url: '/rss/' }
          ]),
          updated_at: now
        })
    } catch (err) {
      console.warn(`[reconcile-ghost-db] Settings reconciliation warning: ${err.message}`)
    }

    // 2. Remove Ghost's default "Coming soon" post if present & update /about/ page
    try {
      const hasPosts = await knex.schema.hasTable('posts')
      if (hasPosts) {
        const comingSoon = await knex('posts')
          .where({ slug: 'coming-soon', type: 'post' })
          .first()

        if (comingSoon) {
          const childTables = [
            'posts_meta',
            'posts_authors',
            'posts_tags',
            'posts_products',
            'comments',
            'redirects',
            'members_feedback',
            'collections_posts',
            'mobiledoc_revisions',
            'post_revisions'
          ]
          for (const table of childTables) {
            try {
              if (await knex.schema.hasTable(table)) {
                await knex(table).where({ post_id: comingSoon.id }).del()
              }
            } catch {
              // ignore optional child table errors
            }
          }
          await knex('posts').where({ id: comingSoon.id }).del()
          console.log(
            '[reconcile-ghost-db] Removed stock "Coming soon" post (0 articles)'
          )
        }

        const aboutUpdated = await knex('posts')
          .where({ slug: 'about', type: 'page', title: 'About this site' })
          .update({
            title: 'About vitorx86.dev // blog',
            mobiledoc: ABOUT_MOBILEDOC,
            lexical: null,
            html: ABOUT_HTML,
            plaintext: ABOUT_PLAINTEXT,
            updated_at: now
          })
        if (aboutUpdated > 0) {
          console.log('[reconcile-ghost-db] Updated stock /about/ page content')
        }
      }
    } catch (err) {
      console.warn(`[reconcile-ghost-db] Posts reconciliation warning: ${err.message}`)
    }

    // 3. Reconcile technology topic tags
    try {
      const hasTags = await knex.schema.hasTable('tags')
      if (hasTags) {
        const ObjectID = requireFromGhost('bson-objectid')
        const newsTag = await knex('tags').where({ slug: 'news' }).first()
        if (newsTag) {
          if (await knex.schema.hasTable('posts_tags')) {
            await knex('posts_tags').where({ tag_id: newsTag.id }).del()
          }
          await knex('tags').where({ id: newsTag.id }).del()
        }

        for (const tag of TECH_TAGS) {
          const existing = await knex('tags').where({ slug: tag.slug }).first()
          if (!existing) {
            await knex('tags').insert({
              id: ObjectID().toHexString(),
              name: tag.name,
              slug: tag.slug,
              description: tag.description,
              visibility: 'public',
              meta_title: tag.meta_title,
              meta_description: tag.meta_description,
              created_at: now,
              created_by: '1',
              updated_at: now,
              updated_by: '1'
            })
          }
        }
      }
    } catch (err) {
      console.warn(`[reconcile-ghost-db] Tags reconciliation warning: ${err.message}`)
    }
  } catch (err) {
    console.warn(`[reconcile-ghost-db] Warning: ${err.message}`)
  } finally {
    await knex.destroy()
  }
}

reconcile()
