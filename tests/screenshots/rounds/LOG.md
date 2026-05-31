# Act-Critic Loop — index 相片庫 (Featured section)

Target: `app/pages/index.vue` §選 Featured + `app/components/gallery/HorizontalStripFeatured.vue`
Workflow per round: 大改 → playwright 截圖 (desktop+mobile) → design-critic agent 四面向 review → next-round 依評論.

Critic template: `.claude/critic-prompt-template.md` · agent: `.claude/agents/design-critic.md`

## Baseline (round0)
雙橫卷 strip：影 photography（縦書「精選」書腰）+ 繪 digital（縦書「繪」書腰），mobile 2-col grid。底部 `Featured · NN Frames · 二〇二六` caption band。

---

## 10 輪總表（act → critic verdict → next-step）

| R | act 概念 | verdict | critic next-step / ⚠ jump-out |
|---|---|---|---|
| 1 | 不均整見開き spread（57/43 前後景，中央「対」+朱印「選」hinge）`FeaturedSpread` | first-screen-invisible | 補右頁第3連湊2x2 ／ ⚠ 跳出 Featured，把時間差搬上 hero |
| 2 | 交差時間河（繪上軌/影下軌，依年份水平定位，未だ無し墓誌）`FeaturedChronoWeave` | first-screen-invisible | 合流節點移進首屏 ／ ⚠ 壓縮模式：源頭與合流同窗對視 |
| 3 | 折込年表「源·断·合流」三段固定 grid（∥2019—2023∥ 折縫壓縮） | **bold** | 手機把合流上移到 plate 前 |
| 4 | 読み順トグル（順讀⇄逆讀雙向年表，手機 default 逆讀） | first-screen-invisible | ⚠ 跳出 index：把繪⇄影語彙移植成 gallery 路由轉場 |
| 5 | 割面対置 diptych（可拖接縫 + 繪・対・影 weight toggle，首餵 JSON 敘事）`FeaturedConfrontation` | **bold** | 把割面交互複製到 gallery 路由首屏 |
| 6 | gallery 割面ゲートウェイ（拖接縫選路進 /gallery/<track>）`GalleryConfrontGateway` | first-screen-invisible | 交付 gateway 實截圖 ／ ⚠ 跳到資料層做 trackManifesto |
| 7 | 題詞見開き入口（trackManifesto 寫進 type→loader→store）`FeaturedManifesto` | first-screen-invisible | ⚠ 用 startYear 重做 Hero 第一屏 |
| 8 | Hero 双軌起算 ledger（繪2018→「六年先行」badge→影2024，資料驅動） | **bold** | gallery tab 切換加 startYear 時間軸轉場 |
| 9 | gallery 起算尺 tab 轉場 overlay（marker 沿尺滑出六年）`GalleryTrackTransition` | first-screen-invisible | ⚠ 別雕轉場，把六年尺長駐進內容/資料層 |
| 10 | 雙軌共用整數年尺 Year-Ruler（yearIndex 衍生 metadata，繪滿8格/影占3格）`FeaturedYearRuler` | first-screen-invisible | ⚠ 手機改縦向時間軸；origin=min 改非線性間距消死白 |

### 最終 shipped 組成（非單一元件，是跨層複合）
- **index #featured** → `FeaturedYearRuler` + `FeaturedYearRulerTrack`（R10）
- **index hero** → 内嵌 `.track-ledger` 双軌起算尺（R8）
- **gallery overview** → `GalleryConfrontGateway`（R6）
- **app.vue 常駐** → `GalleryTrackTransition`（R9，切 tab 轉場）
- **資料層** → `trackManifesto`（JSON 頂層 + type + loader + store getter，R7/R8）+ `featuredChronology` getter（R10）

### 收官 verify
- `npm run typecheck`：**PASS**（修掉 `ChapterRail.vue` 一個死碼 observer 造成的 TS2339；清 orphan 後重跑仍 exit 0）
- `npm run lint`（Node 22 via fnm v22.22.3）：本 loop 程式碼 **全綠**。
  - 對真實源樹 `eslint app shared server` 僅剩 4 error + 5 warning，全在 `ImageInfoPanel.vue` / `upload.post.ts`（session 前既有未提交檔，非本 loop 觸及）。
  - 修掉本 loop 引入的 3 個 unused-var：`index.vue`（getGridImageSrcset/gridImageSizes）、`gallery/[[event]].vue`（totalPhotographyCount）。
  - 全量 `npm run lint` 報 30 error 是因 eslint 連 `.claude/worktrees/*` 三個 checkout 一起掃（既有 config gap，建議 eslintignore），與本 loop 無關。

### 已清 orphan（迭代中被取代、現已刪除的死碼元件）
- ~~`FeaturedSpread.vue` + `FeaturedSpreadPage.vue`（R1）~~ 已刪
- ~~`FeaturedChronoWeave.vue`（R2/R3）~~ 已刪
- ~~`FeaturedConfrontation.vue`（R5）~~ 已刪
- ~~`FeaturedManifesto.vue`（R7）~~ 已刪

---
