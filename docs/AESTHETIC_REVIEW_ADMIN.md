# Admin 後台 — 美感檢查報告

對照 `.cursor/rules/design-aesthetic.mdc`，逐項檢視 `/admin` 頁現況與落差。
截圖於 `docs/screenshots/admin-review/`（dark / light 兩組共 7 張）。

截圖檔：

- 概覽（dark）：`admin-01-overview-dark.png`
- 管理（dark）：`admin-02-manage-dark.png`
- 上傳（dark）：`admin-03-upload-dark.png`
- 設定（dark）：`admin-04-settings-dark.png`
- 概覽（light）：`admin-05-overview-light.png`
- 管理・編輯模式（light）：`admin-06-manage-editmode-light.png`
- 卡片編輯/刪除 hover（light）：`admin-07-card-edit-hover-light.png`

---

## 1. 檢查對照表

| # | 指示書條目 | 現況 | 判定 | 行動 |
|---|---|---|---|---|
| 1 | dark:* 雙寫 | admin.vue + 11 支子元件皆雙寫 | ✅ 符合 | — |
| 2 | **黑白灰 + 一點赤陶（`accent`）**；禁多色 dot | admin 頁廣泛用 tailwind 內建 **`amber-*`**（40+ 處），而指示書要求 `accent-*`（`#db7b2e` 赤陶系）。`amber-500 = #f59e0b` 偏黃、`accent-500 = #db7b2e` 偏赤，視覺差約 20% hue | ⚠️ 偏離，未處理 | **P2** 再擇期全案替換，需使用者批准 |
| 3 | **色點稀有化**；不用亮色大按鈕 | `gallery/GridView.vue` 編輯模式浮現 `bg-blue-500` 圓鈕 + `bg-red-500` 圓鈕，兩個鮮色擺同格 | ❌ 違反 | **已修**：改 stone 邊框＋白底毛玻璃（編輯）＋ accent 邊框／accent 文字（刪除），語義保留但色點降強度 |
| 4 | **Hairline > 粗線** | 頁頂 `<header>` 用 `bg-stone-950` 整條粗色塊，搭 `w-1 h-6 bg-amber-500` 粗直條 | ⚠️ 偏離 | **已修**：header 改毛玻璃 `bg-stone-50/80 dark:bg-stone-900/60 backdrop-blur-md`，直條改 `bg-stone-900 dark:bg-stone-100` 與 `default.vue` 品牌 Logo 對齊，底部加 `jp-hairline` |
| 5 | CTA 低調（`text + underline on hover` 或 `jp-frame` 包細邊） | 上傳送出按鈕 light `bg-stone-800`、dark `bg-amber-700` | ✅ 可接受 | dark 可改 `dark:bg-accent-700` 連動 #2 |
| 6 | 節標題範式：`jp-eyebrow` → `jp-section-title` → `jp-section-ruby` | Overview 有 `jp-section-label`；其他 3 個 tab 用普通 `<h2 class="text-xl font-light">` | ⚠️ 局部 | **P3** 4 個 tab 的 `<h2>` 可加上 eyebrow + ruby，待整套語系確定後再做 |
| 7 | 余白優先、`py-20 md:py-28` 起跳 | Overview / 管理 / 上傳 / 設定 各走 `p-8 md:p-10`，密度明顯高於前台節 | ⚠️ 意圖性偏離 | 後台是工具箱型頁面、使用者只有站長，密度可容忍；**不處理** |
| 8 | 圖片走 `useImagePath.getThumbPath` | Overview 最近上傳 / Manage / UploadArea 皆已用 | ✅ 符合 | — |
| 9 | 裝飾性字 `aria-hidden` | loading spinner（雙圓環）無文字意義 ok；header 直條加 `aria-hidden="true"` | ✅ 符合 | — |
| 10 | 動畫支援 reduced-motion | 走 Tailwind 預設 `transition-*`（內建尊重 reduced-motion）；自訂 keyframe 未在 admin 頁出現 | ✅ 符合 | — |

