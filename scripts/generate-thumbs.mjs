#!/usr/bin/env node
/**
 * Generate WebP thumbnails under public/images/_thumbs/{400w,800w}/ mirroring paths below public/images.
 * Skips public/images/_thumbs. Run after adding photos: npm run thumbs
 */
import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..', 'public', 'images')
const WIDTHS = [400, 800]
const IMAGE_EXT = /\.(jpe?g|png|gif|webp)$/i

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

async function main () {
  const files = await walkImages(ROOT)
  console.log(`Found ${files.length} images under public/images`)
  let n = 0
  for (const { full, rel } of files) {
    const relNoExt = rel.replace(/\.[^.]+$/i, '')
    for (const w of WIDTHS) {
      const outFile = path.join(ROOT, '_thumbs', `${w}w`, `${relNoExt}.webp`)
      await fs.mkdir(path.dirname(outFile), { recursive: true })
      await sharp(full)
        .resize(w, w, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(outFile)
    }
    n++
    if (n % 25 === 0) {
      console.log(`  … ${n}/${files.length}`)
    }
  }
  console.log(`Done: ${n} source files × ${WIDTHS.length} sizes → WebP in _thumbs/`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
