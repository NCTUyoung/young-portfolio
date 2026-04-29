# Claude Design Brief — Young Portfolio UI Review

Date: 2026-04-28

## Recommendation

需要進行一輪界面設計，但建議是「精修與整體節奏校準」，不是推翻重做。

目前網站已經有明確方向：日式余白、stone 暖灰、少量 accent、攝影與電繪雙主線。主要問題不是元件壞掉，而是部分頁面在資訊密度、層級、手機橫向溢出、section 節奏上還不夠一致。Claude Design 可以用現有風格做一輪 visual direction pass，把首頁、Gallery controls、攝影策展段落與 mobile flow 收斂成更像同一本作品集。

## Design Principles To Preserve

- 保留日式排版精神：余白、間、侘寂、簡素、不均整。
- 保留 `stone` 暖灰作為主色，`accent` 只做小標、焦點線、印章式點綴。
- 保留首頁 Hero 的雙主線拼貼概念：Digital Art + Photography 同屏可見。
- CTA 維持低調，不做高飽和大按鈕。
- 圖片本身可保留原色，UI chrome 需要克制。

## Screenshots

All screenshots are in `screenshots/`.

- `01-home-desktop-hero.png` — desktop 首頁 Hero。
- `02-home-desktop-about-domains.png` — desktop 首頁 About / Domains。
- `03-home-desktop-lower-sections.png` — desktop 首頁下半部 sections。
- `04-gallery-all-desktop-top.png` — desktop Gallery 全部作品首屏。
- `05-gallery-photo-desktop-top-map.png` — desktop 攝影分類首屏 + 地圖。
- `06-gallery-photo-desktop-strip-timeline.png` — desktop 攝影 featured strip + timeline 開始。
- `07-gallery-photo-desktop-grid.png` — desktop 攝影作品 grid。
- `08-gallery-digital-desktop-top.png` — desktop 電繪分類首屏。
- `09-article-desktop-top.png` — desktop 文章頁 coming soon。
- `10-home-mobile-hero.png` — mobile 首頁 Hero。
- `11-gallery-photo-mobile-top.png` — mobile 攝影分類 controls + 地圖。
- `12-gallery-photo-mobile-content.png` — mobile 攝影內容段落。

## Scenario Notes For Claude Design

### 1. Home Hero

Reference screenshots:

- `screenshots/01-home-desktop-hero.png`
- `screenshots/10-home-mobile-hero.png`

What works:

- 首頁已經有很強的「書封 / 作品集封面」感。
- Desktop 的三張直幅拼貼能清楚傳達雙主線。
- Mobile 上圖下文的節奏清楚，文字區有足夠呼吸。

Design asks:

- Desktop Hero 右側第三張照片有被裁到邊緣，請評估是否需要更穩定的三欄比例或留白邊界。
- Mobile Hero 的圖片與標題區之間目前有明顯段落感，但可再設計成更像一張完整封面，而不是「圖片 block + 文字 block」。
- Header logo 與 nav 在大留白中稍微偏工具列感，可考慮更 editorial 的 header treatment，但不要變複雜。

### 2. Gallery Controls

Reference screenshots:

- `screenshots/04-gallery-all-desktop-top.png`
- `screenshots/05-gallery-photo-desktop-top-map.png`
- `screenshots/08-gallery-digital-desktop-top.png`
- `screenshots/11-gallery-photo-mobile-top.png`

What works:

- 分類、事件、搜尋、年份的功能完整。
- Desktop 上 Gallery 首屏很乾淨，符合 stone + accent 的美術方向。

Design asks:

- Controls 的資訊密度偏高，尤其 event filter 數量多時，像資料管理介面多於作品集策展入口。
- Mobile 上 category tabs / event chips 有水平溢出感，右側截斷會讓使用者不確定能不能滑。
- 請設計一個更 editorial 的 controls hierarchy：主要分類清楚，事件篩選可收束，搜尋與年份不要搶過作品。
- Sticky mini bar 可以保留，但要確認它在攝影頁中不會和瀏覽節奏互相干擾。

### 3. Photography Page

Reference screenshots:

- `screenshots/05-gallery-photo-desktop-top-map.png`
- `screenshots/06-gallery-photo-desktop-strip-timeline.png`
- `screenshots/07-gallery-photo-desktop-grid.png`
- `screenshots/12-gallery-photo-mobile-content.png`

What works:

- Map -> statement -> featured strip -> timeline 的敘事方向是對的。
- Featured strip 很有作品集感，值得保留並精修。
- 攝影 grid 能呈現真實比例，符合 portfolio/gallery 需求。

Design asks:

- Map 現在像功能區，但和 featured strip 的策展感銜接還不夠自然。請設計 map 作為「旅程索引」而非單純工具。
- `まだ、撮っている。` 這句很有氣質，但目前在桌機與手機上都偏孤立，請幫它找到更好的上下文位置或視覺承托。
- Featured strip 左側縦書き與大圖組合漂亮，但整段上下空間可再調，讓它更像主策展段落。
- Timeline / grid 開始處需要更明確的 section transition，避免從 featured 直接掉入大量照片。

### 4. Digital Gallery

Reference screenshot:

- `screenshots/08-gallery-digital-desktop-top.png`

What works:

- Masonry 對電繪有效，首屏作品力強。
- 圖像色彩有衝擊力，和 UI 的克制形成對比。

Design asks:

- Digital 頁和 Photography 頁相比缺少一段策展開場，容易變成純瀑布流。
- 請設計一個輕量 intro 或 featured treatment，讓電繪也有和攝影頁相當的入口質感。
- Masonry 上方留白與 controls 的關係可再調，讓作品出現更有儀式感。

### 5. Article Page

Reference screenshot:

- `screenshots/09-article-desktop-top.png`

What works:

- Coming soon 狀態乾淨，沒有過度設計。
- Preview cards 能讓空頁不至於太空。

Design asks:

- 目前使用較明顯的橘色按鈕，和全站「低調 CTA」原則略有落差。
- 請改成更 stone / hairline / underline 的 CTA 語言，或降低按鈕的色塊感。
- Preview cards 可以更像文章目錄，而不是 generic feature cards。

## Priority

1. Gallery mobile controls：最需要設計介入，因為影響可用性與第一印象。
2. Photography page narrative flow：目前內容很好，但 section 串接需要更策展化。
3. Home Hero polish：方向正確，需微調 desktop / mobile 的完整封面感。
4. Digital gallery intro：補足電繪頁的策展入口。
5. Article page CTA/card refinement：低風險精修。

## Suggested Output From Claude Design

- 一版 desktop + mobile Gallery controls redesign。
- 一版 photography page narrative flow：map / statement / featured strip / timeline transition。
- 一版 home hero polish：不改核心概念，只調比例、留白、header、mobile rhythm。
- 一版 digital gallery intro / featured area。
- 一組 design notes：哪些調整是 CSS spacing / typography，哪些需要 component structure change。
