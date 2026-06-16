<template>
  <div
    ref="pageRef"
    class="gallery-world min-h-screen transition-colors duration-300"
    :data-world="worldId"
    :class="{ 'gallery-world--ready': worldReady }"
  >
    <!--
      桌機 lg+：左 rail（filters 常駐）+ 主欄（內容從 viewport 頂端開始）
      mobile/tablet（<lg）：rail 隱藏，沿用原本 top-stack 結構 + sticky mini bar
      詳見 wiki/inspirations/gallery-left-rail.md（survives chrome-budget rule：加 rail = 砍頂部 chrome）
    -->
    <!--
      R1（強硬大膽 galleryWorlds）：破「兩世界共用左 rail + 主欄」拓樸。
        繪 (kai)  = 製図室：左 spec 索引 rail 常駐 → 側railed 工作室。
        影 (kage) = 暗室：取消左 rail，改主欄頂部「暗房光桌橫條」(GalleryDarkroomBar)
                    → 全幅 full-bleed 縱捲膠卷，無側欄吃 ~240px（同時消右側死白）。
      lg+ 兩世界頁面外框本身不同，一眼分得出「兩本不同的書」。
      mobile/tablet（<lg）兩世界都沿用原 top-stack，不受影響。
    -->
    <!--
      j1（双面綴じ・裏地の書口）：持續性「對向世界書口」縱向書脊，貫穿整頁釘在主欄外緣。
      在繪世界(kai)右緣露出影書口、在影世界(kage)左緣露出繪書口 → 兩世界整頁皆可感知、
      單擊翻面切換世界。取代「門之後對向世界即消失」的單世界部落格地層。
      只在 overview 入口顯示（進 event 沉浸閱讀時收起，避免干擾深讀）。SSR 安全。
    -->
    <GalleryFacingEdge v-if="isOverviewEntry" :current="worldId" />

    <div class="lg:flex lg:gap-8 lg:items-start" :class="worldId === 'kage' ? 'lg:block' : ''">
      <GalleryLeftRail
        v-if="worldId === 'kai'"
        :category-label="categoryLabel"
        :category-count="categoryCount"
        class="hidden lg:block"
      />
      <div class="lg:flex-1 lg:min-w-0">
        <!--
          j5（整併 / consolidation）：移除 GalleryWorldGate 3D 立體書台。
          原因：trace 證實它是互動卡頓根源——翻頁改變「葉寬」(open ~80% ↔ verso ~19%)，
          每次切換/點擊都重排整棵 ~700 物件的 preserve-3d 子樹（單次 Layout 1.5–3s）；
          且它與下方 Diptych Ledger 為冗餘的雙世界裝置（critic 標 clutter + below-fold）。
          雙主線入口改由較輕的【對開帳 GalleryDiptychLedger】承擔（見下方），
          世界切換仍由 GalleryFacingEdge 書口 + tab 承擔。 -->

        <!-- 影世界專屬：頂部暗房光桌橫條（取代左 rail；僅 lg+）。
             i1：overview 入口屏由 GalleryWorldGate 承擔門面，暗房橫條隱藏避免重複信號。 -->
        <div v-if="worldId === 'kage' && !isOverviewEntry" class="hidden lg:block container mx-auto px-4 sm:px-6 pt-8">
          <div class="max-w-7xl mx-auto">
            <GalleryDarkroomBar :category-count="categoryCount" />
          </div>
        </div>
    <!-- Header — 個性化設計（lg+ 改由左 rail 承擔，隱藏避免重複）。
         i1：mobile overview 入口屏的世界標牌由 GalleryWorldGate（縱向疊）承擔，
         此 masthead 在 overview 入口隱藏（保留 controls 區供篩選），避免雙標牌重複。 -->
    <div ref="controlsSectionRef" class="container mx-auto px-4 py-8 sm:px-6 md:py-20 relative lg:hidden">
      <!-- 右側縦書き裝飾字（配 hairline 收尾，不再孤立色點） -->
      <div class="absolute top-10 right-[6%] hidden lg:flex flex-col items-center gap-4 select-none pointer-events-none">
        <span class="jp-hairline-v h-16"/>
        <span class="jp-vertical-caption text-stone-400/60 dark:text-stone-600/60">記録と創作</span>
      </div>

      <div class="max-w-7xl mx-auto">
        <!--
          頁眉（mobile/tablet <lg；lg+ 由左 rail 承擔）
          R6（act-critic galleryWorlds）：mobile 首屏也是 critic 指出的「共用頂欄」之一。
          改為依 worldId 換整套標牌語言，與 GalleryLeftRail masthead 同步：
            繪(kai)：mono「製図室 / DRAFTING ROOM」+ 直角方括號 eyebrow + tabular 葉數
            影(kage)：serif「暗室 / Darkroom」+ 常駐手記 note（非 hover）+ 細體張數
          讓手機首訪 3 秒就分得出在哪個世界。world-enter 提供首屏進場呼吸。
        -->
        <!-- 繪 (kai)：overview 入口屏的 mobile 標牌由 GalleryWorldGate 承擔 → 隱藏避免重複 -->
        <div v-if="worldId === 'kai' && !isOverviewEntry" :key="`mh-kai`" class="gallery-masthead-m gallery-masthead-m--kai world-enter world-enter-d1 mb-6">
          <p class="gallery-masthead-m__eyebrow gallery-masthead-m__eyebrow--mono">
            <span aria-hidden="true">[</span>繪 / DIGITAL<span aria-hidden="true">]</span>
          </p>
          <div class="flex items-end gap-5">
            <h1 class="gallery-masthead-m__title gallery-masthead-m__title--mono">製図室</h1>
            <span class="hidden sm:block h-px flex-1 max-w-[120px] bg-accent-500/30 mb-2"/>
          </div>
          <p class="gallery-masthead-m__meta gallery-masthead-m__meta--mono">
            DRAFTING ROOM <span class="opacity-50">·</span> {{ String(categoryCount).padStart(3, '0') }} 葉
          </p>
        </div>

        <!--
          影 (kage)：R8 — mobile 首屏也包進暗室負片膠捲（齒孔 + 反白），
          與繪 mobile 的製圖白底正好相反相，手機首訪 3 秒就分世界。
        -->
        <div v-else-if="worldId === 'kage' && !isOverviewEntry" :key="`mh-kage`" class="gallery-filmpanel-m world-enter world-enter-d1 mb-6">
          <span class="gallery-filmpanel-m__sprockets" aria-hidden="true"/>
          <div class="gallery-masthead-m gallery-masthead-m--kage">
            <p class="gallery-masthead-m__eyebrow gallery-masthead-m__eyebrow--serif">影 — Photography</p>
            <div class="flex items-end gap-5">
              <h1 class="gallery-masthead-m__title gallery-masthead-m__title--serif">暗室</h1>
              <span class="hidden sm:block h-px flex-1 max-w-[120px] bg-stone-400/40 mb-2"/>
            </div>
            <p class="gallery-masthead-m__note world-enter world-enter-d2">光と影を、現像する。</p>
            <p class="gallery-masthead-m__meta gallery-masthead-m__meta--serif">
              Darkroom · 手記 <span class="opacity-50">·</span> {{ categoryCount }} 枚
            </p>
          </div>
        </div>

        <div id="gallery-filter-controls">
          <!-- Category Tabs -->
          <div class="mb-4">
            <GalleryTabBar />
          </div>

          <!-- Event Filter -->
          <div class="mb-6">
            <EventFilter />
          </div>

          <!-- 搜尋 + 年份：輕量行內工具列 -->
          <GalleryFilterToolbar />
        </div>
      </div>
    </div>

    <!--
      Sticky mini bar：控制區離開可視區後，收束為一行摘要。
      lg+ 上 rail 常駐，mini bar 多餘 → `lg:hidden` 隱藏。
    -->
    <transition name="mini-bar-fade">
      <div
        v-if="showControlMiniBar"
        class="lg:hidden pointer-events-none fixed inset-x-0 z-[1090] top-[calc(env(safe-area-inset-top,0px)+4rem)]"
        data-testid="gallery-filter-mini-bar"
      >
        <GalleryControlMiniBar
          controls-id="gallery-filter-controls"
          :category-label="miniCategoryLabel"
          :event-label="miniEventLabel"
          :year-label="miniYearLabel"
          :search-label="miniSearchLabel"
          :expanded="false"
          @expand="scrollToControls"
        />
      </div>
    </transition>

    <!-- Gallery Content -->
    <div class="container mx-auto px-4 sm:px-6 relative">
      <!-- Loading State -->
      <div v-if="isGalleryLoading" class="text-center py-28">
        <!-- 日式菱形旋轉動畫 -->
        <div class="inline-flex flex-col items-center gap-6">
          <div class="relative w-10 h-10">
            <div class="absolute inset-0 border border-accent-300/60 dark:border-accent-600/40 rotate-45 animate-spin" style="animation-duration: 2s;"/>
            <div class="absolute inset-[6px] border border-accent-400/40 dark:border-accent-500/30 rotate-45 animate-spin" style="animation-duration: 3s; animation-direction: reverse;"/>
            <div class="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-accent-400 dark:bg-accent-500 rotate-45"/>
          </div>
          <p class="jp-section-label">Loading</p>
        </div>
      </div>

      <!-- 錯誤態：useAsyncData 失敗或兩邊作品都空時，提供就地重試（避免只靠右上角 toast） -->
      <div
        v-else-if="galleryLoadFailed"
        class="max-w-md mx-auto my-24 text-center px-6"
        role="alert"
      >
        <p class="jp-section-label mb-3">Error</p>
        <h2 class="text-xl font-extralight text-stone-700 dark:text-stone-200 tracking-wider mb-2">
          無法載入作品清單
        </h2>
        <p class="text-sm text-stone-500 dark:text-stone-400 font-light leading-relaxed mb-6">
          網路或資料檔可能暫時無法取得，請稍後再試。
        </p>
        <button
          type="button"
          class="inline-flex items-center gap-2 px-5 py-2 text-xs tracking-[0.25em] text-stone-600 dark:text-stone-300 border border-stone-300 dark:border-stone-600 hover:text-accent-600 dark:hover:text-accent-400 hover:border-accent-400/60 transition-colors"
          :disabled="isGalleryRetrying"
          @click="retryGalleryLoad"
        >
          {{ isGalleryRetrying ? 'Retrying…' : 'Retry' }}
        </button>
      </div>

      <!--
        地點地圖：僅在攝影作品分類顯示（2026-04-19 起改 compact 版；2026-04-28 priority 2 重構）
        敘事章節結構：
          一 · 踏跡 Footsteps（map） → 二 · 句 Statement → 三 · 精選 Selected → 四 · 時間軸 Timeline
        每段冠以 editorial section header（章碼 + 漢字 + Ruby + hairline）取代孤立的 eyebrow 行，
        讓策展節奏取代功能感。
      -->
      <!--
        R6（act-critic loop）：割面ゲートウェイ — overview 進站第一屏即見繪×影割面對峙。
        回應 Round 5 critic next-step「把割面対置交互複製到 gallery 路由首屏，讓繪⇄影
        對峙成為全站入口」。取代 R48 被動 dual-split 兩連結 grid：
          舊：靜態並置兩張卡，點哪張進哪個 event（被動瀏覽）
          新：可拖動接縫的割面，拖向繪/影改變重心 → 收重那側點擊進入 /gallery/<track>
        把「選哪條主線」從 tab 切換的離散決定，變成一條可連續拉扯的分岐手勢。
        與 index FeaturedConfrontation 差異：那是看作品（開 lightbox），這是選路（進路由）。
      -->
      <!--
        R2（galleryWorlds 大改）：割面ゲートウェイ「只在影路由 overview」當作雙主線總入口
        （影為預設落地路由）。回應 Round 1「兩首屏並排幾乎一樣」——digital 不再先吃同一個
        gateway，而是直接由 GalleryDigitalIntro（製圖宣言）+ 製圖格牆領銜，photography 則保留
        gateway 作雙線對峙入口後接顯影 Map/Timeline。如此兩路由首屏結構分歧：
          繪 = 製圖宣言 → 嚴格格牆（對齊牆）
          影 = 割面對峙 → 顯影地圖 → 直落流時間軸
      -->
      <!--
        i1：舊 GalleryConfrontGateway（被埋在 DarkroomBar/Index 之後、非全幅）已由
        頁首 full-bleed GalleryWorldGate 取代（見上方 lg:flex-1 欄頂）。此處保留註解標記移除點。
      -->

      <!--
        i4：暗室「綜覽接觸印樣格目次」(GalleryDarkroomIndex) 已移除 —— 它本身是一張
        縮圖格牆（部落格目次感），與本輪 overview 主欄的橫向膠卷光桌(GalleryLightTable)
        重複（光桌自帶巻尺 roll-ruler 作橫向綜覽導航）。改由光桌單一承擔「綜覽 + 深入」，
        消除「縮圖格牆目次 + 內容」的雙層格牆冗餘。
      -->

      <!--
        其の一 Footsteps Map — 僅在 photography overview（未進 event）顯示。
        進 event 時改走扉頁（GalleryEventCover），跳過 map / statement / strip 三章節。
      -->
      <section
        v-if="!galleryLoadFailed && eventLocations && eventLocations.length && currentCategory === 'photography' && !filterState.selectedEvent"
        ref="mapSectionRef"
        class="mb-12 max-w-7xl mx-auto scroll-mt-24"
        aria-labelledby="photo-map-heading"
      >
        <header class="mb-5 world-enter world-enter-d1">
          <p class="jp-section-label mb-2">其の二 · Footsteps</p>
          <h2
            id="photo-map-heading"
            class="font-jp text-2xl sm:text-3xl font-extralight tracking-[0.3em] text-stone-800 dark:text-stone-100"
          >踏跡 <span class="text-[0.7rem] tracking-[0.4em] text-stone-400 dark:text-stone-500 ml-2 align-middle uppercase">Visited Places</span></h2>
        </header>
        <EventMap
          :events="eventLocations"
          :selected-event-name="filterState.selectedEvent"
          variant="compact"
          @focus-event="handleFocusEvent"
        />
        <div class="jp-hairline w-full mt-6"/>
      </section>

      <!--
        j4（act-critic / 一組對位敘事）：overview 入口的雙世界本體。
        門（GalleryWorldGate）之後，主欄不再各自落到「該世界最新 N 張」的單軌流，
        而是先攤開一冊【對開帳 GalleryDiptychLedger】——由頂層 crossWorldSpreads 編定的
        繪×影同題對頁配對（資料層驅動），讓雙主線從「兩個入口」進化為「一組對位敘事」。
        對開帳之後才接該世界的 timeline / 光桌（深入單軌）。
        只在 overview 入口、且有解析到配對時顯示；進 event 沉浸閱讀時收起。SSR 安全。
      -->
      <div
        v-if="!isGalleryLoading && !galleryLoadFailed && isOverviewEntry && crossWorldSpreads.length"
        class="mb-14 sm:mb-20 world-enter world-enter-d2"
      >
        <GalleryDiptychLedger
          :spreads="crossWorldSpreads"
          @open-kai="openKaiSpread"
          @open-kage="openKageSpread"
        />
        <div class="jp-hairline w-full mt-12 sm:mt-16"/>
      </div>

      <!-- 根據當前類別顯示不同佈局（帶切換動畫） -->
      <transition name="gallery-fade" mode="out-in">
      <div v-if="!isGalleryLoading && !galleryLoadFailed" :key="currentCategory">
        <!-- 搜尋／年份篩選後無結果：就地提示並提供清除 -->
        <div
          v-if="hasActiveSecondaryFilter && noFilteredResults"
          class="max-w-md mx-auto my-20 text-center px-6"
        >
          <p class="jp-section-label mb-3">Empty</p>
          <h2 class="text-lg font-extralight text-stone-700 dark:text-stone-200 tracking-wider mb-2">
            沒有符合條件的作品
          </h2>
          <p class="text-sm text-stone-500 dark:text-stone-400 font-light leading-relaxed mb-5">
            試著調整搜尋詞或年份篩選，或直接清除現有篩選再瀏覽。
          </p>
          <button
            type="button"
            class="inline-flex items-center gap-2 px-4 py-1.5 text-xs tracking-[0.25em] text-stone-600 dark:text-stone-300 border border-stone-300 dark:border-stone-600 hover:text-accent-600 dark:hover:text-accent-400 hover:border-accent-400/60 transition-colors"
            @click="clearSecondaryFilters"
          >
            Reset filters
          </button>
        </div>

        <!--
          數位繪圖（繪 · 製図室）
          i3（act-critic）：KILL 部落格地層 —— 移除舊「v-for stacked 章節 header
          (其の N / 20XX年電繪作品) → GridWall」逐年上下堆疊（critic verdict #2「太像部落格」）。
          改為單一【橫向可拖動製図台年表】GalleryAtelierTimeline：年份左→右鋪在同一張製圖桌上，
          頂部年尺可點跳年，使用者主動橫拖／⇧滾輪／方向鍵探索（user-initiated，無 timer）。
          桌機橫向、手機降級直落（normal scroll，瀏覽不破）。Intro 製圖宣言保留領銜。
        -->
        <div v-else-if="currentCategory === 'digital'">
          <!--
            i6（act-critic / 門と台を一本の軌に縫う）：overview 入口屏顯示 GalleryWorldGate
            時，KILL 中間那層 GalleryDigitalIntro 的「製圖格牆 hero-row」——它在門（已含 繪
            製図台 preview 條）正下方再起一條等寬方格列，正是 critic 指的「門／grid 兩種視覺
            語言並存的斷層」（門→hero-row→年表三條橫條堆疊）。改為門直接接續 AtelierTimeline
            縫合條，一條軌貫穿。非 overview（進 event / 有篩選、無門）時才保留 Intro 領銜。
          -->
          <div v-if="!isOverviewEntry" class="world-enter world-enter-d1">
            <GalleryDigitalIntro />
          </div>
          <GalleryAtelierTimeline
            :groups="atelierYearGroups"
            class="world-enter world-enter-d2"
            @image-click="(img) => openImageViewer(img, digitalArtItems)"
          />
        </div>

        <!-- 攝影作品 - 保持原有的日式佈局 -->
        <div v-else-if="currentCategory === 'photography'">
          <!--
            進入特定 event 時：扉頁式入口（GalleryEventCover）
            啟發自 sites/ryan-mcginley.md + sites/rinko-kawauchi.md（沉浸型訪客優先）。
            跳過 overview 的 Map/Statement/Strip 三章節，直接呈現該 event 之代表照 + metadata + 展開鈕。
            升級路徑：未來加 SERIES_TAG = 'event-cover' 後，cover 來源由 D1（第一張）改為 D2（admin 指定）。

            注意：不能用 <template v-if/v-else> 包多元素群組——本層在 <transition>
            內，多根 fragment 會觸發 Vue 內部 _leaveCb null reference（v3.4-3.6
            transition + multi-root fragment 已知互動）。改用個別 v-if 維持單根。
          -->
          <GalleryEventCover
            v-if="filterState.selectedEvent && currentEventGroup"
            :group="currentEventGroup"
            @expand="scrollToEventTimeline"
          />

          <!--
            R32：「其の二 · Artist Statement」整段刪除（與首頁 Hero/Epilogue 重複）。

            i4（act-critic / 暗室の横引き膠卷光桌）：KILL 影世界舊「stacked 摺合章 timeline
            + 精選 strip」部落格地層（critic AVOID jump-out：影仍是死板縮圖格牆）。
            overview 主欄改為一條【橫向可拖動的暗房光桌膠卷流】GalleryLightTable，
            與繪 GalleryAtelierTimeline（製図台）對位——一張製圖桌、一卷底片，
            兩世界各有招牌橫向手勢。HorizontalStripFeatured / GalleryPhotographySection
            （逐年 stacked）只在「進 event 沉浸模式」保留垂直閱讀。
          -->
          <!-- overview：橫向膠卷光桌（取代精選 strip + 逐年 stacked timeline） -->
          <GalleryLightTable
            v-if="!filterState.selectedEvent"
            :items="photographyEventItems"
            class="world-enter world-enter-d2"
            @image-click="(img) => openImageViewer(img, allPhotographyImages)"
          />

          <!-- Timeline：僅 event 沉浸模式渲染；扉頁的「展開全部」會 scroll 到此 -->
          <div v-if="filterState.selectedEvent" ref="eventTimelineRef" class="scroll-mt-24">
            <GalleryPhotographySection
              ref="photographySectionRef"
              :items="photographyEventItems"
              :focused-event-name="focusedEventName"
              :register-event-ref="setEventRef"
            />
          </div>
        </div>

        <!--
          2026-05-09：移除「全部作品 - 混合佈局」分支（原 GalleryAllMixedSection）。
          雙主線敘事（繪 / 影）為策展核心；mixed feed 與兩條獨立敘事弧不同質。
          舊 /gallery/all 由 useGalleryCategoryRoute 在 client-side replace 到 /gallery/photography。
        -->
      </div>
      </transition>
    </div>

    <!--
      j1：手機「翻面帶」—— fixed 縱向書口僅桌機(lg+)出現，手機在頁尾補一條橫向
      「翻到對向世界」帶，確保手機也保有整頁雙世界可感知＋可切換（user-initiated）。
    -->
    <NuxtLink
      v-if="isOverviewEntry"
      :to="`/gallery/${worldId === 'kai' ? 'photography' : 'digital'}`"
      class="facing-band lg:hidden"
      :data-world="worldId === 'kai' ? 'kage' : 'kai'"
      :aria-label="worldId === 'kai' ? '影の世界（暗室）へ翻る' : '繪の世界（製図室）へ翻る'"
    >
      <span class="facing-band__rule" aria-hidden="true"/>
      <span class="facing-band__kana font-jp" aria-hidden="true">{{ worldId === 'kai' ? '影' : '繪' }}</span>
      <span class="facing-band__copy">
        <span class="facing-band__lead">{{ worldId === 'kai' ? '対向の世界へ' : '対向の世界へ' }}</span>
        <span class="facing-band__sub">{{ worldId === 'kai' ? '影 · Photography へ翻る →' : '← 繪 · Digital へ翻る' }}</span>
      </span>
      <span class="facing-band__rule" aria-hidden="true"/>
    </NuxtLink>

    <!-- Footer — 根據分類變化 -->
    <div class="container mx-auto px-4 py-16 sm:px-6 sm:py-20 lg:py-28 text-center relative overflow-hidden">
      <div class="deco-line-h absolute left-1/2 top-0 w-40 -translate-x-1/2"/>

      <!-- 背景漢字裝飾 -->
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span class="font-jp text-[10rem] sm:text-[14rem] font-thin leading-none text-stone-100/80 dark:text-stone-800/40">
          {{ currentCategory === 'digital' ? '繪' : currentCategory === 'photography' ? '影' : '創' }}
        </span>
      </div>

      <div class="relative">
        <!-- 上方裝飾：hairline + 墨點 -->
        <div class="flex items-center justify-center gap-3 mb-6">
          <div class="h-px w-12 bg-gradient-to-r from-transparent to-stone-300/60 dark:to-stone-600/40"/>
          <span class="jp-sumi-dot opacity-70"/>
          <div class="h-px w-12 bg-gradient-to-l from-transparent to-stone-300/60 dark:to-stone-600/40"/>
        </div>

        <div class="font-jp text-2xl md:text-3xl font-thin text-stone-300 dark:text-stone-600 tracking-wider">{{ footerQuote }}</div>
        <div class="text-xs text-accent-400/50 dark:text-accent-500/35 mt-3 font-light tracking-[0.4em]">{{ footerSub }}</div>
      </div>
    </div>
      </div>
    </div>

    <!--
      R3：繪⇄影「世界幕」轉場 overlay（回應 Round 2 critic「缺 tab/route 兩世界互轉轉場」）。
      切換 track 時播一次定向幕：
        繪(kai) = 暖色製圖網格幕，由右上「俐落 grid-snap」橫掃離場（呼應對齊牆語法）
        影(kage) = 冷色顯影幕，中央「緩慢 develop blur-fade」消散（呼應顯影盤語法）
      純一次性、user-initiated（點 tab 才觸發），無 timer/autoplay，不違 hero 靜態鐵律
      （此為 gallery 非 hero）。fixed 滿版、pointer-events-none、aria-hidden，不擋互動。
      所有 keyframe 在 prefers-reduced-motion 下停用（見 main.css）。
    -->
    <transition :name="worldId === 'kai' ? 'world-curtain-kai' : 'world-curtain-kage'">
      <div
        v-if="worldCurtainOn"
        class="world-curtain"
        :data-world="worldId"
        aria-hidden="true"
      >
        <span class="world-curtain__kana font-jp">{{ worldId === 'kai' ? '繪' : '影' }}</span>
      </div>
    </transition>

    <!-- 圖片檢視器 -->
    <ImageViewer />

    <!--
      R9：繪⇄影 切換時的「起算尺」轉場 overlay 已上移至 app.vue 常駐，
      確保 route param 變更卸載 page 時 overlay 仍能完整播放（見 GalleryTrackTransition.vue 註解）。
    -->


    <!-- 回到地圖：桌機右側膠囊按鈕 -->
    <button
      v-if="showBackToMap && currentCategory === 'photography'"
      class="hidden md:flex fixed right-[10%] top-1/2 z-[1005] -translate-y-1/2 px-3 py-1.5 text-[0.7rem] tracking-[0.3em] rounded-full bg-white/90 border border-stone-200 text-stone-500 hover:text-accent-600 hover:border-accent-300 shadow-japanese transition-all"
      type="button"
      aria-label="回到地圖"
      title="回到地圖"
      @click="scrollToMap"
    >
      MAP
    </button>

    <!-- 回到地圖：手機右下圓形按鈕 -->
    <button
      v-if="showBackToMap && currentCategory === 'photography'"
      class="md:hidden fixed z-[1005] flex h-11 w-11 touch-manipulation items-center justify-center rounded-full border border-stone-200 bg-white/95 text-[0.65rem] tracking-[0.2em] text-stone-500 shadow-japanese transition-all active:scale-95 right-[max(1rem,env(safe-area-inset-right))] bottom-[calc(5rem+env(safe-area-inset-bottom))]"
      type="button"
      aria-label="回到地圖"
      title="回到地圖"
      @click="scrollToMap"
    >
      MAP
    </button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch, computed, ref, nextTick, type ComponentPublicInstance } from 'vue'
