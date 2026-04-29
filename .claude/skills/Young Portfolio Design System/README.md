# Young Portfolio Design System

> 設計系統 for **NCTU Young** — 個人作品集網站，收錄數位電繪與攝影作品。
> 日式排版精神：余白・間・侘寂・簡素・不均整。

---

## 1 · 產品脈絡 (Product Context)

**Young Portfolio** 是 NCTU Young 個人 portfolio 站，以 Nuxt 3 + Tailwind 構築，靜態部署於 GitHub Pages 子路徑 `/young-portfolio/`。網站有 **兩條創作主線**並行：

| 主線 | 內容 |
| --- | --- |
| 數位電繪 (Digital) | 二〇一八年起累積，自幾何化動物、人物到場景與概念藝術。 |
| 攝影紀錄 (Photography) | Nikon Z f 為主，街拍、活動紀實、城市夜景；附地圖與拍攝資訊。 |

### 主要產品 / 表面

1. **Marketing Home** (`pages/index.vue`) — 扉頁式封面、自我介紹、領域、道具、引言、步履、精選、目次。
2. **Gallery** (`pages/gallery/[[category]].vue`) — `all` / `digital` / `photography` 三分類；攝影附 EventMap、Featured Strip、Timeline。
3. **Article** (`pages/article.vue`) — 文章專區（Coming Soon）。
4. **Admin** (`pages/admin.vue`) — 本機後台上傳／管理介面（client-only）。

### 來源 / Sources

| 類型 | 路徑 |
| --- | --- |
| GitHub Repo | <https://github.com/NCTUyoung/young-portfolio> (default branch: `master`) |
| Live Site | <https://nctuyoung.github.io/young-portfolio/> |
| 設計簡報 | `CLAUDE_DESIGN_BRIEF.md`（隨此 design system 一起；中文撰寫） |
| 螢幕擷圖 | `screenshots/01-12*.png`（desktop + mobile，作為視覺真實基準） |
| 主要 CSS 來源 | `app/assets/css/main.css`（讀入 `colors_and_type.css` 內） |
| Tailwind 設定 | `tailwind.config.js`（accent palette 自訂，stone 為 neutral 主色） |
| Nuxt 設定 | `nuxt.config.ts`（fonts、SEO、GitHub Pages baseURL） |
| Agents 規範 | `AGENTS.md`（全站維護備忘 + 美感規範來源 `.cursor/rules/design-aesthetic.mdc`） |

> ⚠️ 雖然本 design system 內已抓出主要 token，**設計鐵律的真相在 `.cursor/rules/design-aesthetic.mdc`**（rule file，未 import 至此）。任何大型版型修改，請回原 repo 取最新版。

---

## 2 · CONTENT FUNDAMENTALS — 文案調性

### 語言

- **主語**：繁體中文（zh-Hant）。`<html lang="zh-Hant">` 鎖死。
- **點綴**：日文漢字／假名 (e.g. 「余白」「自己紹介」「作品を見る」「文章を読む」「目次」「侘寂の道」)。日文不是翻譯，而是**裝飾性副題**——標題用漢字、副題用日文短句、CTA 用「を見る／を読む」收束。
- **羅馬字**：Outfit 拉丁排印做 ruby、eyebrow、英文版小標 (e.g. `DIGITAL ART & PHOTOGRAPHY`、`GALLERY`、`ABOUT`、`DOMAINS`)。

### 語氣 (tone)

- **第一人稱寫述、克制**：「電繪與攝影兩條線並行——」、「以 Nikon Z f 為主，記錄街景、活動與夜景」。不寫「Welcome to my portfolio!」這種西式 hero copy。
- **簡素、不誇張**：避免感嘆號、形容詞堆疊；CTA 用低調動詞（「進入作品集」、「編集中」、「全てを見る」）。
- **句式短**：每句不超過兩個逗號；長段以全形破折號 `——` 切意。
- **敬語感**：「敬請期待」、「致しております」級別的中性敬意，不用「快來看！」。

