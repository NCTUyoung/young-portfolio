<template>
  <div ref="pageRef">
    <!--
      Round 15：縦書「目次」chapter rail（lg+ only fixed 右側）
      編輯化目次：序 / 領 / 対 / 步 / 選 / 印 — 把首頁敘事擬書目
    -->
    <ChapterRail />

    <!-- freshen R2：砍掉全頁「綴じ糸」固定縫線 + 朱結（scroll-driven 裝飾過載，
         與「清新」相悖；critic 點名 motif/裝飾通膨）。bindingProgress JS 保留，
         僅供 Featured 暖→冷 sweep 使用。 -->

    <!-- =====================================================================
         Hero — 対開扉頁（R4 強硬大膽：對開帶升格為首屏 hero）
         上一輪 critic jump-out：「破『hero 三連拼貼』鐵律——首屏直接做左繪/右影對開，
           兩半各鋪一張該世界代表圖（繪滿版方格/影膠卷流），背景色拉開明度差，
           中央書脊縫即導覽，點任一半進對應 gallery；對開帶本身就是新 hero。
           兩半 reveal 從書脊向外展開（reduced-motion 改淡入）。」
         回應（結構性大改，非 chrome）：
           - 廢除 3 連拼貼 hero-collage（5 年的 §11 策略 C），改 hero-spread 對開兩半。
           - 左半 = 繪世界（暖陽 fdfaf4 + 工程方格紙 + Zen Kaku 幾何字 + 滿版代表電繪）。
           - 右半 = 影世界（暗室 14181b + 顯影顆粒 + Shippori 明體 + 滿版代表攝影，明度差 ~15 階）。
           - 中央書脊縫（hero-spine）= 導覽：縦書き「繪／影」與令和年號，視覺鉚定「翻開兩本書」。
           - 兩半各掛世界標牌（製図室／暗室）+ 進場 reveal 從書脊向外展開（hero-spread--in）。
           - 點任一半 → /gallery/digital | /gallery/photography（heroFocus toggle hover 強化）。
         鐵律破例（見 rulesBroken）：破 hero 三連拼貼策略 C；右半 stone 主軸內換暗室冷青 +
           serif 字族；左半暖陽 + 幾何 sans。皆有「兩世界 identity 首屏即兌現」之敘事正當性。
         hero static 守線：無 autoplay/timer/carousel；hover/click 才變化（user-initiated）。
         ===================================================================== -->
    <section
      class="hero-spread relative min-h-[600px] h-[82vh] md:min-h-[680px] overflow-hidden"
      :class="{ 'hero-spread--in': heroIn }"
      role="region"
      aria-roledescription="封面對開主視覺"
      aria-label="繪と影 — 左繪右影對開扉頁，點任一半進入對應圖片庫"
    >
      <!-- 對開兩半：lg+ 左右；mobile 上下 -->
      <div class="hero-spread__pages" :data-hover="heroHover || 'none'">
        <!-- ============ 左半：繪世界（製図室） ============ -->
        <NuxtLink
          to="/gallery/digital"
          class="hero-page hero-page--kai group"
          aria-label="進入繪世界 — 製図室 Digital Gallery"
          @mouseenter="setHoverFocus('kai')"
          @mouseleave="setHoverFocus(null)"
        >
          <img
            v-if="heroCollage.art"
            :src="heroCollage.art"
            :alt="`電繪作品代表 — ${heroCollage.artTitle}`"
            class="hero-page__img"
            fetchpriority="high"
            loading="eager"
            decoding="async"
          >
          <span class="hero-page__texture" aria-hidden="true"/>
          <span class="hero-page__wash hero-page__wash--kai" aria-hidden="true"/>
          <span class="hero-page__plate">
            <span class="hero-page__eyebrow hero-page__eyebrow--mono"><span aria-hidden="true">[</span>繪 / DIGITAL<span aria-hidden="true">]</span></span>
            <span class="hero-page__title hero-page__title--kai">製図室</span>
            <span class="hero-page__note hero-page__note--kai">幾何から角色へ、規矩から自由へ。</span>
            <span class="hero-page__enter">
              <span class="hero-page__enter-label">繪を見る</span>
              <svg class="hero-page__enter-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
            </span>
          </span>
        </NuxtLink>

        <!-- ============ 中央書脊縫：導覽軸（縦書き 繪／影 + 令和年號） ============ -->
        <div class="hero-spine" aria-hidden="true">
          <span class="hero-spine__rule hero-spine__rule--top"/>
          <span class="hero-spine__kana font-jp">繪<span class="hero-spine__div">／</span>影</span>
          <span class="hero-spine__era font-jp">令和七年</span>
          <span class="hero-spine__rule hero-spine__rule--bot"/>
        </div>

        <!-- ============ 右半：影世界（暗室） ============ -->
        <NuxtLink
          to="/gallery/photography"
          class="hero-page hero-page--kage group"
          aria-label="進入影世界 — 暗室 Photography Gallery"
          @mouseenter="setHoverFocus('kage')"
          @mouseleave="setHoverFocus(null)"
        >
          <img
            v-if="heroCollage.main"
            :src="heroCollage.main"
            alt=""
            class="hero-page__img"
            fetchpriority="high"
            loading="eager"
            decoding="async"
            aria-hidden="true"
          >
          <span class="hero-page__texture" aria-hidden="true"/>
          <span class="hero-page__wash hero-page__wash--kage" aria-hidden="true"/>
          <span class="hero-page__plate hero-page__plate--right">
            <span class="hero-page__eyebrow hero-page__eyebrow--serif">影 — Photography</span>
            <span class="hero-page__title hero-page__title--kage">暗室</span>
            <span class="hero-page__note hero-page__note--kage">光と影を、現像する。</span>
            <span class="hero-page__enter hero-page__enter--right">
              <svg class="hero-page__enter-arrow hero-page__enter-arrow--left" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M7 8l-4 4m0 0l4 4m-4-4h18"/></svg>
              <span class="hero-page__enter-label hero-page__enter-label--serif">影を見る</span>
            </span>
          </span>
        </NuxtLink>
      </div>

      <!-- 對開帶上方一行余白主題（極簡 overlay，不搶圖；首屏即見命題） -->
      <p class="hero-spread__masthead" aria-label="余白 — 繪と影、二つの世界">
        <span class="hero-spread__masthead-kanji font-jp">余白</span>
        <span class="hero-spread__masthead-en">Two worlds · one ink</span>
      </p>
    </section>

    <!-- =====================================================================
         序・自己紹介 — 合併開卷（R8 強硬大膽 · 首頁精簡）
         R8：把原獨立的「序 Prologue band」（py-14 lg:py-20 + border-b 整帶）併入
             「自己紹介 About」成單一開卷 section，砍掉一整段堆疊的版面與分隔帶。
             critic 連輪點名「序/自介/步履未再精簡合併、整頁仍長」——本輪不再各據一帶：
               · 序 = 開卷 masthead（章題 序 + 起算 ledger + 入口），承接 hero 對開帶。
               · 自己紹介 = 開卷下半的 portrait + 人物文字，與序共用同一版心、同一進場節奏。
             兩者本就同屬「翻開封面後的第一頁自序」，分成兩個 full-bleed band 是冗餘 scroll。
             合併後首訪由 hero → 一頁自序（序＋人）→ 步履，少一次整屏停頓。
             SEO：頁面唯一 <h1>序 保留於此（移進合併 section，層級不變）。
         ===================================================================== -->
    <section class="relative pt-10 pb-12 lg:pt-12 lg:pb-20">
      <div class="max-w-5xl mx-auto px-6 sm:px-10 lg:px-16">
        <!-- 序 — 開卷 masthead：章題 + 双軌起算 ledger + 入口（原 prologue band 內容） -->
        <div class="relative w-full max-w-xl lg:pr-12 mb-12 lg:mb-16">
          <h1 class="reveal jp-section-title text-3xl sm:text-4xl">序
            <span class="jp-section-ruby">Prologue</span>
          </h1>

          <!--
            R48：「双軌起算 ledger」— 把 2018 vs 2024 的六年時間差量化成一條起算尺
            （左 繪・二〇一八、右 影・二〇二四、中央 badge 寫先行年數），首訪可讀。
            data 來源：digitalManifesto / photographyManifesto store getter。
            R8：原 prologue band 整段移入此合併 section，內容與行為不變。
          -->
          <div class="reveal reveal-delay-2 track-ledger" aria-label="双軌起算：繪自二〇一八、影自二〇二四，影軌晚六年">
            <p class="track-ledger__eyebrow">起算 · Since</p>
            <div class="track-ledger__rail">
              <!-- 左端：繪軌起點 -->
              <div class="track-ledger__node track-ledger__node--kai">
                <span class="track-ledger__kana font-jp" :style="{ color: trackLedger.kai.ink }" aria-hidden="true">{{ trackLedger.kai.kana }}</span>
                <span class="track-ledger__year jp-kansuji">{{ trackLedger.kai.startKansuji }}</span>
                <span class="track-ledger__roman">{{ trackLedger.kai.roman }}</span>
              </div>

              <!-- 中段尺身：實線（繪已走）+ dashed（影尚未存在）+ 量距 badge -->
              <div class="track-ledger__span" aria-hidden="true">
                <span class="track-ledger__span-solid"/>
                <span class="track-ledger__gauge">
                  <span class="track-ledger__gauge-num jp-kansuji">{{ trackLedger.gapKansuji }}</span>
                  <span class="track-ledger__gauge-unit font-jp">年先行</span>
                </span>
                <span class="track-ledger__span-dashed"/>
              </div>

              <!-- 右端：影軌起點 -->
              <div class="track-ledger__node track-ledger__node--kage">
                <span class="track-ledger__kana font-jp" :style="{ color: trackLedger.kage.ink }" aria-hidden="true">{{ trackLedger.kage.kana }}</span>
                <span class="track-ledger__year jp-kansuji">{{ trackLedger.kage.startKansuji }}</span>
                <span class="track-ledger__roman">{{ trackLedger.kage.roman }}</span>
              </div>
            </div>
            <!-- 兩軌宣言並置（與 plate 同層，3 秒可讀） -->
            <div class="track-ledger__declarations">
              <p class="track-ledger__decl track-ledger__decl--kai font-jp">{{ trackLedger.kai.declaration }}</p>
              <p class="track-ledger__decl track-ledger__decl--kage font-jp">{{ trackLedger.kage.declaration }}</p>
            </div>
          </div>

          <!-- 入口：低調文字 + 箭頭 -->
          <div class="reveal reveal-delay-1 mt-10 lg:mt-14 flex flex-wrap items-center gap-x-8 gap-y-4">
            <NuxtLink
              :to="galleryTarget"
              class="group inline-flex items-center gap-3 text-stone-800 dark:text-stone-100 border-b border-stone-400/70 dark:border-stone-500/70 pb-2 pr-2 hover:border-accent-500 dark:hover:border-accent-400 transition-colors duration-500"
            >
              <span class="font-jp tracking-[0.25em] text-lg">{{ galleryCtaLabel }}</span>
              <span class="text-xs tracking-[0.3em] text-stone-500 dark:text-stone-400 uppercase">Gallery</span>
              <svg class="w-4 h-4 text-stone-500 dark:text-stone-400 transition-transform duration-500 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </NuxtLink>
            <NuxtLink
              to="/article"
              class="group inline-flex items-center gap-2 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 transition-colors duration-500"
            >
              <span class="font-jp tracking-[0.25em] text-base">文章を読む</span>
              <svg class="w-3.5 h-3.5 transition-transform duration-500 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </NuxtLink>
          </div>
        </div>

        <!-- 序 ⇄ 自己紹介 之間的開卷折縫 hairline（取代原兩 section 的 border-b 整帶分隔） -->
        <div class="reveal jp-hairline w-full mb-12 lg:mb-16"/>

        <!-- 自己紹介 About — 與序共用版心、同一進場節奏（R8 併入開卷下半） -->
        <header class="reveal mb-10 lg:mb-14 flex items-baseline justify-between flex-wrap gap-4">
          <div>
            <h2 class="jp-section-title text-4xl sm:text-5xl">自己紹介
              <span class="jp-section-ruby">About</span>
            </h2>
          </div>
          <span class="jp-vertical-caption hidden lg:inline-block">一</span>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          <!-- 左：方形頭像 + 印章 -->
          <div class="reveal-left lg:col-span-5 relative">
            <div class="jp-frame bg-stone-50 dark:bg-stone-800/40 aspect-tatami overflow-hidden relative">
              <img
                :src="avatarPath"
                alt="Young"
                class="w-full h-full object-cover"
                decoding="async"
                loading="lazy"
              >
              <!-- 右下角漢字浮水印 -->
              <span class="absolute bottom-4 right-5 font-jp text-7xl font-extralight text-white/30 dark:text-white/15 select-none leading-none">寫</span>
            </div>
            <!-- 印章 -->
            <!-- Round 18：variant C — 左上破口（hero 角章微差別於 epilogue 落款） -->
            <!-- Round 19：字身套 ink-bleed SVG filter，朱泥邊緣參差感 -->
            <span class="jp-seal jp-seal--c absolute -bottom-3 -right-3 shadow-sm"><span class="jp-seal-ink">楊</span></span>
          </div>

          <!-- 右：文字主體 -->
          <div class="lg:col-span-7 lg:pl-4">
            <p class="reveal font-jp text-2xl tracking-[0.3em] text-stone-800 dark:text-stone-100 font-light">NCTU<span class="mx-2"/>Young</p>
            <p class="reveal reveal-delay-1 mt-2 text-xs tracking-[0.45em] uppercase text-stone-500 dark:text-stone-400 font-light">Digital Painter &middot; Photographer</p>

            <!-- hairline separator -->
            <div class="reveal reveal-delay-1 jp-hairline my-8 max-w-xs"/>

            <!--
              R3（首頁精簡合併）：原 About 兩段並置——第一段講「兩條線並行」（與 Hero ledger
              + 対話 重複命題），第二段是「此處收錄…」的功能性導覽（與 gallery 本身重複）。
              併為單段：保留媒材具體性（插畫題材 / Nikon Z / 街拍夜景），剪掉重複的雙主線宣言
              與導覽說明，讓 About 回到「人」而非「再講一次雙主線」。
            -->
            <p class="reveal reveal-delay-2 jp-body text-[0.95rem] max-w-xl">
              插畫自幾何、角色至場景；攝影以街拍、活動與城市夜景為主，用 Nikon Z 系統把當下的光影留下。零碎日常亦會在 Instagram 與 Threads 更新。
            </p>

            <div class="reveal reveal-delay-3 mt-10">
              <SocialMediaLinks />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!--
      R32：「領域 Domains」section 整段刪除
      critic R31 命中：「繪×影」motif 在 Hero / Domains / 対話 / Journey / Featured / Epilogue 出現 6 次
      Domains 是純文字版「繪/影 對聯 + tag list」— 與 Hero subtitle 與 対話 完全重複
      訪客在 Hero 已被告知雙主線、在 Journey 看到時間軸、在 Featured 看到作品 — Domains 是多餘的「教學頁」
      ===================================================================== -->

    <!--
      R31：砍掉「道具 Tools」section（generic spec list，非 dual-track narrative，user 反饋首頁太冗雜）
      R31：砍掉「侘寂 引言」section（單句 quote，与 Epilogue 收筆語重疊）
      R6（act-critic 首頁精簡）：砍掉獨立的 `<section id="dialogue">`（原 py-28 lg:py-36，
      約一整屏高度）。critic 連 3 輪點名首頁過長、対話 couplet 與 Journey 命題重複。
      対話 的「繪で影を描く／影で繪を撮る」對位悖論本就是「走兩條軌之前的宣言」，
      把它折進 Journey 的 masthead（軌頭上方），讓宣言緊貼它要走的時間軸，
      不再獨佔一屏。`id="dialogue"` 錨點移到 Journey section（ChapterRail 對齊調整）。
      ===================================================================== -->

    <!-- =====================================================================
         步履 — Journey（雙軌時間軸：繪左／影右／合流中）— id="journey"（Round 15 ChapterRail）
         R6：併入 対話 couplet 作 masthead；保留 id="dialogue" 兼容 ChapterRail 錨點
         2026-05-25：由單線 zig-zag 改為 track-driven 雙軌
           - desktop：digital → 左欄；photo → 右欄；both → 跨欄置中（合流節點）
           - 影軌頭部加「未だ無し」縦書き墓誌，把 2018-2024 的空白變成敘事
           - mobile：維持單欄，chapter kanji 旁加小縦書き track tag（繪 / 影 / 共）
         守門：marker 不破 stone 系；縦書き只在 desktop 軌頭出現 1 次，不通膨
         ===================================================================== -->
    <section id="journey" class="relative py-14 lg:py-20 scroll-mt-24">
      <!-- ChapterRail 的「対」錨點：併入 Journey 後，dialogue 錨點落在此 masthead 上緣 -->
      <span id="dialogue" class="absolute -top-24" aria-hidden="true"/>
      <div class="max-w-5xl mx-auto px-6 sm:px-10 lg:px-16">
        <!-- freshen R2：砍掉「対話 couplet」（繪で影を描く／影で繪を撮る 縦書對聯 + 対 朱印
             + 背景「対」ghost）。critic 點名 motif 通膨——書脊繪／影 已是 dual-track 唯一錨點，
             此處重述第 4 次。id="dialogue" 錨點保留於上方 span，ChapterRail 不受影響。 -->

        <header class="reveal mb-12 flex items-baseline justify-between flex-wrap gap-4">
          <h2 class="jp-section-title text-3xl sm:text-4xl">步履
            <span class="jp-section-ruby">Journey</span>
          </h2>
          <span class="text-[0.7rem] tracking-[0.4em] text-stone-400 dark:text-stone-500 uppercase">二〇一八 — 二〇二六</span>
        </header>

        <!-- 雙軌軌頭（desktop only）：繪 / 影 標籤對位中央軸；強化「兩條河」意象 -->
        <div class="reveal hidden md:grid md:grid-cols-2 md:gap-12 mb-10 relative">
          <div class="md:text-right md:pr-12">
            <p class="jp-eyebrow justify-end text-stone-500"><span>Digital</span></p>
            <span class="block font-jp text-2xl font-extralight tracking-[0.4em] text-stone-700 dark:text-stone-200 mt-2">繪</span>
          </div>
          <div class="md:pl-12">
            <p class="jp-eyebrow text-stone-500"><span>Photography</span></p>
            <span class="block font-jp text-2xl font-extralight tracking-[0.4em] text-stone-700 dark:text-stone-200 mt-2">影</span>
          </div>
          <!-- 中央軸：在軌頭間加一道短 hairline-v 視覺鉚定起點 -->
          <span class="absolute left-1/2 -translate-x-px top-0 bottom-0 jp-hairline-v" aria-hidden="true"/>
        </div>

        <div class="relative journey-thread">
          <!--
            中線（桌面）— Round 11 升級：scroll-driven ink-fill
            底層仍是 jp-hairline-v 靜態 thread（fallback 永遠存在）；
            上層 journey-thread-fill 用 animation-timeline: view() 隨 scroll 拉長 scaleY
            視覺：使用者捲動 Journey 時，朱色墨絲從上方延伸而下，象徵「正在走過」
            不支援瀏覽器：thread-fill scaleY 0 → 等同隱形，無視覺破口
            prefers-reduced-motion：強制 scaleY 0，回退到純靜態 hairline
          -->
          <div class="hidden md:block absolute top-0 bottom-0 left-1/2 -translate-x-px w-px jp-hairline-v"/>
          <div class="hidden md:block absolute top-0 bottom-0 left-1/2 -translate-x-px w-px journey-thread-fill" aria-hidden="true"/>
          <!-- 手機左線 -->
          <div class="md:hidden absolute top-0 bottom-0 left-3 w-px jp-hairline-v"/>
          <div class="md:hidden absolute top-0 bottom-0 left-3 w-px journey-thread-fill" aria-hidden="true"/>

          <ol class="space-y-12 md:space-y-20">
            <li
              v-for="(m, index) in milestonesWithPlace"
              :key="index"
              class="reveal relative md:grid md:grid-cols-2 md:gap-12"
              :class="[`reveal-delay-${Math.min(index + 1, 5)}`]"
            >
              <!--
                節點 marker（Round 2 升級 both 軌）
                - digital：實心菱形（既有語彙）
                - photo：環狀菱形（鏡頭隱喻，stone 系不破色）
                - both：合流大菱形 + V 形匯入線 + 內芯（雙線歸一儀式）
                注意：marker 在 mobile 沿用左 3px 軸；desktop 永遠在中央軸上
              -->
              <span
                v-if="m.track !== 'both'"
                class="absolute md:left-1/2 md:-translate-x-1/2 left-3 -translate-x-1/2 top-2 w-2.5 h-2.5 rotate-45 ring-4 ring-stone-50 dark:ring-stone-900"
                :class="m.track === 'photo' ? 'bg-stone-50 dark:bg-stone-900 border border-accent-500/80 dark:border-accent-400/80' : 'bg-accent-500/80 dark:bg-accent-400/80'"
                aria-hidden="true"
              />
              <template v-if="m.track === 'both'">
                <!-- V 形匯入線（desktop only）：左右兩條 hairline 從上方斜匯入中央 marker -->
                <svg
                  class="hidden md:block absolute left-1/2 -translate-x-1/2 -top-12 w-44 h-14 pointer-events-none"
                  viewBox="0 0 176 56"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <line x1="0" y1="0" x2="86" y2="54" stroke="currentColor" stroke-width="1" class="text-stone-300 dark:text-stone-600 opacity-80"/>
                  <line x1="176" y1="0" x2="90" y2="54" stroke="currentColor" stroke-width="1" class="text-stone-300 dark:text-stone-600 opacity-80"/>
                </svg>
                <!--
                  合流大菱形（Round 12 升級：scroll-driven pulse）
                  - 加 .confluence-marker class：view-timeline 抵達中段時 scale 1 → 1.4 → 1
                  - ::after 朱光 ring 同步 pulse（淡入淡出）
                  - 既有 ring-4 stone 圈仍是 fallback chrome（不支援 / reduced-motion 時的靜態）
                -->
                <span
                  class="confluence-marker absolute md:left-1/2 md:-translate-x-1/2 left-3 -translate-x-1/2 top-1 w-4 h-4 rotate-45 bg-accent-500 dark:bg-accent-400 ring-4 ring-stone-50 dark:ring-stone-900 shadow-sm"
                  aria-hidden="true"
                />
                <!-- 內芯白菱形：兩線歸一視覺 -->
                <span
                  class="hidden md:block absolute md:left-1/2 md:-translate-x-1/2 top-[10px] w-1.5 h-1.5 rotate-45 bg-stone-50 dark:bg-stone-900"
                  aria-hidden="true"
                />
              </template>

              <!-- 行動版：單欄 + track tag -->
              <div class="md:hidden pl-10">
                <p class="jp-kansuji text-sm text-accent-600 dark:text-accent-400 tracking-wider mb-1 flex items-center gap-2">
                  <span class="font-jp text-[0.7rem] tracking-[0.3em] text-stone-500 dark:text-stone-400 px-1.5 py-0.5 border border-stone-300/70 dark:border-stone-600/70">
                    {{ m.track === 'digital' ? '繪' : m.track === 'photo' ? '影' : '繪×影' }}
                  </span>
                  <span>{{ m.kansuji }} / {{ m.year }}</span>
                  <span v-if="m.place" class="mx-1 text-stone-400">·</span>
                  <span v-if="m.place" class="text-stone-500 dark:text-stone-400 font-jp tracking-[0.2em]">{{ m.place }}</span>
                </p>
                <h3 class="font-jp text-lg font-light tracking-[0.2em] text-stone-800 dark:text-stone-100">
                  <span v-if="m.chapter" class="mr-2 text-accent-500 dark:text-accent-400 font-extralight">{{ m.chapter }}</span>{{ m.title }}
                </h3>
                <p class="jp-body text-sm mt-2">{{ m.description }}</p>
              </div>

              <!--
                桌面：track-driven 分軌
                - digital：左欄（右對齊）
                - photo：右欄（左對齊）
                - both：跨欄置中（合流敘事）
              -->
              <div
                class="hidden md:block"
                :class="
                  m.track === 'both'
                    ? 'md:col-span-2 md:text-center md:px-12 md:pt-8'
                    : m.track === 'digital'
                      ? 'md:text-right md:pr-12'
                      : 'md:col-start-2 md:pl-12'
                "
              >
                <!--
                  both 軌：合流眉題前置（Round 2 升級 → Round 3 收緊）
                  - Round 3：pt-6 → pt-1；eyebrow mb-4 → mb-2；讓 V→菱形→築 三拍緊鄰，
                    避免 200px+ 空白讓合流節點與「築」斷裂
                -->
                <!--
                  合流眉題（Round 4 升級）：critic 指原 jp-eyebrow ::before 單側 hairline
                  橫跨整欄讓「三拍」第二拍像獨立章節。改為對稱 60-80px 短 hairline 居中，
                  視覺像「兩股流匯入眉題」，與下方 V 形匯入線意象相承
                -->
                <p
                  v-if="m.track === 'both'"
                  class="inline-flex items-baseline justify-center gap-3 mb-2 text-[0.7rem] tracking-[0.35em] uppercase font-light text-accent-500 dark:text-accent-400"
                >
                  <span class="inline-block w-12 h-px bg-current opacity-50"/>
                  <span>合流 · Confluence</span>
                  <span class="inline-block w-12 h-px bg-current opacity-50"/>
                </p>
                <p class="jp-kansuji text-sm text-accent-600 dark:text-accent-400 tracking-wider mb-1">{{ m.kansuji }}<span class="mx-2 opacity-50">／</span>{{ m.year }}</p>
                <h3 class="font-jp text-xl font-light tracking-[0.25em] text-stone-800 dark:text-stone-100 mb-2">
                  <span v-if="m.chapter" class="mr-3 text-accent-500 dark:text-accent-400 font-extralight">{{ m.chapter }}</span>{{ m.title }}
                </h3>
                <p class="jp-body text-[0.95rem]" :class="m.track === 'both' ? 'mx-auto max-w-md' : ''">{{ m.description }}</p>

                <!--
                  Round 16：合流節點 click → case-study reveal
                  critic Round 15 提：「合流大菱形可點擊進 case-study」
                  改法：用 native <details>/<summary> 做可展開合流物語，無 modal、無 JS state
                  展開後雙欄：繪 軸（2018-2024 鍛鍊）+ 影 軸（2024 起步）+ 一句總結
                  繞過 wabi-sabi 三鍵：(a) summary 看不像 button，hairline-only；(b) 內容雙欄對位呼應対話；(c) accent 僅章題與 hairline
                -->
                <details v-if="m.track === 'both'" class="confluence-story group mt-7 lg:mt-9 mx-auto max-w-2xl text-center">
                  <summary
                    class="cursor-pointer list-none inline-flex items-center gap-3 text-[0.62rem] tracking-[0.5em] uppercase text-stone-500 dark:text-stone-400 group-hover:text-accent-600 dark:group-hover:text-accent-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-500/60 rounded-sm transition-colors duration-300"
                  >
                    <span class="inline-block w-6 h-px bg-stone-300 dark:bg-stone-600 group-hover:bg-accent-500/70 group-hover:w-9 transition-all duration-300" aria-hidden="true"/>
                    <span class="font-jp tracking-[0.45em]">合流の物語</span>
                    <span class="text-stone-400 dark:text-stone-500 transition-transform duration-300 group-open:rotate-180" aria-hidden="true">⌄</span>
                  </summary>
                  <div class="mt-8 lg:mt-10 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 md:gap-10 items-start">
                    <!-- 繪 軸：六年鍛鍊 -->
                    <article class="md:text-right">
                      <p class="jp-eyebrow justify-center md:justify-end text-stone-500 mb-2"><span>Digital · 繪</span></p>
                      <h4 class="font-jp text-base font-extralight tracking-[0.35em] text-stone-700 dark:text-stone-200">六年の鍛錬</h4>
                      <p class="jp-body text-[0.9rem] mt-3 max-w-xs md:ml-auto">
                        二〇一八幾何插畫、二〇二〇人物角色、二〇二四技法精進——筆觸從規矩走到自由的六年。
                      </p>
                    </article>
                    <!-- 中釘 hairline-v + 朱印「合」 -->
                    <div class="hidden md:flex flex-col items-center self-stretch py-1" aria-hidden="true">
                      <span class="w-px flex-1 bg-gradient-to-b from-transparent via-stone-300/70 dark:via-stone-600/60 to-transparent"/>
                      <span class="jp-seal !w-9 !h-9 !text-sm shrink-0 my-1"><span class="jp-seal-ink">合</span></span>
                      <span class="w-px flex-1 bg-gradient-to-b from-transparent via-stone-300/70 dark:via-stone-600/60 to-transparent"/>
                    </div>
                    <!-- 影 軸：一年起步 -->
                    <article class="md:text-left">
                      <p class="jp-eyebrow justify-center md:justify-start text-stone-500 mb-2"><span>Photography · 影</span></p>
                      <h4 class="font-jp text-base font-extralight tracking-[0.35em] text-stone-700 dark:text-stone-200">一年の出発</h4>
                      <p class="jp-body text-[0.9rem] mt-3 max-w-xs">
                        二〇二四 Nikon Z f 入手——從零開始、夜景、街拍、淺景深，與電繪筆觸互相滋養。
                      </p>
                    </article>
                  </div>
                  <!-- 收束句：合流的真意 -->
                  <blockquote class="mt-8 lg:mt-10 font-jp text-sm lg:text-base font-extralight tracking-[0.35em] text-stone-600 dark:text-stone-300 leading-[2] text-center">
                    繪は影を学び、<span class="mx-2 text-stone-400">影は繪を学ぶ。</span>
                  </blockquote>
                </details>
              </div>

              <!--
                直排地名軸字（Phase 2；2026-04-20 → 2026-05-25 雙軌調整）
                - 只有 photo / both 軌（usePhotoLocation=true）才會有 place
                - photo 軌 content 在右欄 → place 流到左欄空位
                - both 軌跨欄置中 → place 流到下方獨立區塊（mobile fallback 已在上方含 place）
              -->
              <aside
                v-if="m.place && m.track !== 'both'"
                class="hidden md:flex items-start pt-1 md:pr-12 md:justify-end md:row-start-1 md:col-start-1"
                aria-hidden="true"
              >
                <span class="writing-vertical font-jp text-[0.8rem] tracking-[0.55em] text-stone-500 dark:text-stone-400 font-extralight leading-none">
                  {{ m.place }}
                </span>
              </aside>
            </li>
          </ol>

          <!--
            影軌墓誌（desktop only · Round 2 升級為貫穿軌道）
            critic Round 1 指出：原本 absolute top-0 + 單塊「未だ無し」讓 photo 軌看起來像
            「斷掉的單點」而非「空白的軌道」，視覺重量 5:1 失衡。
            改法：dashed 虛線縱貫帶 + 4 字分散沿線（未 / だ / 無 / し），
            讓 2018-2024 的影軌空白本身有結構，把「留白也是一條軌」做實。
            高度延伸到 photo 軌第一個 milestone（2024 撮）之前 ~75% 高度。
          -->
          <!--
            NOT YET 貫穿軌（Round 3 微調）：
            - 高度 75% → 58%，在 photo 軌啟動點（2024 撮 ~ 60% 位置）前自然收束，不再壓到 2024 撮 eyebrow
            - 4 字 padding 加大讓字距更詩意（不再像 placeholder）
            - NOT YET caption 改放在虛線下方留 12px gap，與虛線形成完整收尾
          -->
          <aside
            class="hidden md:block absolute top-0 right-0 w-1/2 pl-12 h-[58%] pointer-events-none select-none"
            aria-hidden="true"
          >
            <div class="relative h-full flex flex-col items-start text-stone-400 dark:text-stone-500">
              <!-- 虛線縱貫線：在虛線終點處再加一個短橫線收筆 -->
              <span class="absolute left-0 top-2 bottom-6 border-l border-dashed border-stone-300 dark:border-stone-600/70"/>
              <span class="absolute -left-1 bottom-6 w-2 h-px bg-stone-300 dark:bg-stone-600/70"/>
              <!-- 4 字沿線分散：加大字距讓墓誌更有呼吸 -->
              <div class="ml-3 flex flex-col justify-between h-[calc(100%-2rem)] py-3">
                <span class="font-jp text-[0.85rem] tracking-[0.5em] font-extralight leading-none opacity-70">未</span>
                <span class="font-jp text-[0.85rem] tracking-[0.5em] font-extralight leading-none opacity-70">だ</span>
                <span class="font-jp text-[0.85rem] tracking-[0.5em] font-extralight leading-none opacity-70">無</span>
                <span class="font-jp text-[0.85rem] tracking-[0.5em] font-extralight leading-none opacity-70">し</span>
              </div>
              <!-- 軌尾 latin caption，貼虛線收筆後 12px -->
              <span class="absolute left-3 bottom-0 text-[0.55rem] tracking-[0.4em] uppercase opacity-50">Not yet</span>
            </div>
          </aside>
        </div>
      </div>
    </section>

    <!-- =====================================================================
         精選 — 雙橫卷（攝影 + 電繪），data-driven 自 series:['featured']
         2026-04-29：撤掉 hardcoded featuredWorks 陣列 + 3x2 grid，
                     兩個 medium 各自有書腰 + 橫卷，呼應「雙主線並行」首頁敘事；
                     手機由 HorizontalStripFeatured 內部 fallback 為 2-col grid。
         ===================================================================== -->
    <section id="featured" class="relative py-14 lg:py-20 scroll-mt-24 overflow-hidden">
      <div class="jp-hairline absolute top-0 left-0 right-0"/>
      <!--
        R10 強硬大膽（首頁精簡 — 砍重複入口帶）：
        刪除原 Featured「對開雙世界帶」（製図室／暗室 兩片入口 plate）。
        critic 連輪點名首頁精簡停滯——這片 plate 與第一屏 Hero-spread 的兩半
        逐字重複：同 製図室／暗室 標牌、同 繪を見る／影を見る CTA、同暖陽/暗室質地。
        訪客在首屏已被兩世界入口擊中，Featured 再貼一次同樣的門牌＝冗餘 scroll 與
        敘事原地踏步。本輪把 Featured 從「入口承諾 #2」改成「實證」——
        只留資料驅動的年尺（FeaturedYearRuler，繪八年/影兩年的實體距離差），
        並由 §header 一行 bridge 承接 Hero 的暖/冷 identity（文字一線而非整片門牌）。
        為了讓兩世界 identity 仍延續到 Featured，section 底鋪一層 scroll-driven
        暖→冷掃描層（featured-sweep），隨捲動把版面從繪暖陽過渡到影冷銀，
        呼應 Hero 對開兩半，但不再重述門牌。砍掉約 190 行 .featured-half CSS。
      -->
      <header class="reveal mb-3 lg:mb-4 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 flex items-baseline justify-between flex-wrap gap-4">
        <h2 class="jp-section-title text-3xl sm:text-4xl">選
          <span class="jp-section-ruby">Featured · 二つの世界</span>
        </h2>
        <NuxtLink
          to="/gallery"
          class="group inline-flex items-center gap-2 text-xs tracking-[0.35em] uppercase text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 transition-colors"
        >
          <span class="font-jp tracking-[0.35em]">全てを見る</span>
          <svg class="w-3.5 h-3.5 transition-transform duration-500 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </NuxtLink>
      </header>

      <!-- bridge：一行承接 Hero 暖/冷 identity（繪暖 → 影冷），不再貼整片門牌 -->
      <p class="reveal reveal-delay-1 mb-10 lg:mb-14 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 text-[0.78rem] sm:text-sm tracking-[0.18em] text-stone-500 dark:text-stone-400 font-jp leading-[2]">
        <span class="featured-bridge-kai">製図室の暖い陽</span><span class="mx-2 text-stone-300 dark:text-stone-600" aria-hidden="true">——</span><span class="featured-bridge-kage">暗室の冷たい銀</span>。同じ一冊の、二つの頁。
      </p>

      <div class="featured-section relative max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">
        <!--
          R10 新動效：暖→冷 scroll-driven 掃描底層。
          隨頁面捲動進度（bindingProgress 0→1）把背景 hue 從繪暖陽推向影冷銀，
          視覺上「翻過繪頁、現出影頁」，把兩世界 identity 延續進 Featured 而不重述門牌。
          純 scroll-driven（沿用 home-binding 的 rAF 進度，無 timer/autoplay）。
          reduced-motion：CSS 端凍結在中性值（見 .featured-sweep）。
        -->
        <span
          class="featured-sweep"
          aria-hidden="true"
          :style="{ '--sweep': bindingProgress }"
        />

        <!--
          Round 10（act-critic loop）：題詞見開き FeaturedManifesto → 年尺 FeaturedYearRuler。
          critic R9 jump-out：「別再雕轉場——把 startYear/EXIF 升級成每張作品的『距起算第幾年』
          敘事 metadata，讓六年尺長駐在 gallery 內容本身（時間軸排序、作品角標年差），
          而非只活在 1.7 秒過場幕裡。讓敘事在內容裡，不在等待裡」。
          回應（跨層大改，衍生資料層 + 全新版面）：
          ① 衍生層：store 新增 featuredChronology getter，把每張 featured 作品算出
             yearIndex（該作年份 − 軌起始年）並投影到雙軌共用的 0..span 整數年尺。
          ② 版面：撤掉兩片靜態題詞，改「年尺 / Year-Ruler」——繪（上）自 2018 走滿八格、
             影（下）自 2024 只佔右段兩格，雙主線時間差成為版面上的實體水平距離，首屏即見。
          ③ 每個節點帶「第 N 年 / 年目」角標（軌墨色描邊不填色，守 stone 主軸），
             六/八年尺長駐在內容本身，不靠轉場、不靠下滑、不靠等待。
        -->
        <div class="reveal"><FeaturedYearRuler /></div>
      </div>
    </section>

    <!-- R31：「目次 Index」section 整段刪除（與 Hero 已有的 /gallery + /article 入口重複） -->

    <!-- =====================================================================
         印 — Signature Epilogue（Round 13 全新章節）
         敘事邏輯：Hero 立軸 → Domains 分聯 → 対話 立宣言 → Journey 走過時間
                  → Featured 收作品 → 印 落款收束（書末朱印）
         構成：極簡單頁，置中朱印「楊」+ 一句署名 + 兩條 hairline 收角
         守門：accent 僅朱印 + epilogue 副題；其餘 stone；無新動效，靠版面收束
         ===================================================================== -->
    <section
      id="epilogue"
      class="relative py-24 lg:py-32 overflow-hidden bg-stone-100/30 dark:bg-stone-900/30 scroll-mt-24"
      role="region"
      aria-roledescription="署名落款"
      aria-label="印 — Signature"
    >
      <!-- 上 hairline 收 Featured 區邊界 -->
      <div class="jp-hairline absolute top-0 left-0 right-0"/>

      <!--
        背景：極淡縦書「終」單字 ghost — 須比 対話「対」更克制
        因為前景署名 + 主文密度高，背景不能搶。size 26vw → 16vw, opacity 22/15 → 10/8
      -->
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none select-none" aria-hidden="true">
        <span class="font-jp text-[clamp(7rem,16vw,12rem)] font-extralight text-stone-300/30 dark:text-stone-700/20 leading-none [writing-mode:vertical-rl] tracking-[0.12em]">終</span>
      </div>

      <div class="relative max-w-3xl mx-auto px-6 sm:px-10 text-center">
        <!-- 章題 minimal eyebrow（與 対話 同級，避免 jp-section-title 過密） -->
        <p class="reveal jp-eyebrow justify-center text-stone-500 mb-10 lg:mb-14">
          <span>Epilogue · 印</span>
        </p>

        <!--
          兩條短 hairline 包夾朱印
          Round 14 升級：朱印 hover 露出篆刻紋路（雙線內框 + 朱光擴張 + 微旋正）
          視為「掃描印章細節」的 editorial 互動
        -->
        <div class="reveal flex items-center justify-center gap-6 mb-10">
          <span class="jp-hairline flex-1 max-w-[6rem]" aria-hidden="true"/>
          <button
            type="button"
            class="signature-seal group relative inline-flex focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-500/60 rounded-sm"
            :aria-label="`作者朱印：楊 — 落款於令和七年`"
            @click="scrollToTop"
          >
            <span class="jp-seal !w-14 !h-14 !text-2xl shadow-sm transition-transform duration-500 group-hover:scale-105 group-hover:[transform:rotate(-1deg)_scale(1.05)]"><span class="jp-seal-ink">楊</span></span>
            <!-- 篆刻內框：hover 才顯現的雙線內 inset，模擬印章邊框 -->
            <span class="pointer-events-none absolute inset-1 border border-accent-500/0 group-hover:border-accent-500/50 dark:group-hover:border-accent-400/50 transition-all duration-500" aria-hidden="true"/>
            <span class="pointer-events-none absolute inset-2 border border-accent-500/0 group-hover:border-accent-500/30 dark:group-hover:border-accent-400/30 transition-all duration-700 delay-100" aria-hidden="true"/>
            <!-- 朱光暈：hover 擴張 -->
            <span class="pointer-events-none absolute inset-0 -m-2 rounded-sm bg-accent-500/10 dark:bg-accent-400/10 -z-10 blur-md group-hover:bg-accent-500/25 dark:group-hover:bg-accent-400/25 group-hover:-m-5 transition-all duration-700" aria-hidden="true"/>
          </button>
          <span class="jp-hairline flex-1 max-w-[6rem]" aria-hidden="true"/>
        </div>

        <!-- 落款主文：作者署名（單字本名／別稱皆 OK，這裡用 Young 配 NCTU 字樣對齊 logo） -->
        <div class="reveal reveal-delay-1 flex flex-col items-center gap-3">
          <h2 class="font-jp text-2xl lg:text-3xl font-extralight tracking-[0.45em] text-stone-700 dark:text-stone-200">Young</h2>
          <span class="text-[0.62rem] tracking-[0.5em] uppercase text-stone-400 dark:text-stone-500">NCTU · 楊</span>
        </div>

        <!--
          收束句：書末單行（與 対話「Two hands · One ink」呼應）
          Round 14：mt-2 → mt-5 拉開兩行行距；mobile tracking 縮（避免 SHADOWS 斷行孤行）
        -->
        <p class="reveal reveal-delay-2 mt-12 lg:mt-16 font-jp text-base lg:text-lg font-extralight tracking-[0.35em] text-stone-600 dark:text-stone-300 leading-[2]">
          影と繪を、<span class="text-stone-400 dark:text-stone-500">同じ墨で。</span>
        </p>
        <p class="reveal reveal-delay-3 mt-5 text-[0.6rem] sm:text-[0.62rem] tracking-[0.35em] sm:tracking-[0.5em] uppercase text-stone-400 dark:text-stone-500">
          Shadows and strokes <span class="mx-2 opacity-60">·</span> One ink
        </p>

        <!--
          R3（首頁精簡合併）：刪除 Epilogue 底部「繪 2018 ─ ✦ ─ 2024 影」雙主線時間軸。
          這是站內第三處同一條 2018/2024 時間差敘事——Hero 第一屏已有 track-ledger
          「六年先行」尺、Featured 已有 FeaturedYearRuler 年尺。Epilogue 應收束於署名朱印，
          不該再複述一次時間軸。砍掉縮短書末頁、讓落款更純粹（回應 critic 首頁精簡停滯）。
        -->

        <!--
          年代落款（與 Hero 的「令和」+「二〇二六」對接）
          Round 14：加「回到開卷」隱性錨點，書末頁可一鍵回首，閉合書本敘事
          Round 20：時間軸已收束雙線，落款縮小到次層
        -->
        <div class="reveal reveal-delay-3 mt-10 lg:mt-14 flex flex-col items-center gap-3 text-stone-400 dark:text-stone-500">
          <span class="w-px h-6 bg-stone-300/70 dark:bg-stone-600/60" aria-hidden="true"/>
          <span class="font-jp text-[0.7rem] tracking-[0.55em]">令和七年 · 二〇二六</span>
          <a
            href="#"
            class="group mt-4 inline-flex items-center gap-2 text-[0.6rem] tracking-[0.4em] uppercase text-stone-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-500/60 rounded-sm px-2 py-1"
            aria-label="回到頁首 — 重新開卷"
            @click.prevent="scrollToTop"
          >
            <span class="font-jp tracking-[0.4em]">回開卷</span>
            <span class="w-3 h-px bg-stone-300/70 group-hover:bg-accent-500/70 group-hover:w-5 transition-all duration-300" aria-hidden="true"/>
            <svg class="w-3 h-3 -rotate-90 transition-transform duration-300 group-hover:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
            </svg>
          </a>
        </div>
      </div>

      <!-- 下 hairline：書末頁底邊 -->
      <div class="jp-hairline absolute bottom-0 left-0 right-0"/>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useScrollReveal } from '~/composables/useScrollReveal'
