<template>
  <div ref="pageRef">
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
        <!-- Mobile / Tablet：單張主攝影 -->
        <img
          v-if="heroCollage.main"
          :src="heroCollage.main"
          alt=""
          class="lg:hidden absolute inset-0 w-full h-full object-cover dark:brightness-[0.82]"
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
          Photo
        </div>

        <!--
          Desktop：3 張縦拼貼
          - py-6 → py-8：替最大 translate-y 預留呼吸，避免最後一張底邊被裁
          - translate-y-8 → translate-y-5：縮小最右張下移幅度（依 brief priority 3）
          - flex-[1.3] → flex-[1.25]：中心圖略收，讓兩側更平衡
        -->
        <div class="hidden lg:flex absolute inset-0 items-stretch gap-3 px-4 pt-6 pb-10">
          <!-- 左：電繪代表（上偏） -->
          <figure class="relative flex-1 -translate-y-1 overflow-hidden bg-stone-100 dark:bg-stone-800">
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
          <figure class="relative flex-[1.25] translate-y-2 overflow-hidden bg-stone-100 dark:bg-stone-800">
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
          <figure class="relative flex-1 translate-y-5 overflow-hidden bg-stone-100 dark:bg-stone-800">
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
          <!-- 主標：余白 + 副題 -->
          <h1 class="reveal">
            <span class="block font-jp font-extralight text-6xl sm:text-7xl lg:text-[7.5rem] tracking-[0.14em] text-stone-900 dark:text-stone-50 leading-[1]">
              余<span class="inline-block mx-4"/>白
            </span>
            <span class="mt-6 flex items-baseline gap-4">
              <span class="h-px w-12 bg-stone-400/70 dark:bg-stone-500" aria-hidden="true"/>
              <span class="text-sm sm:text-base tracking-[0.32em] uppercase text-stone-600 dark:text-stone-300 font-light">
                Digital Art &amp; Photography
              </span>
            </span>
          </h1>

          <!-- 入口：低調文字 + 箭頭 -->
          <div class="reveal reveal-delay-1 mt-10 lg:mt-14 flex flex-wrap items-center gap-x-8 gap-y-4">
            <NuxtLink
              to="/gallery"
              class="group inline-flex items-center gap-3 text-stone-800 dark:text-stone-100 border-b border-stone-400/70 dark:border-stone-500/70 pb-2 pr-2 hover:border-accent-500 dark:hover:border-accent-400 transition-colors duration-500"
            >
              <span class="font-jp tracking-[0.25em] text-lg">作品を見る</span>
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
         自己紹介 — 左肖像、右文字；書頁式版心
         ===================================================================== -->
    <section class="relative py-24 lg:py-36">
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
            <span class="jp-seal absolute -bottom-3 -right-3 shadow-sm">楊</span>
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

    <!-- =====================================================================
         對聯 — 繪 / 影（左右雙聯）
         ===================================================================== -->
    <section class="relative py-24 lg:py-32 bg-stone-100/40 dark:bg-stone-800/25">
      <div class="jp-hairline absolute top-0 left-0 right-0"/>
      <div class="max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">
        <header class="reveal mb-16 text-center">
          <h2 class="jp-section-title text-4xl sm:text-5xl">領域
            <span class="jp-section-ruby">Domains</span>
          </h2>
        </header>

        <!-- 雙聯排版 — 中央一道墨線 -->
        <div class="relative grid grid-cols-1 md:grid-cols-2 gap-0">
          <!-- 中央分隔線 -->
          <div class="hidden md:block absolute top-6 bottom-6 left-1/2 -translate-x-1/2 jp-hairline-v"/>

          <!-- 左聯：繪 -->
          <article class="reveal px-4 md:px-10 py-6 md:py-4 text-center md:text-right">
            <div class="flex md:justify-end items-start gap-5 mb-6">
              <div class="flex-1 md:max-w-[18rem] md:order-1">
                <p class="jp-eyebrow justify-center md:justify-end text-stone-500">
                  <span>Digital</span>
                </p>
                <h3 class="font-jp text-3xl sm:text-4xl font-extralight tracking-[0.3em] text-stone-800 dark:text-stone-100 mt-3">數位電繪</h3>
              </div>
              <div class="hidden md:block md:order-2">
                <span class="jp-vertical-kanji text-[5rem]">繪</span>
              </div>
            </div>
            <p class="jp-body text-[0.92rem] text-stone-600 dark:text-stone-400 max-w-sm md:ml-auto">
              二〇一八年起累積電繪作品——自幾何化的動物插畫、人物，至場景與概念藝術，嘗試不同風格與筆觸。
            </p>
            <ul class="mt-6 text-xs tracking-[0.35em] text-stone-500 dark:text-stone-400 font-jp leading-loose">
              <li v-for="tag in digitalTags" :key="tag">{{ tag }}</li>
            </ul>
          </article>

          <!-- 右聯：影 -->
          <article class="reveal reveal-delay-1 px-4 md:px-10 py-6 md:py-4 text-center md:text-left">
            <div class="flex md:justify-start items-start gap-5 mb-6">
              <div class="hidden md:block">
                <span class="jp-vertical-kanji text-[5rem]">影</span>
              </div>
              <div class="flex-1 md:max-w-[18rem]">
                <p class="jp-eyebrow justify-center md:justify-start text-stone-500">
                  <span>Photography</span>
                </p>
                <h3 class="font-jp text-3xl sm:text-4xl font-extralight tracking-[0.3em] text-stone-800 dark:text-stone-100 mt-3">攝影紀錄</h3>
              </div>
            </div>
            <p class="jp-body text-[0.92rem] text-stone-600 dark:text-stone-400 max-w-sm">
              以 Nikon Z f 為主，記錄街景、活動與夜景；偏愛淺景深與自然光，讓畫面保留現場氛圍。
            </p>
            <ul class="mt-6 text-xs tracking-[0.35em] text-stone-500 dark:text-stone-400 font-jp leading-loose">
              <li v-for="tag in photoTags" :key="tag">{{ tag }}</li>
            </ul>
          </article>
        </div>
      </div>
      <div class="jp-hairline absolute bottom-0 left-0 right-0"/>
    </section>

    <!-- =====================================================================
         道具 — 不等寬 + 左側縦向 spine（2026-04-20 v2）
         來源：wiki/concepts/japanese-editorial-cover.md 案例 B（amble #1 Tokyo）
               左側極粗直排「Tokyo」地名軸 + 右側目錄欄位
         改動：原 md:grid-cols-3 + md:divide-x（三等分對稱，像規格表）
               → 打斷為左 spine + 三不等寬欄，移除 divide-x 留白氣
         鐵律守門：spine 用 extralight 克制，非 Extra Bold；三欄依內容長度分配；
                   §1 不均整加分；§7 Hairline > 粗線（僅保留一道豎 hairline 嵌在 spine 右側）
         ===================================================================== -->
    <section class="relative py-24 lg:py-32">
      <div class="max-w-5xl mx-auto px-6 sm:px-10 lg:px-16">
        <header class="reveal mb-14 flex items-baseline justify-between flex-wrap gap-4">
          <h2 class="jp-section-title text-3xl sm:text-4xl">道具
            <span class="jp-section-ruby">Tools</span>
          </h2>
          <span class="text-[0.7rem] tracking-[0.4em] text-stone-400 dark:text-stone-500 uppercase hidden md:inline-block">Instruments &middot; 三種の神器</span>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-[auto_1fr_1.1fr_1fr] gap-0 md:gap-x-8 lg:gap-x-12">
          <!-- 左側縦向 spine：借 amble 左軸字機制
               2026-04-20 修正：原 spine 寫「道具」與 h2 主標重複（double-signaling）
               改為「筆鏡技」三字合璧——對應右側三欄 kanji（筆/鏡/技），
               spine 作為「三字隆重直排」的 editorial 副線，非 h2 複寫
               注意：writing-mode: vertical-rl + flex flex-col 會讓 children 變右→左排
                     這裡用單 span + block spacer，與 hero「繪と影」同構，保證上→下 -->
          <aside class="hidden md:flex flex-col items-center justify-start pr-6 relative">
            <span
              class="writing-vertical font-jp text-xl lg:text-2xl font-extralight tracking-[0.9em] text-stone-700 dark:text-stone-200 leading-none select-none"
              aria-hidden="true"
            >
              筆鏡技
            </span>
            <div class="jp-hairline-v h-16 mt-6" aria-hidden="true" />
            <span
              class="writing-vertical mt-4 text-[0.6rem] tracking-[0.45em] uppercase text-stone-400 dark:text-stone-500"
              aria-hidden="true"
            >
              Instruments
            </span>
          </aside>

          <article
            v-for="(tool, index) in tools"
            :key="tool.category"
            class="reveal px-4 md:px-0 py-10 md:py-2 flex flex-col text-center md:text-left border-t md:border-t-0 first:border-t-0 border-stone-200/70 dark:border-stone-700/50"
            :class="[`reveal-delay-${index + 1}`]"
          >
            <span class="writing-vertical font-jp text-2xl font-extralight tracking-[0.4em] text-stone-700 dark:text-stone-200 mb-6 md:hidden">
              {{ tool.kanji }}
            </span>
            <p class="text-[0.65rem] tracking-[0.45em] uppercase text-stone-500 dark:text-stone-400 mb-3">
              <span class="md:inline-flex md:items-baseline md:gap-2">
                <span class="hidden md:inline font-jp text-base tracking-[0.3em] text-stone-700 dark:text-stone-200 font-extralight not-italic">{{ tool.kanji }}</span>
                <span class="hidden md:inline w-px h-3 bg-stone-300/70 dark:bg-stone-600/70"></span>
                <span>{{ tool.category }}</span>
              </span>
            </p>
            <ul class="space-y-2.5">
              <li
                v-for="item in tool.items"
                :key="item"
                class="text-sm text-stone-600 dark:text-stone-300 font-light tracking-wide"
              >
                {{ item }}
              </li>
            </ul>
          </article>
        </div>
      </div>
    </section>

    <!-- =====================================================================
         侘寂 — 引言（直書、極簡）
         ===================================================================== -->
    <section class="reveal relative py-28 lg:py-40 overflow-hidden bg-stone-50/50 dark:bg-stone-900/40">
      <div class="jp-hairline absolute top-0 left-0 right-0"/>

      <!-- 背景大字 -->
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span class="font-jp text-[clamp(12rem,32vw,26rem)] font-extralight text-stone-200/50 dark:text-stone-800/40 leading-none tracking-wider">侘</span>
      </div>

      <div class="relative max-w-3xl mx-auto px-6 flex items-center justify-center gap-12">
        <!-- 直書引言（桌面） -->
        <blockquote class="hidden md:flex writing-vertical font-jp text-3xl lg:text-[2.25rem] font-extralight tracking-[0.4em] text-stone-800 dark:text-stone-100 leading-[2.2]">
          不完美之中<span class="mx-4"/>藏著最真實的美
        </blockquote>

        <!-- 橫書引言（行動版） -->
        <blockquote class="md:hidden font-jp text-2xl font-extralight tracking-[0.3em] text-stone-800 dark:text-stone-100 leading-[2] text-center">
          「不完美之中，<br>藏著最真實的美。」
        </blockquote>

        <!-- 署名（直書） -->
        <div class="hidden md:flex flex-col items-center gap-3 text-stone-400 dark:text-stone-500">
          <div class="w-px h-8 bg-stone-400/60 dark:bg-stone-500/60"/>
          <span class="writing-vertical font-jp text-[0.7rem] tracking-[0.6em]">侘寂の道</span>
          <div class="w-px h-8 bg-stone-400/60 dark:bg-stone-500/60"/>
        </div>
      </div>

      <p class="md:hidden mt-8 text-center text-[0.7rem] tracking-[0.4em] text-stone-400 dark:text-stone-500">— 侘寂の道</p>

      <div class="jp-hairline absolute bottom-0 left-0 right-0"/>
    </section>

    <!-- =====================================================================
         步履 — Journey（zig-zag 非對稱時間軸）
         ===================================================================== -->
    <section class="relative py-24 lg:py-32">
      <div class="max-w-5xl mx-auto px-6 sm:px-10 lg:px-16">
        <header class="reveal mb-16 flex items-baseline justify-between flex-wrap gap-4">
          <h2 class="jp-section-title text-3xl sm:text-4xl">步履
            <span class="jp-section-ruby">Journey</span>
          </h2>
          <span class="text-[0.7rem] tracking-[0.4em] text-stone-400 dark:text-stone-500 uppercase">二〇一八 — 二〇二六</span>
        </header>

        <div class="relative">
          <!-- 中線（桌面） -->
          <div class="hidden md:block absolute top-0 bottom-0 left-1/2 -translate-x-px jp-hairline-v"/>
          <!-- 手機左線 -->
          <div class="md:hidden absolute top-0 bottom-0 left-3 jp-hairline-v"/>

          <ol class="space-y-12 md:space-y-20">
            <li
              v-for="(m, index) in milestonesWithPlace"
              :key="index"
              class="reveal relative md:grid md:grid-cols-2 md:gap-12"
              :class="[`reveal-delay-${Math.min(index + 1, 5)}`]"
            >
              <!-- 節點 -->
              <span
                class="absolute md:left-1/2 md:-translate-x-1/2 left-3 -translate-x-1/2 top-2 w-2.5 h-2.5 rotate-45 bg-accent-500/80 ring-4 ring-stone-50 dark:ring-stone-900"
                aria-hidden="true"
              />

              <!-- 行動版：單欄 -->
              <div class="md:hidden pl-10">
                <p class="jp-kansuji text-sm text-accent-600 dark:text-accent-400 tracking-wider mb-1">
                  {{ m.kansuji }} / {{ m.year }}
                  <span v-if="m.place" class="mx-2 text-stone-400">·</span>
                  <span v-if="m.place" class="text-stone-500 dark:text-stone-400 font-jp tracking-[0.2em]">{{ m.place }}</span>
                </p>
                <h3 class="font-jp text-lg font-light tracking-[0.2em] text-stone-800 dark:text-stone-100">{{ m.title }}</h3>
                <p class="jp-body text-sm mt-2">{{ m.description }}</p>
              </div>

              <!-- 桌面：zig-zag -->
              <div
                class="hidden md:block"
                :class="index % 2 === 0 ? 'md:text-right md:pr-12' : 'md:col-start-2 md:pl-12'"
              >
                <p class="jp-kansuji text-sm text-accent-600 dark:text-accent-400 tracking-wider mb-1">{{ m.kansuji }}<span class="mx-2 opacity-50">／</span>{{ m.year }}</p>
                <h3 class="font-jp text-xl font-light tracking-[0.25em] text-stone-800 dark:text-stone-100 mb-2">
                  <span v-if="m.chapter" class="mr-3 text-accent-500 dark:text-accent-400 font-extralight">{{ m.chapter }}</span>{{ m.title }}
                </h3>
                <p class="jp-body text-[0.95rem]">{{ m.description }}</p>
              </div>

              <!--
                直排地名軸字（Phase 2；2026-04-20）
                - 來源：japanese-editorial-cover.md 候補機制 3（amble 左軸字）
                - 只有當 m.place 存在（photography 資料聚合成功）才渲染
                - 自動流入對向空欄：idx 偶時 content 在 col-1，aside 流到 col-2；反之亦然
                - 字級 text-[0.8rem] extralight 極克制，避免與中央 kansuji 搶戲
                - 守門：若縦書き通膨明顯（同視窗 >1 高辨識度直排），此處為第一個降級候選
              -->
              <aside
                v-if="m.place"
                class="hidden md:flex items-start pt-1"
                :class="index % 2 === 0 ? 'md:pl-12' : 'md:pr-12 md:justify-end md:row-start-1 md:col-start-1'"
                aria-hidden="true"
              >
                <span class="writing-vertical font-jp text-[0.8rem] tracking-[0.55em] text-stone-500 dark:text-stone-400 font-extralight leading-none">
                  {{ m.place }}
                </span>
              </aside>
            </li>
          </ol>
        </div>
      </div>
    </section>

    <!-- =====================================================================
         精選 — 雙橫卷（攝影 + 電繪），data-driven 自 series:['featured']
         2026-04-29：撤掉 hardcoded featuredWorks 陣列 + 3x2 grid，
                     兩個 medium 各自有書腰 + 橫卷，呼應「雙主線並行」首頁敘事；
                     手機由 HorizontalStripFeatured 內部 fallback 為 2-col grid。
         ===================================================================== -->
    <section class="relative py-24 lg:py-32 bg-stone-100/40 dark:bg-stone-800/25">
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

        <!-- 第一條：攝影精選 -->
        <div class="reveal mb-10 lg:mb-14 -mx-6 sm:-mx-10 lg:-mx-16">
          <HorizontalStripFeatured category="photography" link-mode="navigate" :show-caption-band="false" />
        </div>

        <!-- 第二條：電繪精選（不再顯示底部 Featured Frames band，避免雙 strip 各掛一條） -->
        <div class="reveal -mx-6 sm:-mx-10 lg:-mx-16">
          <HorizontalStripFeatured category="digital" link-mode="navigate" :show-caption-band="false" />
        </div>
      </div>
    </section>

    <!-- =====================================================================
         索引 — 書扉式卡（作品集 / 文章）
         ===================================================================== -->
    <section class="relative py-24 lg:py-32">
      <div class="max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">
        <header class="reveal mb-14 text-center">
          <h2 class="jp-section-title text-3xl sm:text-4xl">目次
            <span class="jp-section-ruby">Index</span>
          </h2>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14">
          <!-- 作品集 -->
          <NuxtLink
            to="/gallery"
            class="reveal group relative block overflow-hidden aspect-[5/4] jp-frame bg-stone-100 dark:bg-stone-800"
          >
            <img
              :src="getThumbPath('gallery/2024年電繪作品/23.jpg', 800)"
              :srcset="getGridImageSrcset('gallery/2024年電繪作品/23.jpg')"
              :sizes="gridImageSizes"
              alt="Gallery preview"
              class="absolute inset-0 w-full h-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
              loading="lazy"
              decoding="async"
            >
            <div class="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-stone-900/30 to-stone-900/10"/>
            <!-- 章碼 -->
            <span class="absolute top-6 left-6 font-jp text-xs tracking-[0.4em] text-white/70">其一</span>
            <span class="absolute top-6 right-6 jp-seal !w-9 !h-9 !text-[0.7rem]">集</span>

            <div class="absolute bottom-0 left-0 right-0 p-8 lg:p-10">
              <p class="text-[0.7rem] tracking-[0.4em] uppercase text-stone-300 mb-3">Collection</p>
              <h3 class="font-jp text-3xl lg:text-4xl font-extralight tracking-[0.25em] text-white">作品集</h3>
              <p class="jp-body text-stone-300 text-sm mt-3 max-w-sm">
                電繪與攝影，依年份、事件與地點分類，附地圖與拍攝資訊。
              </p>
              <div class="mt-5 inline-flex items-center gap-3 text-white/85 text-xs tracking-[0.35em] uppercase group-hover:text-accent-300 transition-colors">
                <span class="font-jp tracking-[0.35em]">進入作品集</span>
                <svg class="w-4 h-4 transition-transform duration-500 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </NuxtLink>

          <!-- 文章（編集中）-->
          <NuxtLink
            to="/article"
            class="reveal reveal-delay-1 group relative aspect-[5/4] jp-frame bg-stone-50 dark:bg-stone-800/60 p-10 lg:p-12 flex flex-col"
          >
            <span class="absolute top-6 left-6 font-jp text-xs tracking-[0.4em] text-stone-400 dark:text-stone-500">其二</span>
            <span class="absolute top-6 right-6 jp-seal !w-9 !h-9 !text-[0.7rem]">文</span>

            <div class="mt-auto">
              <p class="text-[0.7rem] tracking-[0.4em] uppercase text-stone-400 dark:text-stone-500 mb-3">Writings</p>
              <h3 class="font-jp text-3xl lg:text-4xl font-extralight tracking-[0.25em] text-stone-800 dark:text-stone-100">文章</h3>
              <p class="jp-body text-sm mt-3 max-w-sm">
                設計心得、技術筆記與創作故事——目前編纂中，敬請期待。
              </p>
              <div class="mt-5 inline-flex items-center gap-3 text-stone-500 dark:text-stone-400 text-xs tracking-[0.35em] uppercase group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">
                <span class="font-jp tracking-[0.35em]">編集中</span>
                <svg class="w-3.5 h-3.5 transition-transform duration-500 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
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
import HorizontalStripFeatured from '~/components/gallery/HorizontalStripFeatured.vue'

