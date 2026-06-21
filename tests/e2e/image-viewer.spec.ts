import { test, expect } from '@playwright/test'

/**
 * 針對 `app/components/ImageViewer.vue`：點開→ESC 關閉→方向鍵切換。
 * 對應程式：`handleKeydown` / `handleTabKey`（document 層 keydown）。
 *
 * lightbox 入口：自「進入單一事件後的接觸印樣瀑布流」(GalleryContactSheet) 點格開圖。
 * （overview 已改章節索引，點卡是導航到事件頁、不再開 lightbox；故改由 event 頁進入。）
 * 事件頁預設展開該事件，瀑布流直接可見。
 *
 * 使用 `force: true`：hover caption 會在 pointer enter 瞬間套 pointer-events 攔掉 img
 * click 的 actionability 檢查；實際使用者點得進去（事件 bubble 到 button），force click 表達真實行為。
 */
const EVENT_PATH = '/gallery/photography/Annber%20%E5%A4%96%E6%8B%8D'

test.describe('ImageViewer 鍵盤操作', () => {
  test('點圖開啟 → ESC 關閉', async ({ page }) => {
    await page.goto(EVENT_PATH)
    // 等 hydration 完成再 click，否則 button @click handler 可能尚未綁定
    await page.waitForLoadState('networkidle')

    // 進入事件預設展開 → 接觸印樣瀑布流可見；點第一格開 lightbox
    const firstCell = page.locator('.contact-sheet__btn').first()
    await firstCell.waitFor({ state: 'visible', timeout: 15_000 })
    await firstCell.click({ force: true })

    const dialog = page.getByRole('dialog', { name: '圖片檢視器' })
    await expect(dialog).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })

  test('方向鍵切換下一張（index 1/N → 2/N）', async ({ page }) => {
    await page.goto(EVENT_PATH)
    await page.waitForLoadState('networkidle')

    const firstCell = page.locator('.contact-sheet__btn').first()
    await firstCell.waitFor({ state: 'visible', timeout: 15_000 })
    await firstCell.click({ force: true })

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