import { useImagePath } from '~/composables/useImagePath'
import { SEO_CONFIG, SOCIAL_LINKS } from '~~/shared/config/constants'
import {
  buildPersonSchema,
  buildWebSiteSchema,
  toHeadScripts
} from '~/utils/siteSchema'
import { useGalleryStore } from '~/stores/gallery'
import { fetchPhotographyWorks, fetchDigitalWorks } from '~/stores/galleryLoaders'
import FeaturedYearRuler from '~/components/gallery/FeaturedYearRuler.vue'
import ChapterRail from '~/components/ChapterRail.vue'

const { getThumbPath } = useImagePath()
const { observeAll } = useScrollReveal()
const pageRef = ref<HTMLElement | null>(null)

/**
 * R8：綴じ糸（裝幀縫線）scroll-driven 進度（0→1）。
 * = scrollTop / (documentHeight - viewportHeight)，rAF 節流避免每次 scroll 同步 reflow。
 * 純 scroll-driven、無 timer/autoplay；驅動左版心縫線「往下縫合」與縫頭朱結下滑。
 * reduced-motion 下仍更新數值（位置正確），CSS 端去掉平滑過渡（見 main.css .home-binding）。
 */
const bindingProgress = ref(0)
let bindingRaf = 0
let bindingTicking = false
function updateBindingProgress () {
  bindingTicking = false
  if (typeof window === 'undefined') return
  const doc = document.documentElement
  const scrollable = doc.scrollHeight - window.innerHeight
  bindingProgress.value = scrollable > 0
    ? Math.min(1, Math.max(0, window.scrollY / scrollable))
    : 0
}
function onBindingScroll () {
  if (bindingTicking) return
  bindingTicking = true
  bindingRaf = requestAnimationFrame(updateBindingProgress)
}

