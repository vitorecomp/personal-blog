#!/usr/bin/env node
/**
 * Automatically seeds or activates the Ghost 5 Owner account when
 * GHOST_ADMIN_EMAIL and GHOST_ADMIN_PASSWORD are provided via environment
 * variables (injected from GitHub Secrets / Cloud Run).
 *
 * Modes:
 *   1. Pre-boot (`node seed-ghost-admin.mjs --pre-boot`):
 *      Patches `fixtures.json` so a brand-new database initializes with the
 *      Owner user already active (`status: "active"`).
 *   2. Post-boot (`node seed-ghost-admin.mjs --post-boot`):
 *      Waits for Ghost's local HTTP server to listen and, if `/ghost/api/admin/authentication/setup/`
 *      reports `status: false`, calls `POST /ghost/api/admin/authentication/setup/`
 *      to complete Owner setup on an already-initialized database.
 */

import fs from 'node:fs'
import path from 'node:path'

const email = (process.env.GHOST_ADMIN_EMAIL || '').trim()
const password = process.env.GHOST_ADMIN_PASSWORD || ''
const name = (process.env.GHOST_ADMIN_NAME || 'Vitor Vieira').trim()
const blogTitle = (process.env.GHOST_BLOG_TITLE || 'vitorx86.dev // blog').trim()

if (!email || !password) {
  process.exit(0)
}

const GHOST_CURRENT = process.env.GHOST_CURRENT || '/var/lib/ghost/current'
const fixturesPath = path.join(
  GHOST_CURRENT,
  'core/server/data/schema/fixtures/fixtures.json'
)

function patchFixturesPreBoot() {
  if (!fs.existsSync(fixturesPath)) {
    return
  }
  try {
    const fixtures = JSON.parse(fs.readFileSync(fixturesPath, 'utf8'))
    const userModel = fixtures.models?.find((m) => m.name === 'User')
    if (userModel && Array.isArray(userModel.entries) && userModel.entries.length > 0) {
      userModel.entries[0] = {
        ...userModel.entries[0],
        name,
        slug: 'vitor',
        email,
        password,
        status: 'active'
      }
      fs.writeFileSync(fixturesPath, JSON.stringify(fixtures, null, 4) + '\n')
      console.log(`[seed-ghost-admin] Configured Owner fixture for ${email}`)
    }
  } catch (err) {
    console.warn(`[seed-ghost-admin] Could not patch fixtures.json: ${err.message}`)
  }
}

async function ensureSetupPostBoot() {
  const port = process.env.server__port || process.env.PORT || '2368'
  const setupUrl = `http://127.0.0.1:${port}/ghost/api/admin/authentication/setup/`
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Forwarded-Proto': 'https',
    Origin: process.env.url || `http://localhost:${port}`
  }

  for (let attempt = 1; attempt <= 60; attempt++) {
    await new Promise((r) => setTimeout(r, 2000))
    try {
      const res = await fetch(setupUrl, { method: 'GET', headers })
      if (!res.ok) continue
      const data = await res.json()
      const isSetupComplete = Boolean(data?.setup?.[0]?.status)
      if (isSetupComplete) {
        console.log('[seed-ghost-admin] Ghost Owner account is active.')
        return
      }

      const postRes = await fetch(setupUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          setup: [
            {
              name,
              email,
              password,
              blogTitle
            }
          ]
        })
      })
      if (postRes.ok) {
        console.log(`[seed-ghost-admin] Completed Ghost Owner setup for ${email}`)
      } else {
        const errText = await postRes.text()
        console.warn(`[seed-ghost-admin] Setup POST returned ${postRes.status}: ${errText}`)
      }
      return
    } catch {
      // Ghost is still booting/migrating; retry
    }
  }
}

const mode = process.argv[2] || '--pre-boot'
if (mode === '--pre-boot') {
  patchFixturesPreBoot()
} else if (mode === '--post-boot') {
  ensureSetupPostBoot()
}