### 大小寫 / 標點

- **拉丁字**：除人名 (`NCTU Young`) 與標題首字外，eyebrow / ruby / nav 全用 **UPPERCASE + tracking 0.32–0.5em**。
- **半全形混用**：純中文段落用全形標點 (`，。、`)；中英混排時數字 / 英文前後加 **半形空格**。
- **日文裝飾標點**：用 `『』「」` 包引文，用 `——` 與 `／` 做斷句與並列。
- **數字**：年份用阿拉伯數字 (2024)，敘事用漢數字 (二〇二四)；同一頁可並用 (`二〇一八 — 二〇二六`)。

### Emoji / 圖示

- **不使用 emoji**。整站 0 個 emoji。
- 裝飾改用：日式漢字 (繪・影・余・白・侘・寂・選・集・文)、墨點 (`.jp-sumi-dot`)、印章 (`.jp-seal`)、hairline 細線。
- Icon library = **Lucide** (`@nuxt/icon` server-bundle)。

### 範例

```text
余  白
DIGITAL ART & PHOTOGRAPHY
作品を見る  GALLERY  →
```

```text
自己紹介  ABOUT
NCTU  Young
DIGITAL PAINTER · PHOTOGRAPHER
電繪與攝影兩條線並行——插畫自幾何、角色至場景；攝影則以街拍、活動與城市夜景為主，
以 Nikon Z 系統將當下的光影留下。
```

```text
不完美之中
藏著最真實的美
— 侘寂の道
```

---

## 3 · VISUAL FOUNDATIONS — 視覺基礎

### Colors

- **Stone (warm neutral) 為主軸**。Background = `stone-50` / `stone-900` (dark)，文字主色 = `stone-800` / `stone-100`。整站 90% 像素是 stone。
- **Accent 為赤陶／琥珀** (`accent-500 #db7b2e`)，**僅用**於：eyebrow/ruby (`accent-500`)、節點菱形 (`accent-500/80`)、印章描邊與底色 (`accent-700` + `accent-50/70`)、kansuji 顏色 (`accent-600`)、CTA hover 邊線。**從不**做大色塊填充。
- 圖片本身保留原色，UI chrome 一律克制；hero 攝影在 dark mode 下用 `dark:brightness-[0.82~0.85]` 壓暗。

### Type

- 全站 sans = **Outfit**（拉丁）→ **Noto Sans TC**（繁中）。
- 日式裝飾（豎排、引言、節標題）= **Noto Serif JP**（`font-jp`）。明朝體 ExtraLight (200) 是主特徵。
- **JP titles 永遠 extralight + 大 tracking** (0.18–0.5em)；身體文字 `line-height: 2`（`.jp-body`）。
- 西文 eyebrow / ruby 一律 `text-xs` + `uppercase` + `tracking-[0.35em~0.5em]`。

### Spacing

- Section 垂直韻律：`py-24 lg:py-36`（96 → 144px）。彼此交替 `bg-stone-50` 與 `bg-stone-100/40`（極淡分區），**不**靠粗 divider。
- 容器：`max-w-5xl ~ max-w-6xl mx-auto px-6 sm:px-10 lg:px-16`。
- 標題到內容：`mb-14 lg:mb-20`（豐富的呼吸）。

### 背景 / 紋理

- **不**用全 bleed photo 背景做 hero（但雙圖／三圖拼貼 OK）。
- 不用漸層；不用 gradient bluish-purple、不用霓虹。
- Optional 紙紋 (`.washi-bg`) — 極淡 stone 條紋作底，`opacity 8~15%`。
- 「侘寂」section 用大字 `侘` 作背景水印 (`opacity-40~50%`)。

### Borders / Hairlines

- **Hairline 優先於粗線**。`.jp-hairline` = 漸淡水平線 (兩端透明 → stone-300/80 → 透明)。整站 80% 分隔線都是 hairline。
- `.jp-frame` = 1px 主邊框 + 內縮 6px 第二層細邊框（書扉雙框）。
- `.jp-side-line` = 1.5px accent 左側引言線。

