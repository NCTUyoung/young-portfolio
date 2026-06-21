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
          j5：移除 GalleryWorldGate 3D 立體書台（互動卡頓根源——翻頁重排 ~700 物件 preserve-3d 子樹）。
          two-rooms-r1：跨世界對開帳（GalleryDiptychLedger）亦已移除——雙主線不再靠「同頁混兩世界」，
          而是各自成一間自洽房間（繪=左 rail+製図台 / 影=DarkroomBar+光桌）。
          世界互穿收斂為單一書口門檻 GalleryFacingEdge（桌機）／翻面帶（手機）。 -->

        <!-- 影世界專屬：頂部暗房光桌橫條（取代左 rail；僅 lg+）。
             two-rooms-r1：暗房橫條改為「影世界 desktop 的常駐房間標牌」——
             overview 與 event 皆顯示（取代被移除的對開帳作為房間門面），
             與繪世界左 rail 標牌對位，讓影室 desktop 也有自洽的 masthead → 光桌 → footer。 -->
        <!-- 影世界 desktop 控制列（取代舊「光卓 bar」——使用者：bar 不需要）。
             僅留輕量 hairline 工具列：繪/影 燈位切換 + 搜尋/年份；房間標題交給
             GalleryEditorialModules 自帶的扉頁 nameplate。 -->
        <div v-if="worldId === 'kage'" class="hidden lg:block container mx-auto px-4 sm:px-6 pt-8">
          <div class="max-w-7xl mx-auto" data-world="kage">
            <div class="kage-ctrl">
              <GalleryTabBar variant="rail" />
              <div class="kage-ctrl__filter">
                <GalleryFilterToolbar variant="rail" />
              </div>
            </div>
            <!--
              影世界 desktop 事件索引（修復「event 系統消失、只能往下滾」）：
              桌機 photography 過去只有 TabBar + 搜尋/年份，沒有任何 event 跳轉入口，
              GalleryLeftRail（唯一桌機 EventFilter 宿主）又被 v-if=kai 鎖在繪世界。
              這裡補回橫向 EventFilter（與手機同元件），讓影世界 overview 能直接跳各 event。
              wiki: inspirations/gallery-left-rail.md（rail 範圍本含 photography）+ chrome-budget（復原導航，非疊裝飾）。
            -->
            <div class="kage-event-index">
              <EventFilter single-row />
            </div>
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
        <!-- 繪 (kai)：mobile 房間標牌（two-rooms-r1：overview 與 event 皆顯示，作製図室門面） -->
        <div v-if="worldId === 'kai'" :key="`mh-kai`" class="gallery-masthead-m gallery-masthead-m--kai world-enter world-enter-d1 mb-6">
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
        <div v-else-if="worldId === 'kage'" :key="`mh-kage`" class="gallery-filmpanel-m world-enter world-enter-d1 mb-6">
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

        <!--
          two-rooms-r2：mobile 控制列也按房間語彙分家——繪冠製図抽屜頂緣（細直角把手 + DR 編號），
          影冠負片齒孔頂緣，呼應桌機兩房的篩選骨架，避免手機兩房又回到同款鷹架。
        -->
        <div
          id="gallery-filter-controls"
          class="gallery-mctrl"
          :class="worldId === 'kai' ? 'gallery-mctrl--kai' : 'gallery-mctrl--kage'"
        >
          <p class="gallery-mctrl__pull" aria-hidden="true">
            <span class="gallery-mctrl__pull-no">{{ worldId === 'kai' ? 'DR·INDEX' : 'FRAME·SEL' }}</span>
            <span class="gallery-mctrl__pull-name font-jp">{{ worldId === 'kai' ? '製図索引' : '齣選び' }}</span>
          </p>
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
      <!--
        two-rooms-r2（act-critic / 暗室を sumi に統一）：影世界踏跡地圖過去是一塊 cream/light
        leaflet 區塊，把暗室沉浸打斷三次中的第一次。改為把整段包進【安全光暗房框 safelight】：
        近黑 sumi 底盤 + 紅安全燈暈，地圖 tile 以 CSS filter 反相＋紅化（像在暗房紅光下看一張
        定位負片），section header 反白為冷銀 serif。地圖功能（leaflet）不動，僅視覺收進暗室。
      -->
      <!--
        其の一「踏跡」地圖：原本擠在 overview 頂部（控制列＋chips 之後就是大地圖），
        把照片擠到首屏之下。改為下放到「第一塊 event 模組之後」當中段章節插曲
        （透過 GalleryEditorialModules 的 #after-first slot），讓照片先迎人。
        wiki: inspirations/gallery-control-density-reduction.md（把余白還給內容）。
        定義移到下方 <GalleryEditorialModules> 的 template #after-first。
      -->

      <!--
        two-rooms-r1（act-critic / 雙主線＝兩間獨立沉浸室）：移除 overview 入口的
        【對開帳 GalleryDiptychLedger】—— 它是「既A又B」把 繪×影 對頁並置的跨世界裝置，
        在兩世界 overview 同時渲染，正是 critic 與使用者指出的「很雜亂」根源。
        雙主線敘事不再靠「在同一頁混兩世界」表達，而是各自成為一間自洽的房間：
          繪(kai)  = 製図室：左 rail 標牌 → AtelierTimeline 製図台 → footer
          影(kage) = 暗室：頂部 DarkroomBar 標牌 → LightTable 光桌 → footer
        世界互穿收斂為單一門檻（書口 GalleryFacingEdge / 手機翻面帶），點擊才跨。
      -->

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
          <!-- overview：編輯模組網格（特稿大圖 + 編號日期格 + banner，每 event 一塊）。
               取代舊橫向小圖膠卷光桌（使用者：圖太小、排版過時）。
               wiki: patterns/newspaper-masthead-module-grid.md -->
          <!-- overview：章節索引（主欄）+ 踏跡地圖（桌機 sticky 側欄 aside；平板/手機落下方作 colophon）。
               地圖不再夾在事件之間打斷閱讀。wiki: 地圖放旁邊。 -->
          <div v-if="!filterState.selectedEvent" class="kage-overview world-enter world-enter-d2">
            <div class="kage-overview__main">
              <GalleryEditorialModules :items="photographyEventItems" />
            </div>
            <aside
              v-if="!galleryLoadFailed && eventLocations && eventLocations.length && currentCategory === 'photography'"
              class="kage-overview__aside"
            >
              <section
                ref="mapSectionRef"
                class="kage-safelight scroll-mt-24"
                aria-labelledby="photo-map-heading"
              >
                <span class="kage-safelight__lamp" aria-hidden="true"/>
                <header class="kage-safelight__head">
                  <p class="kage-safelight__eyebrow">其の一 · Footsteps</p>
                  <h2
                    id="photo-map-heading"
                    class="kage-safelight__title font-jp"
                  >踏跡 <span class="kage-safelight__roman">Visited Places</span></h2>
                  <!--
                    「停留放大」提示在 header 余白（框外），不壓 tile 遮 marker；
                    地圖 hover 展開後由 @expand-change 收起。wiki: inspirations/non-occluding-hint.md 方案 A。
                  -->
                  <span
                    v-if="!mapExpanded"
                    class="kage-safelight__hint"
                    aria-hidden="true"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" class="kage-safelight__hint-icon">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M7 13L3 17m0 0h3.5M3 17v-3.5M13 7l4-4m0 0h-3.5M17 3v3.5" />
                    </svg>
                    <span>停留放大</span>
                  </span>
                </header>
                <div class="kage-safelight__plate">
                  <EventMap
                    v-if="mapShouldMount"
                    :events="eventLocations"
                    :selected-event-name="filterState.selectedEvent"
                    variant="compact"
                    :show-expand-hint="false"
                    @focus-event="handleFocusEvent"
                    @expand-change="mapExpanded = $event"
                  />
                  <!-- 掛載前佔位：預留近似高度避免地圖一進來時捲動跳動 -->
                  <div v-else class="kage-safelight__plate-skeleton" aria-hidden="true"/>
                </div>
              </section>
            </aside>
          </div>

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
      two-rooms-r1：移除「世界幕」轉場 overlay（world-curtain）。
      它在每次切 track 都閃一次滿版幕，與書口門檻 + 對開帳同時釋放「對向世界」信號，
      正是本輪要消的多重跨世界噪音之一。世界互穿收斂為單一門檻（書口 GalleryFacingEdge），
      點擊翻面即由路由切換完成，不再額外加一層幕。
    -->

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
import GalleryEditorialModules from '~/components/gallery/GalleryEditorialModules.vue'
import GalleryFacingEdge from '~/components/gallery/GalleryFacingEdge.vue'
import GalleryDigitalIntro from '~/components/gallery/GalleryDigitalIntro.vue'
import GalleryControlMiniBar from '~/components/gallery/GalleryControlMiniBar.vue'
import GalleryLeftRail from '~/components/gallery/GalleryLeftRail.vue'
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
/**
 * 延後掛載 Leaflet 地圖（修「首次點圖庫非常卡」）：地圖在影世界 overview 預設落地即渲染，
 * 但 leaflet 動態 import + 一格瓦片網路請求 + flyToBounds + tile CSS filter 全擠在首屏。
 * 改為首屏繪製完成後（requestIdleCallback，無則 setTimeout 退回）才掛地圖，讓影像格牆先出來。
 */
