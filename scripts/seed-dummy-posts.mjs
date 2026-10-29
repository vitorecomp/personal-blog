#!/usr/bin/env node
/**
 * Seeds (or removes with `--clean`) dummy technical blog posts into the Ghost 5
 * database for local UI testing of the dev.to feed, tags, search, reading list,
 * and article Table of Contents.
 *
 * Usage:
 *   node scripts/seed-dummy-posts.mjs           # Seed 6 dummy posts (auto-detects local container if run on host)
 *   node scripts/seed-dummy-posts.mjs --clean   # Remove all dummy posts
 */

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const GHOST_CURRENT = process.env.GHOST_CURRENT || '/var/lib/ghost/current'
const isCleanMode = process.argv.includes('--clean') || process.argv.includes('--clear')

const DUMMY_POSTS = [
  {
    title: 'Building a SIMD-Accelerated Vector Index in Rust (turbovec)',
    slug: 'dummy-simd-vector-index-rust-turbovec',
    featured: true,
    tags: ['systems-and-cli', 'ai-and-agents'],
    publishedOffsetHours: 2,
    custom_excerpt:
      'How we designed cache-aligned HNSW graph storage and quantized L2/cosine distance kernels in Rust to hit sub-millisecond recall.',
    sections: [
      {
        heading: 'Memory Layout & Cache-Line Alignment',
        body: 'High-dimensional vector search is almost always memory-bandwidth bound rather than compute bound. When traversing an HNSW graph, each hop dereferences a neighbor list and fetches multiple embedding vectors from RAM. By packing 64-byte aligned blocks and prefetching neighbor vectors ahead of the distance kernel, we cut L3 cache misses by 42%.',
        code: `#[repr(C, align(64))]
pub struct AlignedVectorBlock<const D: usize> {
    pub id: u64,
    pub norm: f32,
    pub lanes: [f32; D],
}`
      },
      {
        heading: 'Int8 Scalar Quantization with SIMD',
        body: 'Full FP32 embeddings consume 6 KB per 1536-dimensional vector. Compressing vectors to asymmetric Int8 during graph traversal reduces memory traffic by 4x while preserving >99.1% recall@10 after a final FP32 re-ranking pass over the top-k candidates.',
        code: `pub fn dot_i8_avx2(a: &[i8], b: &[i8]) -> i32 {
    a.iter().zip(b.iter()).map(|(&x, &y)| (x as i32) * (y as i32)).sum()
}`
      },
      {
        heading: 'Benchmark Takeaways',
        body: 'On a 1M vector dataset (768d), p99 query latency dropped from 4.8 ms to 0.74 ms on a single thread while keeping memory footprint under 1.1 GB.'
      }
    ]
  },
  {
    title: 'Designing Deterministic MCP Tool Servers for Local Coding Agents',
    slug: 'dummy-deterministic-mcp-tool-servers',
    featured: true,
    tags: ['ai-and-agents', 'systems-and-cli'],
    publishedOffsetHours: 18,
    custom_excerpt:
      'Lessons from building Model Context Protocol (MCP) servers with strict schema validation, bounded output pagination, and zero-leak sandboxing.',
    sections: [
      {
        heading: 'Why Agent Tool Calls Fail in Production',
        body: 'Most agent loops break not because the model misunderstood the prompt, but because a tool returned 200 KB of unpaginated JSON or an ambiguous error string. Designing MCP tools around bounded token budgets and structured recovery hints dramatically improves multi-step reliability.',
        code: `{
  "tool": "search_index",
  "max_results": 25,
  "cursor": "eyJvZmZzZXQiOjI1fQ==",
  "truncated": false
}`
      },
      {
        heading: 'Idempotency & Dry-Run Contracts',
        body: 'Every mutating MCP tool should accept a dryRun flag and return a deterministic diff preview before committing state changes. This lets orchestrators verify invariants without side effects.'
      }
    ]
  },
  {
    title: 'Reverse-Engineering CAN-Bus Telemetry with an ESP32-S3 in the Garage',
    slug: 'dummy-esp32-s3-can-bus-telemetry-garage',
    featured: false,
    tags: ['hardware-and-garage', 'systems-and-cli'],
    publishedOffsetHours: 42,
    custom_excerpt:
      'Wiring an SN65HVD230 transceiver to an ESP32-S3 TWAI controller to capture 500 kbps ECU frames, decode RPM/coolant PIDs, and stream live telemetry over WebSockets.',
    sections: [
      {
        heading: 'Hardware Wiring & Termination',
        body: 'The ESP32-S3 includes a built-in Two-Wire Automotive Interface (TWAI) peripheral compatible with ISO 11898-1 CAN 2.0 frames. Paired with a 3.3V SN65HVD230 transceiver and a split 120-ohm termination resistor, it locks onto a 500 kbps OBD-II / ECU bus with zero dropped frames.',
        code: `twai_general_config_t g_config = TWAI_GENERAL_CONFIG_DEFAULT(GPIO_NUM_4, GPIO_NUM_5, TWAI_MODE_LISTEN_ONLY);
twai_timing_config_t t_config = TWAI_TIMING_CONFIG_500KBITS();
twai_filter_config_t f_config = TWAI_FILTER_CONFIG_ACCEPT_ALL();`
      },
      {
        heading: 'Ring-Buffered Frame Decoding',
        body: 'Using a lock-free FreeRTOS ring buffer between the TWAI ISR task and the Wi-Fi telemetry streamer prevents frame jitter even during bursts of 1,200 frames per second.'
      }
    ]
  },
  {
    title: 'Writing a Fast Linux Directory Listing CLI in Go (go-ls)',
    slug: 'dummy-fast-linux-directory-cli-go-ls',
    featured: false,
    tags: ['systems-and-cli', 'cloud-and-devops'],
    publishedOffsetHours: 76,
    custom_excerpt:
      'Replacing stat() storms with getdents64 batching, worker pools, and Git status tree caching for instant terminal directory listings.',
    sections: [
      {
        heading: 'Avoiding Per-File Syscall Overhead',
        body: 'On large monorepos with 50,000+ entries, calling lstat() sequentially dominates wall-clock time. By reading directory descriptors in 32 KB buffers via getdents64 and only querying extended attributes when requested, cold directory scans run 3.4x faster.',
        code: `buf := make([]byte, 32*1024)
n, err := unix.Getdents(fd, buf)`
      },
      {
        heading: 'Git Status Decoration Without Shelling Out',
        body: 'Parsing the .git/index binary header directly in Go avoids spawning git status subprocesses on every prompt redraw.'
      }
    ]
  },
  {
    title: 'Zero-Downtime Ghost 5 on Cloud Run with Cloud SQL & Terraform',
    slug: 'dummy-ghost-5-cloud-run-terraform',
    featured: false,
    tags: ['cloud-and-devops'],
    publishedOffsetHours: 120,
    custom_excerpt:
      'How blog.vitorx86.dev runs on Google Cloud Run behind a shared Global HTTPS Load Balancer with Cloud SQL MySQL 8.0 and GCS FUSE media sync.',
    sections: [
      {
        heading: 'Shared Global Load Balancer Routing',
        body: 'Instead of provisioning separate load balancers per subdomain, a single Global External Application Load Balancer routes vitorx86.dev, cases.vitorx86.dev, and blog.vitorx86.dev to serverless NEGs with managed TLS certificates.',
        code: `host_rule {
  hosts        = ["blog.vitorx86.dev"]
  path_matcher = "blog-matcher"
}`
      },
      {
        heading: 'Idempotent Database Reconciliation on Boot',
        body: 'A lightweight pre-boot Node script reconciles theme activation and topic tags against Cloud SQL before handing off to the Ghost entrypoint.'
      }
    ]
  },
  {
    title: 'Custom Smartwatch Firmware on ESP32: Low-Power Display & BLE Sync',
    slug: 'dummy-custom-smartwatch-firmware-esp32',
    featured: false,
    tags: ['hardware-and-garage'],
    publishedOffsetHours: 168,
    custom_excerpt:
      'Squeezing 5 days of battery life out of a 240x240 SPI IPS display and ESP32 using deep-sleep wake stubs, DMA double buffering, and BLE GATT time sync.',
    sections: [
      {
        heading: 'SPI DMA Double Buffering at 40 MHz',
        body: 'Driving a 240x240 RGB565 panel at 60 FPS requires pushing 115.2 KB per frame. Using two 32-line DMA bounce buffers in internal SRAM lets the CPU rasterize the next strip while the SPI controller clocks out the previous one.',
        code: `spi_transaction_t trans = {
    .length = STRIP_WIDTH * STRIP_LINES * 16,
    .tx_buffer = dma_buf[active_buf],
};
spi_device_queue_trans(spi_handle, &trans, portMAX_DELAY);`
      },
      {
        heading: 'Deep-Sleep Wake Stubs & IMU Wrist Tilt',
        body: 'Configuring the BMA423 accelerometer interrupt pin as an EXT0 wake source keeps quiescent current under 180 uA while waking the watch face in 65 ms.'
      }
    ]
  }
]