/**
 * Round 14 epilogue：「回開卷」 + 朱印點擊都會回到頁首。
 * scroll-behavior: smooth 由瀏覽器 + Tailwind scroll-smooth 處理；
 * 此函式只負責 window.scrollTo(0,0)，呼叫端再決定 modifier 行為。
 */
function scrollToTop () {
  if (typeof window === 'undefined') return
  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' })
}

/**
 * Phase 3B/3A：首頁需 photography 作品以渲染 HorizontalStripFeatured。
 * 用同一個 useAsyncData key 讓 SSR 能 prefetch；key 與 gallery 頁不同
 * （gallery 頁是 'gallery-works' 含 digital + photo），避免 Nuxt 錯誤覆蓋。
 * strip 篩 series=featured（~8 張）；Hero 靜照篩 series=hero（建議 1 張）。
 * 共用同一筆 JSON 載入，載入成本小（photographyList.json ~80 筆）。
 */
const galleryStore = useGalleryStore()
// R48：軌道入口宣言（繪/影）— 直接讀 store 的 trackManifesto getter，
// 用於 Hero 第一屏「双軌起算 ledger」（startYear 差 + declaration 並置）。
const { digitalManifesto, photographyManifesto } = storeToRefs(galleryStore)
const { data: photoPayload } = await useAsyncData('home-photography', fetchPhotographyWorks)
// 2026-04-20：Hero 改 amble 清爽拼貼（§11 策略 C）— 需混合攝影 + 電繪兩線作品
// 同屏彰顯雙主線。此處載入 digital 供 heroCollage computed 取代表作。
const { data: digitalPayload } = await useAsyncData('home-digital', fetchDigitalWorks)
watch(
  photoPayload,
  (v) => {
    if (v) galleryStore.hydrateFromPayload({ photography: v })
  },
  { immediate: true }
)
watch(
  digitalPayload,
  (v) => {
    if (v) galleryStore.hydrateFromPayload({ digital: v })
  },
  { immediate: true }
)

