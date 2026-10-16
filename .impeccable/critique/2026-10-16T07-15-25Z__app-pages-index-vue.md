---
target: 盤點首頁是否符合博物館印象
total_score: 20
max_score: 28
na_heuristics: 7,9,10
p0_count: 0
p1_count: 2
target_identity: "file:C:\\Users\\jimmy\\Documents\\development\\nctuyoung.github.io\\app\\pages\\index.vue"
target_fingerprint: "sha256:997811524d71ce005eb6e68a11ea5e3d7cbd2dc388b7ae041a18c90f2b827b7d"
target_path: "C:\\Users\\jimmy\\Documents\\development\\nctuyoung.github.io\\app\\pages\\index.vue"
timestamp: 2026-10-16T07-15-25Z
slug: app-pages-index-vue
---
Method: dual-agent (A: homepage_museum_design_a · B: homepage_museum_evidence_b)

**部分符合。首屏的展廳印象成立；整頁目前更接近日式編輯式作者作品集，博物館的觀看節奏還沒延續到底。**最值得改的是作品的出場順序與展示尺寸。

本輪檢查 2026-10-16 正式首頁，桌機 1440×900、手機 390×844，涵蓋淺色／深色。只評估，沒有修改介面。

**設計辨識度與整體印象**

這個首頁有自己的媒材語言，並非一般套版：左側暖牆、木框與卡紙對應繪畫；右側冷銀桌面與錯位相紙對應攝影。兩條創作路徑容易辨識。博物館印象目前主要來自首屏的物件與材質；後續的章節、履歷與年尺，更偏向一本作者創作誌。

實拍：[首屏](C:/Users/jimmy/Documents/development/nctuyoung.github.io/.tmp/home-museum-a/desktop-light-hero.png)／[精選區，圖片已載入](C:/Users/jimmy/Documents/development/nctuyoung.github.io/.tmp/home-museum-a/desktop-light-featured-loaded.png)／[手機首屏](C:/Users/jimmy/Documents/development/nctuyoung.github.io/.tmp/home-museum-a/mobile-light-hero.png)。

**值得保留的三件事**

- 真實作品、完整畫面與裱框形成觀看距離，首頁已經有進入展廳的暗示。
- 暖色繪畫與冷色攝影的區別清楚；手機上下排列、深色模式仍維持兩種材質關係。
- 靜態展示、克制的導引與頁尾朱印形成安靜的開場和收束。攝影維持相紙與光桌語言即可，不必也套木框。

**優先問題**

1. **P1｜進門後，作品讓位給作者履歷。**目前順序是雙入口 → 序／自己介紹 → 步履 → 精選。訪客看過首屏後，要經過長篇作者敘事才再次看作品，展覽感因此中斷。建議改為雙入口 → 1–2 件大幅精選與簡短作品說明 → 作者簡介 → 精簡的創作沿革。完整年表可留為次層資訊。定位：首頁 76–183、211–381、398 行起。建議命令：`$impeccable layout`。

2. **P1｜精選作品成為年尺上的小資料點。**桌機精選圖約 96×120px，重心落在創作年份；目前各媒材整軌導向分類，缺少逐件作品的展籤與觀看停留點。年尺適合保留作索引；首頁另外給 1–2 件真實作品足夠尺寸，附既有標題、年份、媒材，才有第二個觀看高點。八張圖片已確認完整載入，初次灰格截圖屬延遲載入暫態，不列為產品故障。定位：首頁 398–460 行、FeaturedYearRuler.vue 17–57 行。建議命令：`$impeccable layout`。

3. **P2｜看展線索的語言與字級不夠穩定。**首屏「走進展廳／開啟攝影地圖」清楚，下方卻切換成「作品を見る／文章を読む／全てを見る」；精選年份與微小副標也較難掃讀。建議繁中作主要行動語、日文作副標，作品資料留在可讀的展籤層級。不要靠增加裝飾字或年份標記補足策展。定位：首頁 104–122、413–425 行與精選年尺。建議命令：`$impeccable clarify`、`$impeccable typeset`。

