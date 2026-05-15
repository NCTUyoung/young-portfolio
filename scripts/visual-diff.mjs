#!/usr/bin/env node
// Pixel diff for visual-baseline-gallery. Emits a red-overlay diff PNG + JSON summary.
//
// Usage:
//   node scripts/visual-diff.mjs <baseline.png> <current.png> <out-diff.png> [--threshold=12]
//
// Output (stdout):
//   { width, height, changedPixels, percent, threshold, regions: { tl, tc, tr, ml, mc, mr, bl, bc, br } }
//
// The diff PNG: unchanged pixels rendered as pale grey, changed pixels red-tinted.
// Region grid is a 3x3 split so you can quickly tell "all change in top-left rail" etc.

import sharp from 'sharp'
import { existsSync } from 'node:fs'
import { resolve, basename } from 'node:path'

const argv = process.argv.slice(2)
const positional = argv.filter(a => !a.startsWith('--'))
const flag = (name, fallback) => {
  const m = argv.find(a => a.startsWith(`--${name}=`))
  return m ? m.split('=')[1] : fallback
}

if (positional.length < 3) {
  console.error('Usage: visual-diff.mjs <baseline.png> <current.png> <out-diff.png> [--threshold=12]')
  process.exit(2)
}

const [baselinePath, currentPath, outPath] = positional.map(p => resolve(p))
const threshold = Number(flag('threshold', 12))

for (const p of [baselinePath, currentPath]) {
  if (!existsSync(p)) {
    console.error(`visual-diff: missing input ${p}`)
    process.exit(2)
  }
}

const [a, b] = await Promise.all([
  sharp(baselinePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
  sharp(currentPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
])

if (a.info.width !== b.info.width || a.info.height !== b.info.height) {
  console.error(`visual-diff: dimension mismatch — baseline ${a.info.width}x${a.info.height} vs current ${b.info.width}x${b.info.height}`)
  process.exit(3)
}

const { width, height } = a.info
const totalPixels = width * height
const out = Buffer.alloc(totalPixels * 4)
let changedPixels = 0

const REGIONS = ['tl', 'tc', 'tr', 'ml', 'mc', 'mr', 'bl', 'bc', 'br']
const regionCounts = Object.fromEntries(REGIONS.map(k => [k, 0]))
const colThird = width / 3
const rowThird = height / 3

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4
    const dr = Math.abs(a.data[i] - b.data[i])
    const dg = Math.abs(a.data[i + 1] - b.data[i + 1])
    const db = Math.abs(a.data[i + 2] - b.data[i + 2])
    const maxChan = Math.max(dr, dg, db)

    const r = b.data[i]
    const g = b.data[i + 1]
    const bl = b.data[i + 2]
    const luma = 0.299 * r + 0.587 * g + 0.114 * bl

    if (maxChan > threshold) {
      // Red-tint changed pixels; preserve some shape via luma
      out[i] = 255
      out[i + 1] = Math.round(luma * 0.25)
      out[i + 2] = Math.round(luma * 0.25)
      out[i + 3] = 255
      changedPixels++

      const col = Math.min(2, Math.floor(x / colThird))
      const row = Math.min(2, Math.floor(y / rowThird))
      regionCounts[REGIONS[row * 3 + col]]++
    } else {
      // Pale greyscale of current pixel — keeps original layout legible behind the diff
      const muted = Math.round(luma * 0.35 + 255 * 0.65)
      out[i] = muted
      out[i + 1] = muted
      out[i + 2] = muted
      out[i + 3] = 255
    }
  }
}

await sharp(out, { raw: { width, height, channels: 4 } }).png().toFile(outPath)

const percent = Math.round((changedPixels / totalPixels) * 100 * 1000) / 1000
const summary = {
  baseline: basename(baselinePath),
  current: basename(currentPath),
  out: basename(outPath),
  width,
  height,
  totalPixels,
  changedPixels,
  percent,
  threshold,
  regions: regionCounts
}

console.log(JSON.stringify(summary, null, 2))
