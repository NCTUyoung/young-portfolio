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
  - **Pinia `storesDirs`**：`@pinia/nuxt` 是用 `resolve(layer.app, storeDir)` 解析，而在 Nuxt 4 `layer.app` 已經是 `app/`。若寫 `storesDirs: ['./app/stores']` 會變成 `app/app/stores`（不存在）→ `useXxxStore` 全數 auto-import silent fail，dev 會看到 `ReferenceError: useAdminStore is not defined`。正解：**不設 `storesDirs`，交給預設（`<srcDir>/stores` = `app/stores`）**；真要寫就寫 `'./stores'` 或絕對路徑。
  - **SSR 讀 public JSON 不能走 HTTP**：`app/stores/galleryLoaders.ts` 之前無論 client 還 server 都用 `$fetch(baseURL + '/galleryList.json')`。Nitro 在 server 端會把這個 URL 先丟進 Vue Router catchall 評估（找不到 page route → `[Vue Router warn] No match found for location with path "/galleryList.json"`），Nuxt 4 下更會升級成 `[unhandledRejection] 404 Page not found`（即使最終 public handler 仍回 200）。正解：**server 端直接 `fs.readFile('public/<filename>')`**，跳過 Nitro router；client 端才走 `$fetch` 配 baseURL 讓 GitHub Pages 供檔。
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
- **CI**：`.github/workflows/deploy.yml` Node 20 → 22；新增 lint/test 前置步驟、build 前 `actions/cache` 快取 `.nuxt`；加 `npm audit --audit-level=high` 作 CVE gate（上游 high/critical 漏洞會讓 build 紅燈，強制升級或 `npm audit fix`）。
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
  - **admin e2e smoke（2026-04 已加）**：`tests/e2e/admin.spec.ts` 五條 — overview 載入、`photography/gallery` 分類切換、四 tab 切換可渲染、管理 tab 開「編輯模式」浮現編輯/刪除按鈕、上傳 tab 空檔時按鈕 disabled + photography 模式可見 EventForm placeholder。**刻意不觸發 upload/delete/update API**（會寫本機 FS 與 `public/*List.json`，污染資料）。
  - **暫緩再拆（仍然）**：admin.ts 還有 659 行、被 ~180 處引用（10 個 component + `pages/admin.vue`）。雖然現在有 smoke e2e 擋住 tab 切換／editMode 的 UI 回歸，但 upload/delete/update 的實際呼叫路徑仍無 e2e；想真正切 `admin-upload` + `admin-manage` 子 store 前，建議再加「mock fetch 版」的上傳／刪除 e2e，或等 admin API 型別再長大（批次操作之類）時順勢動。
- **後台 API**：新端點請先加 `adminApiClient`，再於 store 用 `createApiRequest`。
- **`docs/MAINTENANCE.md`**：已對齊現況目錄與指令（2026-03）。

### P2（品質與長期）

- ~~**圖片格式**（AVIF + WebP）~~（已加，2026-04）：`scripts/generate-thumbs.mjs` 與 `server/utils/thumbFromSource.ts` 同時產 WebP (q=82) 與 AVIF (q=50, effort=4)，`<GalleryPhotographySection>`／`<GalleryMasonryLayout>` 用 `<picture>` 以 `image/avif` → `image/webp` → `<img>` 順序做 fallback（`display: contents` 保持外層 justified layout）。本機 230 張實測：AVIF 6.42 MB vs WebP 10.22 MB，縮 ~37%。`npm run thumbs -- --no-avif` 可只產 WebP；`--force` 強制覆蓋。
- ~~**結構化資料（JSON-LD）**~~（已加，2026-04）：
  - `pages/index.vue` 插 `Person` + `WebSite` schema，`sameAs` 指向 GitHub / Facebook / Instagram / Threads，`author` 由 `SEO_CONFIG.siteUrl` 當 canonical URL。產生器集中在 `app/utils/siteSchema.ts`。
  - `pages/gallery/[[category]]/[[event]].vue` 吐三種 schema：無 event 段且無 `?image=` → `CollectionPage`（`about` 指向作者）；路徑 `/gallery/<cat>/<event>` → `ImageGallery` 含 `hasPart` 最多 20 張 `ImageObject`；`?image=` → 單張 `ImageObject`，帶 `creator` / `dateCreated` / `keywords`（`tags`）。實作在 `app/utils/gallerySeo.ts`。
  - **canonical URL 修正**：`useRequestURL()` 在 `nuxt generate` 時 origin 會是 `http://localhost`；schema 裡的 `url` 特別用 `SEO_CONFIG.siteUrl` 組 origin，避免 Google 把站台當 staging。`og:url` 保留原行為。
  - SSG build 驗證：`.output/public/index.html` 有 2 條 `<script type="application/ld+json">`（Person + WebSite），四個 gallery 頁各 1 條（CollectionPage）。
