<template>
  <div ref="pageRef">
    <!-- =====================================================================
         Hero — 表紙（扉頁）
         構成：左縦書き年號／中主標（和欧混植）／右作品集縦書き／底部 CTA
         ===================================================================== -->
    <section
      class="relative min-h-[88dvh] md:h-[94vh] md:min-h-[640px] overflow-hidden"
      role="region"
      aria-roledescription="封面主視覺"
      aria-label="Young Portfolio 表紙 — 精選攝影輪播"
      @mouseenter="pauseHeroCycle"
      @mouseleave="resumeHeroCycle"
      @focusin="pauseHeroCycle"
      @focusout="resumeHeroCycle"
    >
      <!-- 背景：作品照片輪播（極慢淡入淡出） + 分區和紙米白罩 -->
      <div class="absolute inset-0">
        <!-- 多張疊加、僅 opacity 控制可見性；單色化 + 輕抑飽和／亮度 -->
        <img
          v-for="(src, i) in heroImages"
          :key="src"
          :src="src"
          alt=""
          class="absolute inset-0 w-full h-full object-cover grayscale contrast-90 brightness-105 transition-opacity ease-in-out motion-reduce:transition-none"
          :class="[
            i === activeHero ? 'opacity-80 dark:opacity-35' : 'opacity-0'
          ]"
          style="transition-duration: 1500ms"
          :fetchpriority="i === 0 ? 'high' : 'auto'"
          :loading="i === 0 ? 'eager' : 'lazy'"
          decoding="async"
          aria-hidden="true"
        >
        <!-- 全局輕薄米白罩：mobile 壓更多以確保對比，desktop 輕壓 -->
        <div class="absolute inset-0 bg-stone-50/45 md:bg-stone-50/25 dark:bg-stone-900/55 md:dark:bg-stone-900/50"/>
        <!-- 左側主讀字區：不透明米白漸至透明，托起「余白」主標 -->
        <div class="absolute inset-y-0 left-0 w-[72%] bg-gradient-to-r from-stone-50 via-stone-50/92 to-transparent dark:from-stone-900 dark:via-stone-900/92"/>
        <!-- 右側縦書き襯底：細柱米白漸層 -->
        <div class="absolute inset-y-0 right-0 w-[18%] bg-gradient-to-l from-stone-50/80 to-transparent dark:from-stone-900/80 hidden lg:block"/>
        <!-- 下緣輕抹一層，讓 Scroll 提示清楚 -->
        <div class="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-stone-50/70 to-transparent dark:from-stone-900/70"/>
      </div>

      <!-- 內容格 — 書籍扉頁式版芯 -->
      <div class="relative z-10 h-full flex items-center">
        <div class="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 w-full">
          <div class="grid grid-cols-12 items-center gap-6">
            <!-- 左欄：縦書き年號（裝飾，大寫氣勢） -->
            <aside class="hidden lg:flex col-span-1 justify-end">
              <div class="flex flex-col items-center gap-3">
                <div class="w-px h-10 bg-stone-400/60 dark:bg-stone-500/60"/>
                <span class="jp-vertical-caption">令和七年・春</span>
                <div class="w-px h-16 bg-stone-400/40 dark:bg-stone-500/40"/>
              </div>
            </aside>

            <!-- 中央主欄 -->
            <div class="col-span-12 lg:col-span-8">
              <!-- 和欧混植 eyebrow -->
              <p class="reveal jp-eyebrow text-stone-700 dark:text-stone-200 mb-8">
                <span class="font-jp tracking-[0.45em]">作品集</span>
                <span aria-hidden="true" class="w-px h-3 bg-stone-400/60"/>
                <span>Young Portfolio</span>
              </p>

              <!-- 主標：漢字 + 英文副題，和欧對照 -->
              <h1 class="reveal reveal-delay-1">
                <span class="block font-jp font-extralight text-6xl sm:text-7xl lg:text-[6.5rem] tracking-[0.12em] text-stone-900 dark:text-stone-50 leading-[1.05]">
                  余<span class="inline-block mx-3"/>白
                </span>
                <span class="mt-5 flex items-baseline gap-4">
                  <span class="h-px w-10 bg-stone-400/70 dark:bg-stone-500"/>
                  <span class="text-sm sm:text-base tracking-[0.32em] uppercase text-stone-600 dark:text-stone-300 font-light">
                    Digital Art &amp; Photography
                  </span>
                </span>
              </h1>

              <!-- 引言（明朝體、兩行） -->
              <p class="reveal reveal-delay-2 jp-body mt-10 max-w-md text-[0.98rem]">
                餘白之中，留下電繪與攝影的斷章——<br>
                <span class="text-stone-500 dark:text-stone-400">拾取日常的節奏，緩緩書寫。</span>
              </p>

              <!-- 入口：低調文字 + 箭頭，非橘色鈕 -->
              <div class="reveal reveal-delay-3 mt-12 flex flex-wrap items-center gap-x-8 gap-y-4">
                <NuxtLink
                  to="/gallery"
                  class="group inline-flex items-center gap-3 text-stone-800 dark:text-stone-100 border-b border-stone-400/70 dark:border-stone-500/70 pb-2 pr-2 hover:border-accent-500 dark:hover:border-accent-400 transition-colors duration-500"
                >
                  <span class="font-jp tracking-[0.25em] text-lg">作品を見る</span>
                  <span class="text-xs tracking-[0.3em] text-stone-500 dark:text-stone-400 uppercase">Gallery</span>
                  <svg class="w-4 h-4 text-stone-500 dark:text-stone-400 transition-transform duration-500 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </NuxtLink>
                <NuxtLink
                  to="/article"
                  class="group inline-flex items-center gap-2 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 transition-colors duration-500"
                >
                  <span class="font-jp tracking-[0.25em] text-base">文章を読む</span>
                  <svg class="w-3.5 h-3.5 transition-transform duration-500 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </NuxtLink>
              </div>
            </div>

            <!-- 右欄：縦書き主題字 -->
            <aside class="hidden lg:flex col-span-3 justify-end pr-6">
              <div class="flex items-start gap-6">
                <div class="jp-hairline-v h-48"/>
                <div class="flex flex-col items-center gap-4 select-none">
                  <div class="w-px h-6 bg-stone-500/60 dark:bg-stone-400/60"/>
                  <span class="writing-vertical font-jp text-[2.1rem] font-light tracking-[0.35em] text-stone-900 dark:text-stone-50 leading-none drop-shadow-[0_1px_0_rgba(255,255,255,0.6)] dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                    繪<span class="block h-3"/>と<span class="block h-3"/>影
                  </span>
                  <div class="w-px h-6 bg-stone-500/60 dark:bg-stone-400/60"/>
                  <span class="writing-vertical font-jp text-xs tracking-[0.6em] text-stone-600 dark:text-stone-300">
                    二〇二六
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <!-- 底部：SCROLL 提示（和英） -->
      <div class="absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-stone-500 dark:text-stone-400">
        <span class="font-jp text-[0.7rem] tracking-[0.5em]">下へ</span>
        <div class="w-px h-10 bg-gradient-to-b from-stone-400/70 to-transparent dark:from-stone-500/70 animate-pulse"/>
        <span class="text-[0.6rem] tracking-[0.35em] uppercase">Scroll</span>
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
         道具 — 三欄、hairline 分隔
         ===================================================================== -->
    <section class="relative py-24 lg:py-32">
      <div class="max-w-5xl mx-auto px-6 sm:px-10 lg:px-16">
        <header class="reveal mb-14 text-center">
          <h2 class="jp-section-title text-3xl sm:text-4xl">道具
            <span class="jp-section-ruby">Tools</span>
          </h2>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-stone-200/70 dark:divide-stone-700/50">
          <article
            v-for="(tool, index) in tools"
            :key="tool.category"
            class="reveal px-6 md:px-8 py-10 flex flex-col items-center text-center"
            :class="[`reveal-delay-${index + 1}`]"
          >
            <span class="writing-vertical font-jp text-2xl font-extralight tracking-[0.4em] text-stone-700 dark:text-stone-200 mb-6">
              {{ tool.kanji }}
            </span>
            <p class="text-[0.65rem] tracking-[0.45em] uppercase text-stone-500 dark:text-stone-400 mb-6">{{ tool.category }}</p>
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
              v-for="(m, index) in milestones"
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
                <p class="jp-kansuji text-sm text-accent-600 dark:text-accent-400 tracking-wider mb-1">{{ m.kansuji }} / {{ m.year }}</p>
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
            </li>
          </ol>
        </div>
      </div>
    </section>

    <!-- =====================================================================
         精選 — 整齊方格 (4:5)
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

        <!-- 整齊 3 欄 4:5 grid -->
        <ul class="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
          <li
            v-for="(work, index) in featuredWorks"
            :key="work.src"
            class="reveal"
            :class="[`reveal-delay-${Math.min(index + 1, 5)}`]"
          >
            <NuxtLink
              to="/gallery"
              class="block group relative overflow-hidden aspect-tatami bg-stone-200/60 dark:bg-stone-800/60"
            >
              <img
                :src="getThumbPath(work.src, 800)"
                :srcset="getGridImageSrcset(work.src)"
                :sizes="gridImageSizes"
                :alt="work.title"
                class="w-full h-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
                loading="lazy"
                decoding="async"
              >
              <!-- 日式 caption：直書短標 + 橫書副標 -->
              <div class="absolute inset-0 bg-gradient-to-t from-stone-900/75 via-stone-900/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>
              <div class="absolute bottom-0 left-0 right-0 p-4 lg:p-5 flex items-end justify-between gap-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                <div>
                  <p class="text-white font-jp text-base tracking-[0.15em] font-light leading-tight">{{ work.title }}</p>
                  <p class="text-white/70 text-[0.65rem] tracking-[0.35em] uppercase mt-1.5">{{ work.category }}</p>
                </div>
                <span class="writing-vertical font-jp text-[0.65rem] tracking-[0.4em] text-white/70">{{ work.kanji }}</span>
              </div>
            </NuxtLink>
          </li>
        </ul>
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
import { ref, onMounted, onUnmounted } from 'vue'
import { useScrollReveal } from '~/composables/useScrollReveal'
import { useImagePath } from '~/composables/useImagePath'

