/**
 * R41 — digital 7 events 加「工具 / 技法 / 題材」三軸
 */
import { readFileSync, writeFileSync } from 'node:fs'

const map = {
  '2018年電繪作品': {
    tools: ['SAI', 'Illustrator'],
    techniques: ['色塊', '幾何向量'],
    topics: ['膠囊·機械', '單一物件']
  },
  '2021年電繪作品': {
    tools: ['Procreate'],
    techniques: ['粗線條', '浮世繪風'],
    topics: ['人物', '練習稿']
  },
  '2022年電繪作品': {
    tools: ['Procreate', 'Photoshop'],
    techniques: ['構圖偏移', '概念主視覺'],
    topics: ['委託案', '社團封面']
  },
  '2023年電繪作品': {
    tools: ['Photoshop', '數位板'],
    techniques: ['光源結構', '左上 45°'],
    topics: ['人物', '場景']
  },
  '2024年電繪作品': {
    tools: ['Photoshop'],
    techniques: ['負空間', '水彩留白'],
    topics: ['雙軌共構', '寧靜敘事']
  },
  '2025年電繪作品': {
    tools: ['Photoshop', '攝影參照'],
    techniques: ['決定性瞬間', '凍結 1/100s'],
    topics: ['動勢', '肢體']
  },
  '2026年電繪作品': {
    tools: ['AI 草稿', 'Photoshop 手刷'],
    techniques: ['AI 輔助構圖', '手工色層'],
    topics: ['人物', '氣息保留']
  }
}

const path = 'public/galleryList.json'
const data = JSON.parse(readFileSync(path, 'utf-8'))
let touched = 0
for (const [name, axes] of Object.entries(map)) {
  if (data.seriesNarratives?.[name]) {
    Object.assign(data.seriesNarratives[name], axes)
    touched++
  }
}
writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8')
console.log(`Added 3-axis meta to ${touched}/${Object.keys(map).length} digital events`)
