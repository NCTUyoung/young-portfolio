import { readFileSync, writeFileSync } from 'node:fs'

const map = {
  '春日街拍': {
    tools: ['Nikon Z f', '70-180 f/2.8'],
    techniques: ['淺景深', '逆光'],
    topics: ['街頭', '人物']
  },
  '2024新北耶誕城': {
    tools: ['Nikon Z f'],
    techniques: ['夜景', '霓虹色'],
    topics: ['節慶', '城市']
  },
  '2025 桃猿三本柱': {
    tools: ['Nikon Z f', '70-180mm'],
    techniques: ['1/2000s', '高速快門'],
    topics: ['棒球', '球員']
  },
  '攝影社 米倉團拍': {
    tools: ['Nikon Z f'],
    techniques: ['團拍', '空檔捕捉'],
    topics: ['人物', '木牆']
  },
  '調色測試': {
    tools: ['DxO', 'Lightroom'],
    techniques: ['曲線', '色階'],
    topics: ['練習', '校色']
  },
  '交大外拍': {
    tools: ['Nikon Z f'],
    techniques: ['長影', '紅磚'],
    topics: ['校園', '人物']
  },
  '2025 聖誕台北': {
    tools: ['Nikon Z f'],
    techniques: ['金光', '夜景'],
    topics: ['城市', '燈飾']
  },
  '峨嵋湖風鈴木': {
    tools: ['Nikon Z f'],
    techniques: ['等雲', '低光'],
    topics: ['花季', '黃花']
  },
  'WBC 2026': {
    tools: ['Nikon Z f', '119mm'],
    techniques: ['場邊', '裁切構圖'],
    topics: ['棒球', '板凳']
  },
  'WBC東京 台澳': {
    tools: ['Nikon Z f'],
    techniques: ['人造光', '均勻光'],
    topics: ['東京巨蛋', '比賽']
  },
  'Annber 外拍': {
    tools: ['Nikon Z f'],
    techniques: ['第三遍', '放鬆瞬間'],
    topics: ['人像', '校園']
  },
  '栗子外拍': {
    tools: ['Nikon Z f'],
    techniques: ['窗光', '克制走位'],
    topics: ['人像', '室內']
  }
}

const path = 'public/photographyList.json'
const data = JSON.parse(readFileSync(path, 'utf-8'))
let touched = 0
for (const [name, axes] of Object.entries(map)) {
  if (data.seriesNarratives?.[name]) {
    Object.assign(data.seriesNarratives[name], axes)
    touched++
  }
}
writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8')
console.log(`Added 3-axis to ${touched}/${Object.keys(map).length} photography events`)
