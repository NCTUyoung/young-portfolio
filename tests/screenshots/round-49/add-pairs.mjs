/**
 * R49 — 加入 pairWith 配對欄位
 * 5 對繪×影互相指向（dual-track narrative pairing）
 * id 規則：`<category>-<filename without ext>` (見 generateImageId in app/utils/imageUtils.ts)
 */
import { readFileSync, writeFileSync } from 'node:fs'

// Photography → Digital pairs（id 必須對應到實際 filename 去除副檔名）
const photoToDigital = {
  // 春日街拍 紅扇女子 → 2025年電繪
  'photography/春日街拍/DSC_7030-1.jpg': 'digital-gallery/2025年電繪作品/17',
  // Annber 笑意 → 2024年電繪
  'photography/Annber 外拍/DSC_2702-編輯-1.jpg': 'digital-gallery/2024年電繪作品/23',
  // 栗子 窗光 → 2026年電繪
  'photography/栗子外拍/DSC_5910-編輯-1.jpg': 'digital-gallery/2026年電繪作品/21-編輯-編輯-編輯-1',
  // WBC 板凳 → 2023年電繪
  'photography/WBC 2026/DSC_9991-編輯-1.jpg': 'digital-gallery/2023年電繪作品/22',
  // 峨嵋湖風鈴木 → 2018年電繪 (Wave 神奈川)
  'photography/峨嵋湖風鈴木/DSC_1721-編輯-1.jpg': 'digital-gallery/2018年電繪作品/The_Great_Wave_off_Kanagawa'
}

const photoPath = 'public/photographyList.json'
const photoData = JSON.parse(readFileSync(photoPath, 'utf-8'))
let pTouched = 0
for (const img of photoData.Img) {
  if (photoToDigital[img.filename]) {
    img.pairWith = photoToDigital[img.filename]
    pTouched++
  }
}
writeFileSync(photoPath, JSON.stringify(photoData, null, 2), 'utf-8')
console.log(`photo: ${pTouched} pairs set`)

// Reverse pairs digital → photography
const digitalToPhoto = {}
for (const [pFilename, dId] of Object.entries(photoToDigital)) {
  // dId is like 'digital-gallery/2025年電繪作品/00' — extract filename
  const dFile = dId.replace(/^digital-/, '')
  digitalToPhoto[dFile] = `photography-${pFilename.replace(/\.[^/.]+$/, '')}`
}

const digitalPath = 'public/galleryList.json'
const digitalData = JSON.parse(readFileSync(digitalPath, 'utf-8'))
let dTouched = 0
for (const img of digitalData.Img) {
  const base = img.filename.replace(/\.[^/.]+$/, '')
  if (digitalToPhoto[base]) {
    img.pairWith = digitalToPhoto[base]
    dTouched++
  }
}
writeFileSync(digitalPath, JSON.stringify(digitalData, null, 2), 'utf-8')
console.log(`digital: ${dTouched} pairs set`)
