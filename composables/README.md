# Composables

Nuxt 會自動匯入 `composables/*.ts` 內的 `use*` 函式，頁面與元件可直接呼叫。手動 import 時請用 **`~/composables/useXxx`**（勿加 `index.ts` barrel，以免與 auto-import 重複註冊）。

## 使用中（與 UI 連線）

| 檔案 | 用途 |
|------|------|
| `useImagePath.ts` | 依 `app.baseURL` 組出 `/images/...` 路徑與完整 URL |
| `useToast.ts` | Toast UI；`useGlobalToast()` 為單例，供多處共用 |
| `useScrollReveal.ts` | IntersectionObserver，`.reveal` 等進場動畫 |
| `useGalleryImageRoute.ts` | 圖片庫頁：`?image=<id>` 與 lightbox 狀態同步 |
| `useGalleryCategoryRoute.ts` | 圖片庫：`/gallery/:category` 與 Pinia `selectedCategory` 同步 |
| `useGalleryPhotographyLayout.ts` | 攝影區桌面雙欄：行高、`getImageRows`、`getRowGridTemplateColumns`（CSS Grid `grid-template-columns` 字串，避免 Tailwind 任意 class 被 purge） |

## 工具／預留

| 檔案 | 用途 |
|------|------|
| `useApi.ts` | 包一層 `$fetch`：`createApiRequest` 重試／toast；`stores/admin.ts` 已用 `showToast: false` + `adminApiClient` |
| `useEventManagement.ts` | 攝影／數位事件資料與查詢（目前未掛在頁面） |
| `useImageProcessing.ts` | EXIF、標籤、分類等（目前未掛在頁面） |

## 已移除（避免與 Store 重複）

- ~~`useImageViewer.ts`~~：請用 `stores/imageViewer` + `ImageViewer.vue`
- ~~`useRadialNavigation.ts`~~：放射導航邏輯在 `stores/imageViewer`

圖片檢視器狀態一律以 **Pinia `useImageViewerStore`** 為準。
