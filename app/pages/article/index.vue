<template>
  <div class="min-h-screen bg-stone-50 text-stone-800 dark:bg-stone-900 dark:text-stone-100">
    <div class="mx-auto max-w-3xl px-6 pb-24 pt-20 sm:px-10 sm:pt-28">
      <header class="mb-12 sm:mb-16">
        <h1 class="font-jp text-4xl font-light tracking-[0.08em] sm:text-5xl">文章</h1>
        <p class="mt-5 max-w-xl text-base leading-8 text-stone-600 dark:text-stone-300">
          創作手記，記下繪畫、攝影與製作這個網站時的思考。
        </p>
      </header>

      <section aria-labelledby="article-index-heading">
        <h2 id="article-index-heading" class="mb-5 font-jp text-xl font-light text-stone-700 dark:text-stone-200">目次</h2>
        <ol class="border-t border-stone-300/70 dark:border-stone-600/70">
          <li v-for="preview in previews" :key="preview.kansuji" class="border-b border-stone-300/70 dark:border-stone-600/70">
            <NuxtLink
              v-if="preview.slug"
              :to="`/article/${preview.slug}`"
              class="group block py-6 text-inherit transition-colors hover:text-accent-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent-700 dark:hover:text-accent-300 dark:focus-visible:outline-accent-300 sm:py-8"
            >
              <div class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                <div class="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span class="font-jp text-sm text-stone-600 dark:text-stone-300">{{ preview.kansuji }}</span>
                  <h3 class="font-jp text-xl font-light tracking-[0.04em] sm:text-2xl">{{ preview.title }}</h3>
                </div>
                <span class="text-sm text-stone-600 dark:text-stone-300">{{ preview.trackKana }} · 公開 <span aria-hidden="true">↗</span></span>
              </div>
              <p class="mt-3 max-w-2xl text-sm leading-7 text-stone-600 dark:text-stone-300">{{ preview.description }}</p>
            </NuxtLink>
            <div v-else class="py-6 sm:py-8">
              <div class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                <div class="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span class="font-jp text-sm text-stone-600 dark:text-stone-300">{{ preview.kansuji }}</span>
                  <h3 class="font-jp text-xl font-light tracking-[0.04em] text-stone-700 dark:text-stone-200 sm:text-2xl">{{ preview.title }}</h3>
                </div>
                <span class="text-sm text-stone-600 dark:text-stone-300">{{ preview.trackKana }} · 編纂中</span>
              </div>
            </div>
          </li>
        </ol>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ChapterPreview {
  kansuji: string
  title: string
  description?: string
  trackKana: '繪' | '影' | '両'
  slug?: string
}

const previews: ChapterPreview[] = [
  {
    kansuji: '其の一',
    title: '設計心得',
    description: '從一張白紙到一張畫的思考路徑：構圖、留白、為什麼這格的色塊比那格重要。電繪思維為主，攝影構圖為輔。',
    trackKana: '繪',
    slug: 'design-thinking'
  },
  {
    kansuji: '其の二',
    title: '技術筆記',
    trackKana: '両'
  },
  {
    kansuji: '其の三',
    title: '創作故事',
    trackKana: '両'
  },
  {
    kansuji: '其の四',
    title: '器材評測 — 119mm 的場邊',
    description: 'Nikon Z f 與 119mm 鏡頭的場邊拍攝，以及 DxO 後製。',
    trackKana: '影',
    slug: 'gear-119mm'
  }
]

useSeoMeta({
  title: '文章專區',
  description: '電繪設計心得與 119mm 場邊攝影器材手記。',
  ogTitle: '文章專區 - 創作手記',
  ogDescription: '電繪設計心得與 119mm 場邊攝影器材手記。',
  ogType: 'website',
  ogUrl: 'https://nctuyoung.github.io/young-portfolio/article',
  ogImage: 'https://nctuyoung.github.io/young-portfolio/images/gallery/2024年電繪作品/23.jpg',
  twitterCard: 'summary_large_image'
})
</script>
