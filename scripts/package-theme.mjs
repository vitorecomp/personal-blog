#!/usr/bin/env node
/**
 * Zero-dependency ZIP packager for the `vitorx86-garage` Ghost 5 theme.
 * Outputs `dist/vitorx86-garage.zip` ready for direct upload into Ghost Admin.
 */

import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..')
const THEME_DIR = path.join(ROOT_DIR, 'themes', 'vitorx86-garage')
const DIST_DIR = path.join(ROOT_DIR, 'dist')
const OUT_ZIP = path.join(DIST_DIR, 'vitorx86-garage.zip')

function collectFiles(dir, baseDir = dir) {
  const results = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath, baseDir))
    } else if (entry.isFile()) {
      const relPath = path.relative(baseDir, fullPath).split(path.sep).join('/')
      results.push({ fullPath, relPath })
    }
  }
  return results
}

function crc32(buf) {
  if (typeof zlib.crc32 === 'function') {
    return zlib.crc32(buf) >>> 0
  }
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i]
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function buildZip(files) {
  const localParts = []
  const centralParts = []
  let offset = 0

  for (const file of files) {
    const raw = fs.readFileSync(file.fullPath)
    const compressed = zlib.deflateRawSync(raw)
    const nameBuf = Buffer.from(file.relPath, 'utf8')
    const crc = crc32(raw)

    // Local file header (30 bytes + filename)
    const localHeader = Buffer.alloc(30)
    localHeader.writeUInt32LE(0x04034b50, 0) // signature
    localHeader.writeUInt16LE(20, 4) // version needed
    localHeader.writeUInt16LE(0, 6) // flags
    localHeader.writeUInt16LE(8, 8) // compression = deflate
    localHeader.writeUInt16LE(0, 10) // mod time
    localHeader.writeUInt16LE(0x21, 12) // mod date
    localHeader.writeUInt32LE(crc, 14) // crc32
    localHeader.writeUInt32LE(compressed.length, 18) // compressed size
    localHeader.writeUInt32LE(raw.length, 22) // uncompressed size
    localHeader.writeUInt16LE(nameBuf.length, 26) // file name length
    localHeader.writeUInt16LE(0, 28) // extra field length

    localParts.push(localHeader, nameBuf, compressed)

    // Central directory header (46 bytes + filename)
    const centralHeader = Buffer.alloc(46)
    centralHeader.writeUInt32LE(0x02014b50, 0) // signature
    centralHeader.writeUInt16LE(20, 4) // version made by
    centralHeader.writeUInt16LE(20, 6) // version needed
    centralHeader.writeUInt16LE(0, 8) // flags
    centralHeader.writeUInt16LE(8, 10) // compression = deflate
    centralHeader.writeUInt16LE(0, 12) // mod time
    centralHeader.writeUInt16LE(0x21, 14) // mod date
    centralHeader.writeUInt32LE(crc, 16) // crc32
    centralHeader.writeUInt32LE(compressed.length, 20) // compressed size
    centralHeader.writeUInt32LE(raw.length, 24) // uncompressed size
    centralHeader.writeUInt16LE(nameBuf.length, 28) // file name length
    centralHeader.writeUInt16LE(0, 30) // extra length
    centralHeader.writeUInt16LE(0, 32) // comment length
    centralHeader.writeUInt16LE(0, 34) // disk number
    centralHeader.writeUInt16LE(0, 36) // internal attrs
    centralHeader.writeUInt32LE(0, 38) // external attrs
    centralHeader.writeUInt32LE(offset, 42) // local header offset

    centralParts.push(centralHeader, nameBuf)
    offset += localHeader.length + nameBuf.length + compressed.length
  }

  const centralSize = centralParts.reduce((acc, b) => acc + b.length, 0)
  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0) // EOCD signature
  eocd.writeUInt16LE(0, 4) // disk number
  eocd.writeUInt16LE(0, 6) // central dir disk
  eocd.writeUInt16LE(files.length, 8) // entries on disk
  eocd.writeUInt16LE(files.length, 10) // total entries
  eocd.writeUInt32LE(centralSize, 12) // central dir size
  eocd.writeUInt32LE(offset, 16) // central dir offset
  eocd.writeUInt16LE(0, 20) // comment length

  return Buffer.concat([...localParts, ...centralParts, eocd])
}

fs.mkdirSync(DIST_DIR, { recursive: true })
const files = collectFiles(THEME_DIR)
const zipBuf = buildZip(files)
fs.writeFileSync(OUT_ZIP, zipBuf)
console.log(
  `✓ Packaged Ghost 5 theme (${files.length} files, ${(zipBuf.length / 1024).toFixed(1)} KB) -> ${path.relative(ROOT_DIR, OUT_ZIP)}`
)
