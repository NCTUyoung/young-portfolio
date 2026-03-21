# Agent / 維護備忘

- **部署**：GitHub Pages，`app.baseURL` = `/young-portfolio/`；靜態資源與 `useImagePath` 依此組路徑。
- **圖片庫路由**：`pages/gallery/[[category]].vue`；分類 `all` | `digital` | `photography`。Lightbox 與 `?image=<id>` 由 `useGalleryImageRoute` 同步。列表篩選邏輯在 `stores/gallerySelectors.ts`。
- **攝影作品網格**：`GalleryPhotographySection` 為 **justified rows**（`utils/justifiedGalleryLayout.ts`）：依容器寬與長寬比決定 **每列張數**，同列等高、寬度依比例分配並填滿列寬（類 Google Images）；非固定雙欄。需 `ResizeObserver` + 圖片 `naturalWidth/Height` 更新比例。
- **檢視器**：僅使用 Pinia `stores/imageViewer`，勿再引入已刪除的 viewer composable。
- **Composables**：說明見 `composables/README.md`；勿加 `composables/index.ts` barrel（與 Nuxt auto-import 衝突）。
- **健檢／重構優先級**：見 `docs/PROJECT_HEALTH.md`；維護目錄與指令見 `docs/MAINTENANCE.md`。
- **後台 API**：`stores/adminApiClient.ts` + `stores/adminTypes.ts`；純計算見 `stores/adminSelectors.ts`；store 內用 `useApi().createApiRequest`（通常 `showToast: false`）。勿用 `stores/admin/` 資料夾（與 `admin.ts` 檔名在 Windows 衝突）。`pages/admin.vue`：`pageReady` 首次載入完成前顯示 loading；非 upload 分頁可顯示可關閉的全域錯誤條。
- **ESLint**：`consistent-type-imports` 為 warn；動態模組型別勿用 `typeof import('pkg')`，改用 `import type * as Pkg from 'pkg'` + `typeof Pkg`。
- **測試**：`npm run test`（Vitest）；`utils/*.test.ts`（`galleryUtils`、`formatters`、`validators`）。
- **回應語言**：使用者偏好中文說明；程式與註解可用英文。
