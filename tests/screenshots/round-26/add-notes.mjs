/**
 * R26 — 為 ~16 張代表性照片加 image-level `note` 欄位
 * 一次性 mutate `photographyList.json`，
 * 之後 InfoPanel 的 narrativeText 改讀 note > annotation > narrative
 */
import { readFileSync, writeFileSync } from 'node:fs'

const path = 'public/photographyList.json'
const data = JSON.parse(readFileSync(path, 'utf-8'))

// (filename basename) → note. event-內第一張 + 標誌性作品優先。
const notes = {
  // 春日街拍 — 紅扇主角
  'DSC_7030-1.jpg': '紅扇的角度幾乎跟旗袍領子平行——這不是擺出來的，是她剛要展開扇子的前一格。',
  // 2024新北耶誕城 — 巨大圖案下
  'DSC_4319-NEF_DxO_DeepPRIMEXD-1.jpg': '看燈飾後面的天空——還沒完全暗，是 18:15 左右的「藍調時刻」，最後一抹深藍墊底。',
  // 2025 桃猿三本柱 — 動作前
  'DSC_6516-1.jpg': '球員的左手已經舉到肩線——這是揮棒準備的最後一格。下一張快門落下，球可能已經出去。',
  // 米倉團拍
  'DSC_4810-編輯-1.jpg': '木紋背景把人從現代街景剝出來。她回頭那一下，把肩頸的線條交給左上的窗光描了一遍。',
  // 調色測試
  'DSC_3889-編輯-1.jpg': '這張是「練習簿」裡的第三種曲線——綠色被往上拉了 10%，畫面就從「下午」變成「初春」。',
  // 交大外拍 — 紅樓影子
  'DSC_3051-編輯-1.jpg': '紅磚的反光顏色，跟她裙子的橘紅是巧合也是收成——這條街我們走了四遍才找到對的光。',
  // 2025 聖誕台北 — 金色街
  'DSC_6432-編輯-1.jpg': '路面金光只在這幾步寬有，再走兩步就被建築陰影吃掉了。攝影是場跟光速賽跑的散步。',
  // 峨嵋湖風鈴木 — 黃花
  'DSC_1721-編輯-1.jpg': '黃花本身飽和度不到 60%，但天空陰沉成 wabi 灰，反而把它的暖色推到前面。',
  // WBC 2026 — 板凳
  'DSC_9991-編輯-1.jpg': '畫面右下角有 1/12 被切到——那是教練的手肘。整張在說「鏡頭沒對到比賽，但對到準備」。',
  // WBC東京 — 鳥居
  'DSC_9872-編輯-1.jpg': '第一鳥居的木紋已經被風雨啃過——這是 13 世紀以來的同一根柱子，攝影的本質是「目擊」。',
  // Annber 外拍 — 笑意
  'DSC_2702-編輯-1.jpg': '她笑出來的那一刻肩膀微微鬆下，光線剛好接住下垂的耳邊髮——這是「沒在拍」的第二秒。',
  // Annber — 紫藤
  'DSC_2216-編輯-1.jpg': '紫藤是借景。前景手的伸出方向跟藤蔓的下垂方向交織成 X 型，重心剛好落在她抬頭的下巴。',
  // 栗子外拍 — 泡沫
  'DSC_6289-編輯-1.jpg': '泡沫散開的軌跡在她唇邊停留了 1/250 秒。再快快門會凍住、再慢會糊掉——這是 1/250 的特權。',
  // 栗子 — 床頭
  'DSC_5910-編輯-1.jpg': '暗紅織紋只佔畫面 1/4，但顏色重量已經夠把整張平衡。剩下 3/4 留給她側躺的鬆弛。',
  // 栗子 — 花瓣牆
  'DSC_5532-編輯-編輯-1.jpg': '花瓣牆的密度像背景音樂——聲量大但訊息少。她那條紅色高跟才是這張的主旋律。',
}

let touched = 0
for (const img of data.Img) {
  const basename = img.filename.split('/').pop()
  if (notes[basename]) {
    img.note = notes[basename]
    touched++
  }
}

writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8')
console.log(`Added note to ${touched}/${data.Img.length} images`)