const { getThumbPath, getGridImageSrcset, gridImageSizes } = useImagePath()
const { observeAll } = useScrollReveal()
const pageRef = ref<HTMLElement | null>(null)

/**
 * Phase 3B/3A：首頁需 photography 作品以渲染 HorizontalStripFeatured。
 * 用同一個 useAsyncData key 讓 SSR 能 prefetch；key 與 gallery 頁不同
 * （gallery 頁是 'gallery-works' 含 digital + photo），避免 Nuxt 錯誤覆蓋。
 * strip 篩 series=featured（~8 張）；Hero 靜照篩 series=hero（建議 1 張）。
 * 共用同一筆 JSON 載入，載入成本小（photographyList.json ~80 筆）。
 */
const galleryStore = useGalleryStore()
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

  return {
    art: getThumbPath(digitalSource, 800),
    artTitle: digitalTitle,
    main: heroImage.value,
    sub: getThumbPath(photoSubSource, 800),
    subTitle: photoSubTitle
  }
})

// ===== 領域 =====
const digitalTags = ['電繪插畫', '角色設計', '風景繪製', '概念藝術', '幾何風格']
const photoTags = ['街頭攝影', '活動紀實', '淺景深', '夜間攝影', '望遠鏡頭']

// ===== 道具：加入漢字豎排小標 =====
const tools = [
  {
    category: 'Brushes',
    kanji: '筆',
    items: ['Photoshop', 'Clip Studio Paint', 'Procreate']
  },
  {
    category: 'Lenses',
    kanji: '鏡',
    items: ['Nikon Z f', 'NIKKOR Z 24-120 f/4', 'NIKKOR Z 70-180 f/2.8']
  },
  {
    category: 'Stack',
    kanji: '技',
    items: ['Nuxt 3 / Vue 3', 'Tailwind CSS', 'TypeScript']
  }
]