import { storeToRefs } from 'pinia'
import { useGalleryStore } from '~/stores/gallery'
import { fetchDigitalWorks, fetchPhotographyWorks } from '~/stores/galleryLoaders'
import { SEO_CONFIG } from '~~/shared/config/constants'
import {
  resolveGalleryShareMeta,
  parseGalleryImageIdFromRoute,
  parseGalleryEventFromParams,
  absoluteUrlFromSitePath
} from '~/utils/gallerySeo'
import type { GalleryItem, FilterState } from '~~/shared/types/gallery'
import { useImageViewerStore } from '~/stores/imageViewer'
import { useGlobalToast } from '~/composables/useToast'

// ===== 組件引入 =====
import GalleryTabBar from '~/components/GalleryTabBar.vue'
import EventFilter from '~/components/EventFilter.vue'
import GalleryFilterToolbar from '~/components/GalleryFilterToolbar.vue'
import GalleryAtelierTimeline from '~/components/gallery/GalleryAtelierTimeline.vue'
import GalleryPhotographySection from '~/components/gallery/GalleryPhotographySection.vue'
import GalleryEventCover from '~/components/gallery/GalleryEventCover.vue'
import GalleryLightTable from '~/components/gallery/GalleryLightTable.vue'
import GalleryDiptychLedger from '~/components/gallery/GalleryDiptychLedger.vue'
import GalleryFacingEdge from '~/components/gallery/GalleryFacingEdge.vue'
import GalleryDigitalIntro from '~/components/gallery/GalleryDigitalIntro.vue'
import GalleryControlMiniBar from '~/components/gallery/GalleryControlMiniBar.vue'
import GalleryLeftRail from '~/components/gallery/GalleryLeftRail.vue'
import GalleryDarkroomBar from '~/components/gallery/GalleryDarkroomBar.vue'
import EventMap from '~/components/EventMap.vue'
import ImageViewer from '~/components/ImageViewer.vue'

