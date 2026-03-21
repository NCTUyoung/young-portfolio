# 專案健檢與可維護性（Rolling）

> 最後更新：依倉庫現況整理；大型重構請依「優先級」分段進行。

## 架構總覽

| 層級 | 現況 | 建議 |
|------|------|------|
| **路由** | `pages/` 檔案式路由；圖片庫為 `gallery/[[category]].vue` | 新頁面維持單一職責；複雜頁抽 composable |
| **狀態** | Pinia：`gallery`、`imageViewer`、`admin` | 檢視器以 `imageViewer` 為唯一來源；避免再寫第二套 viewer composable |
| **資料** | 公開站讀 `public/*.json`；後台走 `server/api/*` | 新 API 可逐步改用 `useApi` 包裝（重試、toast） |
| **樣式** | Tailwind + 少量 scoped CSS | 重複的裝飾線／按鈕可抽成小型元件或 `@apply` 片段 |

## 已處理／已對齊

- Composables 目錄有 `README.md`；已移除與 store 重複的 `useImageViewer` / `useRadialNavigation`。
- 圖片庫分類與網址：`/gallery/{all|digital|photography}`；lightbox 與 `?image=` 由 `useGalleryImageRoute` 同步。
- 勿新增 `composables/index.ts` barrel（會與 Nuxt auto-import 重複註冊）。

## 技術債與優先級

### P0（影響正確性或體驗）

- **`stores/gallery.ts`**：JSON 載入見 `galleryLoaders`、座標見 `galleryConstants`；篩選／分組／混合佈局／地圖點見 `stores/gallerySelectors.ts`（store 只組裝 computed 與快取）。
- **`pages/gallery/[[category]].vue`**：已拆 `components/gallery/GalleryPhotographySection.vue`、`GalleryAllMixedSection.vue`，路由同步用 `useGalleryCategoryRoute`，攝影佈局用 `useGalleryPhotographyLayout`。

### P1（維護成本）

- **`stores/admin.ts`**：API 見 `adminApiClient`、型別見 `adminTypes`；管理／概覽 **computed** 見 `adminSelectors.ts`；請求經 `useApi().createApiRequest`。若仍覺肥大，可再拆「上傳／管理」子 composable 或子 store。
- **後台 API**：新端點請先加 `adminApiClient`，再於 store 用 `createApiRequest`。
- **`docs/MAINTENANCE.md`**：已對齊現況目錄與指令（2026-03）。

### P2（品質與長期）

- **測試**：Vitest（`npm run test`）；已覆蓋 `utils/galleryUtils.ts`、`utils/formatters.ts`、`utils/validators.ts` 等（見 `*.test.ts`）；store selectors 見 `*Selectors.test.ts`。
- **型別**：`types/gallery.ts` 為主；避免在元件內重複定義 props 型別，改 `import type`。
- **ESLint**：`eslint.config.mjs` 在 `withNuxt()` 上追加 flat 區塊：`parserOptions.projectService: true`、`tsconfigRootDir` 指向 repo 根；`@typescript-eslint/consistent-type-imports` 設為 **warn**（`prefer: type-imports`）。避免 `typeof import('foo')` 型別註解，可改 `import type * as FooNS from 'foo'` + `typeof FooNS`。
- **後台 UX**：`pages/admin.vue` 以 `pageReady` 控制首次雙分類載入完成後才顯示主內容；載入中顯示與前台類似的 loading；全域錯誤條（非 upload 分頁）可手動關閉。

## 依賴與死碼策略

- 移除未使用依賴（例如曾用於已下架 UI 的套件），減少安裝體積與稽核面積。
- 未引用之 `.vue` 元件應刪除或移入 `components/_archive/` 並在 README 註記，避免誤用。

## 建議 Git／發版流程

1. `npm run lint` + `npm run test` + `npm run build` 通過再推 `master`。
2. GitHub Pages 使用 `nitro.preset: github-pages` 與 `baseURL: /young-portfolio/`；部署路徑變更需同步改 `useImagePath`、SEO `ogUrl`。

## 相關文檔

- [composables/README.md](../composables/README.md)
- [MAINTENANCE.md](./MAINTENANCE.md)
