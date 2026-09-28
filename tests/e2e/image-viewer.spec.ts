import { test, expect, type Page } from '@playwright/test'

/**
 * 針對 `app/components/ImageViewer.vue`：點開→ESC 關閉→方向鍵切換。
 * 對應程式：`handleKeydown` / `handleTabKey`（document 層 keydown）。
 *
 * lightbox 入口：事件扉頁預設顯示系列照片，再從接觸印樣瀑布流點格開圖。
 *
 * 使用 `force: true`：hover caption 會在 pointer enter 瞬間套 pointer-events 攔掉 img
 * click 的 actionability 檢查；實際使用者點得進去（事件 bubble 到 button），force click 表達真實行為。
 */
const EVENT_PATH = '/gallery/photography/Annber%20%E5%A4%96%E6%8B%8D'

async function openEventSeries (page: Page) {
  await page.goto(EVENT_PATH)
  await expect(page.locator('#event-cover-heading')).toHaveText('Annber 外拍')
  await page.waitForLoadState('networkidle')
  const seriesShortcut = page.getByRole('button', { name: /前往系列照片/ })
  await expect(seriesShortcut).toBeVisible()
  await expect(seriesShortcut).toHaveAttribute('aria-expanded', 'true')
  await expect(page.locator('.contact-sheet__masonry:visible').first()).toBeVisible({ timeout: 15_000 })
}

test.describe('ImageViewer 鍵盤操作', () => {
  test('same image reopen resets failed decode state', async ({ page }) => {
    let failViewerLoad = false
    await page.route('**/images/**', async (route) => {
      const url = route.request().url()
      const isViewerThumbnail = /\/_thumbs\/(?:800|1600)w\//.test(url)
      const isOriginalImage = url.includes('/images/photography/') && !url.includes('/_thumbs/')
      if (failViewerLoad && (isViewerThumbnail || isOriginalImage)) {
        await route.abort()
        return
      }
      await route.continue()
    })

    await openEventSeries(page)
    const firstCell = page.locator('.contact-sheet__btn').first()
    await firstCell.waitFor({ state: 'visible', timeout: 15_000 })

    failViewerLoad = true
    await firstCell.click({ force: true })
    const dialog = page.getByRole('dialog', { name: '圖片檢視器' })
    const viewerImage = dialog.locator('.image-viewer-area picture img')
    await expect(dialog.getByText('IMAGE UNAVAILABLE', { exact: true })).toBeVisible({ timeout: 10_000 })

    failViewerLoad = false
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await firstCell.click({ force: true })
    await expect(dialog).toBeVisible()
    await expect.poll(() => viewerImage.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0), { timeout: 10_000 }).toBe(true)
    await expect(dialog.getByText('IMAGE UNAVAILABLE', { exact: true })).toBeHidden()
    await expect(dialog.getByText('LOADING', { exact: true })).toBeHidden()
  })

  test('點圖開啟 → ESC 關閉', async ({ page }) => {
    await openEventSeries(page)

    // 進入事件預設展開 → 接觸印樣瀑布流可見；點第一格開 lightbox
    const firstCell = page.locator('.contact-sheet__btn').first()
    await firstCell.waitFor({ state: 'visible', timeout: 15_000 })
    // The initial frame skips the blurred entrance state and receives request priority.
    await expect(firstCell.locator('img')).toHaveAttribute('fetchpriority', 'high')
    await expect(firstCell.locator('img')).toHaveCSS('filter', 'saturate(0.9) contrast(1.02)')
    await expect(firstCell.locator('..')).toHaveClass(/contact-sheet__cell--developed/)
    await firstCell.click({ force: true })

    const dialog = page.getByRole('dialog', { name: '圖片檢視器' })
    await expect(dialog).toBeVisible()
    const viewerImage = dialog.locator('.image-viewer-area picture img')
    await expect.poll(() => viewerImage.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true)
    await expect(dialog.getByText('LOADING', { exact: true })).toBeHidden()

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })

  test('方向鍵切換下一張（index 1/N → 2/N）', async ({ page }) => {
    await openEventSeries(page)

    const firstCell = page.locator('.contact-sheet__btn').first()
    await firstCell.waitFor({ state: 'visible', timeout: 15_000 })
    await firstCell.click({ force: true })

    const dialog = page.getByRole('dialog', { name: '圖片檢視器' })
    await expect(dialog).toBeVisible()

    // 主索引是頂部工具列的 `<p><span>N</span><span>／</span><span>M</span></p>`。
    // 分隔符為全形「／」（jp-kansuji 風格，刻意），regex 接受 ASCII `/` 或全形 `／`
    // 兩者擇一，以免日後若改回 ASCII 又要改 test。
    // dialog 內同時有 radial menu 也會出現類似 `1 / N`，只取 `<p>` 避免 strict mode 炸。
    const viewerImage = dialog.locator('.image-viewer-area picture img')
    await expect.poll(() => viewerImage.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true)
    await expect(dialog.getByText('LOADING', { exact: true })).toBeHidden()
    const firstViewerSrc = await viewerImage.getAttribute('src')
    const firstViewerAlt = await viewerImage.getAttribute('alt')
    const indexP = dialog.locator('p').filter({ hasText: /^\s*\d+\s*[／/]\s*\d+\s*$/ })

    await expect(indexP).toHaveText(/^\s*1\s*[／/]\s*\d+\s*$/)

    await page.keyboard.press('ArrowRight')

    await expect(indexP).toHaveText(/^\s*2\s*[／/]\s*\d+\s*$/, { timeout: 5_000 })
    await expect.poll(() => viewerImage.getAttribute('src')).not.toBe(firstViewerSrc)
    await expect.poll(() => viewerImage.getAttribute('alt')).not.toBe(firstViewerAlt)
    await expect.poll(() => viewerImage.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0), { timeout: 10_000 }).toBe(true)
    await expect(dialog.getByText('LOADING', { exact: true })).toBeHidden()

    await page.keyboard.press('Escape')
  })
})