// ===== Store 和 Composables =====
const galleryStore = useGalleryStore()
const {
  mixedPhotoItems,
  eventLocations,
  isLoading,
  allWorks,
  digitalError,
  photographyError,
  filterState,
  digitalWorks,
  photographyWorks,
  filteredItems,
  crossWorldSpreads,
} = storeToRefs(galleryStore)

const {
  loadAllWorks,
  hydrateFromPayload,
  setSelectedEvent,
  setSearchQuery,
  setYearFilter,
} = galleryStore

const { getImagePath, getThumbPath } = useImagePath()

const { data: galleryPayload, pending: galleryPending, error: galleryPayloadError, refresh: refreshGalleryPayload } = await useAsyncData('gallery-works', async () => {
  // Key 必須叫 `photography` 才能對上 `hydrateFromPayload` 的 destructure；
  // 早期版本誤命名為 `photo`，導致 SSR 只灌到 digital，攝影仍為空，要靠 onMounted 補抓
  // (見下方 `if (digitalWorks.length === 0 || photographyWorks.length === 0) loadAllWorks()`)。
  // 修正 key 名後 SSR 就能完整填滿 store，事件頁的 `ImageGallery` JSON-LD 也才會帶 hasPart。
  const [digital, photography] = await Promise.all([fetchDigitalWorks(), fetchPhotographyWorks()])
  return { digital, photography }
})

