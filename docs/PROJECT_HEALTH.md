# 專案健檢與可維護性（Rolling）

> 最後更新：2026-04（Nuxt 4.4 + 新版目錄結構／模組升級後）。
> 大型重構請依「優先級」分段進行。

## Nuxt 4 升級紀錄（2026-04）

- **版本**：`nuxt 3.21.2 → 4.4.2`、`@nuxt/icon 1.15.0 → 2.2.1`、`nuxt-headlessui 1.1.x → 1.2.2`、`@pinia/nuxt 0.5.x → 0.11.3`。
- **目錄結構（新預設）**：
  - `app/`：`app.vue`、`assets/`、`components/`、`composables/`、`layouts/`、`pages/`、`stores/`、`utils/`。
  - `shared/`：跨 app 與 server 共用的 `types/`、`config/`。
  - `server/`：保持在 repo 根（Nuxt 4 官方慣例）。
  - `public/`、`docs/`、`scripts/`、`nuxt.config.ts` 等不動。
- **Alias 更動**：`~` / `@` 指向 `app/`；跨 app＋server 的 types/config 請用 `~~/shared/...`（相對於 rootDir）。
  - 一次性批次改：`~/types/*` → `~~/shared/types/*`、`~/config/*` → `~~/shared/config/*`。
- **Pinia**：`storesDirs` 改 `./app/stores/**`。
- **Nuxt 4 Prerender 預設**：`crawlLinks: true` 會從首頁爬所有站內連結。`/admin` 為本機後台頁，會讓 SSG build 失敗。已加：
  - `nitro.prerender.ignore: ['/admin', '/young-portfolio/admin']`
  - `nitro.prerender.failOnError: false`
  - `routeRules['/admin']: { ssr: false, prerender: false }`
- **TypeScript**：Nuxt 4 產生 4 份 tsconfig（`tsconfig.app.json` / `tsconfig.server.json` / `tsconfig.shared.json` / `tsconfig.node.json`）。`vitest.config.ts` 不在任一 tsconfig 的 include 內，ESLint flat config 已將它列入 `ignores` 避免 `projectService` 報錯。
- **Vitest alias**：`~`/`@` → `app/`；`~~`/`@@` → repo root，以便測試檔繼續用 `~/utils/...`、`~~/shared/types/...`。
- **踩雷**：
  - 頭一次安裝 `@nuxt/icon@2.x` 時還在 Nuxt 3，會被 disable 並炸 `_createApp is not a function`。升級順序要先升 Nuxt 本體再升 module 2.x。
  - 搬目錄後 `.nuxt/.output/.cache` 務必全清，否則殘留舊的 path 引用。
  - **Tailwind `content` 路徑**：`tailwind.config.js` 的 glob 必須跟著搬到 `app/`（`./app/components/**`、`./app/layouts/**`、`./app/pages/**`、`./app/plugins/**`、`./app/composables/**`、`./app/utils/**`、`./app/app.vue`）。舊路徑掃不到任何檔案時 dev server 會出 `No utility classes were detected in your source files` 警告，**整站 utility class 不會被編入 CSS**，視覺上像 JS/CSS 全掛（只剩 plain flow）。
- **Dev Server 微調（Windows + Vite 7）**：
  - **Leaflet CSS 改為元件層 import**：`nuxt.config.ts` 的 `css[]` 移除 `'leaflet/dist/leaflet.css'`，改於 `app/components/EventMap.vue` 的 `<script setup>` 頂部 `import 'leaflet/dist/leaflet.css'`。
    - 原因：Vite 7 在 Windows 透過 `@fs` 絕對路徑載入 `node_modules` 內 CSS 時，dev server 會回 `application/json` 觸發瀏覽器的 `MIME type` 錯誤與 Vue Router `No match found for location with path "/_nuxt/@fs..."` 警告。
    - 好處：地圖 CSS 隨元件 code-split，只有用到地圖的頁面（攝影展分類、event detail）才載入。
  - **`experimental.payloadExtraction: false`**：
    - 原因：Nuxt 4 在 Windows 寫入 `.nuxt/cache/nuxt/payload/<route>` 時未先建立父目錄，dev 刷 `/gallery/photography` 會 500（`ENOENT`）。
    - 取捨：本站資料流走 Pinia 客戶端 fetch `public/*.json`，payload 預抽取對首次與導覽幾乎沒加速；SSG build 照樣預渲染 HTML、GitHub Pages 部署不受影響。
    - 回退：日後 Nuxt patch 修掉 cache dir 建立 bug，可移除此設定回預設。

## 本次健檢批次紀錄（2026-04）

