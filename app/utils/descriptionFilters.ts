/**
 * 判斷圖片說明是否為模板樣板內容（無實際描述價值）。
 *
 * 背景：Gallery JSON 內大量 photography 作品的 `content` 欄位被填為
 * 「數位單眼相機拍攝作品」這類樣板句；顯示給使用者只會造成重複噪音。
 * 此工具提供共用白名單，讓資訊面板 / 分享卡 / SEO 能統一過濾。
 *
 * 原則：寧可放行一些可疑字串，也不要誤殺使用者自填的真實敘述 → 使用「完整比對
 * + 極少數開頭詞」策略，而不是模糊 keyword 匹配。
 */

const BOILERPLATE_EXACT_MATCHES: ReadonlySet<string> = new Set([
  '數位單眼相機拍攝作品',
  '數位相機拍攝作品',
  '攝影作品',
  '拍攝作品',
  '未命名',
  'untitled',
  'Untitled'
])

export function isBoilerplateContent (text: string | null | undefined): boolean {
  if (!text) return true
  const trimmed = text.trim()
  if (trimmed === '') return true
  if (BOILERPLATE_EXACT_MATCHES.has(trimmed)) return true
  return false
}

export function nonBoilerplateOrEmpty (text: string | null | undefined): string {
  return isBoilerplateContent(text) ? '' : (text as string).trim()
}
