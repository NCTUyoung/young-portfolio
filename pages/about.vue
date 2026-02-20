<template>
  <div class="min-h-screen">
    <!-- Hero 區域 -->
    <section class="bg-white/60 dark:bg-stone-800/60 backdrop-blur-sm">
      <div class="max-w-5xl mx-auto py-20 px-6 sm:py-28 sm:px-8 lg:px-12">
        <div class="flex flex-col md:flex-row items-center md:items-start gap-12 md:gap-16">
          <!-- 頭像 -->
          <div class="flex-shrink-0">
            <div class="w-40 h-40 sm:w-48 sm:h-48 rounded-full overflow-hidden border border-stone-200/60 dark:border-stone-700/60 shadow-sm">
              <img
                :src="avatarPath"
                alt="Young"
                class="w-full h-full object-cover"
              />
            </div>
          </div>

          <!-- 自我介紹 -->
          <div class="text-center md:text-left flex-1">
            <h1 class="text-4xl sm:text-5xl font-extralight text-stone-800 dark:text-stone-200 tracking-wider leading-tight">
              Young
            </h1>
            <p class="mt-2 text-lg text-stone-500 dark:text-stone-400 font-light tracking-wide">
              數位藝術創作者 · 攝影愛好者
            </p>
            <div class="mt-6 max-w-xl">
              <p class="text-stone-600 dark:text-stone-400 font-light leading-relaxed tracking-wide">
                熱愛以數位畫筆和相機記錄生活中的每一份感動。透過電繪創作表達內心世界，
                用攝影捕捉日常中被忽略的美好瞬間。相信每一幅作品都承載著獨特的故事與情感。
              </p>
            </div>

            <!-- 社群連結 -->
            <div class="mt-8 flex items-center justify-center md:justify-start gap-4">
              <a
                href="https://github.com/NCTUyoung"
                target="_blank"
                rel="noopener noreferrer"
                class="p-3 rounded-xl border border-stone-200/60 dark:border-stone-700/60 hover:border-stone-300/80 dark:hover:border-stone-600/80 hover:bg-stone-50/50 dark:hover:bg-stone-700/50 transition-all duration-300 group"
                title="GitHub"
              >
                <svg class="w-5 h-5 text-stone-500 dark:text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
              <a
                href="mailto:nctuyoung@gmail.com"
                class="p-3 rounded-xl border border-stone-200/60 dark:border-stone-700/60 hover:border-stone-300/80 dark:hover:border-stone-600/80 hover:bg-stone-50/50 dark:hover:bg-stone-700/50 transition-all duration-300 group"
                title="Email"
              >
                <svg class="w-5 h-5 text-stone-500 dark:text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 創作領域 -->
    <section class="py-20 bg-stone-50/30 dark:bg-stone-900/30">
      <div class="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
        <h2 class="text-2xl sm:text-3xl font-extralight text-stone-800 dark:text-stone-200 tracking-wider mb-12 text-center">
          創作領域
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- 數位電繪 -->
          <div class="bg-white/70 dark:bg-stone-800/70 backdrop-blur-sm rounded-xl border border-stone-200/60 dark:border-stone-700/60 p-8 hover:border-stone-300/80 dark:hover:border-stone-600/80 transition-all duration-500">
            <div class="flex items-center gap-4 mb-6">
              <div class="w-12 h-12 rounded-xl bg-stone-100/80 dark:bg-stone-700/80 flex items-center justify-center">
                <svg class="w-6 h-6 text-stone-600 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                </svg>
              </div>
              <h3 class="text-xl font-extralight text-stone-800 dark:text-stone-200 tracking-wider">數位電繪</h3>
            </div>
            <p class="text-stone-600 dark:text-stone-400 font-light leading-relaxed tracking-wide mb-6">
              從 2018 年開始數位繪畫創作，探索不同風格與技法。
              從幾何化的動物插畫到精緻的人物繪圖，持續在創作中成長與突破。
            </p>
            <div class="flex flex-wrap gap-2">
              <span v-for="tag in digitalTags" :key="tag"
                    class="px-3 py-1 text-xs font-light text-stone-500 dark:text-stone-400 bg-stone-100/60 dark:bg-stone-700/60 rounded-full tracking-wide">
                {{ tag }}
              </span>
            </div>
          </div>

          <!-- 攝影 -->
          <div class="bg-white/70 dark:bg-stone-800/70 backdrop-blur-sm rounded-xl border border-stone-200/60 dark:border-stone-700/60 p-8 hover:border-stone-300/80 dark:hover:border-stone-600/80 transition-all duration-500">
            <div class="flex items-center gap-4 mb-6">
              <div class="w-12 h-12 rounded-xl bg-stone-100/80 dark:bg-stone-700/80 flex items-center justify-center">
                <svg class="w-6 h-6 text-stone-600 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
              </div>
              <h3 class="text-xl font-extralight text-stone-800 dark:text-stone-200 tracking-wider">攝影紀錄</h3>
            </div>
            <p class="text-stone-600 dark:text-stone-400 font-light leading-relaxed tracking-wide mb-6">
              使用 Nikon Z f 記錄城市街景、活動紀實與日常生活。
              喜歡運用淺景深與自然光線，捕捉充滿故事感的畫面。
            </p>
            <div class="flex flex-wrap gap-2">
              <span v-for="tag in photoTags" :key="tag"
                    class="px-3 py-1 text-xs font-light text-stone-500 dark:text-stone-400 bg-stone-100/60 dark:bg-stone-700/60 rounded-full tracking-wide">
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 使用工具 -->
    <section class="py-20">
      <div class="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
        <h2 class="text-2xl sm:text-3xl font-extralight text-stone-800 dark:text-stone-200 tracking-wider mb-12 text-center">
          工具與器材
        </h2>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div v-for="tool in tools" :key="tool.category"
               class="text-center bg-white/70 dark:bg-stone-800/70 backdrop-blur-sm rounded-xl border border-stone-200/60 dark:border-stone-700/60 p-6 hover:border-stone-300/80 dark:hover:border-stone-600/80 transition-all duration-500">
            <div class="w-10 h-10 mx-auto mb-4 rounded-lg bg-stone-100/80 dark:bg-stone-700/80 flex items-center justify-center">
              <svg class="w-5 h-5 text-stone-600 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="tool.icon" />
              </svg>
            </div>
            <h3 class="text-sm font-medium text-stone-700 dark:text-stone-300 tracking-wider mb-3">{{ tool.category }}</h3>
            <ul class="space-y-1.5">
              <li v-for="item in tool.items" :key="item" class="text-sm text-stone-500 dark:text-stone-400 font-light tracking-wide">
                {{ item }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- 創作歷程 -->
    <section class="py-20 bg-stone-50/30 dark:bg-stone-900/30">
      <div class="max-w-3xl mx-auto px-6 sm:px-8 lg:px-12">
        <h2 class="text-2xl sm:text-3xl font-extralight text-stone-800 dark:text-stone-200 tracking-wider mb-12 text-center">
          創作歷程
        </h2>

        <div class="space-y-8">
          <div v-for="(milestone, index) in milestones" :key="index"
               class="flex gap-6 items-start">
            <!-- 時間軸圓點 -->
            <div class="flex-shrink-0 w-16 text-right">
              <span class="text-sm font-light text-stone-400 dark:text-stone-500 tracking-wide">{{ milestone.year }}</span>
            </div>
            <div class="flex-shrink-0 relative">
              <div class="w-2.5 h-2.5 rounded-full bg-stone-300 dark:bg-stone-600 mt-1.5"></div>
              <div v-if="index < milestones.length - 1" class="absolute top-4 left-1 w-px h-full bg-stone-200 dark:bg-stone-700"></div>
            </div>
            <div class="pb-8">
              <h3 class="text-base font-light text-stone-700 dark:text-stone-300 tracking-wide">{{ milestone.title }}</h3>
              <p class="mt-1 text-sm text-stone-500 dark:text-stone-400 font-light leading-relaxed">{{ milestone.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-20">
      <div class="max-w-3xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
        <h2 class="text-2xl sm:text-3xl font-extralight text-stone-800 dark:text-stone-200 tracking-wider mb-4">
          瀏覽作品集
        </h2>
        <p class="text-stone-500 dark:text-stone-400 font-light tracking-wide mb-8">
          歡迎探索我的數位電繪與攝影作品
        </p>
        <NuxtLink
          to="/gallery"
          class="inline-flex items-center px-8 py-3 border border-stone-300/80 dark:border-stone-600/80 rounded-xl text-stone-600 dark:text-stone-400 font-light tracking-wide hover:bg-stone-50/50 dark:hover:bg-stone-800/50 hover:border-stone-400/80 dark:hover:border-stone-500/80 transition-all duration-300 group"
        >
          前往作品集
          <svg class="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// ===== 圖片路徑 =====
const { getImagePath } = useImagePath()
const avatarPath = getImagePath('gallery/2024年電繪作品/18-4.jpg')

// ===== 資料 =====
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

// ===== SEO =====
useSeoMeta({
  title: '關於我',
  description: '了解 Young 的創作故事——數位電繪藝術家與攝影愛好者，以畫筆與鏡頭記錄生活。',
  ogTitle: '關於 Young - 數位藝術與攝影',
  ogDescription: '了解 Young 的創作故事——數位電繪藝術家與攝影愛好者，以畫筆與鏡頭記錄生活。',
  ogType: 'profile',
  ogUrl: 'https://nctuyoung.github.io/young-portfolio/about',
  ogImage: 'https://nctuyoung.github.io/young-portfolio/images/gallery/2024年電繪作品/18-4.jpg',
  twitterCard: 'summary_large_image'
})
</script>

<style scoped>
/* 響應式優化 */
@media (max-width: 640px) {
  h1 {
    font-size: 2.5rem;
  }
}
</style>
