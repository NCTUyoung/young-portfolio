import { test, expect, type Page } from '@playwright/test'

/**
 * 後台 `/admin` smoke e2e。
 *
 * 刻意「不」觸發任何 write API（upload / delete / update）：這些都會實際寫本機
 * 檔案系統與 `public/*List.json`，一跑就污染本機資料，CI 上也不會有合理 fixture。
 *
 * smoke 目標：把 `stores/admin` 最常 regress 的幾條線驗到 UI layer：
 *   1. 首次載入會打兩條 `/api/gallery?category=...`，pageReady 才放行主內容。
 *   2. 4 個 tab（概覽 / 上傳 / 管理 / 設定）初次點進去都要能渲染。
 *   3. 進「管理」→ 開「編輯模式」→ 卡片 hover 會出現編輯／刪除按鈕（不按下）。
 *   4. 進「上傳」→ 沒選檔時「上傳圖片」按鈕 disabled；EventForm 佔位字顯示。
 *
 * 這份 spec 之後若要再拆 `admin-upload` / `admin-manage` 子 store，應該全綠。
 */

async function openAdminAndWaitReady (page: Page) {
  await page.goto('/admin')

  // header「後台管理」會在 CSR 掛載後渲染。/admin 是 ssr:false（CSR-only），
  // CI 冷載入有時 >5s，給較寬的 timeout 對齊下方 spinner 等待，避免 flaky。
  await expect(page.getByRole('heading', { name: '後台管理' })).toBeVisible({ timeout: 15_000 })

  // pageReady 切到 true 後，載入 spinner 消失；用 role=status 的存在與否辨識
  await expect(page.getByRole('status').filter({ hasText: 'Loading' })).toBeHidden({ timeout: 15_000 })
}

test.describe('後台 /admin — overview', () => {
  test('首次載入後顯示概覽統計（總數／本月／事件）', async ({ page }) => {
    await openAdminAndWaitReady(page)

    // 概覽 tab 是預設 active，`Overview` 小標應可見
    await expect(page.getByText('Overview', { exact: true })).toBeVisible()

    // 四個統計 label（label 文字 + 數字），用 label 找就好
    await expect(page.getByText('總數', { exact: true })).toBeVisible()
    await expect(page.getByText('本月', { exact: true })).toBeVisible()
    await expect(page.getByText('事件', { exact: true })).toBeVisible()

    // 「近 6 個月」柱狀圖區塊
    await expect(page.getByText('近 6 個月', { exact: true })).toBeVisible()

    // 「最近上傳」區塊；本機不確定有沒有上傳，兩種情況都算合格：
    //   - 有資料：看到縮圖
    //   - 無資料：看到「尚無上傳的作品」
    const recentHeader = page.getByText('最近上傳', { exact: true })
    await expect(recentHeader).toBeVisible()
  })

  test('切換 繪圖 / 攝影 分類按鈕會更新 active 樣式', async ({ page }) => {
    await openAdminAndWaitReady(page)

    // 概覽區內的分類切換在 `<header>` 裡；取文字較穩
    const photoBtn = page.getByRole('button', { name: '攝影作品', exact: true }).first()
    const galleryBtn = page.getByRole('button', { name: '繪圖作品', exact: true }).first()

    await expect(galleryBtn).toBeVisible()
    await photoBtn.click()

    // click 後應滑到「攝影」選中；統計的「相機」label 在 photography 分類才出現
    await expect(page.getByText('相機', { exact: true })).toBeVisible()
  })
})

test.describe('後台 /admin — tabs', () => {
  test('四個 tab（上傳 / 管理 / 設定）都能進入並渲染對應 section', async ({ page }) => {
    await openAdminAndWaitReady(page)

    // 上傳
    await page.getByRole('button', { name: '上傳', exact: true }).click()
    await expect(page.getByRole('heading', { name: '上傳作品' })).toBeVisible()
    await expect(page.getByText('選擇圖片', { exact: true })).toBeVisible()

    // 管理
    await page.getByRole('button', { name: '管理', exact: true }).click()
    await expect(page.getByRole('heading', { name: '管理作品' })).toBeVisible()
    await expect(page.getByRole('button', { name: '編輯模式' })).toBeVisible()

    // 設定
    await page.getByRole('button', { name: '設定', exact: true }).click()
    await expect(page.getByRole('heading', { name: '系統設定' })).toBeVisible()
    await expect(page.getByText('預設設定', { exact: true })).toBeVisible()
  })
})

test.describe('後台 /admin — 編輯模式', () => {
  test('管理 tab 開編輯模式，卡片上浮現編輯／刪除按鈕', async ({ page }) => {
    await openAdminAndWaitReady(page)

    await page.getByRole('button', { name: '管理', exact: true }).click()
    await expect(page.getByRole('heading', { name: '管理作品' })).toBeVisible()

    // 開編輯模式
    const editBtn = page.getByRole('button', { name: '編輯模式' })
    await expect(editBtn).toBeVisible()
    await editBtn.click()

    // 開了後按鈕文字變「退出編輯」；卡片上的編輯 / 刪除按鈕用 title 抓（lucide SVG 無文字）
    await expect(page.getByRole('button', { name: '退出編輯' })).toBeVisible()

    // 管理 tab 有可能是空資料（本機測試帳號沒作品）— 若有作品才驗刪除按鈕
    const deleteButtons = page.locator('button[title="刪除圖片"]')
    const editButtons = page.locator('button[title="編輯圖片"]')
    const hasItems = await deleteButtons.count() > 0
    if (hasItems) {
      await expect(deleteButtons.first()).toBeVisible()
      await expect(editButtons.first()).toBeVisible()
    }
  })
})

test.describe('後台 /admin — 上傳 UI（不實際送出）', () => {
  test('沒選檔時，「上傳圖片」按鈕 disabled；切到攝影可見事件名稱 placeholder', async ({ page }) => {
    await openAdminAndWaitReady(page)

    await page.getByRole('button', { name: '上傳', exact: true }).click()
    await expect(page.getByRole('heading', { name: '上傳作品' })).toBeVisible()

    // 預設 uploadCategory=gallery，EventForm 只顯示「自動事件分類」說明
    await expect(page.getByText('自動事件分類', { exact: true })).toBeVisible()

    // 切到攝影 → EventForm 渲染 radio（新事件／既有事件）與事件名稱欄位
    // 分類 select 在 header 右側，改用下拉值切換（避免按鈕歧義）
    const uploadCategorySelect = page
      .locator('section:has(h2:has-text("上傳作品")) select')
      .first()
    await uploadCategorySelect.selectOption('photography')

    await expect(
      page.getByPlaceholder('例如：春日街拍、2024 新北耶誕城')
    ).toBeVisible()

    // 上傳送出按鈕—未選檔應 disabled
    const submitBtn = page.getByRole('button', { name: /上傳圖片/ })
    await expect(submitBtn).toBeVisible()
    await expect(submitBtn).toBeDisabled()
  })
})