// ===== 圖片路徑 =====
const avatarPath = getThumbPath('gallery/2024年電繪作品/55.jpg', 400)

// ===== Hero 靜照（Phase 3A） =====
// 2026-04-19：從 series=hero 的 JSON 資料取第一張；與 og:image / twitterImage /
// personImage 同源，避免過去 heroImages 硬編 5 張 × 3 份 OG URL 的資料債。
// 若 JSON 暫未標 hero tag（本地測試 / 極端情況），fallback 回固定路徑。
const HERO_FALLBACK = 'photography/WBC東京 台澳/DSC_9877-編輯-1.jpg'
const heroSource = computed(() => {
  const first = photoPayload.value?.works?.find(
    (img) => Array.isArray(img.series) && img.series.includes('hero')
  )
  return first?.filename || HERO_FALLBACK
})
const heroImage = computed(() => getThumbPath(heroSource.value, 800))
const heroImageAbsolute = computed(() =>
  `${SEO_CONFIG.siteUrl}images/${heroSource.value.split('/').map(encodeURIComponent).join('/')}`
)

/**
 * R48：Hero 第一屏「双軌起算 ledger」資料
 * （取代 R42/R43 的「今年 NOW」抽象面板 — 改為直接量化 startYear 時間差，首屏可讀）
 * critic R(prev) verdict = first-screen-invisible / jump-out：
 *   把 trackManifesto.startYear 差（2018 vs 2024）做進 Hero 第一屏，
 *   首訪 3 秒就撞到雙軌時間差，而非滾到 Featured / Epilogue 才見。
 * 此 computed 直接從 store getter（digitalManifesto / photographyManifesto）取
 * startYear + declaration，並算出「先行年數」當作 ledger 中央的度量數字。
 */
