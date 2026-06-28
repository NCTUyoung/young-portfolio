/**
 * 影像幾何離線量測：縱橫比（aspectRatio）＋內容感知焦點（focalX / focalY）。
 *
 * 單一真相：批次工具 `scripts/compute-aspect-ratios.mjs` 與本機上傳端
 * `server/api/upload.post.ts` 共用本檔，避免兩處邏輯漂移（focal 的「保頭天花板」很微妙，
 * 重複實作遲早走鐘）。兩處皆以「原圖儲存像素」量測（不 .rotate()），對齊 generate-thumbs
 * 的縮圖實際比例。
 *
 * 位置在 server/utils/（而非 scripts/）：須落在 Nitro 的 server 打包範圍內，否則上傳路由
 * 一 import 就會被外部化、相對路徑相對 .nuxt/dev/ 解析錯誤 → 整個 SSR server 載入即崩。
 * batch script 反向以 ../server/utils/ 匯入此檔（純 node，僅依賴 sharp / smartcrop-sharp）。
 *
 * 介面：吃**絕對路徑**（呼叫端自行解析），量不到回 null（呼叫端保留缺值）。
 */
import sharp from 'sharp'
import smartcrop from 'smartcrop-sharp'

/** 量單張原圖比例（width/height，四捨五入 4 位）；找不到檔或無尺寸回 null。 */
export async function ratioOf (abs) {
  try {
    const meta = await sharp(abs).metadata()
    if (!meta.width || !meta.height) return null
    // 不做 orientation 交換：對齊 generate-thumbs（未 .rotate()）的縮圖實際比例。
    return Math.round((meta.width / meta.height) * 10000) / 10000
  } catch {
    return null
  }
}

/**
 * 內容感知焦點（focalX / focalY，0..1，原圖正規化座標）。
 *
 * 以「索引卡實際裁切比例 3:2」請求 smartcrop（非正方形），讓寬框落在臉／上半身最顯著處。
 * focalY 預設取主體帶中心，再加一道「以主體帶頂端為頭頂基準」的保頭天花板：對最寬共用框
 * R_MAX 求解，若 bandCenter 會讓可見視窗頂端超過 bandTop（切到頭）就把 f 壓到
 * bandTop / (1 − r/R_MAX)。守衛 bandTop>0.02：橫幅／近正方時不夾、直接用 bandCenter。
 * 詳細推導見 scripts/compute-aspect-ratios.mjs 既有註解。
 */
const FOCAL_DEMAND = { width: 300, height: 200 } // 3:2 = 索引卡最吃緊的裁切比例
const FOCAL_R_MAX = 2.0 // 最寬的共用裁切框（桌機 88vh full-bleed hero ≈ 16:9/0.88）

export async function focalOf (abs) {
  try {
    const meta = await sharp(abs).metadata()
    if (!meta.width || !meta.height) return null
    const r = meta.width / meta.height
    const { topCrop } = await smartcrop.crop(abs, FOCAL_DEMAND)
    if (!topCrop) return null
    const focalX = (topCrop.x + topCrop.width / 2) / meta.width
    const bandTop = topCrop.y / meta.height
    let focalY = (topCrop.y + topCrop.height / 2) / meta.height // 主體帶中心
    // 保頭天花板：以主體帶頂端為頭頂基準，壓到最寬框 window_top ≤ bandTop（橫幅/滿框帶跳過）。
    if (r < FOCAL_R_MAX && bandTop > 0.02) {
      const headSafe = bandTop / (1 - r / FOCAL_R_MAX)
      if (focalY > headSafe) focalY = headSafe
    }
    const clamp = (n) => Math.min(1, Math.max(0, Math.round(n * 1000) / 1000))
    return { focalX: clamp(focalX), focalY: clamp(focalY) }
  } catch {
    return null
  }
}
