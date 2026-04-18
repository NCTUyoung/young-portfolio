#!/usr/bin/env node
/**
 * Generate thumbnails under public/images/_thumbs/{400w,800w}/ mirroring paths below public/images.
 *
 * 雙格式：WebP + AVIF（2026 AVIF 全家瀏覽器覆蓋 ≥95%；Safari 16+、Firefox 93+、Chromium 85+）。
 * - WebP 82：與舊版一致，當最終 fallback。
 * - AVIF 50：同畫質下再小 20–30%，是 `<picture>` 第一順位。
 *
 * Skips public/images/_thumbs. Run after adding photos: npm run thumbs
 *
 * CLI:
 *   npm run thumbs                 全量掃描（跳過已存在的 thumb，除非 --force）
 *   npm run thumbs -- --force      強制覆寫（升級 encoder 設定時用）
 *   npm run thumbs -- --no-avif    只產 WebP（CI debug 或機器沒裝 libavif 時用）
 */
import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..', 'public', 'images')
const WIDTHS = [400, 800]
const IMAGE_EXT = /\.(jpe?g|png|gif|webp)$/i

const args = new Set(process.argv.slice(2))
const FORCE = args.has('--force')
const SKIP_AVIF = args.has('--no-avif')

/** 需要產出的 format x width 組合；SKIP_AVIF=true 時只留 WebP。 */
const OUTPUTS = SKIP_AVIF
  ? [{ format: 'webp', quality: 82 }]
  : [
      { format: 'webp', quality: 82 },
      { format: 'avif', quality: 50 } // AVIF 50 ≈ WebP 80；實測檔案比 WebP 小 ~25%
    ]

/**
 * @param {string} dir
 * @param {string} baseRel posix-style relative path from ROOT or ''
 * @returns {Promise<{ full: string, rel: string }[]>}
 */
async function walkImages (dir, baseRel = '') {
  const out = []
  let entries
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const e of entries) {
    if (e.name === '_thumbs') continue
    const full = path.join(dir, e.name)
    const rel = baseRel ? `${baseRel}/${e.name}` : e.name
    if (e.isDirectory()) {
      out.push(...await walkImages(full, rel))
    } else if (e.isFile() && IMAGE_EXT.test(e.name)) {
      out.push({ full, rel })
    }
  }
  return out
}

async function fileExists (p) {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

async function encodeOne (sourceFull, outFile, width, format, quality) {
  await fs.mkdir(path.dirname(outFile), { recursive: true })
  const pipeline = sharp(sourceFull).resize(width, width, {
    fit: 'inside',
    withoutEnlargement: true
  })
  if (format === 'webp') {
    await pipeline.webp({ quality }).toFile(outFile)
  } else if (format === 'avif') {
    // effort=4 是速度／品質折衷；effort=6 再小 ~5% 但慢 2 倍
    await pipeline.avif({ quality, effort: 4 }).toFile(outFile)
  }
}

async function main () {
  const files = await walkImages(ROOT)
  console.log(`Found ${files.length} images under public/images`)
  console.log(`Outputs: ${OUTPUTS.map(o => o.format).join(' + ')} × ${WIDTHS.join('/')} = ${OUTPUTS.length * WIDTHS.length} thumbs/source`)

  let n = 0
  let written = 0
  let skipped = 0
  for (const { full, rel } of files) {
    const relNoExt = rel.replace(/\.[^.]+$/i, '')
    for (const w of WIDTHS) {
      for (const { format, quality } of OUTPUTS) {
        const outFile = path.join(ROOT, '_thumbs', `${w}w`, `${relNoExt}.${format}`)
        if (!FORCE && await fileExists(outFile)) {
          skipped++
          continue
        }
        await encodeOne(full, outFile, w, format, quality)
        written++
      }
    }
    n++
    if (n % 25 === 0) {
      console.log(`  … ${n}/${files.length} (written=${written}, skipped=${skipped})`)
    }
  }
  console.log(`Done: ${n} source files → wrote ${written}, skipped ${skipped} (use --force to overwrite)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
