# 項目維護指南

## 項目概述

Nuxt 4 作品集（數位繪圖 + 攝影），部署於 **GitHub Pages**，`app.baseURL` 為 `/young-portfolio/`。

### 技術棧

- **框架**: Nuxt 4、Vue 3.5+、TypeScript、Node 22+
- **狀態**: Pinia（`gallery`、`imageViewer`、`admin`；位於 `app/stores/`）
- **樣式**: Tailwind CSS
- **工具**: VueUse、HeadlessUI、Leaflet（地圖）、`@nuxt/icon` + lucide
- **測試**: Vitest（`npm run test`）

## 目錄結構（Nuxt 4 慣例）

```
nctuyoung.github.io/
├── app/                             # Nuxt 4 的 srcDir，對應 ~/ 與 @/
│   ├── app.vue
│   ├── assets/
│   ├── components/
│   │   ├── gallery/                 # GalleryPhotographySection、GalleryAllMixedSection
│   │   ├── EventMap.vue
│   │   ├── ImageViewer.vue          # 已加 focus trap + @nuxt/icon
│   │   └── ...
│   ├── composables/                 # 見 composables/README.md（勿加 index.ts barrel）
│   ├── layouts/
│   ├── pages/
│   │   ├── index.vue
│   │   ├── gallery/[[category]].vue # /gallery/all|digital|photography
│   │   ├── admin.vue                # 僅本機 dev 使用，已設 ssr:false + prerender:false
│   │   └── article.vue
│   ├── stores/
│   │   ├── gallery.ts、gallerySelectors.ts、galleryLoaders.ts、galleryConstants.ts
│   │   ├── imageViewer.ts
│   │   ├── admin.ts、adminSelectors.ts、adminApiClient.ts、adminTypes.ts
│   └── utils/
│       ├── galleryUtils.ts、formatters.ts、validators.ts、imageUtils.ts
│       ├── gallerySeo.ts、justifiedGalleryLayout.ts
│       └── *.test.ts                # Vitest
├── shared/                          # 跨 app + server 共用，需用 ~~/shared/... 前綴
│   ├── types/gallery.ts
│   └── config/constants.ts
├── server/                          # server routes / utils（Nuxt 4 仍在 root）
│   ├── api/
│   └── utils/galleryDataStore.ts    # atomic write + mutex
├── public/                          # 靜態資源、sitemap.xml、robots.txt
├── scripts/                         # generate-thumbs.mjs 等離線腳本
├── docs/
│   ├── MAINTENANCE.md               # 本檔
│   └── PROJECT_HEALTH.md            # 健檢與後續優先級
├── nuxt.config.ts
├── vitest.config.ts                 # alias: ~ → app/、~~ → root
└── eslint.config.mjs
```

## 已完成的重構（摘要）

| 項目 | 說明 |
|------|------|
| 圖片庫 | 路由分類、`useGalleryImageRoute`、`useGalleryCategoryRoute`、攝影 justified 版面（`utils/justifiedGalleryLayout`）、子元件拆分 |
| Gallery store | `galleryLoaders` / `galleryConstants` 與 store 分離 |
| 後台 | `adminApiClient` + `adminTypes`；`useApi().createApiRequest`（後台多為 `showToast: false`）；`admin.vue` 首次載入用 `pageReady` + loading／全域錯誤條 |
| 測試 | `utils/galleryUtils`、`formatters`、`validators`；selectors 見 `*Selectors.test.ts`（見 `*.test.ts`） |
| ESLint | `consistent-type-imports`（warn，type-aware：`projectService` + `tsconfigRootDir`） |

**已移除／不存在於倉庫**：`useGalleryFilters`、`useRadialNavigation`、`GalleryFilter.vue`（舊文檔誤載，請勿再引用）。

## 維護檢查清單

### 日常

