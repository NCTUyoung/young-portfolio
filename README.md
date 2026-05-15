# Young Portfolio

> NCTU Young 的個人作品集網站。**數位電繪**與**攝影**雙主線敘事；攝影以「event（策展單元）」組織，每個 event 有獨立的時間／地點／hero 與一份預渲染 HTML。

| 項目 | 網址 |
| --- | --- |
| 前台 | <https://nctuyoung.github.io/young-portfolio/> |
| 後台 | <https://nctuyoung.github.io/young-portfolio/admin>（dev-only，正式站不存在） |
| Repo | <https://github.com/NCTUyoung/nctuyoung.github.io> |

---

## 是什麼

- **靜態作品集**：Nuxt 4 SSG，部署於 GitHub Pages 子路徑 `/young-portfolio/`。
- **雙主線**：`digital`（電繪）與 `photography`（攝影），各自獨立的 JSON 資料源、敘事與篩選；2026-05 起已移除 `/gallery/all` 混流。
- **Event 為策展單元**：每個 event = 一個（時間 + 地點 + 主題）的集合。每個 event 在 build 時掃 JSON 列舉、各自預渲染一份 HTML，社群爬蟲（Slack / Discord / X / Threads）能直接讀到對應的 OG hero 與 JSON-LD `ImageGallery`。
- **本機後台**：`/admin` 路由僅在 `npm run dev` 啟用，可上傳／編輯／刪除作品 JSON。`nuxt generate` 會排除這條路由與 `server/api/`。
- **設計語言**：日式編輯（**余白 · 間 · 侘寂**）。stone 為脊、accent 僅作 hairline／印章。光譜上靠 [Rinko Kawauchi](./wiki/sites/rinko-kawauchi.md) ↔ [Hiroshi Sugimoto](./wiki/sites/hiroshi-sugimoto.md) 之間，中間偏簡。

---

## 技術棧

| 領域 | 用什麼 |
| --- | --- |
| 框架 | Nuxt 4（`app/` directory）· Vue 3 · TypeScript（strict） |
| 狀態 | Pinia（純函數 selectors 拆 store 外，可單測） |
| 樣式 | Tailwind CSS 3 · 自家 `jp-*` utility classes · CSS vars（light/dark） |
| 字型 | `@nuxt/fonts`：Outfit + Noto Sans TC + Noto Serif JP（裝飾） |
| 圖標 | `@nuxt/icon` + `@iconify-json/lucide`（client bundle scan，不打 CDN） |
| 地圖 | Leaflet（CSS 在 `EventMap.vue` 元件層 import） |
| 圖檔 | Sharp（`scripts/generate-thumbs.mjs` 產 WebP / 400w + 800w） |
| 測試 | Vitest（unit） · Playwright（e2e） |
| 部署 | Nitro `github-pages` preset → GitHub Pages |

Node **22+** 必裝（見 `.nvmrc`；`predev` / `pretest` / `prelint` 都會擋舊版）。

---

## 本機開發

```bash
npm install
npm run dev          # http://localhost:3000
```

- 後台 `/admin` 與 `server/api/*` 端點**僅** dev server 可用；純 `nuxt generate` 預覽看不到後台。
- 第一次跑前若 `public/images/` 有新圖：`npm run thumbs` 產縮圖。

---

## 指令

| 指令 | 用途 |
| --- | --- |
| `npm run dev` | 開發伺服器（含 admin API、HMR） |
| `npm run generate` | 靜態 SSG → `.output/public/` |
| `npm run preview` | 預覽 build 結果 |
| `npm run build:github` | CI 專用：`npm ci` + `nuxt build --preset github-pages` |
| `npm run typecheck` | `nuxt typecheck`（vue-tsc） |
| `npm run lint` / `lint:fix` | ESLint 9（flat config） |
| `npm run lint:data` | 校驗 `public/*.json` 結構與 event 拼字一致 |
| `npm run test` | Vitest 單元測試（selectors / utils / layout） |
| `npm run test:e2e` | Playwright e2e（需 dev server 同時跑） |
| `npm run thumbs` | 由 `public/images/` 產 `_thumbs/{400w,800w}/` WebP |

**發版前順序**：`typecheck` → `lint` → `lint:data` → `test` → `generate`。

---

## 專案結構