watch(galleryPayload, (v) => {
  if (v) hydrateFromPayload(v)
}, { immediate: true })

const isGalleryLoading = computed(() => galleryPending.value || isLoading.value)

const galleryLoadFailed = computed(() => {
  if (isGalleryLoading.value) return false
  const hasError = Boolean(galleryPayloadError.value || digitalError.value || photographyError.value)
  const hasNoWorks = digitalWorks.value.length === 0 && photographyWorks.value.length === 0
  return hasError && hasNoWorks
})

const isGalleryRetrying = ref(false)
const retryGalleryLoad = async () => {
  if (isGalleryRetrying.value) return
  isGalleryRetrying.value = true
  try {
    await refreshGalleryPayload()
    if (galleryPayload.value) {
      hydrateFromPayload(galleryPayload.value)
    } else {
      await loadAllWorks()
    }
  } finally {
    isGalleryRetrying.value = false
  }
}

const imageViewerStore = useImageViewerStore()
const toast = useGlobalToast()

/** Lightbox 與 `?image=` 網址同步（見 composables/useGalleryImageRoute.ts） */
useGalleryImageRoute()
useGalleryCategoryRoute()
useGalleryEventRoute()
const pageRef = ref<HTMLElement | null>(null)
const controlsSectionRef = ref<HTMLElement | null>(null)
const mapSectionRef = ref<HTMLElement | null>(null)
const showBackToMap = ref(false)
const showControlMiniBar = ref(false)