const mapShouldMount = ref(false)

/**
 * 踏跡地圖 compact hover 展開狀態（由 EventMap @expand-change 同步）。
 * 用來在 header 余白的「停留放大」提示——展開後收起，未展開時顯示。
 * 提示移出地圖框（非遮擋式）：wiki inspirations/non-occluding-hint.md 方案 A。
 */
const mapExpanded = ref(false)

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
 * 切換 track 時重新觸發世界進場（質地淡入 + .world-enter 重播）。
 * two-rooms-r1：移除「世界幕」overlay 後，跨世界只靠書口門檻 + 進場呼吸，不再額外掛幕。
 */
watch(worldId, () => {
  armWorld()
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
    // 首屏繪製完成後再掛 Leaflet 地圖，避免瓦片/flyTo 卡住第一屏
    const mountMap = () => { mapShouldMount.value = true }
    const ric = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback
    if (typeof ric === 'function') ric(mountMap, { timeout: 1500 })
    else window.setTimeout(mountMap, 600)
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', handleScroll)
    cancelAnimationFrame(worldReadyRaf)
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

/* ===== 影世界 desktop 控制列（取代光卓 bar；輕量 hairline，非銀盒） ===== */
.kage-ctrl {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem 2rem;
  padding-bottom: 0.85rem;
  border-bottom: 1px solid var(--border);
  /* 影世界冷 slate accent（rail variant 沿用 token） */
  --accent: #52647a;
  --accent-ink: #3f4f63;
  --accent-soft: #9aadc5;
}
:global(.dark) .kage-ctrl {
  --accent: #9aadc5;
  --accent-ink: #b6c6da;
  --accent-soft: #52647a;
}
.kage-ctrl__filter { flex: 0 1 auto; min-width: 0; }

/* 影世界 desktop 事件索引：與控制列拉開一段余白；EventFilter 自帶底 hairline，不再加框 */
.kage-event-index { margin-top: 1.6rem; }

/* ===== R8：mobile 影世界暗室負片膠捲面板（齒孔 + 反白） ===== */
.gallery-filmpanel-m {
  position: relative;
  padding: 1.25rem 1.5rem 1.35rem 1.75rem;
  /* freshen 光卓：冷銀亮燈箱底（light） */
  background: linear-gradient(165deg, #eef2f5 0%, #e1e8ed 100%);
  border-radius: 2px;
  box-shadow: inset 0 0 0 1px rgba(82, 100, 122, 0.16);
}
:global(.dark) .gallery-filmpanel-m {
  background: linear-gradient(165deg, #1a1f24 0%, #0e1114 100%);
  box-shadow: inset 0 0 0 1px rgba(154, 173, 197, 0.12);
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
    rgba(82, 100, 122, 0.55) 0 1.6px,
    transparent 1.9px
  );
  background-size: 8px 15px;
  background-repeat: repeat-y;
  opacity: 0.5;
}
:global(.dark) .gallery-filmpanel-m__sprockets {
  background-image: radial-gradient(circle at center, rgba(238, 241, 243, 0.85) 0 1.6px, transparent 1.9px);
}
/* 面板內文字：light 深 slate 墨，dark 反白 */
.gallery-filmpanel-m .gallery-masthead-m__title { color: #2b3640 !important; }
.gallery-filmpanel-m .gallery-masthead-m__eyebrow--serif { color: #5b6b7e !important; }
.gallery-filmpanel-m .gallery-masthead-m__note {
  color: #56697e !important;
  border-left-color: rgba(82, 100, 122, 0.5) !important;
}
.gallery-filmpanel-m .gallery-masthead-m__meta {
  color: #66788c !important;
}
:global(.dark) .gallery-filmpanel-m .gallery-masthead-m__title { color: #eef1f3 !important; }
:global(.dark) .gallery-filmpanel-m .gallery-masthead-m__eyebrow--serif { color: #9aadc5 !important; }
:global(.dark) .gallery-filmpanel-m .gallery-masthead-m__note {
  color: rgba(206, 214, 224, 0.85) !important;
  border-left-color: rgba(154, 173, 197, 0.55) !important;
}
:global(.dark) .gallery-filmpanel-m .gallery-masthead-m__meta {
  color: rgba(190, 200, 212, 0.78) !important;
}

/* =========================================================
   two-rooms-r2：影世界踏跡地圖「安全光暗房框」safelight
   把過去打斷暗室的 cream leaflet 區塊收進 sumi 底盤 + 紅安全燈，
   tile 反相＋紅化 → 像暗房紅光下定位的一張負片地圖。
   ========================================================= */
.kage-safelight {
  position: relative;
  padding: 1.5rem clamp(1rem, 3vw, 2rem) 1.7rem;
  /* freshen 光卓：冷銀亮燈箱底取代 sumi 暗底（light） */
  background: linear-gradient(168deg, #eef2f5 0%, #e1e8ed 100%);
  border-radius: 2px;
  box-shadow: inset 0 0 0 1px rgba(82, 100, 122, 0.14);
  overflow: hidden;
}
:global(.dark) .kage-safelight {
  background: linear-gradient(168deg, #15191e 0%, #0c0f12 100%);
  box-shadow: inset 0 0 0 1px rgba(154, 173, 197, 0.1);
}
/* 燈箱冷光暈：light 模式改右上冷藍光散開（取代暗房紅安全燈）；dark 保留紅燈 */
.kage-safelight__lamp {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(38% 50% at 92% 0%, rgba(120, 150, 184, 0.18) 0%, transparent 70%),
    radial-gradient(60% 70% at 50% 120%, rgba(140, 165, 190, 0.1) 0%, transparent 60%);
}
:global(.dark) .kage-safelight__lamp {
  background:
    radial-gradient(38% 50% at 92% 0%, rgba(176, 58, 46, 0.22) 0%, transparent 70%),
    radial-gradient(60% 70% at 50% 120%, rgba(120, 40, 34, 0.1) 0%, transparent 60%);
}
.kage-safelight__head {
  position: relative;
  margin-bottom: 1.1rem;
}
.kage-safelight__eyebrow {
  margin: 0 0 0.55rem;
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  font-size: 0.6rem;
  letter-spacing: 0.42em;
  color: #5b6b7e;
}
:global(.dark) .kage-safelight__eyebrow { color: #c98b80; }
.kage-safelight__title {
  margin: 0;
  font-family: var(--world-display, 'Shippori Mincho', 'Noto Serif JP', serif);
  font-size: 1.75rem;
  font-weight: var(--world-display-weight, 500);
  letter-spacing: 0.28em;
  line-height: 1.2;
  color: #2b3640;
}
:global(.dark) .kage-safelight__title { color: #eef1f3; }
.kage-safelight__roman {
  margin-left: 0.6rem;
  font-family: var(--world-mono, ui-monospace, monospace);
  font-size: 0.62rem;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: rgba(91, 107, 126, 0.85);
  vertical-align: middle;
}
:global(.dark) .kage-safelight__roman { color: rgba(201, 139, 128, 0.85); }
/* 「停留放大」提示：移到 header 右下余白（地圖框外），不再壓 tile 遮 marker。
   icon + 文字，低對比、輕量；地圖展開後 v-if 收起。非遮擋式提示方案 A。 */
.kage-safelight__hint {
  position: absolute;
  right: 0;
  bottom: 0.15rem;
  display: inline-flex;
  align-items: center;
  gap: 0.32rem;
  font-family: 'Noto Sans JP', system-ui, -apple-system, sans-serif;
  font-size: 0.58rem;
  letter-spacing: 0.22em;
  color: rgba(91, 107, 126, 0.7);
  pointer-events: none;
  user-select: none;
}
:global(.dark) .kage-safelight__hint { color: rgba(201, 139, 128, 0.6); }
.kage-safelight__hint-icon {
  width: 0.7rem;
  height: 0.7rem;
  color: rgba(91, 107, 126, 0.85);
}
:global(.dark) .kage-safelight__hint-icon { color: rgba(201, 139, 128, 0.8); }
/* 窄寬：title 與 hint 同行易擠，hint 退到不顯（地圖在手機本就堆疊、hover 不成立） */
@media (max-width: 420px) {
  .kage-safelight__hint { display: none; }
}
/* tile 反相＋紅化：地圖在暗房紅光下讀作一張定位負片，不再打斷 sumi 沉浸。
   leaflet 互動（hover card / marker）由內層元件控制，filter 僅作用於 tile pane。 */
/* 地圖延後掛載前的佔位骨架：高度貼齊 compact 地圖（160px），避免地圖進場時版面跳動 */
.kage-safelight__plate-skeleton {
  height: 160px;
  background: linear-gradient(180deg, rgba(82, 100, 122, 0.05), rgba(82, 100, 122, 0.02));
}
:global(.dark) .kage-safelight__plate-skeleton {
  background: linear-gradient(180deg, rgba(13, 16, 20, 0.6), rgba(13, 16, 20, 0.35));
}
.kage-safelight__plate {
  position: relative;
  border: 1px solid rgba(82, 100, 122, 0.22);
  border-radius: 2px;
  overflow: hidden;
}
:global(.dark) .kage-safelight__plate { border-color: rgba(176, 58, 46, 0.22); }
/* light 光卓：地圖正常顯示（燈箱上的一張定位圖）；dark 暗房保留反相紅化負片 */
.kage-safelight__plate :deep(.event-map-container) {
  background: #e7edf1;
}
:global(.dark) .kage-safelight__plate :deep(.leaflet-tile-pane) {
  filter: invert(0.92) hue-rotate(150deg) saturate(0.7) brightness(0.82) sepia(0.35);
}
:global(.dark) .kage-safelight__plate :deep(.event-map-container) {
  background: #0d1014;
}
/* 邊緣漸層遮罩：dark 改暗，不再是 cream（light 維持預設 stone-50） */
:global(.dark) .kage-safelight__plate :deep([class*='from-stone-50']) {
  --tw-gradient-from: rgba(13, 16, 20, 0.85) !important;
}
@media (prefers-reduced-motion: reduce) {
  .kage-safelight__lamp { animation: none; }
}

/* =========================================================
   overview 2 欄：主欄章節索引 + 側欄踏跡地圖
   桌機：地圖為 sticky 右側欄（「放旁邊」，不夾在事件之間打斷閱讀）。
   平板/手機：塌為單欄，地圖落到索引下方拉開余白作收尾 colophon。
   ========================================================= */
.kage-overview { display: block; }
@media (min-width: 1024px) {
  .kage-overview {
    display: grid;
    grid-template-columns: minmax(0, 1fr) clamp(280px, 24vw, 340px);
    gap: clamp(2rem, 4vw, 4rem);
    align-items: start;
  }
  .kage-overview__aside {
    position: sticky;
    top: 5.5rem;
  }
}
@media (max-width: 1023px) {
  .kage-overview__aside { margin-top: 3rem; }
}

/* =========================================================
   two-rooms-r2：mobile 控制列房間語彙頂緣（繪抽屜把手 / 影齒孔）
   ========================================================= */
.gallery-mctrl {
  position: relative;
  padding-top: 1.1rem;
}
.gallery-mctrl__pull {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin: 0 0 0.9rem;
}
.gallery-mctrl__pull-no {
  font-family: var(--world-mono, ui-monospace, monospace);
  font-size: 0.54rem;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: var(--accent);
}
.gallery-mctrl__pull-name {
  font-size: 0.74rem;
  letter-spacing: 0.3em;
  color: rgb(120 113 108);
}
:global(.dark) .gallery-mctrl__pull-name { color: rgb(168 162 158); }
/* 繪：製図抽屜頂緣——細直角把手短橫 + 極淺凹陷感 */
.gallery-mctrl--kai::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 2.2rem;
  height: 2px;
  background: color-mix(in srgb, var(--accent) 65%, transparent);
}
/* 影：負片齒孔頂緣——亮孔跑滿頂邊 */
.gallery-mctrl--kage::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 6px;
  background-image: radial-gradient(
    circle at center,
    color-mix(in srgb, var(--accent) 70%, transparent) 0 1.3px,
    transparent 1.6px
  );
  background-size: 11px 6px;
  background-repeat: repeat-x;
  opacity: 0.6;
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
  /* freshen-final+1：facing 對側世界提示字降為極淡 stone ghost——回應 critic「digital 頁尾
     暖橘『影』kana 與 motif≤2 自打架」。band 本身（書口導向對側房）保留，但巨幅暖色 motif
     收成中性幽靈字，不再當第三個強 motif 與 hero/軌頭爭聲。 */
  opacity: 0.4;
}
.facing-band[data-world='kai'] .facing-band__kana { color: color-mix(in srgb, var(--accent) 20%, rgb(120 113 108)); }
.facing-band[data-world='kage'] .facing-band__kana { color: color-mix(in srgb, var(--accent) 20%, rgb(120 113 108)); }
:global(.dark) .facing-band[data-world='kage'] .facing-band__kana { color: color-mix(in srgb, var(--accent) 20%, rgb(168 162 158)); }
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