const ARABIC_TO_KANSUJI = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'] as const
function toKansuji (n: number): string {
  return String(n).split('').map(d => ARABIC_TO_KANSUJI[Number(d)] ?? d).join('')
}
const trackLedger = computed(() => {
  const kai = digitalManifesto.value
  const kage = photographyManifesto.value
  // 先行軌 = startYear 小者（繪 2018）；後發軌 = 大者（影 2024）。
  const lead = kai.startYear <= kage.startYear ? kai : kage
  const late = kai.startYear <= kage.startYear ? kage : kai
  const gap = Math.max(0, late.startYear - lead.startYear)
  return {
    kai: { ...kai, startKansuji: toKansuji(kai.startYear) },
    kage: { ...kage, startKansuji: toKansuji(kage.startYear) },
    gap,
    gapKansuji: toKansuji(gap)
  }
})

// ===== Hero 雙軌 toggle（R27 引入 / R28 URL state） =====
// CLAUDE.md「Hero static」鐵律解讀：禁 autoplay / carousel / auto-switching。
// 此 toggle 為 user-initiated（click only），第一屏 3 秒內把 dual-track 敘事兌現。
// R28：toggle 狀態寫進 URL `?focus=kai|kage`，並讓 hero「作品を見る」按鈕
// 依當前 focus 動態指向 /gallery/digital 或 /gallery/photography，
// 把「首屏選擇」變成 site-wide 敘事承諾（critic R27 ⚠ 跳出建議）。
type HeroFocus = 'balanced' | 'kai' | 'kage'
const route = useRoute()
const heroFocus = ref<HeroFocus>('balanced')

/**
 * R4：對開帶進場 — heroIn 在 mount 後一拍翻 true，觸發兩半「從書脊向外展開」
 * 的 CSS transition（hero-spread--in）。純一次性，無 timer/loop，不違 hero 靜態。
 * prefers-reduced-motion 由 CSS 改為純淡入。
 */
const heroIn = ref(false)
onMounted(() => {
  if (typeof window === 'undefined') { heroIn.value = true; return }
  requestAnimationFrame(() => requestAnimationFrame(() => { heroIn.value = true }))
})

/**
 * R4：對開兩半 hover 時把該世界推前（hero-page--lift），另一半微退，
 * 強化「翻開哪一本書」的選擇感。user-initiated（mouseenter），無 autoplay。
 */
const heroHover = ref<'kai' | 'kage' | null>(null)
function setHoverFocus (v: 'kai' | 'kage' | null) { heroHover.value = v }

// Init from URL or sessionStorage on mount (R47：跨頁持久化)
onMounted(() => {
  const q = route.query.focus
  const v = Array.isArray(q) ? q[0] : q
  if (v === 'kai' || v === 'kage') {
    heroFocus.value = v
  } else if (typeof window !== 'undefined') {
    const stored = window.sessionStorage.getItem('nctu-hero-focus')
    if (stored === 'kai' || stored === 'kage') heroFocus.value = stored
  }
})

/** Gallery CTA 目標路徑 — 跟著 heroFocus（URL/sessionStorage 持久化）走 */
const galleryTarget = computed(() => {
  if (heroFocus.value === 'kai') return '/gallery/digital'
  if (heroFocus.value === 'kage') return '/gallery/photography'
  return '/gallery'
})
const galleryCtaLabel = computed(() => {
  if (heroFocus.value === 'kai') return '繪を見る'
  if (heroFocus.value === 'kage') return '影を見る'
  return '作品を見る'
})

// ===== Hero 拼貼（§11 策略 C）=====
// 2026-04-20：amble 清爽拼貼讓電繪 + 攝影同屏可見，彰顯雙主線。
// - art：電繪代表作（series=hero 優先，否則最新一張，fallback 硬編）
// - main：攝影主圖（= heroSource，SEO / og:image 同源，不動）
// - sub：攝影副圖（series=hero-2 優先，否則 featured 排除主 hero，fallback 硬編）
// 若後續改 admin UI 讓 user 勾選 Hero tag，這段就全數據驅動。
const HERO_DIGITAL_FALLBACK = 'gallery/2026年電繪作品/21-編輯-編輯-編輯-1.jpg'
const HERO_PHOTO_SUB_FALLBACK = 'photography/Annber 外拍/DSC_2702-編輯-1.jpg'

const heroCollage = computed(() => {
  const digitalWorks = digitalPayload.value?.works ?? []
  const photoWorks = photoPayload.value?.works ?? []

  const digitalPick =
    digitalWorks.find((w) => Array.isArray(w.series) && w.series.includes('hero')) ||
    digitalWorks[0]
  const digitalSource = digitalPick?.filename || HERO_DIGITAL_FALLBACK
  const digitalTitle = digitalPick?.title || 'Digital artwork'

  const photoSubPick =
    photoWorks.find((w) => Array.isArray(w.series) && w.series.includes('hero-2')) ||
    photoWorks.find(
      (w) =>
        Array.isArray(w.series) &&
        w.series.includes('featured') &&
        w.filename !== heroSource.value
    ) ||
    photoWorks.find((w) => w.filename !== heroSource.value)
  const photoSubSource = photoSubPick?.filename || HERO_PHOTO_SUB_FALLBACK
  const photoSubTitle = photoSubPick?.title || 'Photography'

  // R29: mobile 依 heroFocus 換主圖（kai = 電繪、其他 = 攝影主）
  const mobileMain = heroFocus.value === 'kai'
    ? getThumbPath(digitalSource, 800)
    : heroImage.value

  return {
    art: getThumbPath(digitalSource, 800),
    artTitle: digitalTitle,
    main: heroImage.value,
    sub: getThumbPath(photoSubSource, 800),
    subTitle: photoSubTitle,
    mobileMain
  }
})

// R32：digitalTags / photoTags 移除（Domains section 已刪）
// R31：tools 陣列移除（道具 section 已刪）

// ===== 步履 Journey：章題 + 漢数字 =====
// usePhotoLocation（可選）：true 時才對應 photography event.location 聚合為縦向地名軸
// 2026-04-20 修正：原本按 year 聚合會讓同年電繪 milestone 也拿到攝影地名（2024「熟」錯配）
// 改為顯式旗標；電繪 milestone 不開，攝影相關才開
//
// 2026-05-25 雙軌改造：track 欄位驅動桌機左右分軌
//   - 'digital' = 繪軌（左）
//   - 'photo'   = 影軌（右）
//   - 'both'    = 合流（居中，雙菱形重疊）
//   把繪/影/共三類 milestone 強制覆蓋 zig-zag，視覺上呈現「電繪 6 年先行、攝影 2024 才加入、2025 兩線匯流建站」的真實故事
type JourneyTrack = 'digital' | 'photo' | 'both'
const milestones: Array<{
  year: string
  kansuji: string
  chapter: string
  title: string
  description: string
  track: JourneyTrack
  usePhotoLocation?: boolean
}> = [
  { year: '2018', kansuji: '二〇一八', chapter: '初', title: '開始數位繪畫', description: '嘗試幾何風格動物插畫與經典畫作再創作。', track: 'digital' },
  { year: '2020', kansuji: '二〇二〇', chapter: '進', title: '深入角色創作', description: '進行人物角色設計，探索多元的創作風格。', track: 'digital' },
  { year: '2024', kansuji: '二〇二四', chapter: '熟', title: '電繪技法精進', description: '累積大量作品，風格更加成熟與多樣。', track: 'digital' },
  { year: '2024', kansuji: '二〇二四', chapter: '撮', title: '踏入攝影領域', description: '入手 Nikon Z f，開始記錄城市街拍與活動紀實。', track: 'photo', usePhotoLocation: true },
  { year: '2025', kansuji: '二〇二五', chapter: '築', title: '建立作品集', description: '以 Nuxt 3 打造個人作品集，整合電繪與攝影。', track: 'both', usePhotoLocation: true }
]

/**
 * Journey 地名聚合（2026-04-20 v2 Phase 2 + 2026-04-20 修正）
 *
 * 來源：wiki/concepts/japanese-editorial-cover.md 候補機制 3（直排事件軸字）
 *       案例 B（amble #1 Tokyo）左緣縦向地名軸
 *
 * 資料層真相（critic-agent 2026-04-20 指正）：
 *   - milestones 常數本身無 location；event.location 僅存於 photographyList.json
 *   - 對應邏輯：按 `time: "YYYY Mon DD"` 抽年份 → 統計該年 event.location 最高頻 → 回灌 milestone
 *   - 2018 / 2020 = 電繪年，無 photography → place 為 undefined → UI 自動隱藏縦軸
 *   - 2024（撮）/ 2025（築）明確標 usePhotoLocation=true → 取最高頻地名
 *   - 2024（熟）雖同年有攝影資料，但本身是電繪 milestone → 未標旗標 → 不顯示
 *
 * 守門：
 *   - 地名來源為真實資料，非手填，維持 §6 精神「資料不為版式讓路」
 *   - 縦軸為 optional（`v-if="m.place"`）；無旗標的 milestone 不渲染，避免錯配
 *   - 顯式旗標（usePhotoLocation）取代隱式年份匹配，避免「同年電繪共享攝影地名」bug
 */
