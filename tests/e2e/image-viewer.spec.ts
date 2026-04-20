import { test, expect } from '@playwright/test'

/**
 * 針對 `app/components/ImageViewer.vue`：點開→ESC 關閉→方向鍵切換。
 * 對應程式：`handleKeydown` / `handleTabKey`（document 層 keydown）。
 *
 * 使用 `force: true`：GalleryPhotographySection 的 hover caption 會在 pointer
 * enter 瞬間套 `group-hover:pointer-events-auto` 攔掉 img click 的 actionability
 * 檢查。實際使用者點得進去（事件 bubble 到外層 div），所以 force click 表達真實行為。
 */
test.describe('ImageViewer 鍵盤操作', () => {
  test('點圖開啟 → ESC 關閉', async ({ page }) => {
    await page.goto('/gallery/photography')

    // 先等第一個事件 heading 出現，確保 photo grid 已掛上（避免 img[alt] 搶到 nav icon）
    await page
      .getByRole('heading', { level: 3, name: /Annber 外拍/ })
      .waitFor({ state: 'visible', timeout: 15_000 })

    // 只抓 photo thumbnail：有 srcset + lazy loading，排除 nav/logo icon
    const firstImage = page.locator('main img[srcset][loading]').first()
    await firstImage.waitFor({ state: 'visible', timeout: 5_000 })
    await firstImage.click({ force: true })

    const dialog = page.getByRole('dialog', { name: '圖片檢視器' })
    await expect(dialog).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })

  test('方向鍵切換下一張（index 1/N → 2/N）', async ({ page }) => {
    await page.goto('/gallery/photography')

    await page
      .getByRole('heading', { level: 3, name: /Annber 外拍/ })
      .waitFor({ state: 'visible', timeout: 15_000 })

    const firstImage = page.locator('main img[srcset][loading]').first()
    await firstImage.waitFor({ state: 'visible', timeout: 5_000 })
    await firstImage.click({ force: true })

    const dialog = page.getByRole('dialog', { name: '圖片檢視器' })
    await expect(dialog).toBeVisible()

    // 主索引是頂部工具列的 `<p><span>N</span><span>／</span><span>M</span></p>`。
    // 分隔符為全形「／」（jp-kansuji 風格，刻意），regex 接受 ASCII `/` 或全形 `／`
    // 兩者擇一，以免日後若改回 ASCII 又要改 test。
    // dialog 內同時有 radial menu 也會出現類似 `1 / N`，只取 `<p>` 避免 strict mode 炸。
    const indexP = dialog.locator('p').filter({ hasText: /^\s*\d+\s*[／/]\s*\d+\s*$/ })

    await expect(indexP).toHaveText(/^\s*1\s*[／/]\s*\d+\s*$/)

    await page.keyboard.press('ArrowRight')

    await expect(indexP).toHaveText(/^\s*2\s*[／/]\s*\d+\s*$/, { timeout: 5_000 })

    await page.keyboard.press('Escape')
  })
})