```
app/                          # Nuxt 4 source root
├── pages/
│   ├── index.vue              # 首頁（Hero / About / Domains / Featured / Articles）
│   ├── gallery/
│   │   └── [[category]]/
│   │       └── [[event]].vue  # /gallery/<digital|photography>[/<event>]
│   ├── article.vue
│   └── admin.vue              # ssr: false, prerender: false
├── components/
│   ├── gallery/               # GalleryEventCover, HorizontalStripFeatured, …
│   ├── admin/                 # 後台 UI（dev-only）
│   ├── EventMap.vue           # Leaflet wrapper（default / compact 變體）
│   └── ImageViewer.vue        # Lightbox + radial nav + hit-zone
├── composables/
│   ├── useImagePath.ts        # 圖片路徑 + WebP srcset + 非 ASCII safe encode
│   ├── useScrollReveal.ts     # IntersectionObserver-based reveal
│   └── useGallery{Image,Category,Event}Route.ts   # URL ⇔ store 雙向同步
├── stores/
│   ├── gallery.ts             # 主庫（raw + 直接 computed）
│   ├── gallerySelectors.ts    # 純函數 selectors（vitest 友善）
│   ├── galleryLoaders.ts      # fetch JSON
│   ├── imageViewer.ts         # Lightbox 狀態
│   └── admin*.ts              # 後台（dev-only）
├── utils/                     # eventUtils, imageUtils, justifiedGalleryLayout
└── assets/css/main.css        # :root / .dark CSS vars + jp-* utility classes
server/api/                    # 後台 endpoints（upload / update / delete；dev-only）
public/
├── galleryList.json           # 電繪資料
├── photographyList.json       # 攝影資料（含 EXIF / event / location）
├── images/                    # 原圖
└── images/_thumbs/{400w,800w}/  # 縮圖（由 thumbs 腳本產生）
shared/types/                  # 跨層型別（GalleryItem, FilterState, …）
scripts/                       # thumbs / lint-gallery-data / check-node
wiki/                          # 設計研究知識庫（見下）
docs/                          # MAINTENANCE / PROJECT_HEALTH
```

---

## 資料與圖檔

**兩份 JSON 是唯一事實來源**。Store 在 client 載入後成記憶體主庫；所有衍生資料（篩選／分組／timeline／地圖點）一律走 `gallerySelectors.ts` 的純函數，**store 不存衍生狀態**。

| 路徑 | 說明 |
| --- | --- |
| `public/galleryList.json` | 電繪作品 |
| `public/photographyList.json` | 攝影作品；每張作品的 `event: { name, description, location, lat?, lng? }` |
| `app/stores/galleryConstants.ts` | `GALLERY_EVENT_COORDS_FALLBACK` — 作品 JSON 沒帶座標時的兜底表 |

### Hero 圖規則（重要）

`photographyList.json` 中 `series: ['hero']` 是 hero **單一來源**。OG image、`useSeoMeta`、JSON-LD `Person.image`、首頁 Hero 區塊**全部**由此推導。

> **換 hero**：只改 `series: ['hero']` 落在哪張作品；其他地方都不需要動。

### 圖片路徑

- 一律走 `useImagePath.getThumbPath(path, size)`，**不要**手刻 `'/images/...'` 字串。
- 非 ASCII（中文檔名／空格）由 composable 內 `encodeURIComponent` 處理。
- 新增原圖 → `npm run thumbs` → commit `_thumbs/` 產物。

---

## 路由與預渲染

| 路由 | prerender | 備註 |
| --- | --- | --- |
| `/` | ✓ | 首頁 |
| `/gallery` · `/gallery/digital` · `/gallery/photography` | ✓ | 類別主頁 |
| `/gallery/<category>/<event>` | ✓ | `nuxt.config.ts` 的 `buildEventPrerenderRoutes` build 時掃 JSON 列舉 |
| `/article` | ✓（crawlLinks） | 文章列表 |
| `/admin` | **✗** | `ssr: false`、`prerender: false`、明列於 `nitro.prerender.ignore` |
| `/gallery/all` | 已移除 | client-side replace 到 `/gallery/photography` 兜底 |

- **Image lightbox 走 query**（`?image=<id>`），由 `useGalleryImageRoute` 同步。不走 path：每張圖獨立 HTML 沒意義。
- **Event filter 走 path**（`/gallery/<cat>/<event>`），由 `useGalleryEventRoute` 同步。走 path：要讓社群爬蟲讀到 event 自己的 hero／JSON-LD。
- Event slug 是**原始 unicode**（Wikipedia 風格），不做 slug 字典。Nitro 對 prerender 路由內部會 decode/encode，CJK 路徑直接落地。

---

## 已知陷阱（踩過的，請別再踩）