4. **P2｜管理與技術資訊進入觀眾的主要視線。**頂部有「後台」，手機選單也列後台管理；頁尾有「nuxt · tailwind · 手作」。這些屬作者維護／製作資訊，對欣賞作品的訪客權重偏高。建議把管理入口移到頁尾低權重位置，技術署名縮到製作說明；功能仍保留。定位：default.vue 57–83、168–177、263–269 行。建議命令：`$impeccable distill`。

程式定位：[首頁](C:/Users/jimmy/Documents/development/nctuyoung.github.io/app/pages/index.vue:76)、[精選年尺](C:/Users/jimmy/Documents/development/nctuyoung.github.io/app/components/gallery/FeaturedYearRuler.vue:17)、[網站導覽](C:/Users/jimmy/Documents/development/nctuyoung.github.io/app/layouts/default.vue:57)。

**觀看節奏與訪客風險**

目前情緒曲線是「首屏入場高點 → 自述與長年表 → 小幅精選 → 朱印收束」。開頭和結尾都有記憶點，中段缺少讓訪客停下來看一件作品的機會。

- 初訪的繁中讀者：主入口容易理解，但後續日文 CTA 需要額外判讀。
- 手機訪客：首屏兩入口仍清楚；全頁約 4800px，需長捲才到精選，展開選單另有 5 項選擇，其中包含管理入口。
- 主要認知負擔來自中段敘事與語言切換；桌機首屏雖有 8 個可互動元素，分成品牌、導覽、主題切換與兩個作品入口，不能把它們當成同一個八選一問題。

**可用性檢核：20/28，Good（71.4%）**

每項滿分 4；這是可用性分數，並非博物館相似度。展示型首頁的效率工具、錯誤復原流程與說明文件不在本輪適用範圍。

| 檢核 | 分數 | 觀察 |
|---|---:|---|
| 狀態可見 | 3 | 入口清楚，首頁定位提示較少 |
| 語言符合訪客 | 2 | 繁中與日文行動語混用 |
| 操作自由 | 3 | 雙入口、導覽、回到頁首皆有 |
| 一致性 | 3 | 跨明暗與裝置的材質語言穩定 |
| 預防誤操作 | 3 | 門牌目的地明確 |
| 容易辨識 | 3 | 主要選項可見，部分文字需判讀 |
| 熟手效率 | n/a | 展示首頁無重複作業流程 |
| 美感與簡素 | 3 | 留白克制，中段敘事偏長 |
| 錯誤復原 | n/a | 此頁無提交或錯誤復原任務 |
| 說明文件 | n/a | 觀展入口不需操作手冊 |

**掃描證據與小項**

CLI 偵測器掃描首頁檔案一次，回傳 81 個提醒：51 個色彩、26 個字級 advisory，另 4 個 warning 來自兩段 Inter 宣告。這兩個 selector 已不在目前首頁 template 中，因此不能把它們列為畫面實際用了錯誤字體；大批色彩提醒主要反映特殊材質色尚未完整映射到設計文件。

本機靜態頁的瀏覽器偵測另回傳 33 項：24 個微小字、5 個 dark-glow、2 個低對比、1 個 spotlight、1 個大字距。該臨時伺服器另有模組 MIME 與中文圖片路徑問題，限制了 overlay 的完整性；33 不與 CLI 的 81 相加，也不據此宣稱正式站有 114 個問題。正式站畫面與圖片載入另以獨立工作階段檢查，未見橫向溢出，A 的四組畫面擷取未記錄 console／page errors。

補充核對：頁尾「令和七年 · 二〇二六」的年號與西元對應不一致；攝影主圖 alt「攝影代表作品」也缺少內容描述。這兩項適合後續小修，不影響本次核心結論。

**後續方向**

優先保留現有暖牆／冷銀兩入口，把精選作品提前並放大；作者自述與年表保留為較短、較後的脈絡。下一輪再以同一組桌機／手機畫面確認作品是否真正成為主角。

兩個可供接續決策的問題：

1. 首頁中段要先調整哪一種？A：精選提早、保留雙入口；B：先看 1–2 件大作品與展籤；C：維持作者自序優先。
2. 主要行動文字要採哪一種？A：繁中主位、日文副標；B：保留日文主位並加繁中說明；C：維持目前混合。