const milestonesWithPlace = computed(() => {
  const works = photoPayload.value?.works ?? []
  const yearLocCount = new Map<string, Map<string, number>>()
  for (const w of works) {
    const year = typeof w.time === 'string' ? w.time.slice(0, 4) : undefined
    const loc = w.event?.location
    if (!year || !loc) continue
    let locMap = yearLocCount.get(year)
    if (!locMap) {
      locMap = new Map<string, number>()
      yearLocCount.set(year, locMap)
    }
    locMap.set(loc, (locMap.get(loc) ?? 0) + 1)
  }
  const yearTopLoc = new Map<string, string>()
  for (const [year, locMap] of yearLocCount) {
    let top: [string, number] | null = null
    for (const entry of locMap) {
      if (!top || entry[1] > top[1]) top = entry
    }
    if (top) yearTopLoc.set(year, top[0])
  }
  return milestones.map(m => ({
    ...m,
    place: m.usePhotoLocation ? yearTopLoc.get(m.year) : undefined
  }))
})

onMounted(() => {
  observeAll(pageRef.value)
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', onBindingScroll, { passive: true })
    window.addEventListener('resize', onBindingScroll, { passive: true })
    updateBindingProgress()
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', onBindingScroll)
    window.removeEventListener('resize', onBindingScroll)
    cancelAnimationFrame(bindingRaf)
  }
})

// SEO — og:image / twitterImage / personImage 皆指向 heroImageAbsolute，
// 與扉頁視覺本體同源；換 hero 張數只需改 photographyList.json 的 series=hero。
// 注意：nuxt.config.ts 的 app.head.meta 也寫了一份 og:image（全站預設），
// useSeoMeta 為 page-level 後註冊，會 **覆寫** 同 property；兩處建議保持一致。
useSeoMeta({
  title: 'NCTU Young - 數位藝術與攝影作品集',
  description:
    'NCTU Young 的個人作品集：數位電繪與攝影。圖片庫依類別與事件瀏覽，攝影附地圖與拍攝資訊。',
  ogTitle: 'Young Portfolio - 數位藝術與攝影',
  ogDescription:
    'NCTU Young 的個人作品集：數位電繪與攝影。圖片庫依類別與事件瀏覽，攝影附地圖與拍攝資訊。',
  ogType: 'website',
  ogUrl: SEO_CONFIG.siteUrl,
  ogImage: () => heroImageAbsolute.value,
  ogImageAlt: 'Young Portfolio — 日式靜照扉頁 hero 攝影',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Young Portfolio - 數位藝術與攝影',
  twitterDescription:
    'NCTU Young 的個人作品集：數位電繪與攝影。圖片庫依類別與事件瀏覽，攝影附地圖與拍攝資訊。',
  twitterImage: () => heroImageAbsolute.value
})

// ===== JSON-LD 結構化資料（Person + WebSite）=====
// Google / Bing 會把 Person 的 sameAs 連向 GitHub/IG/Threads，形成作者
// knowledge graph；ImageGallery / ImageObject 會以 SEO_CONFIG.siteUrl 作 Person
// 主標，所以這裡和 gallery page 的 `gallerySchemaAuthor.url` 保持一致。
// personImage 使用 heroImageAbsolute.value（伺服器端渲染時會 snapshot 一次）。
const siteIdentity = computed(() => ({
  siteUrl: SEO_CONFIG.siteUrl,
  siteName: SEO_CONFIG.siteName,
  siteDescription: SEO_CONFIG.siteDescription,
  personName: 'NCTU Young',
  personAlternateName: 'jimmyyoung1995',
  personJobTitle: 'Digital Painter · Photographer',
  personDescription: SEO_CONFIG.siteDescription,
  personImage: heroImageAbsolute.value,
  socialLinks: [
    SOCIAL_LINKS.github,
    SOCIAL_LINKS.facebook,
    SOCIAL_LINKS.instagram,
    SOCIAL_LINKS.threads
  ],
  knowsAbout: ['Digital Painting', 'Photography', 'Portrait', 'Street Photography']
}))

useHead({
  script: toHeadScripts([
    buildPersonSchema(siteIdentity.value),
    buildWebSiteSchema(siteIdentity.value)
  ])
})
</script>

<style scoped>
/* freshen R2：綴じ糸（.home-binding*）整組 CSS 已移除——裝飾過載，與清新相悖。
   bindingProgress JS 保留，僅驅動 Featured 暖→冷 sweep。 */

/* =========================================================================
   R4 — Hero 対開扉頁（左繪／右影對開，書脊縫導覽，reveal 從脊向外展開）
   破「hero 三連拼貼策略 C」；兩半各自字族＋質地＋明度差，首屏即「兩本不同的書」。
   ========================================================================= */