// ===== 計算屬性 =====
// 當前選擇的類別
const currentCategory = computed(() => filterState.value.selectedCategory)

/**
 * R1（galleryWorlds）：世界身分 — 繪=kai / 影=kage。
 * 由此一個 data-world attribute 驅動整頁氛圍（底紋／環境光／accent 色溫／進場節奏），
 * 讓兩條 track 像兩個截然不同的世界，而非同一個 image browser 換內容。
 */
const worldId = computed(() => (currentCategory.value === 'digital' ? 'kai' : 'kage'))

/**
 * i2（act-critic / 雙世界共同入口）：overview「双世界の門」入口屏條件。
 * 回應 Round 1 critic「門被鎖在 photography 單一路由，/gallery/digital 與 /gallery/all
 * 落地仍是 header+左rail+逐年堆疊的部落格格」。
 * 改為：**任一 overview 路由**（digital 或 photography）未選 event、無次級篩選、
 * 兩軌都有資料時，第一屏都先見 full-bleed 繪×影對峙門面 —— 門已偏向當前世界（bias），
 * 但岐 seam 仍可拖回對側。門之後才是該世界內容（仍可瀏覽，bold ≠ broken）。
 * 進入任一 event（選 event）即離開門面、回到該世界沉浸導航。
 */
const isOverviewEntry = computed(() =>
  !galleryLoadFailed.value &&
  !isGalleryLoading.value &&
  !filterState.value.selectedEvent &&
  !hasActiveSecondaryFilter.value &&
  digitalWorks.value.length > 0 &&
  photographyWorks.value.length > 0
)

/**
 * worldReady：控制 ::before/::after 質地層淡入。
 * 切換 track 時先抽離再掛回 → 重新觸發世界進場（質地淡入 + .world-enter 動畫重播）。
 * 純一次性進場，無 timer/autoplay，不違 hero 靜態鐵律（此處非 hero）。
 */
const worldReady = ref(false)
let worldReadyRaf = 0
const armWorld = () => {
  worldReady.value = false
  if (typeof window === 'undefined') return
  cancelAnimationFrame(worldReadyRaf)
  worldReadyRaf = requestAnimationFrame(() => {
    worldReadyRaf = requestAnimationFrame(() => { worldReady.value = true })
  })
}

/**
 * 世界幕轉場：切換 track 時短暫掛上 overlay 播放定向幕，播完即卸載。
 * 只在「真正切換 track」時觸發（worldId 變更），初次掛載不觸發。
 * prefers-reduced-motion 下不掛幕（避免無謂閃白）。
 */
const worldCurtainOn = ref(false)
let worldCurtainTimer: number | null = null
watch(worldId, () => {
  armWorld()
  if (typeof window === 'undefined') return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  worldCurtainOn.value = true
  if (worldCurtainTimer !== null) window.clearTimeout(worldCurtainTimer)
  // 略長於 leave transition（kage 0.85s）以確保播完離場
  worldCurtainTimer = window.setTimeout(() => {
    worldCurtainOn.value = false
    worldCurtainTimer = null
  }, 120)
})

// Gallery header dynamic info
// 2026-05-09：移除 'all'，labels 收斂為雙主線
const categoryLabel = computed(() => {
  const labels: Record<FilterState['selectedCategory'], string> = { digital: 'Digital Art', photography: 'Photography' }
  return labels[currentCategory.value]
})
const categoryCount = computed(() => {
  if (currentCategory.value === 'digital') return digitalArtItems.value.length
  return photographyEventItems.value.reduce((sum, g) => sum + (g.images?.length || 0), 0)
})

const miniCategoryLabel = computed(() => {
  const labels: Record<FilterState['selectedCategory'], string> = { digital: 'Digital', photography: 'Photography' }
  return labels[currentCategory.value]
})

const miniEventLabel = computed(() => filterState.value.selectedEvent || '全部事件')
const miniYearLabel = computed(() => filterState.value.yearFilter || '全年份')
const miniSearchLabel = computed(() => {
  const value = filterState.value.searchQuery.trim()
  if (!value) return '無'
  return value.length > 18 ? `${value.slice(0, 18)}…` : value
})

// Footer quotes by category（2026-05-09：移除 'all' quote）
const footerQuotes: Record<FilterState['selectedCategory'], { quote: string; sub: string }> = {
  digital:     { quote: '每一筆都是故事', sub: 'every stroke tells a story' },
  photography: { quote: '光影之間，皆是詩', sub: 'poetry between light and shadow' },
}
const footerQuote = computed(() => footerQuotes[currentCategory.value].quote)
const footerSub = computed(() => footerQuotes[currentCategory.value].sub)

// 數位作品列表 - 使用經過篩選的 currentWorks（含搜尋／年份）
const digitalArtItems = computed(() => {
  if (filterState.value.selectedCategory === 'digital') {
    // filteredItems = currentWorks 套用 search/year；category=digital 時 currentWorks 已是 digitalWorks
    return filteredItems.value
  }
  return digitalWorks.value
})

const hasActiveSecondaryFilter = computed(() =>
  Boolean(filterState.value.searchQuery || filterState.value.yearFilter)
)

const noFilteredResults = computed(() => {
  if (currentCategory.value === 'digital') return digitalArtItems.value.length === 0
  return photographyEventItems.value.reduce((s, g) => s + (g.images?.length || 0), 0) === 0
})

const clearSecondaryFilters = () => {
  setSearchQuery('')
  setYearFilter(null)
}

/**
 * i3：digital 依 event.name (年份) 分組，餵給橫向製図台年表（GalleryAtelierTimeline）。
 * 取代舊 digitalEventGroups + stacked 章節 header（部落格地層）。
 * 年份 asc（左→右＝舊→新，橫向時間軸自然由過去往現在推進）。
 * year 欄位：從 event.name 抽 4 位年份，作年尺刻度與年脊大字。
 */