function buildPostContent(post) {
  const htmlParts = []
  const textParts = []

  for (const s of post.sections) {
    htmlParts.push(`<h2>${s.heading}</h2>`)
    htmlParts.push(`<p>${s.body}</p>`)
    textParts.push(s.heading)
    textParts.push(s.body)
    if (s.code) {
      const escaped = s.code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      htmlParts.push(`<pre><code>${escaped}</code></pre>`)
      textParts.push(s.code)
    }
  }

  // Repeat prose padding so Ghost reading_time calculates 3-5 min read
  const filler =
    'In systems engineering, measuring real hardware counters—cache misses, branch mispredictions, syscall latency, and tail p999 distributions—always beats intuition. Every benchmark in this dispatch is reproducible from the open-source repository on cases.vitorx86.dev.'
  htmlParts.push(`<h3>Reproducibility &amp; Telemetry Notes</h3>`)
  htmlParts.push(`<p>${filler}</p><p>${filler}</p>`)
  textParts.push('Reproducibility & Telemetry Notes', filler, filler, filler, filler)

  const html = htmlParts.join('\n')
  const plaintext = textParts.join('\n\n')
  const mobiledoc = JSON.stringify({
    version: '0.3.1',
    atoms: [],
    cards: [['html', { html }]],
    markups: [],
    sections: [[10, 0]],
    ghostVersion: '4.0'
  })

  return { html, plaintext, mobiledoc }
}