| 陷阱 | 為什麼 |
| --- | --- |
| `experimental.payloadExtraction` 必須是 `false` | CJK 路徑下 Nitro 寫 prerender header 沒 encode，TypeError ByteString 炸 build。等上游修。 |
| Pinia `storesDirs` **不要顯式設** | Nuxt 4 下相對路徑以 `app/` 為基準，寫 `'./app/stores'` 會解析成 `app/app/stores`，silent 壞掉所有 `useXxxStore` auto-import。 |
| Leaflet CSS 不要寫進 `nuxt.config.css[]` | Vite 7 + Windows 透過 `@fs` 絕對路徑讀 `node_modules` CSS 會 MIME 異常。已改在 `EventMap.vue` 內 import。 |
| `eventStats` 不信 JSON 嵌入值 | 改名／typo 同步問題反覆出現；store 端 runtime 重算，與可見作品永遠一致。 |
| 新衍生資料**不要**塞進 `gallery.ts` | 全部丟 `gallerySelectors.ts`；純函數可單測，這條紅線守住 store 邊界。 |
| dev server 在 Windows 下 payload 寫入 ENOENT | Nuxt 4 沒 mkdir 父目錄；故 dev 環境也強制 `payloadExtraction: false`（同上設定）。 |
| `<Icon name="lucide:*">` 在 lightbox 內 | `serverBundle` 只蓋 SSR；lightbox `v-if` 預設關閉、client 才掛載。靠 `clientBundle.scan: true` build 時掃出實際用到的 icon 打進 JS，避免 CDN fallback 被擋。 |

---

## 設計語言

**stone 為脊**（UI chrome 一律 `stone.*`）、**accent 僅作 hairline / 印章**（terracotta，不當填色）、**hairline 取代 border**（`jp-hairline` 或 `border-stone-300/60`，不用 `border-2`）。

| 工具類 | 用途 |
| --- | --- |
| `jp-eyebrow` | 小寫 uppercase 標籤 + 引線 hairline |
| `jp-section-title` / `jp-section-ruby` | 漢字主標 + 羅馬副線 |
| `jp-hairline` / `jp-hairline-v` | 1px 漸層 fade 分隔線（水平 / 垂直） |
| `jp-seal` | -3° 旋轉印章 |
| `jp-body` | 明朝體本文（line-height 2） |
| `jp-kana-bg` | 巨型 kana 背景（低 opacity、`pointer-events-none`、`aria-hidden`） |
| `jp-frame` | 雙重內框（書籍封面語彙） |
| `jp-sumi-dot` | 墨點（取代彩色 list bullet） |
| `reveal*` | IO-based scroll reveal；內建 `prefers-reduced-motion` fallback |

**Light 為預設主題**（ADR-001）。`nuxt.config.ts` 的 inline `theme-boot` script 在 Vue 載入前讀 `localStorage['vueuse-color-scheme']` 切 class，避免 FOUCD。Dark mode 保留可選 toggle，不可移除 `dark:*` variant。

完整規範與 design tokens 見 [`CLAUDE.md`](./CLAUDE.md) §Design System、實作見 [`app/assets/css/main.css`](./app/assets/css/main.css)。

---

## 文件導覽

| 文件 | 給誰看 |
| --- | --- |
| [`CLAUDE.md`](./CLAUDE.md) | Claude Code / 協作 AI 與新進開發者：架構速覽、Design System 規範、技術陷阱、Goal-Driven Execution 驗收表 |
| [`wiki/index.md`](./wiki/index.md) | 設計研究知識庫總索引（sites · concepts · patterns · system · inspirations） |
| [`wiki/system/`](./wiki/system/) | 本站**現行**子系統快照（資料流／圖檔／路由／SEO／viewer／layout／theme／build／admin），含 ADR-lite decisions |
| [`wiki/inspirations/`](./wiki/inspirations/) | 設計靈感四階段：Idea → Experimenting → Adopted → Rejected |
| [`docs/MAINTENANCE.md`](./docs/MAINTENANCE.md) | 例行維護、故障排除、縮圖流程 |
| [`docs/PROJECT_HEALTH.md`](./docs/PROJECT_HEALTH.md) | 健檢快照 |

> 動視覺／layout 前，請先看 [`wiki/concepts/`](./wiki/concepts/)（外站光譜對照）與 [`wiki/inspirations/`](./wiki/inspirations/)（候選與已落地紀錄）——避免重複造輪、避免落入已 reject 的方向。

---

## 部署

GitHub Actions 跑 `npm run build:github` 產出 `.output/public/`，由 Pages workflow 推送。

- `nuxt.config.ts` 的 `app.baseURL` 必須與 Pages 子路徑（`/young-portfolio/`）一致。
- `nitro.prerender.failOnError: true` — 任何 event route SSR 死掉，build 直接紅；不會悄悄漏。
- `crawlLinks: true` + 明列 `routes`：靜態主頁 + 動態 event 路由都會被產出。

---

## 作者

**Young** · [GitHub @NCTUyoung](https://github.com/NCTUyoung)
