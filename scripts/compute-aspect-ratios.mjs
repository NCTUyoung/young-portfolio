#!/usr/bin/env node
/**
 * 離線量測每張原圖的縱橫比（width / height），寫回 public/*.json 的 `Img[]`。
 *
 * 為什麼：grid / 接觸印樣瀑布流原本靠 runtime `<img @load>` 量 naturalWidth/Height，
 * 首屏會 layout shift（CLS），且 SSG 版面不可決定（server 端無從得知比例）。把比例
 * 預算進資料後，元件直接讀 `image.aspectRatio` 開 aspect-ratio box，零 CLS、SSR 可重現。
 *
 * 與 generate-thumbs.mjs 對齊：縮圖以 sharp resize（不 .rotate()）產出，故顯示比例 =
 * 原圖「儲存像素」寬高，**不** 依 EXIF orientation 交換寬高（否則會與縮圖實際渲染不符）。
 *
 * 冪等：重跑覆寫同值；只新增 `aspectRatio` 欄位，保留既有鍵序與 2-space 縮排。
 *
 * 用法：
 *   npm run ratios                 量所有缺值（已有 aspectRatio 仍會以最新值覆寫）
 *   npm run ratios -- --check      只檢查、不寫檔（CI / 確認用），有缺漏則 exit 1
 */
import sharp from 'sharp'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..', 'public')
const IMAGES_ROOT = path.join(ROOT, 'images')
const FILES = ['photographyList.json', 'galleryList.json']

const args = new Set(process.argv.slice(2))
const CHECK_ONLY = args.has('--check')

/** 量單張原圖比例；找不到檔或無尺寸回 null（呼叫端跳過、保留缺值）。 */
async function ratioOf (filename) {
  const abs = path.join(IMAGES_ROOT, filename)
  try {
    const meta = await sharp(abs).metadata()
    if (!meta.width || !meta.height) return null
    // 不做 orientation 交換：對齊 generate-thumbs（未 .rotate()）的縮圖實際比例。
    return Math.round((meta.width / meta.height) * 10000) / 10000
  } catch {
    return null
  }
}

async function processFile (file) {
  const jsonPath = path.join(ROOT, file)
  let raw
  try {
    raw = await fs.readFile(jsonPath, 'utf8')
  } catch {
    console.warn(`  ! 跳過 ${file}（讀取失敗）`)
    return { file, total: 0, updated: 0, missing: 0 }
  }
  const data = JSON.parse(raw)
  const imgs = Array.isArray(data.Img) ? data.Img : []

  let updated = 0
  let missing = 0
  const missingNames = []
  for (const img of imgs) {
    if (!img || typeof img.filename !== 'string') continue
    const r = await ratioOf(img.filename)
    if (r === null) {
      missing++
      missingNames.push(img.filename)
      continue
    }
    if (img.aspectRatio !== r) updated++
    img.aspectRatio = r
  }

  if (missingNames.length) {
    console.warn(`  ! ${file}：${missingNames.length} 張量不到尺寸（檔案缺失或非圖片）`)
    for (const n of missingNames.slice(0, 8)) console.warn(`      · ${n}`)
    if (missingNames.length > 8) console.warn(`      … 還有 ${missingNames.length - 8} 張`)
  }

  if (!CHECK_ONLY) {
    // 保留 2-space 縮排 + 行尾換行（與既有檔案格式一致，CJK 不轉義）。
    await fs.writeFile(jsonPath, JSON.stringify(data, null, 2) + '\n', 'utf8')
  }

  return { file, total: imgs.length, updated, missing }
}

async function main () {
  console.log(`Computing aspect ratios${CHECK_ONLY ? ' (check only)' : ''} for: ${FILES.join(', ')}`)
  let anyMissing = false
  for (const file of FILES) {
    const r = await processFile(file)
    console.log(`  ${file}: ${r.total} images · ${r.updated} aspectRatio ${CHECK_ONLY ? 'would change' : 'written/updated'} · ${r.missing} unresolved`)
    if (r.missing > 0) anyMissing = true
  }
  if (CHECK_ONLY && anyMissing) {
    console.error('\n✗ 有圖片量不到尺寸，請先 npm run thumbs 或補齊原圖。')
    process.exit(1)
  }
  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
