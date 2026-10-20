#!/usr/bin/env node
/**
 * Validates the custom Ghost 5 theme (`themes/vitorx86-garage`) structure,
 * templates, required Ghost helpers, and Koenig card CSS selectors.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..')
const THEME_DIR = path.join(ROOT_DIR, 'themes', 'vitorx86-garage')

const REQUIRED_FILES = [
  'package.json',
  'default.hbs',
  'index.hbs',
  'post.hbs',
  'page.hbs',
  'page-about.hbs',
  'tag.hbs',
  'author.hbs',
  'error.hbs',
  'error-404.hbs',
  'partials/header.hbs',
  'partials/footer.hbs',
  'partials/navigation.hbs',
  'partials/post-card.hbs',
  'partials/empty-posts.hbs',
  'partials/topic-channels.hbs',
  'partials/pagination.hbs',
  'assets/css/screen.css',
  'assets/js/main.js'
]

const REQUIRED_CSS_SELECTORS = [
  '--gh-font-heading',
  '--gh-font-body',
  '.kg-width-wide',
  '.kg-width-full',
  '.kg-card',
  '.kg-image',
  '.kg-gallery-container',
  '.kg-gallery-row',
  '.kg-gallery-image',
  '.kg-bookmark-card',
  '.kg-bookmark-container',
  '.kg-bookmark-content',
  '.kg-bookmark-title',
  '.kg-bookmark-description',
  '.kg-bookmark-metadata',
  '.kg-bookmark-icon',
  '.kg-bookmark-author',
  '.kg-bookmark-publisher',
  '.kg-bookmark-thumbnail'
]

let errors = 0

for (const rel of REQUIRED_FILES) {
  const fullPath = path.join(THEME_DIR, rel)
  if (!fs.existsSync(fullPath)) {
    console.error(`[ERROR] Missing required theme file: ${rel}`)
    errors++
  }
}

const pkg = JSON.parse(
  fs.readFileSync(path.join(THEME_DIR, 'package.json'), 'utf8')
)
if (pkg.name !== 'vitorx86-garage') {
  console.error(`[ERROR] Expected theme name 'vitorx86-garage', got '${pkg.name}'`)
  errors++
}
if (!pkg.engines || !pkg.engines.ghost) {
  console.error('[ERROR] Missing engines.ghost in themes/vitorx86-garage/package.json')
  errors++
}

const defaultHbs = fs.readFileSync(path.join(THEME_DIR, 'default.hbs'), 'utf8')
for (const helper of ['{{ghost_head}}', '{{ghost_foot}}', '{{{body}}}']) {
  if (!defaultHbs.includes(helper)) {
    console.error(`[ERROR] default.hbs is missing required helper: ${helper}`)
    errors++
  }
}

const css = fs.readFileSync(
  path.join(THEME_DIR, 'assets/css/screen.css'),
  'utf8'
)
for (const selector of REQUIRED_CSS_SELECTORS) {
  if (!css.includes(selector)) {
    console.error(`[ERROR] assets/css/screen.css is missing required Ghost selector: ${selector}`)
    errors++
  }
}

if (errors > 0) {
  console.error(`\nTheme validation failed with ${errors} error(s).`)
  process.exit(1)
}

console.log(
  `✓ Ghost 5 theme 'vitorx86-garage' validated (${REQUIRED_FILES.length} files, ${REQUIRED_CSS_SELECTORS.length} Ghost/Koenig CSS tokens verified).`
)
