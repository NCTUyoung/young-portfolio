import { test, expect } from '@playwright/test'

test.describe('Gallery /gallery/photography', () => {
  // 攝影 overview 改版（呆版大改 / quiet-asymmetric）：影(kage) overview 主欄 = 報紙刊頭式
  //   編輯模組 (GalleryEditorialModules, .em)。每個 event 一塊「特稿大圖 + 編號支援照 + 全N枚入口」。
  //   舊「暗房光桌橫條」與橫向膠卷光桌已移除。元件自帶的 .em__masthead（h2 写真記録 + .em__count）
  //   現全隱（display:none）：桌機標題/計數改由「頁面層非對稱刊頭」.kage-masthead 統一承擔
  //   （h1 写真記録 + .kage-masthead__count），手機由 filmpanel-m 房間標牌承擔。
  //   Playwright 預設 Desktop Chrome viewport 1280×720 屬 lg+，.kage-masthead 可見。

  test('載入後顯示攝影編輯模組與張數', async ({ page }) => {
    await page.goto('/gallery/photography')

    // 頁面層非對稱刊頭 .kage-masthead 主標 h1 =「写真記録」（lg+；mobile 由 filmpanel-m 標牌承擔）。
    await expect(
      page.locator('.kage-masthead__title').filter({ hasText: '写真記録' })
    ).toBeVisible({ timeout: 10_000 })

    // 張數摘要：`<span>080</span><span>枚 · frames</span>`（補零三位）。
    // 含「枚 · frames」單位 + 雙位數，避免把 0 當通過。
    await expect(
      page.locator('.kage-masthead__count').filter({ hasText: /\d{2,}\s*枚\s*·\s*frames/ })
    ).toBeVisible({ timeout: 10_000 })

    // 至少一個事件模組的「全 N 枚を見る」入口可見 → 代表資料已進畫面。
    await expect(page.locator('.em__enter').first()).toBeVisible({ timeout: 10_000 })
  })

  test('點事件模組「全N枚を見る」進入該事件沉浸頁', async ({ page }) => {
    await page.goto('/gallery/photography')

    // 第一塊模組 = Annber 外拍；其「全 N 枚を見る」連結指向 /gallery/photography/Annber 外拍。
    const enter = page.locator('.em__enter').first()
    await enter.waitFor({ state: 'visible', timeout: 15_000 })

    // hydration race：SSR'd HTML 出來時連結已可見但 Vue listeners 還沒掛上，第一次點可能被吃掉。
    // 等到導航真正生效（URL 含 event path）才繼續。
    // 只在「尚未導航」時才再點：成功但較慢的導航（CI dev route 首編譯可達數秒）會讓
    // 連結消失，若無條件 re-click 會在 event 頁找不到 .em__enter 而 thrash。
    // waitUntil:'commit'：本頁 'load' 事件不可靠（長載資源讓 load 遲遲不觸發），但 URL 一
    // commit 即代表導航成功；真正「頁面渲染好」由下方 h2 可見性把關。
    await expect(async () => {
      if (!/\/gallery\/photography\/Annber/.test(page.url())) {
        await enter.click({ timeout: 2_000 }).catch(() => {})
      }
      await page.waitForURL(/\/gallery\/photography\/Annber/, { timeout: 4_000, waitUntil: 'commit' })
    }).toPass({ timeout: 25_000, intervals: [500, 1000, 2000] })

    // 進入後渲染該事件扉頁：h2 = event 名「Annber 外拍」。
    await expect(
      page.getByRole('heading', { level: 2, name: /Annber 外拍/ })
    ).toBeVisible({ timeout: 15_000 })
  })

  test('進入 event 顯示扉頁、Map/Statement/Strip 隱藏', async ({ page }) => {
    // 直接走 event path（與點入後的目的地等價，但對 SSR 更乾淨）
    await page.goto('/gallery/photography/Annber%20%E5%A4%96%E6%8B%8D')

    // 扉頁渲染：「扉頁 · Cover」eyebrow + 大字 event 名（不依賴 networkidle，避免 map tile 卡住）
    await expect(
      page.getByRole('heading', { level: 2, name: /Annber 外拍/ })
    ).toBeVisible({ timeout: 15_000 })
    await expect(
      page.locator('p').filter({ hasText: /^扉頁\s*·\s*Cover\s*$/ })
    ).toBeVisible()

    // Overview 章節隱藏（Map / Statement heading；編輯模組的扉頁刊頭 写真記録 也不在 event mode）
    await expect(page.locator('#photo-map-heading')).toHaveCount(0)
    await expect(page.locator('#photo-statement-heading')).toHaveCount(0)
    await expect(page.locator('.em__masthead')).toHaveCount(0)

    // 「展開全部」按鈕存在（hit zone CTA，捲到下方時間軸）
    await expect(
      page.getByRole('button', { name: /展開全部/ })
    ).toBeVisible()

    // 進入事件預設展開（route 驅動）：接觸印樣瀑布流（masonry）直接可見，不需手動點展開。
    const masonry = page.locator('.contact-sheet__masonry').first()
    await masonry.scrollIntoViewIfNeeded()
    await expect(masonry).toBeVisible({ timeout: 15_000 })
  })
})