.hero-spread {
  background: #fdfaf4; /* 繪半暖底兜底（影半自有暗底） */
}
:global(.dark) .hero-spread { background: #1a1714; }

.hero-spread__pages {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
}

/* ---- 單半（page）共用 ---- */
/*
  R7（強硬大膽 · first-screen-invisible 修復）：
  critic 連點「首屏整頁死白」。根因＝兩半起手 opacity:0 等 heroIn rAF + 800w 圖晚解碼，
  首訪 3 秒只見奶白。結構性改法：兩半「世界底色 + 版面拓樸縮影（繪方格紙／影膠卷齒孔）」
  在 first paint 即實心可見，不再依賴圖片解碼或進場動畫。只有照片本身做 cross-fade。
  → 一進站就撞到「左暖製図室／右暗暗室」明度對開，圖片是後補的層，不是身分本身。
*/
.hero-page {
  position: relative;
  display: block;
  overflow: hidden;
  text-decoration: none;
  /* 世界底色：第一幀即見明度對開（與圖片解碼無關） */
  background: var(--hp-base, #f3e9d6);
  /* 進場只動 hover lift / flex；位移淡入交給內層 __img + __plate，避免整半藏起來 */
  transition: flex-grow 0.55s ease;
}
.hero-page__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* 圖片晚解碼也不害首屏：底色＋拓樸縮影已可見，圖在其上 cross-fade */
  opacity: 0;
  transition: opacity 1s ease;
}
.hero-spread--in .hero-page__img { opacity: 1; }
.hero-spread--in .hero-page--kage .hero-page__img { transition-delay: 0.08s; }
.hero-page__texture { position: absolute; inset: 0; pointer-events: none; z-index: 1; }
.hero-page__wash { position: absolute; inset: 0; pointer-events: none; z-index: 2; }

/* 繪半：暖製図桌底色 + 工程方格紙（first-paint 即見「攤在製圖桌」的繪世界拓樸縮影） */
.hero-page--kai { --hp-base: #f3e9d6; }
.hero-page--kai .hero-page__wash--kai {
  /* freshen R2：暖 wash 稍提（讓暗色電繪在暖世界裡讀得更柔、平衡右半放亮後的左重） */
  background:
    linear-gradient(105deg, rgba(243,233,214,0.52) 0%, rgba(243,233,214,0.22) 46%, rgba(243,233,214,0.07) 100%),
    radial-gradient(72% 62% at 10% 94%, rgba(216,134,58,0.20) 0%, transparent 72%);
}
.hero-page--kai .hero-page__texture {
  /* R7：粗 + 細雙層方格（製圖格牆縮影），底色上即可見的繪世界版面語彙 */
  background-image:
    linear-gradient(to right, rgba(180,98,46,0.16) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(180,98,46,0.16) 1px, transparent 1px),
    linear-gradient(to right, rgba(180,98,46,0.06) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(180,98,46,0.06) 1px, transparent 1px);
  background-size: 46px 46px, 46px 46px, 9.2px 9.2px, 9.2px 9.2px;
  opacity: 0.7;
}
:global(.dark) .hero-page--kai { --hp-base: #1a1714; }
:global(.dark) .hero-page--kai .hero-page__wash--kai {
  background:
    linear-gradient(105deg, rgba(26,23,20,0.42) 0%, rgba(26,23,20,0.16) 46%, rgba(26,23,20,0.05) 100%),
    radial-gradient(72% 62% at 10% 94%, rgba(216,134,58,0.18) 0%, transparent 72%);
}

/* 影半（freshen 放亮）：light 模式改冷銀亮底、照片不再壓暗、wash/顆粒改冷淡；
   dark 模式保留原暗室暗底配方。兩半皆亮 → 清新，仍靠暖/冷色溫 + 明朝/gothic 字族分世界。 */
.hero-page--kage { --hp-base: #e8eef2; }
.hero-page--kage .hero-page__img { filter: grayscale(0.08) contrast(1.01); }
.hero-page--kage .hero-page__wash--kage {
  /* 冷淡 wash，錨定右下角 plate 區托深墨字（與繪半暖 wash 鏡像） */
  background:
    linear-gradient(255deg, rgba(232,238,242,0.52) 0%, rgba(232,238,242,0.16) 48%, rgba(232,238,242,0.03) 100%),
    radial-gradient(72% 62% at 90% 92%, rgba(154,173,197,0.20) 0%, transparent 70%);
}
.hero-page--kage .hero-page__texture {
  /* 顯影顆粒 + 左緣縱向膠卷齒孔；改冷 slate，light 底上仍可辨、更 clean */
  background-image:
    radial-gradient(circle at center, rgba(82,100,122,0.28) 0 1.3px, transparent 1.6px),
    radial-gradient(rgba(82,100,122,0.10) 0.6px, transparent 0.7px),
    repeating-linear-gradient(to bottom, rgba(82,100,122,0.03) 0px, rgba(82,100,122,0.03) 1px, transparent 1px, transparent 5px);
  background-size: 9px 17px, 4px 4px, 100% 5px;
  background-position: 8px 0, 0 0, 0 0;
  background-repeat: repeat-y, repeat, repeat;
  opacity: 0.5;
}
:global(.dark) .hero-page--kage { --hp-base: #14181b; }
:global(.dark) .hero-page--kage .hero-page__img { filter: grayscale(0.18) brightness(0.7) contrast(1.05); }
:global(.dark) .hero-page--kage .hero-page__wash--kage {
  background:
    linear-gradient(255deg, rgba(15,18,21,0.66) 0%, rgba(15,18,21,0.3) 48%, rgba(15,18,21,0.12) 100%),
    radial-gradient(75% 65% at 90% 10%, rgba(154,173,197,0.16) 0%, transparent 66%);
}
:global(.dark) .hero-page--kage .hero-page__texture {
  background-image:
    radial-gradient(circle at center, rgba(238,241,243,0.6) 0 1.5px, transparent 1.8px),
    radial-gradient(rgba(206,214,224,0.12) 0.6px, transparent 0.7px),
    repeating-linear-gradient(to bottom, rgba(206,214,224,0.035) 0px, rgba(206,214,224,0.035) 1px, transparent 1px, transparent 5px);
  background-size: 9px 17px, 4px 4px, 100% 5px;
  background-position: 8px 0, 0 0, 0 0;
  background-repeat: repeat-y, repeat, repeat;
  opacity: 0.7;
}

/* ---- 進場：底色 + 拓樸縮影 first-paint 即在；只有 plate 標牌做輕量滑入淡入 ----
   （不再讓整半 opacity:0，杜絕「首屏整頁死白」。位移/淡入細節見下方 plate 區塊） */
.hero-spread--in .hero-page__plate { opacity: 1; transform: translateY(0); }
.hero-spread--in .hero-page--kage .hero-page__plate { transition-delay: 0.1s; }

/* ---- hover lift：把選中那半的 plate 與圖略推前，另一半微暗 ---- */
.hero-spread__pages[data-hover='kai'] .hero-page--kage .hero-page__img,
.hero-spread__pages[data-hover='kage'] .hero-page--kai .hero-page__img {
  /* 未選半「退位」：light 模式用降透明 + 微去彩，不再壓暗（清新不破） */
  filter: grayscale(0.4) brightness(1.01) opacity(0.55);
  transition: filter 0.5s ease;
}
:global(.dark) .hero-spread__pages[data-hover='kai'] .hero-page--kage .hero-page__img,
:global(.dark) .hero-spread__pages[data-hover='kage'] .hero-page--kai .hero-page__img {
  filter: grayscale(0.5) brightness(0.6);
}
.hero-spread--in .hero-page:hover .hero-page__plate { transform: translateY(-4px); }

/* ---- 標牌 plate（左下／右下對位）；起手 opacity:0+下移，--in 後滑入 ---- */
.hero-page__plate {
  position: absolute;
  z-index: 3;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.22,0.61,0.36,1);
  left: clamp(1.4rem, 4vw, 4rem);
  bottom: clamp(1.6rem, 5vh, 4rem);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.55rem;
  max-width: 80%;
}
.hero-page__plate--right {
  left: auto;
  right: clamp(1.4rem, 4vw, 4rem);
  align-items: flex-end;
  text-align: right;
}
.hero-page__eyebrow {
  font-size: 0.66rem;
  letter-spacing: 0.26em;
  text-transform: uppercase;
}
.hero-page__eyebrow--mono {
  font-family: ui-monospace, 'SFMono-Regular', 'Roboto Mono', monospace;
  color: #b9601f;
}
.hero-page__eyebrow--mono span { opacity: 0.55; }
:global(.dark) .hero-page__eyebrow--mono { color: #e7b87d; }
.hero-page__eyebrow--serif {
  font-family: 'Shippori Mincho', 'Noto Serif JP', serif;
  letter-spacing: 0.4em;
  text-transform: none;
  color: #56697e;
}
:global(.dark) .hero-page__eyebrow--serif { color: #b9c6d6; }
.hero-page__title {
  font-size: clamp(2.6rem, 6vw, 4.4rem);
  line-height: 1;
  margin: 0.1rem 0 0.2rem;
}
.hero-page__title--kai {
  font-family: 'Zen Kaku Gothic New', 'Noto Sans TC', sans-serif;
  font-weight: 500;
  letter-spacing: 0.1em;
  color: #2b2017;
}
:global(.dark) .hero-page__title--kai { color: #f7efe4; }
.hero-page__title--kage {
  font-family: 'Shippori Mincho', 'Noto Serif JP', serif;
  font-weight: 600;
  letter-spacing: 0.2em;
  color: #2b3640;
  text-shadow: 0 1px 12px rgba(255,255,255,0.5);
}
:global(.dark) .hero-page__title--kage { color: #eef1f3; text-shadow: 0 2px 18px rgba(0,0,0,0.45); }
.hero-page__note {
  font-size: 0.92rem;
  font-weight: 300;
  line-height: 1.8;
  letter-spacing: 0.08em;
}
.hero-page__note--kai { font-family: 'Zen Kaku Gothic New', 'Noto Sans TC', sans-serif; color: #5a4b3c; }
:global(.dark) .hero-page__note--kai { color: #c9b9a6; }
.hero-page__note--kage { font-family: 'Shippori Mincho', 'Noto Serif JP', serif; letter-spacing: 0.14em; color: #51616f; }
:global(.dark) .hero-page__note--kage { color: #c2cdda; }

.hero-page__enter {
  margin-top: 0.65rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #8a7a68;
  transition: color 0.4s ease, gap 0.4s ease;
}
.hero-page__enter--right { color: #66788c; }
:global(.dark) .hero-page__enter--right { color: #9aadc5; }
.hero-page--kai:hover .hero-page__enter { color: #b9601f; }
.hero-page--kage:hover .hero-page__enter { color: #3f4f63; }
:global(.dark) .hero-page--kage:hover .hero-page__enter { color: #cdd8e6; }
.hero-page__enter-label { font-family: 'Zen Kaku Gothic New', 'Noto Sans TC', sans-serif; font-size: 1rem; letter-spacing: 0.2em; }
.hero-page__enter-label--serif { font-family: 'Shippori Mincho', 'Noto Serif JP', serif; letter-spacing: 0.24em; }
.hero-page__enter-arrow { width: 1rem; height: 1rem; transition: transform 0.4s cubic-bezier(0.22,0.61,0.36,1); }
.hero-page--kai:hover .hero-page__enter-arrow { transform: translateX(0.4rem); }
.hero-page--kage:hover .hero-page__enter-arrow--left { transform: translateX(-0.4rem); }
.hero-page:focus-visible { outline: 2px solid currentColor; outline-offset: -6px; }

/* ---- 中央書脊縫（hero-spine）：對開頁的書脊 = 導覽軸 ---- */
.hero-spine {
  position: absolute;
  z-index: 5;
  top: 0; bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 2.2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.1rem;
  pointer-events: none;
  /* freshen：書脊改淺色折縫（中央微亮、兩緣淡灰影），不再是暗縫 */
  background: linear-gradient(to right, rgba(120,113,108,0.12), rgba(120,113,108,0.03) 35%, rgba(255,255,255,0.5) 50%, rgba(120,113,108,0.03) 65%, rgba(120,113,108,0.12));
}
:global(.dark) .hero-spine {
  background: linear-gradient(to right, rgba(0,0,0,0.16), rgba(0,0,0,0.04) 35%, rgba(255,255,255,0.06) 50%, rgba(0,0,0,0.04) 65%, rgba(0,0,0,0.16));
}
.hero-spine__rule { width: 1px; flex: 1; background: linear-gradient(to bottom, transparent, rgba(120,113,108,0.4), transparent); }
:global(.dark) .hero-spine__rule { background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.45), transparent); }
.hero-spine__kana {
  writing-mode: vertical-rl;
  font-size: 1.25rem;
  font-weight: 300;
  letter-spacing: 0.3em;
  color: rgba(40,46,54,0.82);
  text-shadow: 0 1px 8px rgba(255,255,255,0.4);
  line-height: 1.1;
}
:global(.dark) .hero-spine__kana { color: rgba(255,255,255,0.92); text-shadow: 0 1px 8px rgba(0,0,0,0.5); }
.hero-spine__div { color: rgba(40,46,54,0.4); }
:global(.dark) .hero-spine__div { color: rgba(255,255,255,0.5); }
.hero-spine__era {
  writing-mode: vertical-rl;
  font-size: 0.6rem;
  letter-spacing: 0.42em;
  color: rgba(68,64,60,0.6);
}
:global(.dark) .hero-spine__era { color: rgba(255,255,255,0.6); }

/* ---- 對開帶上方余白主題（極簡，居中上緣） ---- */
.hero-spread__masthead {
  position: absolute;
  z-index: 6;
  top: clamp(1.6rem, 5vh, 3.4rem);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  pointer-events: none;
  text-align: center;
}
.hero-spread__masthead-kanji {
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  font-weight: 200;
  letter-spacing: 0.5em;
  color: rgba(41,37,36,0.92);
  text-shadow: 0 1px 12px rgba(255,255,255,0.55);
}
:global(.dark) .hero-spread__masthead-kanji { color: rgba(255,255,255,0.96); text-shadow: 0 2px 14px rgba(0,0,0,0.45); }
.hero-spread__masthead-en {
  font-family: 'Inter', sans-serif;
  font-size: 0.58rem;
  letter-spacing: 0.46em;
  text-transform: uppercase;
  color: rgba(68,64,60,0.66);
}
:global(.dark) .hero-spread__masthead-en { color: rgba(255,255,255,0.72); }

/* ---- mobile：對開頁改上下堆疊，書脊轉橫 ---- */
@media (max-width: 1023px) {
  .hero-spread__pages { grid-template-columns: 1fr; grid-template-rows: 1fr 1fr; }
  .hero-page--kai  { transform: translateY(-5%); }
  .hero-page--kage { transform: translateY(5%); }
  .hero-spread--in .hero-page--kai,
  .hero-spread--in .hero-page--kage { transform: translateY(0); }
  .hero-spine {
    top: 50%; bottom: auto; left: 0; right: 0; width: 100%;
    transform: translateY(-50%);
    flex-direction: row;
    height: 2.2rem;
    background: linear-gradient(to bottom, rgba(120,113,108,0.12), rgba(255,255,255,0.5) 50%, rgba(120,113,108,0.12));
  }
  :global(.dark) .hero-spine {
    background: linear-gradient(to bottom, rgba(0,0,0,0.16), rgba(255,255,255,0.06) 50%, rgba(0,0,0,0.16));
  }
  .hero-spine__rule { width: auto; height: 1px; flex: 1; background: linear-gradient(to right, transparent, rgba(120,113,108,0.4), transparent); }
  :global(.dark) .hero-spine__rule { background: linear-gradient(to right, transparent, rgba(255,255,255,0.45), transparent); }
  .hero-spine__kana, .hero-spine__era { writing-mode: horizontal-tb; }
  .hero-page__plate { max-width: 88%; }
}

/* ---- reduced-motion：底色 + 拓樸縮影 + 標牌 + 圖片全部即刻顯示，無位移無淡入 ---- */
@media (prefers-reduced-motion: reduce) {
  .hero-page { transition: none; }
  .hero-page__img { opacity: 1 !important; transition: none; }
  .hero-page__plate {
    opacity: 1 !important;
    transform: none !important;
    transition: none;
  }
  .hero-page__enter-arrow { transition: none; }
  .hero-spread--in .hero-page:hover .hero-page__plate { transform: none; }
}

/* ===== R27 — Hero 雙軌 toggle + 序卷頭語（挑戰 Hero static 鐵律） ===== */

.hero-toggle-row {
  /* 取代純文字對聯，改為可點擊 toggle 行 */
}
.hero-toggle {
  position: relative;
  display: inline-flex;
  align-items: baseline;
  gap: 0.65rem;
  padding: 0.45rem 0.85rem 0.45rem 1.55rem;
  color: rgb(68 64 60);
  background: transparent;
  border: 1px solid transparent;
  border-bottom: 1px solid rgb(168 162 158 / 0.28);
  cursor: pointer;
  transition: color 0.3s ease, border-color 0.3s ease, background-color 0.3s ease;
}
/* ▎左側 ⇋ 小箭頭 - affordance 提示 */
.hero-toggle::before {
  content: '⇋';
  position: absolute;
  left: 0.45rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.72rem;
  color: rgb(168 162 158);
  font-weight: 400;
  opacity: 0.65;
  transition: opacity 0.3s ease, color 0.3s ease;
}
.hero-toggle:hover::before,
.hero-toggle--active::before {
  opacity: 1;
  color: rgb(217 123 46);
}
:global(.dark) .hero-toggle:hover::before,
:global(.dark) .hero-toggle--active::before {
  color: rgb(231 184 125);
}
:global(.dark) .hero-toggle {
  color: rgb(214 211 209);
  border-bottom-color: rgb(120 113 108 / 0.42);
}
.hero-toggle:hover {
  color: rgb(217 123 46); /* accent-500 */
  border-bottom-color: rgb(217 123 46 / 0.55);
}
.hero-toggle--active {
  color: rgb(217 123 46);
  border-bottom-color: rgb(217 123 46 / 0.85);
  background: rgb(217 123 46 / 0.06);
}
:global(.dark) .hero-toggle--active {
  color: rgb(231 184 125);
  border-bottom-color: rgb(231 184 125 / 0.75);
  background: rgb(231 184 125 / 0.08);
}
.hero-toggle:focus-visible {
  outline: 1px solid rgb(217 123 46 / 0.5);
  outline-offset: 3px;
}

/* ===== R48 — Hero 第一屏 双軌起算 ledger（取代 prologue prose + NOW 面板） ===== */
.track-ledger {
  margin-top: 2.4rem;
  max-width: 34rem;
}
.track-ledger__eyebrow {
  font-family: 'Noto Serif JP', serif;
  font-size: 0.6rem;
  letter-spacing: 0.44em;
  text-transform: uppercase;
  font-weight: 300;
  color: rgb(217 123 46 / 0.9);
  margin: 0 0 1.05rem;
}
:global(.dark) .track-ledger__eyebrow { color: rgb(231 184 125 / 0.9); }

/* 起算尺：左端節點 — 量距尺身 — 右端節點 */
.track-ledger__rail {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.6rem;
}
.track-ledger__node {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
}
.track-ledger__node--kage { align-items: flex-end; text-align: right; }
.track-ledger__kana {
  font-size: 1.7rem;
  font-weight: 200;
  letter-spacing: 0.12em;
  line-height: 1;
}
.track-ledger__year {
  font-family: 'Noto Serif JP', serif;
  font-size: 0.96rem;
  letter-spacing: 0.26em;
  color: rgb(41 37 36);
  font-weight: 300;
}
:global(.dark) .track-ledger__year { color: rgb(245 245 244); }
.track-ledger__roman {
  font-family: 'Inter', sans-serif;
  font-size: 0.56rem;
  letter-spacing: 0.34em;
  text-transform: uppercase;
  color: rgb(120 113 108);
}
:global(.dark) .track-ledger__roman { color: rgb(168 162 158); }

/* 尺身：實線（繪已走六年）→ 中央量距 badge → dashed（影軌那段尚不存在） */
.track-ledger__span {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: 0 0.15rem;
}
.track-ledger__span-solid,
.track-ledger__span-dashed {
  flex: 1;
  height: 0;
  min-width: 0.8rem;
}
.track-ledger__span-solid {
  border-top: 1px solid rgb(168 162 158 / 0.7);
}
.track-ledger__span-dashed {
  border-top: 1px dashed rgb(168 162 158 / 0.6);
}
:global(.dark) .track-ledger__span-solid { border-top-color: rgb(120 113 108 / 0.65); }
:global(.dark) .track-ledger__span-dashed { border-top-color: rgb(120 113 108 / 0.55); }

/* 中央量距 badge：直接寫「六年先行」，是首屏命中的數字證據 */
.track-ledger__gauge {
  flex-shrink: 0;
  display: inline-flex;
  align-items: baseline;
  gap: 0.28rem;
  padding: 0.2rem 0.62rem;
  margin: 0 0.1rem;
  background: var(--bg, rgb(250 250 249));
  border: 1px solid rgb(217 123 46 / 0.55);
  white-space: nowrap;
}
:global(.dark) .track-ledger__gauge {
  background: rgb(28 25 23);
  border-color: rgb(231 184 125 / 0.5);
}
.track-ledger__gauge-num {
  font-family: 'Noto Serif JP', serif;
  font-size: 0.95rem;
  letter-spacing: 0.1em;
  color: rgb(217 123 46);
  line-height: 1;
}
:global(.dark) .track-ledger__gauge-num { color: rgb(231 184 125); }
.track-ledger__gauge-unit {
  font-size: 0.62rem;
  letter-spacing: 0.28em;
  color: rgb(120 113 108);
}
:global(.dark) .track-ledger__gauge-unit { color: rgb(168 162 158); }

/* 兩軌宣言並置（trackManifesto.declaration）— 與起點對齊，3 秒可讀 */
.track-ledger__declarations {
  margin-top: 1.05rem;
  display: flex;
  justify-content: space-between;
  gap: 1.2rem;
}
.track-ledger__decl {
  font-size: 0.82rem;
  font-weight: 300;
  line-height: 1.7;
  letter-spacing: 0.05em;
  color: rgb(68 64 60);
  max-width: 13.5rem;
  position: relative;
  padding-top: 0.55rem;
}
:global(.dark) .track-ledger__decl { color: rgb(214 211 209); }
/* 宣言上緣一道短色 hairline 標識軌墨色（accent/影藍克制破例，僅 2px 寬色條） */
.track-ledger__decl::before {
  content: '';
  position: absolute;
  top: 0;
  width: 1.6rem;
  height: 2px;
}
.track-ledger__decl--kai::before { left: 0; background: rgb(196 110 58); }
.track-ledger__decl--kage::before { right: 0; background: rgb(58 86 122); }
.track-ledger__decl--kage { text-align: right; }
:global(.dark) .track-ledger__decl--kai::before { background: rgb(231 184 125); }
:global(.dark) .track-ledger__decl--kage::before { background: rgb(154 173 197); }

/* R46：余白 動態副題（focus 觸發） */
.hero-title-block {
  position: relative;
}
.hero-title-subline {
  margin-top: 0.85rem;
  display: inline-flex;
  align-items: baseline;
  gap: 0.7rem;
  font-size: 0.95rem;
  padding-left: 0.3rem;
}
.hero-title-subline__dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  align-self: center;
}
.hero-title-subline--kai .hero-title-subline__dot { background: rgb(217 123 46); }
.hero-title-subline--kage .hero-title-subline__dot { background: rgb(46 70 102); }
.hero-title-subline__kana {
  font-size: 1.5rem;
  font-weight: 200;
  letter-spacing: 0.16em;
  line-height: 1;
}
.hero-title-subline--kai .hero-title-subline__kana { color: rgb(217 123 46); }
.hero-title-subline--kage .hero-title-subline__kana { color: rgb(46 70 102); }
:global(.dark) .hero-title-subline--kai .hero-title-subline__kana { color: rgb(231 184 125); }
:global(.dark) .hero-title-subline--kage .hero-title-subline__kana { color: rgb(154 173 197); }
.hero-title-subline__en {
  font-family: 'Inter', sans-serif;
  font-size: 0.66rem;
  letter-spacing: 0.36em;
  text-transform: uppercase;
  color: rgb(120 113 108);
}
:global(.dark) .hero-title-subline__en { color: rgb(168 162 158); }

.hero-subtitle-fade-enter-active,
.hero-subtitle-fade-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.hero-subtitle-fade-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}
.hero-subtitle-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

/* R46：Featured strip dim — focus 模式對非主軌 desaturate + opacity */
.featured-strip {
  transition: opacity 0.55s ease, filter 0.55s ease;
}
.featured-strip--dim {
  opacity: 0.32;
  filter: saturate(0.25) grayscale(0.85);
}
@media (prefers-reduced-motion: reduce) {
  .featured-strip { transition: none; }
}

/* R48：track-ledger 手機收束 — 尺身仍橫向，宣言維持兩欄但縮字距 */
@media (max-width: 640px) {
  .track-ledger { margin-top: 1.9rem; }
  .track-ledger__kana { font-size: 1.4rem; }
  .track-ledger__year { font-size: 0.84rem; letter-spacing: 0.2em; }
  .track-ledger__gauge { padding: 0.16rem 0.42rem; }
  .track-ledger__gauge-unit { letter-spacing: 0.18em; }
  .track-ledger__declarations { gap: 0.7rem; margin-top: 0.85rem; }
  .track-ledger__decl { font-size: 0.74rem; max-width: 48%; }
}

/*
 * R29: balanced 狀態微呼吸 — 取代 R28 文字 hint 作為可互動 affordance
 * 三圖 ±2% scale 各自時相錯開，視覺上「呼吸」但不形成 carousel。
 * 任何 focus 模式（kai/kage）下動畫停止，符合「user 已選擇 = 不再提示」。
 */
@keyframes hero-breath {
  0%, 100% { transform: var(--hero-base-tf, none) scale(1); }
  50% { transform: var(--hero-base-tf, none) scale(1.018); }
}
.hero-collage[data-focus='balanced'] .hero-figure--kai {
  --hero-base-tf: translateY(-4px);
  animation: hero-breath 7.5s ease-in-out infinite;
}
.hero-collage[data-focus='balanced'] .hero-figure--main {
  --hero-base-tf: translateY(8px);
  animation: hero-breath 8.8s ease-in-out infinite;
  animation-delay: 2.4s;
}
.hero-collage[data-focus='balanced'] .hero-figure--kage:not(.hero-figure--main) {
  --hero-base-tf: translateY(20px);
  animation: hero-breath 9.2s ease-in-out infinite;
  animation-delay: 5.1s;
}
@media (prefers-reduced-motion: reduce) {
  .hero-collage .hero-figure { animation: none !important; }
}

/* R29: mobile 主圖切換時的軟過渡 */
.hero-mobile-img {
  transition: opacity 0.5s ease, filter 0.5s ease;
}

/* ===== Hero 拼貼 focus 切換（user-initiated 動畫，非 autoplay） ===== */
/* CSS transition 在 user click 後觸發，符合「Hero static = no auto」的細讀 */
.hero-figure {
  transition:
    flex 0.55s cubic-bezier(0.22, 0.61, 0.36, 1),
    filter 0.55s ease,
    opacity 0.55s ease,
    transform 0.55s ease;
  will-change: flex, filter;
}

/* kai 模式：放大繪、收斂影、影圖灰階退場 */
.hero-collage[data-focus='kai'] .hero-figure--kai {
  flex: 1.8;
  filter: saturate(1.1);
}
.hero-collage[data-focus='kai'] .hero-figure--kage {
  flex: 0.7;
  filter: grayscale(0.65) saturate(0.5) brightness(0.85);
  opacity: 0.55;
}

/* kage 模式：放大影、收斂繪 */
.hero-collage[data-focus='kage'] .hero-figure--kai {
  flex: 0.6;
  filter: grayscale(0.7) saturate(0.4) brightness(0.85);
  opacity: 0.5;
}
.hero-collage[data-focus='kage'] .hero-figure--main {
  flex: 1.9;
  filter: saturate(1.05);
}
.hero-collage[data-focus='kage'] .hero-figure--kage:not(.hero-figure--main) {
  flex: 0.85;
  filter: saturate(0.95);
}

/* prefers-reduced-motion: 取消過渡（仍保留布局切換） */
@media (prefers-reduced-motion: reduce) {
  .hero-figure { transition: none; }
}

@media (max-width: 640px) {
  .hero-toggle {
    padding: 0.3rem 0.55rem;
    gap: 0.4rem;
  }
}

/* =========================================================================
   R10 — Featured：暖→冷 scroll-driven 掃描底層 + bridge 文字暖/冷分色
   （取代 R3 .featured-half 對開門牌——已與 Hero-spread 逐字重複，本輪刪除）
   兩世界 identity 不再靠整片門牌重述，而是：
     ① bridge 一行裡「製図室の暖い陽」走暖橘、「暗室の冷たい銀」走冷青；
     ② section 底鋪 .featured-sweep，隨 --sweep（=頁面捲動進度 0→1）把暖陽
        radial 推向冷銀 radial，視覺像「翻過繪頁、現出影頁」。
   ========================================================================= */

/* bridge 文字：暖/冷一線承接 Hero 對開兩半（字族亦分家：繪幾何 sans / 影明體） */
.featured-bridge-kai {
  color: #b9601f;
  font-family: 'Zen Kaku Gothic New', 'Noto Sans TC', sans-serif;
  letter-spacing: 0.1em;
}
:global(.dark) .featured-bridge-kai { color: #e7b87d; }
.featured-bridge-kage {
  color: #52647a;
  font-family: 'Shippori Mincho', 'Noto Serif JP', serif;
  letter-spacing: 0.16em;
}
:global(.dark) .featured-bridge-kage { color: #9aadc5; }

/* 暖→冷掃描底層：絕對鋪滿 .featured-section，年尺浮於其上 */
.featured-section { isolation: isolate; }
.featured-sweep {
  --sweep: 0;
  position: absolute;
  inset: -1.5rem -1rem;
  z-index: -1;
  pointer-events: none;
  border-radius: 2px;
  /* 暖陽（左上，繪）opacity 隨 sweep 退去；冷銀（右下，影）隨 sweep 浮現 */
  background:
    radial-gradient(58% 60% at 14% 8%,
      rgba(228, 150, 74, calc(0.16 * (1 - var(--sweep)))) 0%, transparent 68%),
    radial-gradient(64% 66% at 88% 96%,
      rgba(120, 146, 178, calc(0.04 + 0.13 * var(--sweep))) 0%, transparent 70%);
  transition: background 0.45s linear;
}
:global(.dark) .featured-sweep {
  background:
    radial-gradient(58% 60% at 14% 8%,
      rgba(228, 150, 74, calc(0.12 * (1 - var(--sweep)))) 0%, transparent 68%),
    radial-gradient(64% 66% at 88% 96%,
      rgba(154, 173, 197, calc(0.03 + 0.10 * var(--sweep))) 0%, transparent 70%);
}

@media (prefers-reduced-motion: reduce) {
  /* 凍結在中性（暖/冷各半顯），去除 scroll 牽動的 transition */
  .featured-sweep {
    transition: none;
    background:
      radial-gradient(58% 60% at 14% 8%, rgba(228, 150, 74, 0.09) 0%, transparent 68%),
      radial-gradient(64% 66% at 88% 96%, rgba(120, 146, 178, 0.09) 0%, transparent 70%);
  }
  :global(.dark) .featured-sweep {
    background:
      radial-gradient(58% 60% at 14% 8%, rgba(228, 150, 74, 0.07) 0%, transparent 68%),
      radial-gradient(64% 66% at 88% 96%, rgba(154, 173, 197, 0.06) 0%, transparent 70%);
  }
}
</style>
