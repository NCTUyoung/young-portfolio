<template>
  <div ref="pageRef">
    <!-- ===== 全屏 Hero — 攝影作品背景 ===== -->
    <section class="relative min-h-[85dvh] overflow-hidden md:h-[92vh] md:min-h-[600px]">
      <!-- 背景：純照片 + 左側漸層遮罩 -->
      <div class="absolute inset-0">
        <img
          :src="heroImageSrc"
          alt=""
          class="absolute inset-0 w-full h-full object-cover"
          fetchpriority="high"
          decoding="async"
          loading="eager"
        >
        <div class="absolute inset-0 bg-white/30 dark:bg-stone-900/25 pointer-events-none"/>
        <div class="absolute inset-y-0 left-0 w-[55%] max-w-[520px] bg-gradient-to-r from-white via-white to-transparent dark:from-stone-900 dark:via-stone-900 dark:to-transparent pointer-events-none"/>
        <div class="absolute inset-0 bg-gradient-to-t from-white/10 via-transparent to-white/10 dark:from-stone-900/10 dark:via-transparent dark:to-stone-900/10 pointer-events-none"/>
      </div>

      <!-- 裝飾性元素 -->
      <div class="deco-line-v h-36 top-12 left-[8%] hidden lg:block"/>
      <div class="deco-dot top-10 left-[8%] hidden lg:block" style="transform: translateX(-2px) translateY(-8px);"/>
      <!-- 右上角豎排漢字裝飾 -->
      <div class="absolute top-12 right-[8%] hidden lg:flex flex-col items-center gap-3 select-none pointer-events-none">
        <div class="w-px h-8 bg-gradient-to-b from-transparent to-stone-300/40 dark:to-stone-600/30"/>
        <span class="writing-vertical font-jp text-xs tracking-[0.5em] text-stone-300/60 dark:text-stone-600/40">作品集</span>
        <div class="w-px h-8 bg-gradient-to-b from-stone-300/40 dark:from-stone-600/30 to-transparent"/>
      </div>
      <div class="deco-line-h absolute bottom-32 right-[10%] hidden w-32 lg:block"/>
      <div class="deco-dot bottom-32 right-[10%] hidden lg:block" style="transform: translateX(36px) translateY(-2px);"/>

      <!-- Hero 內容 — 品牌標語 -->
      <div class="relative z-10 h-full flex items-center">
        <div class="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 w-full">
          <div class="max-w-xl pl-8 pr-6 py-8 sm:py-10 max-[380px]:pl-4 max-[380px]:pr-4 relative">
            <!-- 左側裝飾線：單色豎線（與導覽 LOGO 直條呼應） -->
            <div class="absolute left-0 top-8 bottom-16 w-px bg-gradient-to-b from-stone-900/50 via-stone-600/35 to-transparent dark:from-stone-100/55 dark:via-stone-400/30 dark:to-transparent"/>

            <!-- 小標 + 橫線：高對比小字，避免淺棕難讀 -->
            <div class="reveal flex items-center gap-4 mb-6">
              <p class="text-xs sm:text-sm tracking-[0.28em] uppercase text-stone-900 dark:text-stone-100 font-semibold">
                Digital Art &amp; Photography
              </p>
              <div class="h-px flex-1 max-w-[80px] bg-gradient-to-r from-stone-500/45 to-transparent dark:from-stone-400/50"/>
            </div>

            <!-- 主標題：粗黑主字 + 次行輕量（對齊全站單色標題感） -->
            <h1
              class="reveal reveal-delay-1 text-5xl sm:text-6xl lg:text-7xl font-black tracking-[-0.03em] text-stone-900 dark:text-stone-50 leading-[1.05] [text-shadow:0_1px_0_rgba(255,255,255,0.35)] dark:[text-shadow:0_2px_12px_rgba(0,0,0,0.45)]"
            >
              <span class="block">Young</span>
              <span class="block mt-2 text-3xl sm:text-4xl lg:text-5xl font-extralight tracking-[0.14em] text-stone-700 dark:text-stone-300">
                Portfolio
              </span>
            </h1>

            <!-- 主標與 CTA：細線 + 琥珀點（全區唯一強調色） -->
            <div class="reveal reveal-delay-2 mt-8 flex items-center gap-3">
              <div class="w-8 h-px bg-stone-400/70 dark:bg-stone-500/80"/>
              <div class="w-1.5 h-1.5 rounded-full bg-accent-500 dark:bg-accent-400 ring-1 ring-stone-900/10 dark:ring-white/15"/>
            </div>

            <!-- CTA -->
            <div class="reveal reveal-delay-2 mt-6">
              <NuxtLink
                to="/gallery"
                class="inline-flex min-h-[44px] items-center justify-center px-7 py-3.5 touch-manipulation bg-accent-600 hover:bg-accent-700 active:bg-accent-800 text-white font-light tracking-wider rounded-lg transition-all duration-300 group shadow-lg shadow-accent-600/20"
              >
                瀏覽作品
                <svg class="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部滾動提示 -->
      <div class="absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-stone-400 dark:text-stone-500">
        <span class="text-xs tracking-[0.2em] font-light">SCROLL</span>
        <div class="w-px h-8 bg-gradient-to-b from-stone-400 to-transparent dark:from-stone-500 animate-pulse"/>
      </div>
    </section>

    <!-- ===== 關於我 — 偏左排版 + 錯位設計 ===== -->
    <section class="relative py-20 sm:py-28 overflow-hidden">
      <!-- 背景裝飾 -->
      <div class="absolute top-0 right-0 w-1/2 h-full bg-stone-100/40 dark:bg-stone-800/30 rounded-l-[4rem] hidden lg:block"/>
      <div class="deco-line-v h-32 top-8 right-[42%] hidden lg:block"/>
      <div class="deco-dot top-8 right-[42%] hidden lg:block" style="transform: translate(-2px, -10px)"/>

      <div class="relative max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        <div class="flex flex-col lg:flex-row items-start gap-12 lg:gap-20">
          <!-- 左側：文字 -->
          <div class="flex-1 lg:max-w-md">
            <p class="reveal text-xs tracking-[0.3em] uppercase text-accent-500 dark:text-accent-400 font-light mb-4">About</p>

            <h2 class="reveal reveal-delay-1 text-5xl sm:text-6xl font-extralight text-stone-800 dark:text-stone-100 tracking-wider leading-[1.1]">
              Young
            </h2>
            <p class="reveal reveal-delay-1 mt-2 text-lg text-stone-500 dark:text-stone-400 font-light tracking-wide">
              NCTU Young · 數位電繪與攝影
            </p>

            <p class="reveal reveal-delay-2 mt-8 text-stone-600 dark:text-stone-400 font-light leading-relaxed tracking-wide">
              電繪與攝影兩條線並行：插畫從幾何、角色到場景；攝影以街拍、活動與城市夜景為主，用 Nikon Z
              系統把當下留下來。
            </p>
            <p class="reveal reveal-delay-2 mt-4 text-stone-600 dark:text-stone-400 font-light leading-relaxed tracking-wide">
              這個網站收錄電繪作品與依事件整理的攝影相簿，攝影區附地圖與拍攝資訊。零碎日常與新作也會在
              Instagram、Threads 更新——歡迎從下方連結找到我。
            </p>

            <!-- 社群連結 -->
            <div class="reveal reveal-delay-3 mt-8">
              <SocialMediaLinks />
            </div>
          </div>

          <!-- 右側：頭像（錯位突出） -->
          <div class="reveal-right reveal-delay-2 relative flex-shrink-0 lg:mt-8">
            <!-- 頭像背景裝飾框 -->
            <div class="absolute -top-4 -left-4 w-52 h-52 sm:w-64 sm:h-64 rounded-2xl border border-accent-300/30 dark:border-accent-600/30"/>
            <div class="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden shadow-xl">
              <img
                :src="avatarPath"
                alt="Young"
                class="w-full h-full object-cover"
                decoding="async"
                loading="lazy"
              >
            </div>
            <!-- 浮動裝飾點 -->
            <div class="absolute -bottom-3 -right-3 w-6 h-6 rounded-full bg-accent-400/60 dark:bg-accent-500/50 animate-breathe"/>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== 創作領域 — 左右交錯 ===== -->
    <section class="py-20 lg:py-28 bg-stone-50/40 dark:bg-stone-800/20 relative">
      <div class="deco-line-h absolute left-0 top-0 w-full"/>

      <div class="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        <div class="reveal mb-16">
          <p class="text-xs tracking-[0.3em] uppercase text-accent-500 dark:text-accent-400 font-light mb-3">Domains</p>
          <h2 class="text-3xl sm:text-4xl font-extralight text-stone-800 dark:text-stone-200 tracking-wider">
            創作領域
          </h2>
        </div>

        <!-- 第一排：電繪（大）左 + 留白右 -->
        <div class="reveal grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          <div class="lg:col-span-7 bg-white/80 dark:bg-stone-800/60 backdrop-blur-sm rounded-2xl border border-stone-200/60 dark:border-stone-700/60 p-8 lg:p-10 hover:border-accent-200/60 dark:hover:border-accent-700/40 hover:-translate-y-0.5 transition-all duration-500 group">
            <div class="flex items-center gap-4 mb-6">
              <div class="w-12 h-12 rounded-xl bg-accent-100/80 dark:bg-accent-900/30 flex items-center justify-center group-hover:bg-accent-200/80 dark:group-hover:bg-accent-800/40 transition-colors duration-500">
                <svg class="w-6 h-6 text-accent-600 dark:text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                </svg>
              </div>
              <h3 class="text-2xl font-extralight text-stone-800 dark:text-stone-200 tracking-wider">數位電繪</h3>
            </div>
            <p class="text-stone-600 dark:text-stone-400 font-light leading-relaxed tracking-wide mb-6 text-base">
              2018 年起累積電繪作品，從幾何化的動物插畫到人物與場景，持續嘗試不同風格與筆觸。
            </p>
            <div class="flex flex-wrap gap-2">
              <span
