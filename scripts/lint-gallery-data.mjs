#!/usr/bin/env node
/**
 * 檢查 gallery 資料 JSON 的一致性與資料品質；輸出人類可讀的報表，非零結束碼代表有需要修正的項目。
 *
 * 可抓出的問題：
 *   - eventStats 與 works 中實際事件名稱不一致（例：「桃園」vs「桃猿」typo）
 *   - 圖片檔案實際存在與否（public/images/ 底下）
 *   - boilerplate 敘述比例（只是統計，不視為錯誤）
 *   - 缺少 lat/lng 的事件
 *   - 重複 filename
 *
 * 用法：node scripts/lint-gallery-data.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')
const PUB = path.join(ROOT, 'public')

function readJson (p) {
  return JSON.parse(fs.readFileSync(p, 'utf-8'))
}

function flagLine (severity, message) {
  const prefix = { error: 'ERROR', warn: 'WARN ', info: 'INFO ' }[severity] || severity
  return `[${prefix}] ${message}`
}

function collectEventNames (works) {
  const names = new Set()
  for (const w of works) {
    if (w.event && w.event.name) names.add(w.event.name)
  }
  return names
}

function countBoilerplate (works) {
  const BOILERPLATE = new Set(['數位單眼相機拍攝作品', '數位相機拍攝作品', '攝影作品', '拍攝作品', '未命名'])
  let count = 0
  for (const w of works) {
    const c = (w.content || '').trim()
    if (!c || BOILERPLATE.has(c)) count++
  }
  return count
}

function findDuplicateFilenames (works) {
  const seen = new Map()
  const dups = []
  for (const w of works) {
    if (!w.filename) continue
    if (seen.has(w.filename)) {
      dups.push(w.filename)
    } else {
      seen.set(w.filename, true)
    }
  }
  return dups
}

function findMissingFiles (works) {
  const missing = []
  for (const w of works) {
    if (!w.filename) continue
    const abs = path.join(PUB, 'images', w.filename)
    if (!fs.existsSync(abs)) missing.push(w.filename)
  }
  return missing
}

function checkEventCoords (works, category) {
  const missing = []
  if (category !== 'photography') return missing
  for (const w of works) {
    const ev = w.event
    if (!ev || !ev.name) continue
    if (ev.lat === undefined || ev.lng === undefined) missing.push(`${w.filename} → ${ev.name}`)
  }
  return missing
}

function main () {
  const targets = [
    { file: 'galleryList.json', category: 'digital' },
    { file: 'photographyList.json', category: 'photography' }
  ]

  const report = []
  let errorCount = 0
  let warnCount = 0

  for (const { file, category } of targets) {
    const abs = path.join(PUB, file)
    if (!fs.existsSync(abs)) {
      report.push(flagLine('error', `${file} 不存在`))
      errorCount++
      continue
    }
    const data = readJson(abs)
    const works = data.Img || []
    const eventStats = data.eventStats || {}

    report.push(`\n=== ${file} (${works.length} 筆) ===`)

    // eventStats 已改為 runtime 重算（見 app/stores/gallery.ts），JSON 不需再帶；
    // 若仍留著就檢查 drift，避免手填誤差回流到可見統計上。
    if (data.eventStats && Object.keys(data.eventStats).length > 0) {
      const actual = collectEventNames(works)
      const statsKeys = new Set(Object.keys(eventStats))
      const ghosts = [...statsKeys].filter(k => !actual.has(k))
      const missingInStats = [...actual].filter(k => !statsKeys.has(k))
      if (ghosts.length > 0) {
        errorCount++
        report.push(flagLine('error', `eventStats 有幽靈鍵（作品中找不到的事件名）：${ghosts.join(', ')}`))
      }
      if (missingInStats.length > 0) {
        warnCount++
        report.push(flagLine('warn', `eventStats 漏記事件：${missingInStats.join(', ')}（執行時會自動重算，無立即影響）`))
      }
    }

    const missingFiles = findMissingFiles(works)
    if (missingFiles.length > 0) {
      errorCount++
      report.push(flagLine('error', `public/images/ 底下找不到 ${missingFiles.length} 個檔案，首 3 筆：${missingFiles.slice(0, 3).join(', ')}`))
    }

    const dups = findDuplicateFilenames(works)
    if (dups.length > 0) {
      errorCount++
      report.push(flagLine('error', `重複 filename：${dups.slice(0, 5).join(', ')}${dups.length > 5 ? ` 等 ${dups.length} 筆` : ''}`))
    }

    const missingCoords = checkEventCoords(works, category)
    if (missingCoords.length > 0) {
      warnCount++
      report.push(flagLine('warn', `${missingCoords.length} 筆攝影作品缺 event.lat/lng，會退回 fallback 座標`))
    }

    const boiler = countBoilerplate(works)
    if (boiler > 0) {
      const pct = Math.round((boiler / works.length) * 100)
      report.push(flagLine('info', `${boiler}/${works.length} (${pct}%) 筆為樣板或空白描述；顯示端會自動隱藏`))
    }
  }

  console.log(report.join('\n'))
  console.log(`\n總計：${errorCount} errors, ${warnCount} warns`)
  process.exit(errorCount > 0 ? 1 : 0)
}

main()
