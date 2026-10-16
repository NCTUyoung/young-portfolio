# 首頁博物館呈現：實作與驗證

日期：2026-10-16。起始版本：`a95f3829a7c0208b1fa21e8b6375792a698b09d5`。

依據 [首頁需求](../specs/homepage-museum.md) 與 [原始盤點](../../.impeccable/critique/2026-10-16T07-15-25Z__app-pages-index-vue.md)。

## 完成內容

- 保留靜態繪／影雙入口與 Hero、SEO 資料來源。
- 大幅作品選集提前到自介之前：暖牆畫框呈現數位繪畫、冷色相紙呈現攝影，保留作品原比例。展籤使用既有標題、日期、活動資料，點擊沿用分類頁的圖片分享網址與檢視器。
- 作者介紹縮短；五項完整創作沿革放進原生、預設收合、鍵盤可操作的 details。保留 journey／dialogue 錨點與社群連結。
- 操作文字以繁中為主，日文作副標；署名年份改用一致西元。後台管理移到頁尾，手機選單及頁尾管理連結保留至少 44px 點擊高度。
- 作品資料載入失敗時顯示提示與重試，成功空集合與載入失敗分開處理。
- 移除已被新選集取代的縮圖年尺、長年表與對應動畫／樣式；未新增依賴或更改作品資料、地圖、活動光桌、檢視器架構。

主要變更檔案：`app/pages/index.vue`、`app/components/home/HomeFeaturedExhibition.vue`、`app/layouts/default.vue`、`tests/e2e/home-museum.spec.ts`、`tests/e2e/home.spec.ts`。

## Standards

獨立規範審查依據 AGENTS.md、design-aesthetic.mdc 與程式異味準則。最初提出頁尾管理連結點擊高度不足，已補 44px minimum height；複查通過，無剩餘阻擋項目。暖繪／冷影的指定材質延續既有視覺世界。

## Spec

獨立需求審查核對首頁規格。最初提出作品載入失敗時缺乏提示，以及年表測試聚焦錯誤元素；已補可重試提示、503 → 恢復測試，並聚焦原生 summary。複查通過。

兩軸彙整：Standards 0 項未解決，Spec 0 項未解決。

## 視覺驗證

兩輪批次驗證涵蓋 1440px 桌機 light／dark、768px 平板 light、390px 手機 light／dark，以及既有攝影綜覽／活動頁的六張矩陣。五個首頁狀態均無橫向溢出、主內容圖片載入成功，批次無 JavaScript pageerror。攝影頁前後對照維持地圖、圓形照片與光桌版型；導覽僅移走管理入口。

冷讀視覺審查按「實用／美觀／一致／創意」四維完成，無阻擋交付問題。可選觀察：桌面攝影實際畫面比繪畫小，符合此版不等幅編排，未在本次追加調整。

本機截圖位於 `.tmp/home-museum-implementation/before/` 與 `after/`。桌面長頁截圖可能省略視窗外圖片的繪製，作品區近照與實際捲動已確認攝影完整顯示；不以長頁截圖的空白推定載入失敗。

Impeccable detector：69 項 advisory（39 色彩、30 字級 token 提醒），無其他類型；保留指定材質色與既有尺度，不在本次任務順帶修復舊設計 sidecar。

瀏覽器驗證使用 Playwright。專案規則指向的 Chrome MCP 工具及附加規則檔在此環境不可用，未宣稱使用該工具驗證。

## 自動檢查

- `npm test`：117／117 通過。
- `npm run lint`：0 errors；4 項既有 upload API console warnings。最後修改的 UI 與測試檔另經單檔 ESLint 通過。
- `npm run typecheck`：通過；既有 vue-router Volar 路徑與 payload extraction 提醒未影響退出狀態。
- `npx nuxt build --preset github-pages`：通過，49 條預渲染路由。
- `npm run test:e2e -- --workers=3`：43／43 通過（1.2 分鐘），涵蓋新增首頁七項、既有首頁／地圖／活動選片／檢視器／後台。

新增七項首頁測試涵蓋段落順序、真實作品資料、兩類作品檢視與關閉、資料失敗重試、年表鍵盤操作、手機導覽及原比例顯示。舊首頁測試的作者標題同步更新為繁中。

公開頁面的視覺／新增功能先在正式靜態建置上驗證；完整 E2E 使用 Nuxt dev 以涵蓋後台 API。首次完整執行找出兩處 SSR 控制項先於互動就緒的測試競態，加入導覽 hydration 訊號並讓操作測試等待，兩項定向複驗通過。

另觀察到開發模式的 `?image=` 直連會記錄 ImageViewer 的 SSR／client hydration mismatch 警告；相關大圖互動與關閉測試均通過。堆疊位於本次未修改的 gallery／ImageViewer 路徑，既有光桌測試也包含此直連；推測為既有直連開啟時序，本次未以基準 checkout 重現證明來源，故保留為觀察限制，未擴大修改 viewer。

## 交付範圍

依 implement 流程提交到目前 master 分支。本次交付為本機實作與提交；推送／正式部署狀態另於交付訊息明示。不變更不相關 Wiki 研究內容。