interface AtelierYearGroup {
  eventName: string
  year: string
  images: typeof digitalArtItems.value
  strongestLine: string | null
}
const atelierYearGroups = computed<AtelierYearGroup[]>(() => {
  const groups = new Map<string, AtelierYearGroup>()
  for (const img of digitalArtItems.value) {
    const name = img.event?.name || '其他作品'
    if (!groups.has(name)) {
      const sn = (img as { seriesNarrative?: { strongest_line?: string } }).seriesNarrative
      groups.set(name, {
        eventName: name,
        year: name.match(/(\d{4})/)?.[1] || name,
        images: [],
        strongestLine: sn?.strongest_line || null
      })
    }
    groups.get(name)!.images.push(img)
  }
  // 年份 asc（左→右＝舊→新）：橫向製図台的時間自然由左往右推進
  return Array.from(groups.values()).sort((a, b) => {
    const ay = parseInt(a.year.match(/(\d{4})/)?.[1] || '0', 10)
    const by = parseInt(b.year.match(/(\d{4})/)?.[1] || '0', 10)
    return ay - by
  })
})



// 攝影作品事件分組
const photographyEventItems = computed(() => {
  return mixedPhotoItems.value.filter(item =>
    item.images && item.images.some(img => img.category === 'photography')
  )
})

/**
 * i4：橫向膠卷光桌的 lightbox 來源 —— 攤平所有 event 群組成單一順序照片陣列，
 * 讓在光桌任一格開圖後，徑向導航能跨整卷前後翻（與 stacked timeline 同質）。
 */
const allPhotographyImages = computed<GalleryItem[]>(() =>
  photographyEventItems.value.flatMap(g => g.images || [])
)

/**
 * 進入 event path 時的扉頁來源 group。
 * `mixedPhotoItems` 已套 selectedEvent filter，所以選 event 時通常只剩一個 group；
 * 仍 explicit 用 eventName 比對以防其他 filter 介入。
 */
const currentEventGroup = computed(() => {
  if (!filterState.value.selectedEvent) return null
  return photographyEventItems.value.find(g => g.eventName === filterState.value.selectedEvent) ?? null
})

const eventTimelineRef = ref<HTMLDivElement | null>(null)
const photographySectionRef = ref<{ expandEvent: (name: string) => void } | null>(null)

/** 扉頁「展開全部」→ 平滑捲到 timeline；prefers-reduced-motion 改為瞬移 */
const scrollToEventTimeline = () => {
  if (!eventTimelineRef.value) return
  const prefersReducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  eventTimelineRef.value.scrollIntoView({
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
    block: 'start'
  })
}

// 地圖點擊 → 導覽到下方事件區塊
const eventRefs = ref<Record<string, HTMLElement | null>>({})
const focusedEventName = ref<string | null>(null)
let focusTimer: number | null = null

const setEventRef = (name: string | null, el: Element | ComponentPublicInstance | null) => {
  if (!name) return
  if (!el) {
    eventRefs.value[name] = null
    return
  }
  const target = ('$el' in el ? (el.$el as HTMLElement) : (el as HTMLElement))
  if (typeof window !== 'undefined') {
    if (typeof target.checkVisibility === 'function') {
      if (!target.checkVisibility()) return
    } else if (target.getClientRects().length === 0) {
      return
    }
  }
  eventRefs.value[name] = target
}

const handleFocusEvent = async (eventName: string) => {
  let target = eventRefs.value[eventName]

  // 若目標事件被篩選掉、不在 DOM 中，先切換到該事件再捲動
  if (!target && filterState.value.selectedEvent !== eventName) {
    setSelectedEvent(eventName)
    await nextTick()
    await nextTick() // 再等一幀，確保 ref 已設定
    target = eventRefs.value[eventName]
  }

  if (!target) return

  target.scrollIntoView({ behavior: 'smooth', block: 'start' })

  focusedEventName.value = eventName
  if (focusTimer !== null) {
    window.clearTimeout(focusTimer)
  }
  focusTimer = window.setTimeout(() => {
    focusedEventName.value = null
  }, 900)
}

const handleScroll = () => {
  if (mapSectionRef.value) {
    const mapBottom = mapSectionRef.value.getBoundingClientRect().bottom
    const threshold = 80
    showBackToMap.value = mapBottom < threshold
  } else {
    showBackToMap.value = false
  }

  // 控制區 sticky mini bar（hysteresis：避免臨界點閃爍）
  if (!controlsSectionRef.value || isGalleryLoading.value || galleryLoadFailed.value) {
    showControlMiniBar.value = false
    return
  }
  const controlsBottom = controlsSectionRef.value.getBoundingClientRect().bottom
  const collapseThreshold = 100
  const expandThreshold = 160
  if (!showControlMiniBar.value && controlsBottom < collapseThreshold) {
    showControlMiniBar.value = true
  } else if (showControlMiniBar.value && controlsBottom > expandThreshold) {
    showControlMiniBar.value = false
  }
}

/** 地圖區是否已貼在導覽列下方；區塊高於視窗時只檢查頂緣對齊（避免矮螢幕誤判） */
const isMapComfortablyVisible = () => {
  const el = mapSectionRef.value
  if (!el) return true
  const r = el.getBoundingClientRect()
  const vh = window.innerHeight
  const navReserve = 88
  if (r.top > navReserve + 56) return false
  if (r.top < 52) return false
  if (r.height >= vh - navReserve - 24) {
    return r.top >= navReserve - 16 && r.top <= navReserve + 48
  }
  if (r.bottom > vh - 10) return false
  return true
}

