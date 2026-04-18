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
})
