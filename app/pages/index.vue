<template>
  <div ref="pageRef">
    <!--
      Round 15：縦書「目次」chapter rail（lg+ only fixed 右側）
      編輯化目次：序 / 領 / 対 / 步 / 選 / 印 — 把首頁敘事擬書目
    -->
    <ChapterRail />
    <!-- =====================================================================
         Hero — 表紙（靜照扉頁，Phase 3A）
         構成：左縦書き年號／中主標（和欧混植）／右作品集縦書き／單張靜照背景
         2026-04-19：廢除「風中翻書」5 張輪播鐵律（見 design-aesthetic.mdc §5）。
                     保留扉頁氣質（余白主標、引言、令和年號、繪と影對聯）；
                     單張靜照改從 photographyList.json 標 `series: ['hero']` 取，
                     與 useSeoMeta.ogImage / nuxt.config.ts 同源，修資料債。
                     高度 88dvh → 60vh 讓 strip 上緣在首屏內露臉。
         ===================================================================== -->
    <section
      class="relative min-h-[560px] h-[78vh] md:h-[82vh] md:min-h-[640px] overflow-hidden flex flex-col lg:flex-row-reverse"
      role="region"
      aria-roledescription="封面主視覺"
      aria-label="Young Portfolio 表紙 — amble 封面式分塊"
    >
      <!-- 右半（desktop）／上半（mobile）：Hero 拼貼區（§11 策略 C 清爽拼貼）
           desktop：3 張縦照片並排、錯位偏移，彰顯電繪 + 攝影雙主線
           mobile：單張主攝影出血 + 上下封面式收束（避免「圖+文」兩 block 感）
           overlay caption：左/右兩側標 Digital / Photo（中圖不貼，保 SEO 中性與余白）
           2026-04-28：依 design brief priority 3，調 desktop offset 防右側裁切；
                       mobile 加底部漸層 + 縦書き「影」與下方文字區搭橋。 -->
      <div class="relative h-[46%] lg:h-full lg:w-[58%] overflow-hidden bg-stone-50 dark:bg-stone-900">
        <!--
          Mobile / Tablet：單張主圖 — R29 起依 heroFocus 換代表作
          balanced/kage → 攝影主圖（與 SEO/og:image 同源）
          kai → 電繪代表作（同 desktop 左圖）
        -->
        <img
          v-if="heroCollage.mobileMain"
          :src="heroCollage.mobileMain"
          alt=""
          class="lg:hidden absolute inset-0 w-full h-full object-cover dark:brightness-[0.82] hero-mobile-img"
          :class="{ 'hero-mobile-img--kai': heroFocus === 'kai' }"
          fetchpriority="high"
          loading="eager"
          decoding="async"
          aria-hidden="true"
        >

        <!--
          Mobile 封面收束：底部漸層 + 縦書き「影」/「繪」對聯
          - 漸層讓圖片下緣自然融入下方文字區的 stone-50（書封 → 內頁的轉場）
          - 縦書き「繪」「影」貼右下角，承擔 desktop 上「繪と影」對聯的角色
          - lg:hidden 確保只在手機/平板出現，桌機不干擾 3 圖拼貼
        -->
        <div class="lg:hidden absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent via-stone-50/40 to-stone-50 dark:via-stone-900/40 dark:to-stone-900 pointer-events-none" aria-hidden="true"/>
        <div class="lg:hidden absolute bottom-3 right-4 flex flex-col items-center gap-1.5 pointer-events-none select-none" aria-hidden="true">
          <span class="font-jp text-[0.92rem] tracking-[0.4em] text-stone-700 dark:text-stone-200 font-extralight leading-none [writing-mode:vertical-rl]">繪と影</span>
          <span class="block w-px h-6 bg-stone-400/60 dark:bg-stone-500/60"/>
        </div>
        <div class="lg:hidden absolute top-4 left-4 font-jp text-[0.6rem] tracking-[0.35em] text-stone-50 bg-stone-900/55 px-2 py-[3px] uppercase leading-none pointer-events-none select-none" aria-hidden="true">
          {{ heroFocus === 'kai' ? 'Digital' : 'Photo' }}
        </div>

        <!--
          Desktop：3 張縦拼貼
          - py-6 → py-8：替最大 translate-y 預留呼吸，避免最後一張底邊被裁
          - translate-y-8 → translate-y-5：縮小最右張下移幅度（依 brief priority 3）
          - flex-[1.3] → flex-[1.25]：中心圖略收，讓兩側更平衡
        -->
        <div class="hidden lg:flex absolute inset-0 items-stretch gap-3 px-4 pt-6 pb-10 hero-collage" :data-focus="heroFocus">
          <!-- 左：電繪代表（上偏） -->
          <figure class="relative flex-1 -translate-y-1 overflow-hidden bg-stone-100 dark:bg-stone-800 hero-figure hero-figure--kai">
            <img
              v-if="heroCollage.art"
              :src="heroCollage.art"
              :alt="`電繪作品代表 — ${heroCollage.artTitle}`"
              class="w-full h-full object-cover dark:brightness-[0.85]"
              fetchpriority="high"
              loading="eager"
              decoding="async"
            >
            <figcaption class="absolute bottom-3 left-3 font-jp text-[0.62rem] tracking-[0.35em] text-stone-50 bg-stone-900/55 px-2 py-[3px] uppercase leading-none">
              Digital
            </figcaption>
          </figure>

          <!-- 中：攝影主（與 SEO / og:image 同源，最大、定軸） -->
          <figure class="relative flex-[1.25] translate-y-2 overflow-hidden bg-stone-100 dark:bg-stone-800 hero-figure hero-figure--kage hero-figure--main">
            <img
              v-if="heroCollage.main"
              :src="heroCollage.main"
              alt=""
              class="w-full h-full object-cover dark:brightness-[0.82]"
              fetchpriority="high"
              loading="eager"
              decoding="async"
              aria-hidden="true"
            >
          </figure>

          <!-- 右：攝影副（下偏，但收斂以免裁邊） -->
          <figure class="relative flex-1 translate-y-5 overflow-hidden bg-stone-100 dark:bg-stone-800 hero-figure hero-figure--kage">
            <img
              v-if="heroCollage.sub"
              :src="heroCollage.sub"
              :alt="`攝影作品代表 — ${heroCollage.subTitle}`"
              class="w-full h-full object-cover dark:brightness-[0.82]"
              loading="eager"
              decoding="async"
            >
            <figcaption class="absolute bottom-3 right-3 font-jp text-[0.62rem] tracking-[0.35em] text-stone-50 bg-stone-900/55 px-2 py-[3px] uppercase leading-none">
              Photo
            </figcaption>
          </figure>
        </div>
      </div>

      <!--
        左半（desktop）／下半（mobile）：純米白底文字區，無疊加
        2026-04-28 priority 3：mobile 高度 58% → 54%，與 image 區的 46% 互補；
                                文字向上 -mt-8（負外距）讓 hero collage 漸層與標題交疊一格，
                                配合 image 區底部 stone-50 漸層形成「同一封面」感。
      -->
      <div class="relative bg-stone-50 dark:bg-stone-900 flex items-center h-[54%] lg:h-full lg:w-[42%] px-6 sm:px-10 lg:pl-16 lg:pr-6 py-10 lg:py-0 -mt-8 lg:mt-0 z-[1]">
        <!-- 縦書き「繪と影」：貼文字區右緣（= 照片區左緣），留在白底側不押圖 -->
        <aside class="hidden lg:flex absolute inset-y-0 right-0 items-center pr-4" aria-hidden="false">
          <span
            class="writing-vertical font-jp text-[1.5rem] font-light tracking-[0.5em] text-stone-700 dark:text-stone-300 leading-none select-none"
            aria-label="繪と影 — Digital Art and Photography"
          >
            <span aria-hidden="true">繪<span class="block h-3"/>と<span class="block h-3"/>影</span>
          </span>
        </aside>

        <div class="relative w-full max-w-xl lg:pr-12">
          <!-- 主標：余白 + 雙軌副題（Round 4 升級）
               critic 指原「Digital Art & Photography」一行讀為「一個攝影師講余白」，
               雙主線在首屏太晚兌現。改為「繪 · DIGITAL｜影 · PHOTOGRAPHY」對稱對聯，
               中央 1px hairline-v 分隔，把 Journey 與 Domains 的「繪 ↔ 影」對位
               提前到 hero 主標下，視線停留 0.4s 即兌現雙主線命題 -->
          <h1 class="reveal hero-title-block">
            <span class="block font-jp font-extralight text-6xl sm:text-7xl lg:text-[7.5rem] tracking-[0.14em] text-stone-900 dark:text-stone-50 leading-[1]">
              余<span class="inline-block mx-4"/>白
            </span>
            <!-- R27：繪／影 雙軌 toggle（user-initiated） -->
            <span class="mt-6 inline-flex items-center gap-3 sm:gap-4 hero-toggle-row" role="group" aria-label="Track focus toggle">
              <button
                type="button"
                class="hero-toggle"
                :class="{ 'hero-toggle--active': heroFocus === 'kai' }"
                :aria-pressed="heroFocus === 'kai'"
                aria-label="切換至電繪主視覺"
                @click="setHeroFocus(heroFocus === 'kai' ? 'balanced' : 'kai')"
              >
                <span class="font-jp text-base sm:text-lg font-extralight tracking-[0.3em]">繪</span>
                <span class="text-[0.66rem] sm:text-xs tracking-[0.35em] uppercase font-light">Digital</span>
              </button>
              <span class="block w-px h-4 bg-stone-400/70 dark:bg-stone-500" aria-hidden="true"/>
              <button
                type="button"
                class="hero-toggle"
                :class="{ 'hero-toggle--active': heroFocus === 'kage' }"
                :aria-pressed="heroFocus === 'kage'"
                aria-label="切換至攝影主視覺"
                @click="setHeroFocus(heroFocus === 'kage' ? 'balanced' : 'kage')"
              >
                <span class="font-jp text-base sm:text-lg font-extralight tracking-[0.3em]">影</span>
                <span class="text-[0.66rem] sm:text-xs tracking-[0.35em] uppercase font-light">Photography</span>
              </button>
            </span>
          </h1>
          <!-- R46：余白 副題隨 focus 動態變化（h1 外層 sibling，避免 inline 違規） -->
          <div
            v-if="heroFocus !== 'balanced'"
            class="hero-title-subline"
            :class="`hero-title-subline--${heroFocus}`"
          >
            <span class="hero-title-subline__dot" aria-hidden="true"/>
            <span class="hero-title-subline__kana font-jp">{{ heroFocus === 'kai' ? '繪' : '影' }}</span>
            <span class="hero-title-subline__en">{{ heroFocus === 'kai' ? 'Digital lean' : 'Photography lean' }}</span>
          </div>

          <!--
            R48：Hero 第一屏「双軌起算 ledger」（大改 — 回應 critic first-screen-invisible）
            上輪 verdict：2018 vs 2024 的時間差埋在 Featured / Epilogue，首屏不可見。
            jump-out：把 trackManifesto.startYear 差做進 Hero 第一屏，3 秒內可讀；
                      declaration 從 plate 下緣上提到與 plate 並置。
            做法（全新版面，非舊 motif 深 5%）：
              - 一條「起算尺」橫貫：左端 繪・二〇一八、右端 影・二〇二四，
                兩端之間以 hairline 量出「六年」先行差（中央 badge 直接寫數字）。
              - 每軌 startYear 正下方並置該軌 declaration（trackManifesto.declaration），
                不再是一段散文 prose，而是「軌頭宣言」對位。
              - 後發軌（影）左側留一段 dashed hairline，視覺化「2018-2024 影軌尚未存在」的空白
                （承接 Journey 的「未だ無し」墓誌語彙，但移到首屏、改為量化尺）。
            鐵律守門：stone 主軸 / hairline-only 尺身 / accent 僅中央 badge 與兩端 kanji 描邊；
                      軌墨色（trackManifesto.ink）僅做 kanji 色，不填面（延續 R7 克制破例）。
            data 來源：digitalManifesto / photographyManifesto store getter（startYear + declaration）。
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
      </div>
    </section>

    <!-- =====================================================================
         自己紹介 — 左肖像、右文字；書頁式版心（R31 縮減 padding）
         ===================================================================== -->
    <section class="relative py-16 lg:py-24">
      <div class="max-w-5xl mx-auto px-6 sm:px-10 lg:px-16">
        <header class="reveal mb-14 lg:mb-20 flex items-baseline justify-between flex-wrap gap-4">
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

            <p class="reveal reveal-delay-2 jp-body text-[0.95rem] max-w-xl">
              電繪與攝影兩條線並行——插畫自幾何、角色至場景；攝影則以街拍、活動與城市夜景為主，以 Nikon Z 系統將當下的光影留下。
            </p>
            <p class="reveal reveal-delay-2 jp-body mt-6 text-[0.95rem] max-w-xl text-stone-500 dark:text-stone-400">
              此處收錄電繪作品與依事件整理的攝影相簿，攝影區附地圖與拍攝資訊。零碎日常亦會在 Instagram 與 Threads 更新。
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

    <!-- =====================================================================
         対話 — 雙主線宣言（Round 9 創新）
         Domains 立兩條軌、Journey 走兩條軌、Featured 收兩條軌。
         此節是「兩條軌的自我矛盾」— 一句文學悖論直接收束雙主線敘事。
         構成：左右對位縦書、中央 hairline-v + 朱印「対」釘住、底部羅馬副題
         鐵律守門：stone-only / hairline-v / 縦書き字級不通膨 / accent 僅朱印
         §1 不均整：左聯字距 0.4em、右聯字距 0.5em，刻意非對稱
         ===================================================================== -->
    <section
      id="dialogue"
      class="relative py-28 lg:py-36 overflow-hidden scroll-mt-24"
      role="region"
      aria-roledescription="雙主線宣言"
      aria-label="繪と影 — 対話"
    >
      <!--
        背景：極淡縦書「対」單字承接朱印
        Round 10：opacity 50/35 → 25/15（critic 指太明顯，改為「耳語」級）
      -->
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none select-none" aria-hidden="true">
        <span class="font-jp text-[clamp(11rem,28vw,22rem)] font-extralight text-stone-200/25 dark:text-stone-800/15 leading-none [writing-mode:vertical-rl] tracking-[0.1em]">対</span>
      </div>

      <div class="relative max-w-4xl mx-auto px-6 sm:px-10">
        <!-- 章題 minimal eyebrow（不蓋 jp-section-title，避免與 Domains 同級競爭） -->
        <p class="reveal jp-eyebrow justify-center text-stone-500 mb-14 lg:mb-20">
          <span>Dialogue · 対話</span>
        </p>

        <!-- 對位悖論：左聯（繪以影） + 中釘（朱印「対」） + 右聯（影以繪） -->
        <div class="flex items-center justify-center gap-6 sm:gap-10 lg:gap-16">
          <!-- 左聯：繪 で 影 を 描く -->
          <blockquote
            class="reveal reveal-left writing-vertical font-jp text-2xl sm:text-3xl lg:text-[2rem] font-extralight tracking-[0.4em] text-stone-800 dark:text-stone-100 leading-[2.2] flex-shrink-0"
          >
            繪<span class="mx-1.5 text-stone-400 dark:text-stone-500">で</span>影<span class="mx-1.5 text-stone-400 dark:text-stone-500">を</span>描く
          </blockquote>

          <!-- 中釘：朱印「対」+ 上下 hairline-v -->
          <div class="reveal flex flex-col items-center gap-3 self-stretch py-2" aria-hidden="true">
            <span class="w-px flex-1 bg-gradient-to-b from-transparent via-stone-300/70 dark:via-stone-600/60 to-transparent"/>
            <span class="jp-seal jp-seal--b text-[0.78rem] tracking-[0.2em] font-jp font-light shrink-0"><span class="jp-seal-ink">対</span></span>
            <span class="w-px flex-1 bg-gradient-to-b from-transparent via-stone-300/70 dark:via-stone-600/60 to-transparent"/>
          </div>

          <!-- 右聯：影 で 繪 を 撮る（字距 0.5em，刻意比左聯寬 — §1 不均整） -->
          <blockquote
            class="reveal reveal-right reveal-delay-1 writing-vertical font-jp text-2xl sm:text-3xl lg:text-[2rem] font-extralight tracking-[0.5em] text-stone-800 dark:text-stone-100 leading-[2.2] flex-shrink-0"
          >
            影<span class="mx-1.5 text-stone-400 dark:text-stone-500">で</span>繪<span class="mx-1.5 text-stone-400 dark:text-stone-500">を</span>撮る
          </blockquote>
        </div>

        <!--
          底部副題（Round 10 詩化收束）
          critic 指原雙句羅馬副題是「直譯複讀」資訊冗餘。改為單行詩意句：
          「Two hands · One ink」— 兩條主線、同一筆墨之意，比直譯張力強。
        -->
        <p class="reveal reveal-delay-2 mt-14 lg:mt-20 text-center text-[0.62rem] tracking-[0.5em] uppercase text-stone-400 dark:text-stone-500">
          Two hands <span class="mx-2 opacity-60">·</span> One ink
        </p>
      </div>
    </section>

    <!--
      R31：砍掉「道具 Tools」section（generic spec list，非 dual-track narrative，user 反饋首頁太冗雜）
      R31：砍掉「侘寂 引言」section（單句 quote，与 Epilogue 收筆語重疊）
      原 ~150 行刪除；保留下方 Journey 直接連接
      ===================================================================== -->

    <!-- =====================================================================
         步履 — Journey（雙軌時間軸：繪左／影右／合流中）— id="journey"（Round 15 ChapterRail）
         2026-05-25：由單線 zig-zag 改為 track-driven 雙軌
           - desktop：digital → 左欄；photo → 右欄；both → 跨欄置中（合流節點）
           - 影軌頭部加「未だ無し」縦書き墓誌，把 2018-2024 的空白變成敘事
           - mobile：維持單欄，chapter kanji 旁加小縦書き track tag（繪 / 影 / 共）
         守門：marker 不破 stone 系；縦書き只在 desktop 軌頭出現 1 次，不通膨
         ===================================================================== -->
    <section id="journey" class="relative py-20 lg:py-28 scroll-mt-24">
      <div class="max-w-5xl mx-auto px-6 sm:px-10 lg:px-16">
        <header class="reveal mb-16 flex items-baseline justify-between flex-wrap gap-4">
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
    <section id="featured" class="relative py-20 lg:py-28 bg-stone-100/40 dark:bg-stone-800/25 scroll-mt-24">
      <div class="jp-hairline absolute top-0 left-0 right-0"/>
      <div class="max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">
        <header class="reveal mb-12 lg:mb-16 flex items-baseline justify-between flex-wrap gap-4">
          <h2 class="jp-section-title text-3xl sm:text-4xl">選
            <span class="jp-section-ruby">Featured Works</span>
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
      class="relative py-32 lg:py-48 overflow-hidden bg-stone-100/30 dark:bg-stone-900/30 scroll-mt-24"
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
          Round 20（收官）：雙主線時間軸（繪 2018 ─ ✦ ─ 2024 影）
          整個 portfolio 的最後一抹——把 19 輪建立的「繪×影」motif 用一條
          橫向 hairline + 中央朱菱形濃縮成一句編輯話：
            「2018 起繪、2024 加影、合於 2025」
          位置：epilogue 底部，緊接年代落款上方
          鐵律：stone-only hairline + accent 僅中央 marker 與兩端 kanji
        -->
        <div
          class="reveal reveal-delay-2 mt-14 lg:mt-20 mx-auto max-w-md flex items-center justify-center gap-3 text-stone-500 dark:text-stone-400"
          role="figure"
          aria-label="雙主線時間軸：繪 二〇一八 起、影 二〇二四 起、合流 二〇二五"
        >
          <!-- 左端：繪 2018 -->
          <span class="inline-flex items-baseline gap-2 shrink-0">
            <span class="font-jp text-base font-extralight tracking-[0.3em] text-stone-700 dark:text-stone-200">繪</span>
            <span class="font-jp text-[0.62rem] tracking-[0.35em] text-stone-400 dark:text-stone-500">二〇一八</span>
          </span>
          <!-- 左半 hairline + 中央菱形 + 右半 hairline -->
          <span class="flex-1 h-px bg-gradient-to-r from-transparent via-stone-300/70 dark:via-stone-600/60 to-accent-500/40" aria-hidden="true"/>
          <span class="w-2 h-2 rotate-45 bg-accent-500 dark:bg-accent-400 shrink-0 shadow-sm" aria-hidden="true"/>
          <span class="flex-1 h-px bg-gradient-to-r from-accent-500/40 via-stone-300/70 dark:via-stone-600/60 to-transparent" aria-hidden="true"/>
          <!-- 右端：2024 影 -->
          <span class="inline-flex items-baseline gap-2 shrink-0">
            <span class="font-jp text-[0.62rem] tracking-[0.35em] text-stone-400 dark:text-stone-500">二〇二四</span>
            <span class="font-jp text-base font-extralight tracking-[0.3em] text-stone-700 dark:text-stone-200">影</span>
          </span>
        </div>

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
import { ref, computed, onMounted, watch } from 'vue'
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
const router = useRouter()
const heroFocus = ref<HeroFocus>('balanced')

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

function setHeroFocus (mode: HeroFocus) {
  heroFocus.value = mode
  const next = { ...route.query } as Record<string, string | string[] | undefined>
  if (mode === 'balanced') delete next.focus
  else next.focus = mode
  router.replace({ query: next })
  // R47: sessionStorage 跨頁持久化（用 sessionStorage — tab 關閉重置）
  if (typeof window !== 'undefined') {
    if (mode === 'balanced') window.sessionStorage.removeItem('nctu-hero-focus')
    else window.sessionStorage.setItem('nctu-hero-focus', mode)
  }
}

/** Gallery CTA 目標路徑 — 跟著 heroFocus 走，formalize 首屏選擇 */
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
</style>