- [ ] 圖片與 JSON（`public/*.json`）路徑與 `useImagePath` 一致  
- [ ] **縮圖**：後台 **本機 `nuxt dev` 上傳**（`/api/upload`）會自動為新檔產生 `_thumbs/{400w,800w}`；若你**手動複製**原圖到 `public/images/**`、或需全庫重產，仍執行 `npm run thumbs`。刪除單圖／整個事件時，API 會一併刪除對應 WebP 縮圖。  
- [ ] 響應式與圖片庫分類切換  
- [ ] SEO meta（圖片庫見 `pages/gallery/[[category]].vue`）

### 圖片效能（離線 WebP 縮圖）

- **網格／列表**：使用 `useImagePath()` 的 `getThumbPath`、`getGridImageSrcset`、`gridImageSizes`；實體檔由 **`scripts/generate-thumbs.mjs`** 全量掃描，或 **`server/utils/thumbFromSource.ts`** 在上傳成功時單檔產生（與腳本相同 **sharp** 參數）。  
- **原圖**：`getImagePath` 用於 `ImageViewer`、histogram、後台編輯／lightbox 等需像素級檢視處。  
- **`@nuxt/image`**：**已移除**（GitHub Pages 純靜態，離線產生的 WebP `_thumbs/{400w,800w}` 搭配 `srcset`/`sizes` 已足夠）。若未來要接 IPX／雲端 provider，再重新裝回並驗 `nuxt generate` 產物。

### 發版前

```bash
npm run lint
npm run test
npm run build
```

### 新增功能時

- 型別以 `shared/types/gallery.ts` 為主，用 `import type ... from '~~/shared/types/gallery'`（app 與 server 都同樣寫法）
- 後台新 API：先 `app/stores/adminApiClient`，再在 store 用 `createApiRequest`
- 純邏輯放 `app/utils/`，並可補 `*.test.ts`
- 新 UI 圖示優先用 `<Icon name="lucide:..." />`（`@nuxt/icon` + `@iconify-json/lucide`）

## 開發指令

```bash
npm install
npm run dev
npm run build
npm run preview
npm run thumbs        # 掃描 public/images 產生 _thumbs/400w、800w WebP（新增照片後建議執行）
npm run test          # Vitest 單次
npm run test:watch    # 監聽模式
```

## 故障排除

### 圖片無法載入

1. `nuxt.config` 的 `baseURL` / `app.baseURL`  
2. `useImagePath` 組出的路徑  
3. GitHub Pages 子路徑是否為 `/young-portfolio/`

### 圖片庫篩選異常

1. Pinia `gallery` 的 `filterState`（含 `useLocalStorage`）  
2. `EventFilter` / `GalleryTabBar` 與路由同步

### 建置失敗

1. TypeScript／ESLint 錯誤  
2. `npm ci` 與 Node 版本  
3. 見 `docs/PROJECT_HEALTH.md`

## 優化路線圖（滾動）

### 短期（可選）

- [x] 篩選／分組邏輯已抽 `stores/gallerySelectors.ts`（快取仍留在 `gallery` store）  
- [x] 後台管理／概覽統計已抽 `stores/adminSelectors.ts`（`admin` store 保留狀態與 actions）  
- [ ] 元件層 loading / error 一致性  

### 中期（可選）

- [x] 網格載入 **WebP 縮圖** + `srcset`／`sizes`（見 `utils/imagePaths.ts`、`npm run thumbs`）  
- [ ] 大量圖片時虛擬列表評估  
- [ ] 擴充 Vitest 覆蓋面（composables 需 Nuxt 測試環境時再評估）  

### 長期（可選）

- [ ] PWA、i18n、進階圖像處理等  

## 相關資源

- [Nuxt](https://nuxt.com/)、[Pinia](https://pinia.vuejs.org/)、[Tailwind](https://tailwindcss.com/)  
- 倉庫內：[app/composables/README.md](../app/composables/README.md)、[PROJECT_HEALTH.md](./PROJECT_HEALTH.md)

---

*最後更新：2026-04（Nuxt 4.4 + 新 `app/` / `shared/` 目錄結構）*
