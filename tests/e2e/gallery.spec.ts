import { test, expect } from '@playwright/test'

test.describe('Gallery /gallery/photography', () => {
  test('載入後顯示 80+ 攝影作品與事件分類', async ({ page }) => {
    await page.goto('/gallery/photography')

    await expect(
      page.getByRole('heading', { level: 1, name: /Works/ })
    ).toBeVisible()

    // `Photography · 80 works` 是三個 inline span，直接找 paragraph role 比較穩。
    // 匹配 `<數字> works`，N >= 雙位數避免把 0 當通過。
    await expect(
      page.locator('p').filter({ hasText: /\d{2,} works/ })
    ).toBeVisible({ timeout: 10_000 })

    // 事件 tab「全部事件」永遠存在，等到它可見代表資料已進畫面
    await expect(page.getByRole('button', { name: /^全部事件·\d+$/ })).toBeVisible({
      timeout: 10_000
    })
  })

  test('切換到特定事件 tab 只剩該事件的作品', async ({ page }) => {
    await page.goto('/gallery/photography')
    // 等 hydration 完成再 click，否則 click handler 可能尚未綁定（Vue3 hydration 是 async）
    await page.waitForLoadState('networkidle')

    // 事件 filter 的按鈕 accessible name 是 `Annber 外拍·9` 形式（N 為該事件作品數）。
    // 明確指定 `^...·\d+$` 能把 tab 按鈕和地圖點 toggle 按鈕（名稱是「顯示 ...」）分開。
    const eventButton = page
      .getByRole('button', { name: /^Annber 外拍·\d+$/ })
    await eventButton.waitFor({ state: 'visible', timeout: 10_000 })

    const label = (await eventButton.textContent()) ?? ''
    const m = label.match(/·\s*(\d+)/)
    expect(m, `no count parsed from "${label}"`).not.toBeNull()
    const count = Number(m![1])
    expect(count).toBeGreaterThan(0)

    await eventButton.click()

    // 頂部摘要 `Photography · N works` 會切換成選取事件的 N；用 paragraph 搜最穩
    await expect(
      page.locator('p').filter({ hasText: new RegExp(`\\b${count} works\\b`) })
    ).toBeVisible({ timeout: 5_000 })
  })

  test('進入 event 顯示扉頁、Map/Statement/Strip 隱藏', async ({ page }) => {
    // 直接走 event path（與點 tab 後 router.replace 的目的地等價，但對 SSR 更乾淨）
    await page.goto('/gallery/photography/Annber%20%E5%A4%96%E6%8B%8D')
    await page.waitForLoadState('networkidle')

    // 扉頁渲染：「扉頁 · Cover」eyebrow + 大字 event 名
    await expect(
      page.getByRole('heading', { level: 2, name: /Annber 外拍/ })
    ).toBeVisible({ timeout: 10_000 })
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