function delegateToContainerIfOnHost() {
  if (fs.existsSync(path.join(GHOST_CURRENT, 'index.js'))) {
    return false
  }

  const runtimes = ['podman', 'docker']
  const candidateContainers = ['personal-blog-ghost', 'personal-blog-dev']

  for (const rt of runtimes) {
    try {
      const out = execFileSync(rt, ['ps', '--format', '{{.Names}}'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore']
      })
      const running = out.split(/\r?\n/).map((s) => s.trim())
      const container = candidateContainers.find((c) => running.includes(c))
      if (container) {
        console.log(
          `[seed-dummy-posts] Detected running container '${container}' (${rt}). Syncing and executing inside container...`
        )
        const dest = '/tmp/seed-dummy-posts.mjs'
        execFileSync(rt, ['cp', __filename, `${container}:${dest}`], {
          stdio: 'inherit'
        })
        const args = ['exec', container, 'node', dest]
        if (isCleanMode) args.push('--clean')
        execFileSync(rt, args, { stdio: 'inherit' })
        console.log(
          `[seed-dummy-posts] Restarting '${container}' to refresh Ghost's in-memory post cache...`
        )
        execFileSync(rt, ['restart', container], { stdio: 'inherit' })
        return true
      }
    } catch {
      // try next runtime
    }
  }

  console.error(
    '[seed-dummy-posts] Could not find a local Ghost installation (/var/lib/ghost/current) or a running personal-blog container.'
  )
  process.exit(1)
}