const scrollToMap = () => {
  // block: 'nearest' 避免使用者已在地圖下方瀏覽時被強拉回頂端；
  // 只有完全看不到地圖時瀏覽器才會自動對齊，符合「柔性引導」原則。
  mapSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

const scrollToControls = () => {
  if (!controlsSectionRef.value) return
  const prefersReducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  controlsSectionRef.value.scrollIntoView({
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
    block: 'start'
  })
}

// ===== 圖片檢視器方法 =====
const openImageViewer = (clickedImage: GalleryItem, images: GalleryItem[]) => {
  imageViewerStore.openImageViewer(clickedImage, images)
}

/**
 * j4：對開帳 — 點繪葉開繪世界全卷 lightbox、點影葉開影世界全卷 lightbox。
 * 徑向導航在該世界整卷內前後翻（與該世界 timeline / 光桌同質）。
 */
const openKaiSpread = (img: GalleryItem) => {
  imageViewerStore.openImageViewer(img, digitalWorks.value)
}
const openKageSpread = (img: GalleryItem) => {
  imageViewerStore.openImageViewer(img, allPhotographyImages.value)
}


// ===== 監聽器 =====
/**
 * 篩選某一事件時：
 * - 地圖 flyTo 由 EventMap 處理
 * - 僅當「首次選取事件」且「使用者目前看不到地圖」才 scrollToMap，
 *   避免在地圖下方繼續切換事件時每次都被捲回頂端
 */
const hasScrolledOnEventSelection = ref(false)
watch(
  () => filterState.value.selectedEvent,
  async (name, prev) => {
    if (currentCategory.value !== 'photography') return
    if (!name) {
      hasScrolledOnEventSelection.value = false
      return
    }
    await nextTick()
    await nextTick()

    if (focusTimer !== null) {
      window.clearTimeout(focusTimer)
      focusTimer = null
    }
    focusedEventName.value = name
    focusTimer = window.setTimeout(() => {
      focusedEventName.value = null
      focusTimer = null
    }, 1200)

    const isFirstSelection = prev === null || prev === undefined
    if (isFirstSelection && !isMapComfortablyVisible()) {
      scrollToMap()
      hasScrolledOnEventSelection.value = true
    }
  }
)

watch([digitalError, photographyError], ([digitalErr, photoErr]) => {
  if (digitalErr) {
    toast.error('載入數位作品失敗', '請檢查網路連線或稍後再試')
  }
  if (photoErr) {
    toast.error('載入攝影作品失敗', '請檢查網路連線或稍後再試')
  }
})

// ===== 生命週期 =====
onMounted(async () => {
  // 防禦性 fallback：useAsyncData 走完 hydrate 後若仍有任一邊為空（過去因 payload key
  // 不對齊導致 SSR 只灌數位的 bug 觸發過；現已修正），補抓一次保 UX 正常。
  try {
    if (!digitalError.value && !photographyError.value) {
      if (digitalWorks.value.length === 0 || photographyWorks.value.length === 0) {
        await loadAllWorks()
      }
    }
  } catch (error) {
    console.error('Failed to load works:', error)
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    armWorld()
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', handleScroll)
    cancelAnimationFrame(worldReadyRaf)
    if (worldCurtainTimer !== null) window.clearTimeout(worldCurtainTimer)
  }
})

// ===== SEO（SSR：useAsyncData 先灌入作品，才能依 ?image= / 路徑 event 段產生 OG／Twitter／JSON-LD）=====
// 2026-05-09：移除 'all' 類別後 seoTitles 收斂為雙主線
const seoTitles: Record<FilterState['selectedCategory'], string> = {
  digital: 'Works - 數位繪圖',
  photography: 'Works - 攝影作品',
}

const seoDefaultDescription = '數位藝術與攝影作品集，包含數位插畫與攝影紀錄。'

const defaultOgImageAbs = absoluteUrlFromSitePath(
  SEO_CONFIG.siteUrl,
  'images/photography/2024新北耶誕城/DSC_4319-NEF_DxO_DeepPRIMEXD-1.jpg'
)

const route = useRoute()
const requestUrl = useRequestURL()

const shareUrl = computed(() => {
  if (import.meta.client) return window.location.href
  return `${requestUrl.origin}${requestUrl.pathname}${requestUrl.search}`
})

/**
 * JSON-LD 專用的 canonical URL。
 *
 * `useRequestURL()` 在 `nuxt generate` 預渲染時 origin 會是 `http://localhost`，
 * 丟進 schema 會被 Google 當 staging URL。這裡改以 `SEO_CONFIG.siteUrl` 作
 * 基準 origin，但保留 pathname/query 讓 event / image 參數仍帶得進去。
 * （`og:url` 保留原 behavior，避免動到既有 share flow。）
 */
const schemaCanonicalUrl = computed(() => {
  if (import.meta.client) return window.location.href
  const canonicalOrigin = new URL(SEO_CONFIG.siteUrl).origin
  return `${canonicalOrigin}${requestUrl.pathname}${requestUrl.search}`
})

const absPathClean = (filename: string) => {
  const p = getImagePath(filename)
  return absoluteUrlFromSitePath(SEO_CONFIG.siteUrl, p.replace(/^\//, ''))
}

const absThumb800Clean = (filename: string) => {
  const p = getThumbPath(filename, 800)
  return absoluteUrlFromSitePath(SEO_CONFIG.siteUrl, p.replace(/^\//, ''))
}

// creator 欄位會貼進每張 `ImageObject` 作 schema，呼應首頁 `Person` schema（同 url）。
const gallerySchemaAuthor = {
  name: 'NCTU Young',
  alternateName: 'jimmyyoung1995',
  url: SEO_CONFIG.siteUrl
}

const gallerySeoResolved = computed(() =>
  resolveGalleryShareMeta({
    category: currentCategory.value,
    categoryTitle: seoTitles[currentCategory.value],
    imageId: parseGalleryImageIdFromRoute(route.query as Record<string, unknown>),
    eventName: parseGalleryEventFromParams(route.params as Record<string, unknown>),
    allWorks: allWorks.value,
    absPath: absPathClean,
    absThumb800: absThumb800Clean,
    defaultOgImageAbs,
    defaultTitle: seoTitles[currentCategory.value],
    defaultDescription: seoDefaultDescription,
    pageUrl: schemaCanonicalUrl.value,
    author: gallerySchemaAuthor
  })
)

useSeoMeta({
  title: computed(() => gallerySeoResolved.value.title),
  description: computed(() => gallerySeoResolved.value.description),
  ogTitle: computed(() => gallerySeoResolved.value.title),
  ogDescription: computed(() => gallerySeoResolved.value.description),
  ogType: 'website',
  ogUrl: shareUrl,
  ogImage: computed(() => gallerySeoResolved.value.ogImage),
  ogImageAlt: computed(() => gallerySeoResolved.value.ogImageAlt),
  twitterCard: 'summary_large_image',
  twitterImage: computed(() => gallerySeoResolved.value.ogImage)
})

useHead({
  script: computed(() => {
    const ld = gallerySeoResolved.value.jsonLd
    if (!ld) return []
    return [{ type: 'application/ld+json', innerHTML: JSON.stringify(ld) }]
  })
})
</script>

<style scoped>
/* ===== R40：Digital section 章封 header（與 photography Timeline 對位） ===== */
.digital-chapter-header {
  position: relative;
  padding: 1.6rem 0 1.2rem;
  margin-bottom: 1.4rem;
  border-bottom: 1px solid rgb(168 162 158 / 0.2);
}
.digital-chapter-header__index {
  font-size: 0.62rem;
  letter-spacing: 0.34em;
  color: rgb(217 123 46 / 0.85);
  text-transform: uppercase;
  /* R4：章碼改等寬 mono 製圖字（繪世界專屬 --world-mono），與影 serif 章碼分歧 */
  font-family: var(--world-mono, ui-monospace, monospace);
  font-variant-numeric: tabular-nums;
  margin-bottom: 0.5rem;
}
.digital-chapter-header__title {
  /* R2：繪章名改世界字族（Zen Kaku Gothic New，幾何 gothic），與影 Shippori 明體分家 */
  font-family: var(--world-display, 'Noto Serif JP', serif);
  font-size: 1.85rem;
  font-weight: var(--world-display-weight, 400);
  letter-spacing: var(--world-display-spacing, 0.18em);
  color: rgb(68 64 60);
  margin: 0;
  line-height: 1.3;
}
:global(.dark) .digital-chapter-header__title { color: rgb(231 229 228); }
.digital-chapter-header__strongest {
  margin: 0.6rem 0 0;
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  font-size: 1rem;
  letter-spacing: 0.06em;
  line-height: 1.7;
  color: rgb(120 113 108);
  font-weight: 300;
}
:global(.dark) .digital-chapter-header__strongest { color: rgb(168 162 158); }
.digital-chapter-header__meta {
  margin: 0.85rem 0 0;
  display: inline-flex;
  align-items: baseline;
  gap: 0.55rem;
  font-size: 0.62rem;
  letter-spacing: 0.3em;
  color: rgb(120 113 108);
  text-transform: uppercase;
  /* R4：meta 行（繪 · DIGITAL · N 葉）等寬 mono，製圖標註觸感。
     「繪」漢字首字由既有 .digital-chapter-header__meta > span:first-child 規則覆寫回 serif */
  font-family: var(--world-mono, ui-monospace, monospace);
  font-variant-numeric: tabular-nums;
}
.digital-chapter-header__meta > span:first-child {
  font-family: 'Noto Serif JP', serif;
  color: rgb(217 123 46);
  font-size: 0.92rem;
}
:global(.dark) .digital-chapter-header__meta > span:first-child { color: rgb(231 184 125); }
.digital-chapter-header::before {
  content: '';
  position: absolute;
  left: -1rem;
  top: 1.8rem;
  bottom: 1rem;
  width: 2px;
  border-radius: 1px;
  background: rgb(217 123 46 / 0.55);
}

/* R45：digital chapter axes 3 row — 與 photography 對等 */
.digital-chapter-axes-3row {
  margin: 1rem 0 0;
  padding-top: 0.85rem;
  border-top: 1px solid rgb(168 162 158 / 0.15);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* ===== R6：mobile/tablet 世界標牌（與 GalleryLeftRail masthead 同步換骨） ===== */
.gallery-masthead-m__eyebrow {
  margin: 0 0 0.6rem;
  font-size: 0.62rem;
  letter-spacing: 0.34em;
  text-transform: uppercase;
  color: var(--accent);
}
.gallery-masthead-m__eyebrow--mono {
  font-family: var(--world-mono, ui-monospace, monospace);
  letter-spacing: 0.2em;
}
.gallery-masthead-m__eyebrow--mono span { opacity: 0.6; }
.gallery-masthead-m__eyebrow--serif {
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  letter-spacing: 0.42em;
  text-transform: none;
}
.gallery-masthead-m__title {
  margin: 0;
  font-weight: 200;
  color: rgb(41 37 36);
  line-height: 1.1;
}
:global(.dark) .gallery-masthead-m__title { color: rgb(245 245 244); }
.gallery-masthead-m__title--mono {
  /* R2：繪標題改用世界字族（Zen Kaku Gothic New，幾何 gothic），
     與影的 Shippori 明體分家；mono 留給 meta/格號標註 */
  font-family: var(--world-display, var(--world-mono, ui-monospace, monospace));
  font-weight: var(--world-display-weight, 400);
  font-size: 2rem;
  letter-spacing: var(--world-display-spacing, 0.08em);
}
.gallery-masthead-m__title--serif {
  /* R2：影標題改用世界字族（Shippori Mincho，高對比文人明體） */
  font-family: var(--world-display, 'Noto Serif JP', 'Source Han Serif TC', serif);
  font-size: 2.3rem;
  letter-spacing: var(--world-display-spacing, 0.2em);
  font-weight: var(--world-display-weight, 500);
}
.gallery-masthead-m__note {
  margin: 0.8rem 0 0;
  padding-left: 0.75rem;
  border-left: 1px solid color-mix(in srgb, var(--accent) 45%, transparent);
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  font-size: 0.85rem;
  font-weight: 300;
  letter-spacing: 0.14em;
  line-height: 1.9;
  color: rgb(87 83 78);
}
:global(.dark) .gallery-masthead-m__note { color: rgb(190 184 178); }
.gallery-masthead-m__meta {
  margin: 0.7rem 0 0;
  font-size: 0.66rem;
  letter-spacing: 0.16em;
  color: rgb(120 113 108);
}
:global(.dark) .gallery-masthead-m__meta { color: rgb(168 162 158); }
.gallery-masthead-m__meta--mono {
  font-family: var(--world-mono, ui-monospace, monospace);
  font-variant-numeric: tabular-nums;
}
.gallery-masthead-m__meta--serif {
  font-family: 'Noto Serif JP', serif;
  letter-spacing: 0.2em;
}

/* ===== R8：mobile 影世界暗室負片膠捲面板（齒孔 + 反白） ===== */
.gallery-filmpanel-m {
  position: relative;
  padding: 1.25rem 1.5rem 1.35rem 1.75rem;
  background: linear-gradient(165deg, #20262c 0%, #14181c 100%);
  border-radius: 2px;
  box-shadow: inset 0 0 0 1px rgba(154, 173, 197, 0.12);
}
:global(.dark) .gallery-filmpanel-m {
  background: linear-gradient(165deg, #1a1f24 0%, #0e1114 100%);
}
/* 左緣縱向齒孔 */
.gallery-filmpanel-m__sprockets {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 5px;
  width: 8px;
  pointer-events: none;
  background-image: radial-gradient(
    circle at center,
    rgba(238, 241, 243, 0.85) 0 1.6px,
    transparent 1.9px
  );
  background-size: 8px 15px;
  background-repeat: repeat-y;
  opacity: 0.5;
}
/* 面板內反白覆寫 */
.gallery-filmpanel-m .gallery-masthead-m__title { color: #eef1f3 !important; }
.gallery-filmpanel-m .gallery-masthead-m__eyebrow--serif { color: #9aadc5 !important; }
.gallery-filmpanel-m .gallery-masthead-m__note {
  color: rgba(206, 214, 224, 0.85) !important;
  border-left-color: rgba(154, 173, 197, 0.55) !important;
}
.gallery-filmpanel-m .gallery-masthead-m__meta {
  color: rgba(190, 200, 212, 0.78) !important;
}

/* ===== j1：手機「翻面帶」（對向世界橫向入口；fixed 書口僅桌機，手機在此補位） ===== */
.facing-band {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  max-width: 32rem;
  margin: 0.5rem auto 0;
  padding: 1.1rem 1.4rem;
  text-decoration: none;
  transition: opacity 0.3s ease;
}
.facing-band__rule {
  flex: 1 1 auto;
  height: 1px;
  background: var(--hairline);
}
.facing-band__kana {
  flex: 0 0 auto;
  font-size: 2rem;
  font-weight: 200;
  line-height: 1;
}
.facing-band[data-world='kai'] .facing-band__kana { color: color-mix(in srgb, var(--accent) 60%, rgb(68 64 60)); }
.facing-band[data-world='kage'] .facing-band__kana { color: color-mix(in srgb, var(--accent) 55%, rgb(120 113 108)); }
:global(.dark) .facing-band[data-world='kage'] .facing-band__kana { color: color-mix(in srgb, var(--accent) 55%, rgb(214 211 209)); }
.facing-band__copy {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.18rem;
}
.facing-band__lead {
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  font-size: 0.82rem;
  letter-spacing: 0.16em;
  color: rgb(87 83 78);
}
:global(.dark) .facing-band__lead { color: rgb(214 211 209); }
.facing-band__sub {
  font-size: 0.6rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--accent);
  font-family: var(--world-mono, ui-monospace, monospace);
}

/* 僅保留頁面內過場與響應式 h1 調整；共用樣式（shadow-japanese、backdrop-blur-japanese、scrollbar 等）已遷入 assets/css/main.css */
.gallery-fade-enter-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.gallery-fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.gallery-fade-enter-from { opacity: 0; transform: translateY(12px); }
.gallery-fade-leave-to   { opacity: 0; transform: translateY(-8px); }

.mini-bar-fade-enter-active,
.mini-bar-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.mini-bar-fade-enter-from,
.mini-bar-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (prefers-reduced-motion: reduce) {
  .gallery-fade-enter-active,
  .gallery-fade-leave-active,
  .mini-bar-fade-enter-active,
  .mini-bar-fade-leave-active {
    transition: opacity 0.15s linear;
  }
  .gallery-fade-enter-from,
  .gallery-fade-leave-to,
  .mini-bar-fade-enter-from,
  .mini-bar-fade-leave-to {
    transform: none;
  }
}

@media (max-width: 768px) {
  h1:not(.gallery-masthead-m__title) {
    font-size: 2rem !important;
    line-height: 1.2;
  }
  /* R6：世界標牌在手機略收，但保留兩世界字級差（mono 緊 / serif 鬆） */
  .gallery-masthead-m__title--mono { font-size: 1.75rem; }
  .gallery-masthead-m__title--serif { font-size: 2rem; }
}

@media (max-width: 480px) {
  h1:not(.gallery-masthead-m__title) {
    font-size: 1.75rem !important;
  }
  .gallery-masthead-m__title--mono { font-size: 1.6rem; }
  .gallery-masthead-m__title--serif { font-size: 1.85rem; }
}
</style>
