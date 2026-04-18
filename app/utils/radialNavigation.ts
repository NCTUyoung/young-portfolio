/**
 * Radial navigation 的純演算法（離開 `stores/imageViewer`，方便單元測試）。
 *
 * 為何抽出：
 * - `calcRadialXY` / `computeRadialVisibleWindow` 都是數學／分頁計算，不動 DOM、
 *   不讀取 store state，適合放 util。
 * - 之後若把 `stores/imageViewer` 拆成 `viewer-core` + `viewer-interaction`，這些
 *   函數可以繼續被兩邊共用；有 unit test 盯著就不怕 refactor 踩雷。
 *
 * 保留的非純函數（留在 store 裡）：
 * - `startRadialAnimation`：讀 DOM／call `requestAnimationFrame`，動畫時序與 Vue reactive
 *   posMap 深度耦合，測起來得要 `happy-dom` + fake timer，成本超過價值。
 * - `selectRadialImage`：包含 setTimeout / reset transform / 更新 reactive，同理。
 */

/**
 * 把「在 radial 視圖中第 `index` 個可見圖示」算成 x/y 座標。
 *
 * 設計說明：
 * - `totalVisible` 是**當前可見的**圖片數（不是整個相簿張數）。當 album >7 時，
 *   `getVisibleRadialImages` 會先取 7 張滑動視窗；這裡收到的 total 是視窗大小。
 * - 半徑／角度範圍是 discrete curve（3/5/7/>7）為了讓少量圖片不會擠在太小半徑。
 * - startAngle = 270° - angleRange/2 → 以正下方（270°）為中心左右對稱。
 * - 回傳 x 往右為正、y 往上為正（組件 CSS 會把 y 翻回往下，無須在這動 sign）。
 */
export function calcRadialXY (
  displayIndex: number,
  centerDisplayIndex: number,
  totalVisible: number
): { x: number; y: number } {
  if (totalVisible <= 1) return { x: 0, y: -140 }

  const order = (displayIndex - centerDisplayIndex + totalVisible) % totalVisible

  let radius: number
  let angleRange: number
  if (totalVisible <= 3) {
    radius = 80
    angleRange = 150
  } else if (totalVisible <= 5) {
    radius = 110
    angleRange = 200
  } else if (totalVisible <= 7) {
    radius = 140
    angleRange = 240
  } else {
    radius = 160
    angleRange = 220
  }

  const angleStep = angleRange / Math.max(1, totalVisible - 1)
  const startAngle = 270 - angleRange / 2
  const angle = startAngle + order * angleStep
  const rad = (angle * Math.PI) / 180

  return {
    x: Math.cos(rad) * radius,
    y: -Math.sin(rad) * radius
  }
}

/**
 * 當相簿 >maxVisible 時，算出要顯示哪一段 index window。
 *
 * 例子（maxVisible=7，total=20）：
 * - currentIndex=0 → start=0, end=6
 * - currentIndex=10 → start=7, end=13
 * - currentIndex=19 → start=13, end=19（靠右時貼底，不讓 end 溢位）
 */
export function computeRadialVisibleWindow (
  total: number,
  currentIndex: number,
  maxVisible = 7
): { start: number; end: number } {
  if (total <= maxVisible) return { start: 0, end: Math.max(0, total - 1) }

  const halfVisible = Math.floor(maxVisible / 2)
  const provisionalStart = Math.max(0, currentIndex - halfVisible)
  const endIndex = Math.min(total - 1, provisionalStart + maxVisible - 1)
  // 接近尾端時反推 start；保證 window 永遠是 `maxVisible` 張
  const actualStart = Math.max(0, endIndex - maxVisible + 1)
  return { start: actualStart, end: endIndex }
}

export function lerp (a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function easeOutQuad (t: number): number {
  return 1 - (1 - t) * (1 - t)
}