### 陰影系統

- **微影**：`shadow-japanese` = `0 2px 8px rgba(168,162,158,.10), 0 1px 3px rgba(168,162,158,.05)`。
- **hover 微影**：`shadow-japanese-hover`，僅做圖卡 hover 時用，**不**做下沉 / 飄起。
- 主要不靠陰影層級——靠 hairline + 余白即可分層。

### 模糊 / 透明度

- Header 滾動後：`backdrop-filter: blur(16px) saturate(140%)` + `bg-opacity: 0.92`（`.nav-scrolled`）。
- 一般圖卡 caption overlay：`bg-stone-900/55` 黑半透；text gradient overlay = `from-stone-900/75 via-stone-900/15 to-transparent`（hover 才出現）。

### Corner Radii

- **幾乎不用**。系統偏好直角 + hairline。
- 例外：印章 `.jp-seal`（方形旋轉 -3deg）；按鈕 `rounded-full` 僅用於 social media icon 圓徽；`rounded` 出現於 article preview cards (`<= 1rem`)。

### Cards

- **Frame 式 (`.jp-frame`)**：直角，雙細線邊框，無陰影。Hero 自我介紹頭像、目次卡都用這個。
- **Photo card**：直角、無 border、aspect-ratio 4:5 (`.aspect-tatami`) 或 5:7 (`.aspect-kake`)；hover 才升起 caption。
- **Article preview card** (`pages/article.vue`)：白底 + 細邊 + 8px 圓角；含小 icon。

### 動畫 / 互動

- **進場 reveal** (`.reveal`, `.reveal-left`, `.reveal-right`, `.reveal-scale`)：opacity 0→1, translate 30px→0, **0.8s `cubic-bezier(0.16, 1, 0.3, 1)`** (out-expo 風格)。delay step `0.1s`/`reveal-delay-1~5`。
- **Page transition**：`opacity + translateY 12→0`, 0.35s ease。
- **永遠尊重 `prefers-reduced-motion`**：直接 `opacity:1; transform:none; transition:none`。
- 浮 / 呼吸 / 描墨：`float`、`breathe`、`ink-draw` 動畫保留供裝飾。
- **Hover**：圖片 `scale-[1.04]`，900ms ease-out（緩慢、克制）。連結用 `border-bottom hairline` → hover 變 accent。
- **Press / active**：不縮放、不變色塊，僅 hairline 顏色變更。

### Layout 規則

- Header 固定頂端，scroll 後加 backdrop-blur。Nav 文字級 `text-sm`，間距 `space-x-8`。
- Hero 為 `78vh ~ 82vh`，左 42% 文字、右 58% 圖（desktop）；mobile 上下堆疊。
- 雙聯式 (對聯) 結構常見：左右兩欄中央以 `.jp-hairline-v` 一道豎線分隔。
- 步履 (Journey)：zig-zag 雙欄時間軸，中央菱形節點 `bg-accent-500/80 ring-4 ring-stone-50`。

### 影像色彩

- 暖色傾向，攝影偏自然光、淺景深；電繪偏冷色 / 高對比，**色彩衝擊由作品自己提供**。
- 圖片一律用 `_thumbs/{400w,800w}/` WebP；首頁 hero 主圖優先 fetchpriority="high"。
- Dark mode 主圖 `brightness-[0.82~0.85]` 壓暗，避免發光。

---

## 4 · ICONOGRAPHY — 圖示

