/**
 * R35 — 為所有 seriesNarratives event 加 `strongest_line` 欄位
 * 一句話章首詩，給章封 cover 用，取代「截 38 字加…」的爛尾
 */
import { readFileSync, writeFileSync } from 'node:fs'

// 攝影 — 12 events
const photoLines = {
  '春日街拍': '旗袍與紅燈籠的城市偶遇',
  '2024新北耶誕城': '光太多的夜也能看見人',
  '2025 桃猿三本柱': '快門落下那刻，等待即構圖',
  '攝影社 米倉團拍': '木牆吃光、空檔最戲',
  '調色測試': '練看光，不是套濾鏡',
  '交大外拍': '紅樓三點影最長',
  '2025 聖誕台北': '一條街掛同色金光',
  '峨嵋湖風鈴木': '花季只有十天，攝影者等雲',
  'WBC 2026': '業餘 119mm，看小腿和板凳',
  'WBC東京 台澳': '無風的人造光，焦點還給人',
  'Annber 外拍': '走了三遍才有沒在拍的笑',
  '栗子外拍': '只動兩次位置的克制'
}

// 數位電繪 — 7 events
const digitalLines = {
  '2018年電繪作品': 'SAI 的第一年，色塊講故事',
  '2021年電繪作品': '粗線條的浮世繪味',
  '2022年電繪作品': '畫給別人看的第三年',
  '2023年電繪作品': 'PS+板，光是構圖的開始',
  '2024年電繪作品': '雙軌並行，留白入畫',
  '2025年電繪作品': '攝影的決定性瞬間搬回紙上',
  '2026年電繪作品': 'AI 輔助，手刷氣息還在'
}

function injectLines (path, lines) {
  const data = JSON.parse(readFileSync(path, 'utf-8'))
  let touched = 0
  for (const [name, line] of Object.entries(lines)) {
    if (data.seriesNarratives?.[name]) {
      data.seriesNarratives[name].strongest_line = line
      touched++
    }
  }
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8')
  console.log(`${path}: injected ${touched}/${Object.keys(lines).length}`)
}

injectLines('public/photographyList.json', photoLines)
injectLines('public/galleryList.json', digitalLines)
