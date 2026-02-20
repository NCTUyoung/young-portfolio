<template>
  <div class="min-h-screen">
    <!-- 頁面標題 -->
    <div class="bg-white/60 dark:bg-stone-800/60 backdrop-blur-sm">
      <div class="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 py-16">
        <div class="text-center">
          <h1 class="text-3xl sm:text-4xl font-extralight text-stone-800 dark:text-stone-200 tracking-wider mb-4">文章專區</h1>
          <p class="text-stone-500 dark:text-stone-400 font-light max-w-2xl mx-auto tracking-wide">
            分享設計心得、技術筆記與創作故事
          </p>
        </div>
      </div>
    </div>

    <!-- 內容區域 -->
    <div class="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 py-16">
      <div class="text-center py-12">
        <div class="w-16 h-16 mx-auto mb-6 rounded-xl bg-stone-100/80 dark:bg-stone-800/80 flex items-center justify-center">
          <svg class="w-8 h-8 text-stone-400 dark:text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
        </div>
        <h2 class="text-2xl font-extralight text-stone-800 dark:text-stone-200 tracking-wider mb-4">即將推出</h2>
        <p class="text-stone-500 dark:text-stone-400 font-light mb-10 max-w-md mx-auto tracking-wide leading-relaxed">
          文章功能正在開發中，敬請期待更多精彩內容與設計分享！
        </p>

        <div class="flex items-center justify-center gap-4">
          <NuxtLink
            to="/gallery"
            class="inline-flex items-center px-6 py-3 border border-stone-300/80 dark:border-stone-600/80 rounded-xl text-stone-600 dark:text-stone-400 font-light tracking-wide hover:bg-stone-50/50 dark:hover:bg-stone-800/50 hover:border-stone-400/80 dark:hover:border-stone-500/80 transition-all duration-300 group"
          >
            瀏覽作品集
            <svg class="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </NuxtLink>

          <NuxtLink
            to="/"
            class="inline-flex items-center px-6 py-3 text-stone-500 dark:text-stone-400 font-light tracking-wide hover:text-stone-700 dark:hover:text-stone-300 transition-colors duration-300"
          >
            返回首頁
          </NuxtLink>
        </div>
      </div>

      <!-- 預告內容 -->
      <div class="grid md:grid-cols-3 gap-8 mt-12">
        <div class="text-center bg-white/70 dark:bg-stone-800/70 backdrop-blur-sm rounded-xl border border-stone-200/60 dark:border-stone-700/60 p-8 hover:border-stone-300/80 dark:hover:border-stone-600/80 transition-all duration-500">
          <div class="w-12 h-12 mx-auto mb-4 rounded-xl bg-stone-100/80 dark:bg-stone-700/80 flex items-center justify-center">
            <svg class="w-6 h-6 text-stone-500 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
            </svg>
          </div>
          <h3 class="text-base font-light text-stone-700 dark:text-stone-300 tracking-wider mb-2">設計心得</h3>
          <p class="text-stone-500 dark:text-stone-400 text-sm font-light tracking-wide">分享設計過程中的思考與技巧</p>
        </div>

        <div class="text-center bg-white/70 dark:bg-stone-800/70 backdrop-blur-sm rounded-xl border border-stone-200/60 dark:border-stone-700/60 p-8 hover:border-stone-300/80 dark:hover:border-stone-600/80 transition-all duration-500">
          <div class="w-12 h-12 mx-auto mb-4 rounded-xl bg-stone-100/80 dark:bg-stone-700/80 flex items-center justify-center">
            <svg class="w-6 h-6 text-stone-500 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
            </svg>
          </div>
          <h3 class="text-base font-light text-stone-700 dark:text-stone-300 tracking-wider mb-2">技術筆記</h3>
          <p class="text-stone-500 dark:text-stone-400 text-sm font-light tracking-wide">記錄開發過程中的學習與收穫</p>
        </div>

        <div class="text-center bg-white/70 dark:bg-stone-800/70 backdrop-blur-sm rounded-xl border border-stone-200/60 dark:border-stone-700/60 p-8 hover:border-stone-300/80 dark:hover:border-stone-600/80 transition-all duration-500">
          <div class="w-12 h-12 mx-auto mb-4 rounded-xl bg-stone-100/80 dark:bg-stone-700/80 flex items-center justify-center">
            <svg class="w-6 h-6 text-stone-500 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
          </div>
          <h3 class="text-base font-light text-stone-700 dark:text-stone-300 tracking-wider mb-2">創作故事</h3>
          <p class="text-stone-500 dark:text-stone-400 text-sm font-light tracking-wide">每個作品背後的靈感與故事</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 頁面 meta
useSeoMeta({
  title: '文章專區',
  description: '分享設計心得、技術筆記與創作故事。',
  ogTitle: '文章專區 - 設計心得與技術筆記',
  ogDescription: '分享設計過程、技術筆記與創作背後的故事，文章功能即將推出。',
  ogType: 'website',
  ogUrl: 'https://nctuyoung.github.io/young-portfolio/article',
  ogImage: 'https://nctuyoung.github.io/young-portfolio/images/gallery/2024年電繪作品/23.jpg',
  twitterCard: 'summary_large_image'
})
</script>