const { getThumbPath, getGridImageSrcset, gridImageSizes } = useImagePath()
const { observeAll } = useScrollReveal()
const pageRef = ref<HTMLElement | null>(null)

// ===== 圖片路徑 =====
const avatarPath = getThumbPath('gallery/2024年電繪作品/55.jpg', 400)

// ===== Hero 輪播：精選 5 張，極慢淡入淡出（風中翻書） =====
// 順序即顯示序；首張即預設開頁、SEO 主圖
const heroImages = [
  getThumbPath('photography/WBC東京 台澳/DSC_9877-編輯-1.jpg', 800),
  getThumbPath('photography/峨嵋湖風鈴木/DSC_1437-編輯-1.jpg', 800),
  getThumbPath('photography/Annber 外拍/DSC_2187-編輯-1.jpg', 800),
  getThumbPath('photography/峨嵋湖風鈴木/DSC_2030-編輯-1.jpg', 800),
  getThumbPath('photography/Annber 外拍/DSC_2702-編輯-1.jpg', 800)
]
const HERO_INTERVAL_MS = 9000
const activeHero = ref(0)
let heroTimer: ReturnType<typeof setInterval> | null = null
const prefersReduceMotion = () =>
  typeof window !== 'undefined'
  && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const advanceHero = () => {
  activeHero.value = (activeHero.value + 1) % heroImages.length
}
const startHeroCycle = () => {
  if (prefersReduceMotion()) return
  stopHeroCycle()
  heroTimer = setInterval(advanceHero, HERO_INTERVAL_MS)
}
const stopHeroCycle = () => {
  if (heroTimer !== null) {
    clearInterval(heroTimer)
    heroTimer = null
  }
}
const pauseHeroCycle = () => stopHeroCycle()
const resumeHeroCycle = () => startHeroCycle()

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
const milestones = [
  { year: '2018', kansuji: '二〇一八', chapter: '初', title: '開始數位繪畫', description: '嘗試幾何風格動物插畫與經典畫作再創作。' },
  { year: '2020', kansuji: '二〇二〇', chapter: '進', title: '深入角色創作', description: '進行人物角色設計，探索多元的創作風格。' },
  { year: '2024', kansuji: '二〇二四', chapter: '熟', title: '電繪技法精進', description: '累積大量作品，風格更加成熟與多樣。' },
  { year: '2024', kansuji: '二〇二四', chapter: '撮', title: '踏入攝影領域', description: '入手 Nikon Z f，開始記錄城市街拍與活動紀實。' },
  { year: '2025', kansuji: '二〇二五', chapter: '築', title: '建立作品集', description: '以 Nuxt 3 打造個人作品集，整合電繪與攝影。' }
]