v-for="tag in digitalTags" :key="tag"
                    class="px-3 py-1 text-xs font-light text-accent-700 dark:text-accent-300 bg-accent-100/50 dark:bg-accent-900/30 rounded-full tracking-wide">
                {{ tag }}
              </span>
            </div>
          </div>
          <!-- 右側留白，裝飾 -->
          <div class="hidden lg:flex lg:col-span-5 items-center justify-center relative">
            <!-- 左側細線 -->
            <div class="absolute left-0 top-1/2 -translate-y-1/2 w-px h-24 bg-gradient-to-b from-transparent via-stone-200/60 dark:via-stone-700/40 to-transparent"/>
            <div class="flex flex-col items-center gap-3 select-none pointer-events-none">
              <div class="w-px h-6 bg-gradient-to-b from-transparent to-stone-200/40 dark:to-stone-700/30"/>
              <div class="writing-vertical font-jp text-[6rem] font-thin text-stone-100 dark:text-stone-800/50 tracking-widest leading-none">繪</div>
              <div class="w-px h-6 bg-gradient-to-b from-stone-200/40 dark:from-stone-700/30 to-transparent"/>
            </div>
          </div>
        </div>

        <!-- 第二排：留白左 + 攝影（大）右 -->
        <div class="reveal grid grid-cols-1 lg:grid-cols-12 gap-8">
          <!-- 左側留白，裝飾 -->
          <div class="hidden lg:flex lg:col-span-5 items-center justify-center relative">
            <!-- 右側細線 -->
            <div class="absolute right-0 top-1/2 -translate-y-1/2 w-px h-24 bg-gradient-to-b from-transparent via-stone-200/60 dark:via-stone-700/40 to-transparent"/>
            <div class="flex flex-col items-center gap-3 select-none pointer-events-none">
              <div class="w-px h-6 bg-gradient-to-b from-transparent to-stone-200/40 dark:to-stone-700/30"/>
              <div class="writing-vertical font-jp text-[6rem] font-thin text-stone-100 dark:text-stone-800/50 tracking-widest leading-none">影</div>
              <div class="w-px h-6 bg-gradient-to-b from-stone-200/40 dark:from-stone-700/30 to-transparent"/>
            </div>
          </div>
          <div class="lg:col-span-7 bg-white/80 dark:bg-stone-800/60 backdrop-blur-sm rounded-2xl border border-stone-200/60 dark:border-stone-700/60 p-8 lg:p-10 hover:border-accent-200/60 dark:hover:border-accent-700/40 hover:-translate-y-0.5 transition-all duration-500 group">
            <div class="flex items-center gap-4 mb-6">
              <div class="w-12 h-12 rounded-xl bg-accent-100/80 dark:bg-accent-900/30 flex items-center justify-center group-hover:bg-accent-200/80 dark:group-hover:bg-accent-800/40 transition-colors duration-500">
                <svg class="w-6 h-6 text-accent-600 dark:text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
              </div>
              <h3 class="text-2xl font-extralight text-stone-800 dark:text-stone-200 tracking-wider">攝影紀錄</h3>
            </div>
            <p class="text-stone-600 dark:text-stone-400 font-light leading-relaxed tracking-wide mb-6 text-base">
              以 Nikon Z f 為主，記錄街景、活動與夜景；偏愛淺景深與自然光，讓畫面保留現場氛圍。
            </p>
            <div class="flex flex-wrap gap-2">
              <span