async function runInsideGhost() {
  const requireFromGhost = createRequire(path.join(GHOST_CURRENT, 'index.js'))
  const createKnex = requireFromGhost('knex')
  const ObjectID = requireFromGhost('bson-objectid')

  const dbClient = (process.env.database__client || 'sqlite3').toLowerCase()
  const knex =
    dbClient === 'mysql' || dbClient === 'mysql2'
      ? createKnex({
          client: 'mysql2',
          connection: {
            host: process.env.database__connection__host || '127.0.0.1',
            port: Number(process.env.database__connection__port || 3306),
            user: process.env.database__connection__user || 'ghost',
            password: process.env.database__connection__password || '',
            database: process.env.database__connection__database || 'ghost',
            socketPath: process.env.database__connection__socketPath
          }
        })
      : createKnex({
          client: 'sqlite3',
          connection: {
            filename:
              process.env.database__connection__filename ||
              '/var/lib/ghost/content/data/ghost.db'
          },
          useNullAsDefault: true
        })

  try {
    const slugs = DUMMY_POSTS.map((p) => p.slug)
    const existingDummy = await knex('posts').whereIn('slug', slugs).select('id', 'slug')

    if (existingDummy.length > 0) {
      const ids = existingDummy.map((p) => p.id)
      for (const table of ['posts_authors', 'posts_tags', 'posts_meta', 'mobiledoc_revisions', 'post_revisions']) {
        if (await knex.schema.hasTable(table)) {
          await knex(table).whereIn('post_id', ids).del()
        }
      }
      await knex('posts').whereIn('id', ids).del()
      if (isCleanMode) {
        console.log(
          `[seed-dummy-posts] Removed ${existingDummy.length} dummy post(s) from database.`
        )
        return
      }
    } else if (isCleanMode) {
      console.log('[seed-dummy-posts] No dummy posts found to clean.')
      return
    }

    const author = (await knex('users').orderBy('created_at', 'asc').first()) || {
      id: '1'
    }
    const allTags = await knex('tags').select('id', 'slug')
    const tagBySlug = new Map(allTags.map((t) => [t.slug, t.id]))

    let inserted = 0
    for (const post of DUMMY_POSTS) {
      const postId = ObjectID().toHexString()
      const pubDate = new Date(Date.now() - post.publishedOffsetHours * 3600 * 1000)
      const { html, plaintext, mobiledoc } = buildPostContent(post)

      await knex('posts').insert({
        id: postId,
        uuid: crypto.randomUUID(),
        title: post.title,
        slug: post.slug,
        mobiledoc,
        lexical: null,
        html,
        comment_id: postId,
        plaintext,
        feature_image: null,
        featured: post.featured ? 1 : 0,
        type: 'post',
        status: 'published',
        locale: null,
        visibility: 'public',
        email_recipient_filter: 'none',
        created_at: pubDate,
        created_by: author.id,
        updated_at: pubDate,
        updated_by: author.id,
        published_at: pubDate,
        published_by: author.id,
        custom_excerpt: post.custom_excerpt,
        show_title_and_feature_image: 1
      })

      await knex('posts_authors').insert({
        id: ObjectID().toHexString(),
        post_id: postId,
        author_id: author.id,
        sort_order: 0
      })

      for (let i = 0; i < post.tags.length; i++) {
        const tagId = tagBySlug.get(post.tags[i])
        if (tagId) {
          await knex('posts_tags').insert({
            id: ObjectID().toHexString(),
            post_id: postId,
            tag_id: tagId,
            sort_order: i
          })
        }
      }

      inserted++
    }

    console.log(
      `[seed-dummy-posts] Seeded ${inserted} dummy technical dispatches into Ghost database.`
    )
  } finally {
    await knex.destroy()
  }
}

if (!delegateToContainerIfOnHost()) {
  runInsideGhost()
}