- **測試**：
  - **Vitest 單元**（`npm run test`）：覆蓋 `utils/galleryUtils.ts`、`utils/formatters.ts`、`utils/validators.ts`、`utils/justifiedGalleryLayout.ts`、`utils/imagePaths.ts`、`utils/gallerySeo.ts`、`utils/siteSchema.ts`、`utils/radialNavigation.ts` 與 `stores/*Selectors.test.ts`。
  - **Playwright e2e**（`npm run test:e2e`）：`tests/e2e/` 已建骨架 — `home.spec.ts`（首頁 Hero / Gallery 連結）、`gallery.spec.ts`（`/gallery/photography` 80 works + 事件 tab 切換）、`image-viewer.spec.ts`（點圖開 lightbox + ESC + ArrowRight 切換）。baseURL 含 `/young-portfolio/`；`webServer.reuseExistingServer` 會重用本機 `npm run dev`。
  - **CI e2e**（2026-04 加）：`deploy.yml` 於 `Build` 後跑 Playwright，透過 `actions/cache` 快取 `~/.cache/ms-playwright`，失敗會擋 deploy，reports 以 `playwright-report/` artifact 上傳保留 7 天。待補：主題切換刷新不閃爍。
- **型別**：`types/gallery.ts` 為主；避免在元件內重複定義 props 型別，改 `import type`。
- **ESLint**：`eslint.config.mjs` 在 `withNuxt()` 上追加 flat 區塊：`parserOptions.projectService: true`、`tsconfigRootDir` 指向 repo 根；`@typescript-eslint/consistent-type-imports` 設為 **warn**（`prefer: type-imports`）。避免 `typeof import('foo')` 型別註解，可改 `import type * as FooNS from 'foo'` + `typeof FooNS`。
- **後台 UX**：`pages/admin.vue` 以 `pageReady` 控制首次雙分類載入完成後才顯示主內容；載入中顯示與前台類似的 loading；全域錯誤條（非 upload 分頁）可手動關閉。
- **後台美感檢查（2026-04）**：對照 `.cursor/rules/design-aesthetic.mdc` 做了一輪截圖比對（7 張 before + 2 張 after，dark/light，放 `docs/screenshots/admin-review/`），完整報告見 `docs/AESTHETIC_REVIEW_ADMIN.md`。已修三處：(a) `GridView.vue` 編輯/刪除按鈕由 `bg-blue-500`／`bg-red-500` 鮮色圓鈕改成 stone 毛玻璃（編輯）＋ accent 毛玻璃（刪除語義），不再違反「色點稀有化」；(b) `admin.vue` 頁頂 header 由 `bg-stone-950` 粗色塊 + amber 粗直條改走「毛玻璃 + stone 直條 + jp-hairline 底線」，與 `default.vue` nav 同語言；(c) **全案 `amber-*` → `accent-*`（118 處 / 10 支 admin 檔）**，色相由「琥珀黃 `#f59e0b`」轉為指示書要求的「赤陶 `#db7b2e`」，`shared/types/gallery.ts` 的 `amber` 色票 key 屬 domain token 保留不動。前台（`default.vue` 與 `components/gallery/**`）本無 `amber-*`，故不受影響。

### P3（長期 / 願景）

- `app/stores/imageViewer` 目前承擔 lightbox 狀態、拖曳、導航、Info/Radial（462 行）。
  - **Prep（2026-04 已做）**：把 radial 純演算法抽到 `app/utils/radialNavigation.ts`（`calcRadialXY` / `computeRadialVisibleWindow` / `lerp` / `easeOutQuad`）並建 12 個 unit test；`startRadialAnimation` 裡兩段 inline `getVisibleAt` 重複邏輯也收斂成單一 helper。
  - **暫緩真正的切 store**：剩下不純的部分（`startRadialAnimation`、`selectRadialImage`、縮放／拖曳 state 與 `posMap` reactive 動畫）對 DOM 與 `requestAnimationFrame` 耦合深，Playwright smoke 目前只驗開啟／ESC／ArrowRight，不足以抓 radial 動畫 / 選區放大回歸。等 e2e 把 radial 點擊、選區縮放、info panel toggle 覆蓋到再動。
- ~~Nuxt 4 升級~~（已完成 2026-04）。下一步關注 Nuxt 4 minor 更新與 Vue 3.6 / Nitro 5。
- ~~dev/prerender 的 `/galleryList.json` / `/photographyList.json` 404 噪音~~（已修，2026-04；見 Nuxt 4 踩雷「SSR 讀 public JSON 不能走 HTTP」）。
- ~~CVE gate~~（已加，2026-04；CI 現在跑 `npm audit --audit-level=high`）。
- ~~加 Playwright e2e 進 CI~~（已加，2026-04；見上面 P2 的「CI e2e」）。

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