// ===== 步履 Journey：章題 + 漢数字 =====
// usePhotoLocation（可選）：true 時才對應 photography event.location 聚合為縦向地名軸
// 2026-04-20 修正：原本按 year 聚合會讓同年電繪 milestone 也拿到攝影地名（2024「熟」錯配）
// 改為顯式旗標；電繪 milestone 不開，攝影相關才開
const milestones: Array<{
  year: string
  kansuji: string
  chapter: string
  title: string
  description: string
  usePhotoLocation?: boolean
}> = [
  { year: '2018', kansuji: '二〇一八', chapter: '初', title: '開始數位繪畫', description: '嘗試幾何風格動物插畫與經典畫作再創作。' },
  { year: '2020', kansuji: '二〇二〇', chapter: '進', title: '深入角色創作', description: '進行人物角色設計，探索多元的創作風格。' },
  { year: '2024', kansuji: '二〇二四', chapter: '熟', title: '電繪技法精進', description: '累積大量作品，風格更加成熟與多樣。' },
  { year: '2024', kansuji: '二〇二四', chapter: '撮', title: '踏入攝影領域', description: '入手 Nikon Z f，開始記錄城市街拍與活動紀實。', usePhotoLocation: true },
  { year: '2025', kansuji: '二〇二五', chapter: '築', title: '建立作品集', description: '以 Nuxt 3 打造個人作品集，整合電繪與攝影。', usePhotoLocation: true }
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
