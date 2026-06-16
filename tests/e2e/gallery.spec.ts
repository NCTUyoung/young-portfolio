import { test, expect } from '@playwright/test'

test.describe('Gallery /gallery/photography', () => {
  // galleryWorlds 大改（破共用版面拓樸）：lg+ 時 繪/影 兩世界的頁面外框分歧。
  //   繪(kai)  = 製図室：左側 spec 索引 rail（aria-label="Gallery filters"）。
  //   影(kage) = 暗室：取消左 rail，改主欄頂部「暗房光桌橫條」(GalleryDarkroomBar, .darkroom-bar)。
  // /gallery/photography 落在影(kage) 世界 → chrome 收斂在 .darkroom-bar，而非舊的 rail。
  // mobile top-stack masthead 在同 DOM 以 `lg:hidden` 保留，故文字會出現兩份；
  // 測試一律收斂到 .darkroom-bar 內，避免 strict-mode 命中兩個。
  // Playwright 預設 Desktop Chrome viewport 1280×720 屬 lg+，bar 可見。
  const bar = (page: import('@playwright/test').Page) => page.locator('.darkroom-bar')

  test('載入後顯示 80+ 攝影作品與事件分類', async ({ page }) => {
    await page.goto('/gallery/photography')

    // 影(kage) 世界暗房光桌橫條 masthead h1 = 「暗室」(Darkroom)。
    await expect(
      bar(page).getByRole('heading', { level: 1, name: '暗室' })
    ).toBeVisible()

    // 張數摘要：bar 右側 `<span>080</span><span>枚 · frames</span>`（stat-num 補零三位）。
    // 用含「枚 · frames」單位 + 雙位數，避免把 0 當通過。
    await expect(
      bar(page).locator('.darkroom-bar__stat').filter({ hasText: /\d{2,}\s*枚\s*·\s*frames/ })
    ).toBeVisible({ timeout: 10_000 })

    // 事件 filter「全部事件」永遠存在，等到它可見代表資料已進畫面。
    // EventFilter rail 變體用 justify-between 兩端對齊，無 `·` 分隔點；`\s*\d+$` 通配。
    await expect(bar(page).getByRole('button', { name: /^全部事件\s*·?\s*\d+$/ })).toBeVisible({
      timeout: 10_000
    })
  })

  test('切換到特定事件 tab 只剩該事件的作品', async ({ page }) => {
    await page.goto('/gallery/photography')

    // 事件 filter 的按鈕 accessible name 形如 `Annber 外拍 9`（N 為該事件作品數）。
    // `^...\s*·?\s*\d+$` 把 tab 按鈕和地圖點 toggle 按鈕（名稱是「顯示 ...」）分開。
    const eventButton = bar(page).getByRole('button', { name: /^Annber 外拍\s*·?\s*\d+$/ })
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

    // bar 右側張數（stat-num）會切換成選取事件的 N，且以 padStart(3,'0') 補零三位。
    const expected = String(count).padStart(3, '0')
    await expect(
      bar(page).locator('.darkroom-bar__stat-num')
    ).toHaveText(expected, { timeout: 10_000 })
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