- **相依與環境**：Nuxt 3.17 → 3.21；VueUse / Pinia / Vue / TS / ESLint 一併升版。`npm audit` 由 30 漏洞 → 0。`package.json` 加 `engines.node >= 22`，新增 `.nvmrc`（22）。
- **CI**：`.github/workflows/deploy.yml` Node 20 → 22；新增 lint/test 前置步驟、build 前 `actions/cache` 快取 `.nuxt`。
- **後端安全**：`server/api/upload.post.ts` 加 MIME + 副檔名白名單；新增 `server/utils/galleryDataStore.ts`（atomic write + per-file mutex），所有 gallery 讀寫 API 改走統一入口，避免並發覆蓋。
- **SEO**：新增 `public/sitemap.xml`、`public/robots.txt`；`nuxt.config.ts` 補齊 `color-scheme` / `theme-color` / OG / Twitter / canonical；`pages/index.vue` `useSeoMeta` 擴充 og/twitter。
- **主題閃爍（FOUCD）**：`nuxt.config.ts` 移除 `htmlAttrs.class = 'dark'`，改用 `tagPriority: 'critical'` 的內嵌腳本，依 `localStorage['vueuse-color-scheme']` 於首幀前套類；`layouts/default.vue` 的 `useDark` 顯式指定同一 `storageKey`。
- **死碼**：移除未使用的 `@nuxt/image`。
- **A11y**：
  - `components/ImageViewer.vue` 實作 focus trap（`role="dialog"` + `aria-modal` + Tab 循環 + 還原焦點 + 鎖 body scroll），鍵盤可完整操作。
  - `pages/index.vue` Hero section 加 `role="region"` / `aria-roledescription` / `aria-label`。
  - 工具列按鈕補 `aria-label` / `aria-pressed`；資訊鍵 `I` 切換面板可被輔助技術感知。
- **圖示系統**：導入 `@nuxt/icon` + `@iconify-json/lucide`（離線 bundle，無 CDN 依賴），`ImageViewer` 工具列 / 導航按鈕 inline SVG 替換為 `<Icon name="lucide:..." />`，降低模板雜訊並統一語彙。

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
- **`pages/gallery/[[category]].vue`**：已拆 `components/gallery/GalleryAllMixedSection.vue`；攝影為 `GalleryPhotographySection.vue`（justified rows，`utils/justifiedGalleryLayout.ts`）。路由同步用 `useGalleryCategoryRoute`。

### P1（維護成本）

- **`stores/admin.ts`**：API 見 `adminApiClient`、型別見 `adminTypes`；管理／概覽 **computed** 見 `adminSelectors.ts`；請求經 `useApi().createApiRequest`。若仍覺肥大，可再拆「上傳／管理」子 composable 或子 store。
- **後台 API**：新端點請先加 `adminApiClient`，再於 store 用 `createApiRequest`。
- **`docs/MAINTENANCE.md`**：已對齊現況目錄與指令（2026-03）。

### P2（品質與長期）

- **圖片格式**：若要進一步壓縮體積，可評估離線 `sharp` 一次產出 AVIF + WebP，模板搭配 `<picture>` 依序嘗試。目前策略為 WebP 縮圖 + `srcset/sizes`。
- **結構化資料**：可於 `pages/index.vue`、每場 event 頁加 JSON-LD（`Person` / `ImageGallery` / `CreativeWork`），增強 Google 圖片搜尋的可見度。
- **測試**：Vitest（`npm run test`）；已覆蓋 `utils/galleryUtils.ts`、`utils/formatters.ts`、`utils/validators.ts` 等（見 `*.test.ts`）；store selectors 見 `*Selectors.test.ts`。可再加 Playwright e2e 涵蓋：圖片庫分類切換、lightbox 鍵盤操作、主題切換刷新不閃爍。
- **型別**：`types/gallery.ts` 為主；避免在元件內重複定義 props 型別，改 `import type`。
- **ESLint**：`eslint.config.mjs` 在 `withNuxt()` 上追加 flat 區塊：`parserOptions.projectService: true`、`tsconfigRootDir` 指向 repo 根；`@typescript-eslint/consistent-type-imports` 設為 **warn**（`prefer: type-imports`）。避免 `typeof import('foo')` 型別註解，可改 `import type * as FooNS from 'foo'` + `typeof FooNS`。
- **後台 UX**：`pages/admin.vue` 以 `pageReady` 控制首次雙分類載入完成後才顯示主內容；載入中顯示與前台類似的 loading；全域錯誤條（非 upload 分頁）可手動關閉。

### P3（長期 / 願景）

- `app/stores/imageViewer` 目前承擔 lightbox 狀態、拖曳、導航、Info/Radial；未來可再切成 `viewer-core` + `viewer-interaction`，避免單檔 >400 行。
- ~~Nuxt 4 升級~~（已完成 2026-04）。下一步關注 Nuxt 4 minor 更新與 Vue 3.6 / Nitro 5。
- 修掉 dev/prerender 的 `/galleryList.json`、`/photographyList.json` 404 噪音（某處 client fetch 漏了 `baseURL` 前綴；pre-existing，不是 Nuxt 4 造成的）。

## 依賴與死碼策略

- 移除未使用依賴（例如曾用於已下架 UI 的套件），減少安裝體積與稽核面積。本次已移除 `@nuxt/image`。
- 未引用之 `.vue` 元件應刪除或移入 `components/_archive/` 並在 README 註記，避免誤用。
- 新增 UI 圖示優先用 `@nuxt/icon` + lucide collection；避免再貼 inline SVG。

## 建議 Git／發版流程

1. `npm run lint` + `npm run test` + `npm run build` 通過再推 `master`。
2. GitHub Pages 使用 `nitro.preset: github-pages` 與 `baseURL: /young-portfolio/`；部署路徑變更需同步改 `useImagePath`、SEO `ogUrl`。

## 相關文檔

- [app/composables/README.md](../app/composables/README.md)
- [MAINTENANCE.md](./MAINTENANCE.md)
