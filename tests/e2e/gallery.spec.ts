import { test, expect } from '@playwright/test'

test.describe('Gallery /gallery/photography', () => {
  // 桌機 viewport（lg+）時，filter chrome 集中在左側 rail（aria-label="Gallery filters"）。
  // 原 top-stack header 在同一 DOM 樹中仍以 `lg:hidden` 保留（mobile 渲染用），
  // 所以工作數量／h1 等文字在 DOM 上會出現兩份；測試一律收斂到 rail 內，避免 strict-mode 命中兩個。
  // Playwright 預設 Desktop Chrome viewport 1280×720 屬 lg+，rail 可見。
  const rail = (page: import('@playwright/test').Page) => page.getByLabel('Gallery filters')

  test('載入後顯示 80+ 攝影作品與事件分類', async ({ page }) => {
    await page.goto('/gallery/photography')

    await expect(
      rail(page).getByRole('heading', { level: 1, name: /Works/ })
    ).toBeVisible()

    // `Photography · 80 works` 是三個 inline span。匹配 `<數字> works`，N >= 雙位數避免把 0 當通過。
    await expect(
      rail(page).locator('p').filter({ hasText: /\d{2,} works/ })
    ).toBeVisible({ timeout: 10_000 })

    // 事件 tab「全部事件」永遠存在，等到它可見代表資料已進畫面。
    // rail 版用 justify-between 兩端對齊，無 `·` 分隔點；改用 `\s*\d+$` 通配（horizontal 版仍能匹配）。
    await expect(rail(page).getByRole('button', { name: /^全部事件\s*·?\s*\d+$/ })).toBeVisible({
      timeout: 10_000
    })
  })

  test('切換到特定事件 tab 只剩該事件的作品', async ({ page }) => {
    await page.goto('/gallery/photography')

    // 事件 filter 的按鈕 accessible name 是 `Annber 外拍 9` (rail) 或 `Annber 外拍·9` (horizontal)
    // 形式（N 為該事件作品數）。指定 `^...\s*·?\s*\d+$` 能匹配兩種 variant，並把 tab 按鈕和地圖點
    // toggle 按鈕（名稱是「顯示 ...」）分開。
    const eventButton = rail(page).getByRole('button', { name: /^Annber 外拍\s*·?\s*\d+$/ })
    await eventButton.waitFor({ state: 'visible', timeout: 15_000 })

    const label = (await eventButton.textContent()) ?? ''
    const m = label.match(/(\d+)\s*$/)
    expect(m, `no count parsed from "${label}"`).not.toBeNull()
    const count = Number(m![1])
    expect(count).toBeGreaterThan(0)

    // hydration race：SSR'd HTML 出來時按鈕已可見但 Vue listeners 還沒掛上，第一次點會被吃掉。
    // 等到 click 真正生效（URL 含 event path）才繼續。
    await expect(async () => {
      await eventButton.click({ force: true })
      await page.waitForURL(/\/gallery\/photography\/Annber/, { timeout: 1_000 })
    }).toPass({ timeout: 15_000, intervals: [200, 500, 1000] })

    // 頂部摘要 `Photography · N works` 會切換成選取事件的 N
    await expect(
      rail(page).locator('p').filter({ hasText: new RegExp(`\\b${count} works\\b`) })
    ).toBeVisible({ timeout: 10_000 })
  })

  test('進入 event 顯示扉頁、Map/Statement/Strip 隱藏', async ({ page }) => {
    // 直接走 event path（與點 tab 後 router.replace 的目的地等價，但對 SSR 更乾淨）
    await page.goto('/gallery/photography/Annber%20%E5%A4%96%E6%8B%8D')

    // 扉頁渲染：「扉頁 · Cover」eyebrow + 大字 event 名（不依賴 networkidle，避免 map tile 卡住）
    await expect(
      page.getByRole('heading', { level: 2, name: /Annber 外拍/ })
    ).toBeVisible({ timeout: 15_000 })
    await expect(
      page.locator('p').filter({ hasText: /^扉頁\s*·\s*Cover\s*$/ })
    ).toBeVisible()

    // Overview 三章節隱藏（Map / Statement / Strip header）
    await expect(page.locator('#photo-map-heading')).toHaveCount(0)
    await expect(page.locator('#photo-statement-heading')).toHaveCount(0)
    // Strip header 用其の三 標籤判斷（其の二/其の三/其の四 都該不在 event mode）
    await expect(page.locator('p').filter({ hasText: /其の三/ })).toHaveCount(0)

    // 「展開全部」按鈕存在（hit zone CTA）
    await expect(
      page.getByRole('button', { name: /展開全部/ })
    ).toBeVisible()
  })
})