v-for="tag in photoTags" :key="tag"
                    class="px-3 py-1 text-xs font-light text-accent-700 dark:text-accent-300 bg-accent-100/50 dark:bg-accent-900/30 rounded-full tracking-wide">
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== 工具與器材 ===== -->
    <section class="py-20 lg:py-28">
      <div class="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        <div class="reveal mb-16 text-right">
          <p class="text-xs tracking-[0.3em] uppercase text-accent-500 dark:text-accent-400 font-light mb-3">Tools</p>
          <h2 class="text-3xl sm:text-4xl font-extralight text-stone-800 dark:text-stone-200 tracking-wider">
            工具與器材
          </h2>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div
v-for="(tool, index) in tools" :key="tool.category"
               class="reveal text-center bg-white/70 dark:bg-stone-800/70 backdrop-blur-sm rounded-2xl border border-stone-200/60 dark:border-stone-700/60 p-8 hover:border-accent-200/60 dark:hover:border-accent-700/40 transition-all duration-500 group"
               :class="[`reveal-delay-${index + 1}`]">
            <div class="w-12 h-12 mx-auto mb-5 rounded-xl bg-accent-100/60 dark:bg-accent-900/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              <svg class="w-5 h-5 text-accent-600 dark:text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="tool.icon" />
              </svg>
            </div>
            <h3 class="text-xs font-light text-stone-500 dark:text-stone-400 tracking-[0.35em] uppercase mb-4">{{ tool.category }}</h3>
            <ul class="space-y-2">
              <li v-for="item in tool.items" :key="item" class="text-sm text-stone-500 dark:text-stone-400 font-light tracking-wide">
                {{ item }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== 大引言區塊 — 視覺間斷 ===== -->
    <section class="reveal relative py-24 lg:py-32 overflow-hidden">
      <div class="deco-line-h absolute left-0 top-0 w-full"/>

      <!-- 背景大字裝飾 -->
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span class="jp-kana-bg font-jp">侘</span>
      </div>

      <!-- 左右豎排旁注 -->
      <div class="absolute left-[6%] top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center gap-2 pointer-events-none select-none">
        <div class="w-px h-12 bg-gradient-to-b from-transparent via-accent-300/30 dark:via-accent-600/20 to-transparent"/>
        <span class="writing-vertical font-jp text-[0.6rem] tracking-[0.6em] text-accent-400/40 dark:text-accent-500/30">わびさび</span>
        <div class="w-px h-12 bg-gradient-to-b from-transparent via-accent-300/30 dark:via-accent-600/20 to-transparent"/>
      </div>
      <div class="absolute right-[6%] top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center gap-2 pointer-events-none select-none">
        <div class="w-px h-12 bg-gradient-to-b from-transparent via-stone-300/40 dark:via-stone-600/30 to-transparent"/>
        <span class="writing-vertical font-jp text-[0.6rem] tracking-[0.6em] text-stone-400/40 dark:text-stone-600/30">不完全美</span>
        <div class="w-px h-12 bg-gradient-to-b from-transparent via-stone-300/40 dark:via-stone-600/30 to-transparent"/>
      </div>

      <div class="relative max-w-3xl mx-auto px-6 text-center">
        <!-- 裝飾橫線 -->
        <div class="flex items-center justify-center gap-4 mb-8">
          <div class="h-px w-16 bg-gradient-to-r from-transparent to-accent-300/50 dark:to-accent-600/40"/>
          <div class="w-1 h-1 rounded-full bg-accent-400/60 dark:bg-accent-500/50"/>
          <div class="h-px w-16 bg-gradient-to-l from-transparent to-accent-300/50 dark:to-accent-600/40"/>
        </div>

        <blockquote class="font-jp text-2xl sm:text-3xl lg:text-4xl font-thin text-stone-700 dark:text-stone-300 tracking-wider leading-relaxed">
          「不完美之中，<br >藏著最真實的美。」
        </blockquote>
        <p class="mt-6 text-xs text-stone-400 dark:text-stone-500 font-light tracking-[0.4em]">— 侘寂之道</p>

        <!-- 底部裝飾 -->
        <div class="flex items-center justify-center gap-4 mt-8">
          <div class="h-px w-8 bg-gradient-to-r from-transparent to-stone-300/40 dark:to-stone-600/30"/>
          <div class="w-1 h-1 rounded-full bg-stone-300/60 dark:bg-stone-600/40"/>
          <div class="h-px w-8 bg-gradient-to-l from-transparent to-stone-300/40 dark:to-stone-600/30"/>
        </div>
      </div>

      <div class="deco-line-h absolute bottom-0 left-0 w-full"/>
    </section>

    <!-- ===== 創作歷程 Timeline ===== -->
    <section class="py-20 lg:py-28 bg-stone-50/40 dark:bg-stone-800/20">
      <div class="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">
        <div class="reveal mb-16">
          <p class="text-xs tracking-[0.3em] uppercase text-accent-500 dark:text-accent-400 font-light mb-3">Journey</p>
          <h2 class="text-3xl sm:text-4xl font-extralight text-stone-800 dark:text-stone-200 tracking-wider">
            創作歷程
          </h2>
        </div>

        <div class="relative">
          <!-- Timeline 主線 — accent 漸層 -->
          <div class="absolute left-[0.875rem] top-0 bottom-0 w-px bg-gradient-to-b from-accent-300 via-accent-400/60 to-stone-200 dark:from-accent-600 dark:via-accent-700/50 dark:to-stone-700 hidden sm:block"/>

          <div class="space-y-10">
            <div
v-for="(milestone, index) in milestones" :key="index"
                 class="reveal flex gap-6 items-start"
                 :class="[`reveal-delay-${Math.min(index + 1, 5)}`]">
              <!-- 年份 + accent 菱形節點 -->
              <div class="flex-shrink-0 relative flex items-start justify-center w-7">
                <!-- 外框菱形 -->
                <div class="w-3 h-3 bg-white dark:bg-stone-900 border border-accent-400/70 dark:border-accent-500/70 rotate-45 relative z-10 mt-2">
                  <!-- 內核 -->
                  <div class="absolute inset-[2px] bg-accent-400 dark:bg-accent-500"/>
                </div>
              </div>
              <div class="pb-2">
                <div class="flex items-baseline gap-3 mb-1">
                  <span class="text-sm font-light text-accent-500 dark:text-accent-400 tracking-wider">{{ milestone.year }}</span>
                  <h3 class="text-base font-light text-stone-700 dark:text-stone-300 tracking-wide">{{ milestone.title }}</h3>
                </div>
                <p class="text-sm text-stone-500 dark:text-stone-400 font-light leading-relaxed">{{ milestone.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== 精選作品預覽 ===== -->
    <section class="relative py-24 lg:py-32">
      <div class="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div class="reveal mb-14 flex items-end gap-6">
          <div>
            <p class="text-xs tracking-[0.3em] uppercase text-accent-500 dark:text-accent-400 font-light mb-3">Featured</p>
            <h2 class="text-3xl sm:text-4xl font-extralight text-stone-800 dark:text-stone-200 tracking-wider">
              精選作品
            </h2>
          </div>
          <div class="hidden sm:block h-px flex-1 max-w-[120px] bg-gradient-to-r from-accent-400/60 to-transparent mb-2"/>
        </div>

        <!-- 作品 Grid：2 列交錯高度 -->
        <div class="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          <NuxtLink
            v-for="(work, index) in featuredWorks"
            :key="work.src"
            to="/gallery"
            class="reveal group relative overflow-hidden rounded-xl"
            :class="[
              work.tall ? 'row-span-2' : '',
              `reveal-delay-${Math.min(index + 1, 5)}`
            ]"
          >
            <div :class="work.tall ? 'h-72 lg:h-[28rem]' : 'h-36 lg:h-52'">
              <img
                :src="getThumbPath(work.src, 800)"
                :srcset="getGridImageSrcset(work.src)"
                :sizes="gridImageSizes"
                :alt="work.title"
                class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              >
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>
              <div class="absolute bottom-0 left-0 right-0 p-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                <p class="text-white text-sm font-light tracking-wide">{{ work.title }}</p>
                <p class="text-white/60 text-xs font-light mt-0.5">{{ work.category }}</p>
              </div>
            </div>
          </NuxtLink>
        </div>

        <!-- 查看全部 -->
        <div class="reveal mt-10 text-center">
          <NuxtLink
            to="/gallery"
            class="inline-flex items-center text-stone-500 dark:text-stone-400 hover:text-accent-600 dark:hover:text-accent-400 font-light tracking-wide transition-colors duration-300 group"
          >
            查看全部作品
            <svg class="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- ===== 導航卡片 ===== -->
    <section class="relative py-24 lg:py-32 bg-stone-50/40 dark:bg-stone-800/20">
      <div class="deco-line-h absolute left-0 top-0 w-full"/>
      <div class="deco-line-v absolute -top-20 right-[15%] hidden h-40 lg:block"/>

      <div class="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div class="reveal mb-16 max-w-lg">
          <p class="text-xs tracking-[0.3em] uppercase text-accent-500 dark:text-accent-400 font-light mb-3">Explore</p>
          <h2 class="text-3xl sm:text-4xl font-extralight text-stone-800 dark:text-stone-200 tracking-wider">
            探索更多
          </h2>
        </div>

        <!-- 兩張卡片：作品集 + 文章 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <!-- 作品集卡片（帶預覽圖） -->
          <div class="reveal group">
            <NuxtLink to="/gallery" class="block relative overflow-hidden rounded-2xl h-72 lg:h-80">
              <img
                :src="getThumbPath('gallery/2024年電繪作品/23.jpg', 800)"
                :srcset="getGridImageSrcset('gallery/2024年電繪作品/23.jpg')"
                :sizes="gridImageSizes"
                alt="Gallery preview"
                class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              >
              <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"/>
              <div class="absolute top-6 right-6 w-3 h-3 rounded-full bg-accent-400 opacity-70 group-hover:opacity-100 transition-opacity"/>
              <div class="absolute bottom-0 left-0 p-8 lg:p-10">
                <p class="text-accent-300 text-xs tracking-[0.2em] uppercase mb-2 font-light">Collection</p>
                <h3 class="text-3xl lg:text-4xl font-extralight text-white tracking-wider mb-3">作品集</h3>
                <div class="mt-4 flex items-center text-white/80 text-sm font-light group-hover:text-accent-300 transition-colors duration-300">
                  進入作品集
                  <svg class="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </NuxtLink>
          </div>

          <!-- 文章卡片 -->
          <div class="reveal reveal-delay-1 group">
            <NuxtLink
              to="/article"
              class="block h-full bg-white/70 dark:bg-stone-800/70 backdrop-blur-sm rounded-2xl border border-stone-200/60 dark:border-stone-700/60 p-8 lg:p-10 hover:border-accent-300/60 dark:hover:border-accent-600/60 transition-all duration-500 relative overflow-hidden"
            >
              <div class="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-accent-100/30 dark:bg-accent-900/20 blur-2xl group-hover:scale-150 transition-transform duration-700"/>
              <div class="relative">
                <div class="w-10 h-10 rounded-lg bg-stone-100/80 dark:bg-stone-700/80 flex items-center justify-center mb-5">
                  <svg class="w-5 h-5 text-accent-500 dark:text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </div>
                <h3 class="text-2xl font-extralight text-stone-800 dark:text-stone-200 tracking-wider mb-3">文章</h3>
                <p class="text-stone-500 dark:text-stone-400 font-light text-sm leading-relaxed tracking-wide mb-6">
                  設計心得、技術筆記與創作故事
                </p>
                <div class="flex items-center text-stone-400 dark:text-stone-500 text-sm font-light group-hover:text-accent-500 dark:group-hover:text-accent-400 transition-colors duration-300">
                  即將推出
                  <svg class="w-3.5 h-3.5 ml-1.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useScrollReveal } from '~/composables/useScrollReveal'
import { useImagePath } from '~/composables/useImagePath'

const { getThumbPath, getGridImageSrcset, gridImageSizes } = useImagePath()
const { observeAll } = useScrollReveal()
const pageRef = ref<HTMLElement | null>(null)

// ===== 圖片路徑（Hero / 頭像用縮圖以減少 LCP 與流量；og:image 仍指向原圖 URL）=====
const avatarPath = getThumbPath('gallery/2024年電繪作品/55.jpg', 400)
const heroImageSrc = getThumbPath('photography/2025 桃園三本柱/DSC_6178-編輯-1.jpg', 800)

// ===== About 資料 =====
const digitalTags = ['電繪插畫', '角色設計', '風景繪製', '概念藝術', '幾何風格']
const photoTags = ['街頭攝影', '活動紀實', '淺景深', '夜間攝影', '望遠鏡頭']

const tools = [
  {
    category: '繪圖軟體',
    icon: 'M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25',
    items: ['Photoshop', 'Clip Studio Paint', 'Procreate']
  },
  {
    category: '攝影器材',
    icon: 'M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z',
    items: ['Nikon Z f', 'NIKKOR Z 24-120mm f/4', 'NIKKOR Z 70-180mm f/2.8']
  },
  {
    category: '開發技術',
    icon: 'M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5',
    items: ['Nuxt 3 / Vue 3', 'Tailwind CSS', 'TypeScript']
  }
]

const milestones = [
  { year: '2018', title: '開始數位繪畫', description: '嘗試幾何風格動物插畫與經典畫作再創作' },
  { year: '2020', title: '深入角色創作', description: '開始進行人物角色設計，探索多元的創作風格' },
  { year: '2024', title: '電繪技法精進', description: '累積大量作品，風格更加成熟與多樣化' },
  { year: '2024', title: '踏入攝影領域', description: '入手 Nikon Z f，開始記錄城市街拍與活動紀實' },
  { year: '2025', title: '建立作品集網站', description: '以 Nuxt 3 打造個人作品集，整合電繪與攝影作品' }
]

// ===== 精選作品 =====
const featuredWorks = [
  { src: 'gallery/2025年電繪作品/36-編輯-1.jpg', title: '2025 電繪新作', category: 'Digital Art', tall: true },
  { src: 'photography/春日街拍/DSC_7556-編輯-1.jpg', title: '春日街拍', category: 'Photography', tall: false },
  { src: 'photography/攝影社 米倉團拍/DSC_4810-編輯-1.jpg', title: '米倉團拍', category: 'Photography', tall: false },
  { src: 'gallery/2024年電繪作品/52-1.jpg', title: '2024 角色設計', category: 'Digital Art', tall: false },
  { src: 'photography/2024新北耶誕城/DSC_4319-NEF_DxO_DeepPRIMEXD-1.jpg', title: '新北耶誕城', category: 'Photography', tall: true },
  { src: 'gallery/2023年電繪作品/51.jpg', title: '2023 插畫作品', category: 'Digital Art', tall: false },
]

onMounted(() => {
  observeAll(pageRef.value)
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
  ogImage: 'https://nctuyoung.github.io/young-portfolio/images/photography/2025%20桃園三本柱/DSC_6178-編輯-1.jpg',
  twitterCard: 'summary_large_image'
})
</script>

<style scoped>
/* Hero collage 由組件內建動畫處理 */
</style>