// ===== 精選作品 =====
const featuredWorks = [
  { src: 'gallery/2025年電繪作品/36-編輯-1.jpg', title: '2025 電繪新作', category: 'Digital Art', kanji: '繪' },
  { src: 'photography/春日街拍/DSC_7556-編輯-1.jpg', title: '春日街拍', category: 'Photography', kanji: '春' },
  { src: 'photography/攝影社 米倉團拍/DSC_4810-編輯-1.jpg', title: '米倉團拍', category: 'Photography', kanji: '影' },
  { src: 'gallery/2024年電繪作品/52-1.jpg', title: '2024 角色設計', category: 'Digital Art', kanji: '人' },
  { src: 'photography/2024新北耶誕城/DSC_4319-NEF_DxO_DeepPRIMEXD-1.jpg', title: '新北耶誕城', category: 'Photography', kanji: '夜' },
  { src: 'gallery/2023年電繪作品/51.jpg', title: '2023 插畫作品', category: 'Digital Art', kanji: '畫' }
]

onMounted(() => {
  observeAll(pageRef.value)
  startHeroCycle()
})

onUnmounted(() => {
  stopHeroCycle()
})

// SEO
useSeoMeta({
  title: 'NCTU Young - 數位藝術與攝影作品集',
  description:
    'NCTU Young 的個人作品集：數位電繪與攝影。圖片庫依類別與事件瀏覽，攝影附地圖與拍攝資訊。',
  ogTitle: 'Young Portfolio - 數位藝術與攝影',
  ogDescription:
    'NCTU Young 的個人作品集：數位電繪與攝影。圖片庫依類別與事件瀏覽，攝影附地圖與拍攝資訊。',
  ogType: 'website',
  ogUrl: 'https://nctuyoung.github.io/young-portfolio/',
  ogImage: 'https://nctuyoung.github.io/young-portfolio/images/photography/WBC%E6%9D%B1%E4%BA%AC%20%E5%8F%B0%E6%BE%B3/DSC_9877-%E7%B7%A8%E8%BC%AF-1.jpg',
  ogImageAlt: 'Young Portfolio — 日式靜素作品集 hero 攝影',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Young Portfolio - 數位藝術與攝影',
  twitterDescription:
    'NCTU Young 的個人作品集：數位電繪與攝影。圖片庫依類別與事件瀏覽，攝影附地圖與拍攝資訊。',
  twitterImage: 'https://nctuyoung.github.io/young-portfolio/images/photography/WBC%E6%9D%B1%E4%BA%AC%20%E5%8F%B0%E6%BE%B3/DSC_9877-%E7%B7%A8%E8%BC%AF-1.jpg'
})
</script>
