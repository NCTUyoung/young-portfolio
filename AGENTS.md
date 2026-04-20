# Agent / 維護備忘

- **美感規範**：任何 UI／版型／色彩／字型改動前，先讀 `.cursor/rules/design-aesthetic.mdc`（日式排版精神：余白・間・侘寂；stone + accent tokens、`font-jp`/`font-sans` 混植、`jp-*` utilities、dark-mode 預設、Hero 輪播與單色化等鐵律都在裡面）。
- **部署**：GitHub Pages，`app.baseURL` = `/young-portfolio/`；靜態資源與 `useImagePath` 依此組路徑。
- **字型**：全站 `font-sans` = **Outfit**（拉丁）→ **Noto Sans TC**（繁中）；日式豎排／引言等維持 `font-jp`（**Noto Serif JP**）。來源：`nuxt.config.ts` 的 `fonts.families` + `tailwind.config.js` 的 `fontFamily.sans`，`assets/css/main.css` 的 `@layer base`。
- **圖片庫路由**：`pages/gallery/[[category]].vue`；分類 `all` | `digital` | `photography`。Lightbox 與 `?image=<id>` 由 `useGalleryImageRoute` 同步。列表篩選邏輯在 `stores/gallerySelectors.ts`。
- **攝影作品網格**：`GalleryPhotographySection` 為 **justified rows**（`utils/justifiedGalleryLayout.ts`）：依容器寬與長寬比決定 **每列張數**，同列等高、寬度依比例分配並填滿列寬（類 Google Images）；非固定雙欄。需 `ResizeObserver` + 圖片 `naturalWidth/Height` 更新比例。
- **檢視器**：僅使用 Pinia `stores/imageViewer`，勿再引入已刪除的 viewer composable。`body.style.overflow`（捲動鎖）由 store 的 `openImageViewer`／`closeImageViewer` 獨占管理，`ImageViewer.vue` 的 focus trap 只處理焦點，**不可**重複讀寫 `body.style.overflow`（重複寫會在關閉時把先前鎖定值回填，導致整頁滾輪失靈）。
- **Side-effect 單一擁有者原則**：全域 side effect（`document.body.style.*`、`window.addEventListener`、route query、timer／RAF、DOM class toggle 等）**只能由一處擁有 open↔close 配對**。要嘛 store 管、要嘛 component 管，**禁止兩端各自 save/restore 前值**——`watch` 與 action 的執行順序會讓「前值」被彼此污染，關閉時還原出錯誤狀態。新增 modal／lightbox／drawer 類元件時先確認擁有者。
- **Composables**：說明見 `composables/README.md`；勿加 `composables/index.ts` barrel（與 Nuxt auto-import 衝突）。
- **健檢／重構優先級**：見 `docs/PROJECT_HEALTH.md`；維護目錄與指令見 `docs/MAINTENANCE.md`。
- **重大規劃流程**：遇到「優化計畫／架構決策／核心功能改造」等非瑣碎取捨任務，依 `.cursor/rules/planning-multi-round.mdc` 走多輪：平行 explore × N subagent → v1 草案 → critic subagent 批判 → `AskQuestion` 收斂決策 → v2 定案。不要單輪線性寫 10 個步驟就開工。
- **後台 API**：`stores/adminApiClient.ts` + `stores/adminTypes.ts`；純計算見 `stores/adminSelectors.ts`；store 內用 `useApi().createApiRequest`（通常 `showToast: false`）。勿用 `stores/admin/` 資料夾（與 `admin.ts` 檔名在 Windows 衝突）。`pages/admin.vue`：`pageReady` 首次載入完成前顯示 loading；非 upload 分頁可顯示可關閉的全域錯誤條。
- **ESLint**：`consistent-type-imports` 為 warn；動態模組型別勿用 `typeof import('pkg')`，改用 `import type * as Pkg from 'pkg'` + `typeof Pkg`。
- **測試**：`npm run test`（Vitest）；`utils/*.test.ts`（`galleryUtils`、`formatters`、`validators`）。新增或變更使用者可見功能時，另依 `.cursor/rules/feature-testing-mcp-devtools.mdc` 以 **MCP `user-chrome-devtools`** 對本機 `npm run dev` 做路由／快照（或 trace）驗證；勿只用內建瀏覽器測 `localhost`。
- **回應語言**：使用者偏好中文說明；程式與註解可用英文。
- **攝影網站研究 Wiki**：`wiki/` 是獨立的 LLM-maintained 知識庫（Karpathy `llm-wiki` pattern），專收攝影作品集網站並提煉給 young-portfolio 用的靈感。有自己的 `wiki/AGENTS.md` 規範頁面格式、ingest/query/lint 三種操作、`index.md` 與 `log.md` 維護方式。使用者說「ingest」「lint wiki」「開一張 inspiration」等指令時，全部按 `wiki/AGENTS.md` 走，不要在全站 src 裡亂寫。