---

## 2. 本輪已修

### 2.1 `app/components/admin/gallery/GridView.vue` — 編輯/刪除按鈕

- 原：`bg-blue-500` / `bg-red-500` 飽和圓鈕，兩個鮮色擺一起 → 違反「色點稀有化」。
- 改：
  - **編輯**：`border border-stone-300 bg-white/85 text-stone-700` 毛玻璃鈕 +
    hover 時 `border-stone-500 text-stone-900`。語義「進一步操作」→ 中性灰。
  - **刪除**：`border-accent-400 bg-white/85 text-accent-700` 毛玻璃鈕 +
    hover 時 `border-accent-600 text-accent-800`。語義「危險」→ 走赤陶警示
    （指示書「accent.500~700」範圍），而不用鮮紅。
  - 雙寫 dark mode：`dark:bg-stone-900/70` 取代白底，邊框與 text 用 stone-200/accent-300 系。

### 2.2 `app/pages/admin.vue` — 頁頂標題列

- 原：`<header class="bg-stone-950">` 整條粗色塊 + `<div class="w-1 h-6 bg-amber-500">`
  粗色直條，在 light mode 下與主內容 `bg-white` 對比粗暴、不是 hairline 風格。
- 改：
  - 容器改毛玻璃 `bg-stone-50/80 dark:bg-stone-900/60 backdrop-blur-md`，與前台
    `default.vue` 的 nav 同一套視覺語言。
  - 直條改 `span h-[1.2em] w-[2px] bg-stone-900 dark:bg-stone-100`，與品牌 Logo
    左緣的單色直條完全對齊。
  - 底線加 `<div class="jp-hairline w-full" />`，走指示書規定的「極細漸淡分隔線」。
  - 所有 light/dark 配色成對雙寫。

### 2.3 覆蓋測試

- `tests/e2e/admin.spec.ts` 5 條 smoke 全綠（原樣未動 selector；修的是視覺而非結構）。

---

## 3. 本輪未處理（交使用者批准後再做）

| 優先 | 項目 | 規模 | 備註 |
|---|---|---|---|
| **P2** | 全案 `amber-*` → `accent-*` 替換 | 40+ 處跨 `admin.vue` / 11 支 admin 子元件 / `default.vue` | 色會從「偏黃琥珀」變成「偏赤陶」，是整站色調決策；建議和「要不要整站跟進（前台）」一起討論再動 |
| **P3** | 4 個 admin tab `<h2>` 加 `jp-eyebrow` / `jp-section-ruby` | 4 處 | 錦上添花，後台功能頁可延後 |
| **P3** | 上傳送出按鈕 dark `bg-amber-700` → `bg-accent-700` | 1 處 | 與 P2 連動一起做 |

---

## 4. 截圖說明

7 張截圖在 `docs/screenshots/admin-review/`，檔名前綴編號即為順序：

1. **dark / 概覽**：統計卡、「近 6 個月」柱狀、「最近上傳」網格。柱狀的 amber 橘黃在 dark 下偏亮，就是 #2 想討論的點。
2. **dark / 管理**：篩選列（分類／事件／網格列表／編輯模式／重新載入）、統計 hairline 條、事件卡片列。
3. **dark / 上傳**：預設繪圖模式 → EventForm 顯示「自動事件分類」說明；虛線 dropzone、上傳 / 清除 CTA 對照。
4. **dark / 設定**：4 個分組（預設／圖片處理／系統功能／介面偏好），滑桿的 amber 色點（#2 同源）。
5. **light / 概覽**：對比 #1 看色彩穩定度。**頁頂強黑色塊 header 與白底對比粗暴**，就是 #4 修正的點。
6. **light / 管理・編輯模式**：「退出編輯」按鈕目前是 `bg-red-50 text-red-600`（OK 因屬狀態色），但色彩語言要和 #2 一起調。
7. **light / 卡片編輯/刪除浮出**：本輪 **#3 已修**，之後重新截圖應看到 stone/accent 系。