- **icon library**：**Lucide** (透過 `@nuxt/icon` + `@iconify-json/lucide`，server-bundle 離線優先)；本 design system 推薦也用 Lucide CDN：<https://unpkg.com/lucide-static>。
- **stroke**：1px ~ 1.5px (`stroke-width="1"`)；極細為主，配合 hairline 美學。
- **fill**：永遠 `fill="none"`，stroke only。
- **顏色**：跟隨 `currentColor`（一般是 `stone-500/400`，hover 進 `stone-800/100`）；**不**用彩色 icon。
- **尺寸**：`w-3.5 h-3.5` (UI 行內) → `w-4 h-4` (CTA 箭頭) → `w-5 h-5` (social link)。
- **箭頭**：CTA arrow 是 SVG `M17 8l4 4m0 0l-4 4m4-4H3`（細長右箭頭），hover 時 `translate-x-1`。
- **SVG 使用**：站內主要靠 Lucide；自繪 SVG 限於 `ink-draw-line` 描墨動畫（極少用）。
- **Logo**：`assets/logo-nctu-young.svg`（1px stroke、Outfit / 全大寫）+ favicon。
- **Emoji / Unicode**：**0 個**。漢字是裝飾代替品（繪・影・余・白・寫・楊・選・集・文・道・侘・寂）。
- **Social icons**：GitHub, Facebook, Instagram, Threads, Mail——統一線稿，stroke 1.5。

---

## 5 · INDEX — 檔案總覽

```
.
├── README.md                       ← 本文（產品脈絡 + 內容 + 視覺 + iconography）
├── SKILL.md                        ← Agent Skill manifest（兼容 Claude Code）
├── CLAUDE_DESIGN_BRIEF.md          ← 原 design brief（中文，外部單位提交）
├── colors_and_type.css             ← 所有 CSS variable + 字體 import + 語意 type token
├── assets/
│   ├── logo-nctu-young.svg         ← 站方 logo（重繪自 nav 上的 |NCTU YOUNG）
│   ├── seal-yang.svg               ← 楊印章 (.jp-seal style)
│   ├── ink-stroke.svg              ← 描墨裝飾線（裝飾用）
│   ├── avatar-young.jpg            ← 自我介紹頁頭像（自 sherlock.jpg / 站方公開）
│   └── favicon.ico
├── screenshots/                    ← 12 張原網站桌機 + 手機 截圖（真實基準）
├── preview/                        ← Design System tab 用 (~700×N) 卡片
│   ├── color-stone.html
│   ├── color-accent.html
│   ├── color-semantic.html
│   ├── type-display.html
│   ├── type-section-title.html
│   ├── type-eyebrow-ruby.html
│   ├── type-body.html
│   ├── type-vertical.html
│   ├── spacing-rhythm.html
│   ├── radii-shadows.html
│   ├── hairlines.html
│   ├── seal-frame.html
│   ├── icon-system.html
│   ├── button-cta.html
│   ├── card-photo.html
│   ├── card-article-preview.html
│   ├── nav-header.html
│   ├── eventmap-strip.html
│   └── logo-mark.html
└── ui_kits/
    └── portfolio_site/             ← 唯一一組 UI kit（單一產品 = 個人 portfolio 網站）
        ├── README.md
        ├── index.html              ← 互動 click-thru（Home → Gallery → Article）
        ├── Header.jsx
        ├── HomeHero.jsx
        ├── HomeAbout.jsx
        ├── HomeDomains.jsx
        ├── HomeFeatured.jsx
        ├── GalleryControls.jsx
        ├── GalleryEventMap.jsx
        ├── GalleryFeaturedStrip.jsx
        ├── GalleryGrid.jsx
        ├── ArticleHero.jsx
        ├── Footer.jsx
        └── primitives.jsx          ← 共用元件 (Hairline, Seal, Eyebrow, JpTitle, CTA, etc.)
```

> 沒有 `slides/`：未提供 deck template，依規範省略。

---

## 6 · 給未來的代理

當新需求進來時：
1. 先讀本 README + `colors_and_type.css`。
2. 開 `ui_kits/portfolio_site/index.html` 看現行視覺實況。
3. 在 `screenshots/` 對照真實截圖（單一真相）。
4. 修改前先看 `CLAUDE_DESIGN_BRIEF.md` 列出的 priority — 不要把「mobile gallery controls」之外的問題當主軸。
5. 鐵律：保留 stone 為主色、accent 僅做點綴、CTA 低調、hairline > 粗線。
