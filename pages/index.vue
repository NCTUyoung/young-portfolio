<template>
  <div>
    <!-- 英雄區域 -->
    <div class="bg-white/60 backdrop-blur-sm">
      <div class="max-w-7xl mx-auto py-24 px-6 sm:py-32 sm:px-8 lg:px-12">
        <div class="text-center max-w-4xl mx-auto">
          <h1 class="text-5xl font-extralight text-stone-800 sm:text-6xl sm:tracking-wider lg:text-7xl leading-tight">
            歡迎來到 NCTU Young
          </h1>
          <p class="mt-8 max-w-2xl mx-auto text-xl text-stone-600 font-light leading-relaxed tracking-wide">
            這裡是交大青年的聚集地，分享生活，分享快樂。
          </p>
        </div>
      </div>
    </div>

    <!-- 特色內容 -->
    <div class="bg-stone-50/30 py-20">
      <div class="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div class="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
          <!-- 圖片庫卡片 -->
          <div class="bg-white/70 backdrop-blur-sm overflow-hidden border border-stone-200/60 rounded-xl hover:border-stone-300/80 transition-all duration-500 group">
            <div class="p-8">
              <h3 class="text-2xl font-extralight text-stone-800 tracking-wider leading-relaxed">圖片庫</h3>
              <p class="mt-4 text-stone-600 font-light leading-relaxed tracking-wide">
                瀏覽精彩的校園生活照片，記錄美好瞬間。
              </p>
              <div class="mt-6">
                <NuxtLink to="/gallery" class="text-stone-600 hover:text-stone-800 font-light tracking-wide transition-colors duration-300 relative group-hover:translate-x-1 inline-flex items-center">
                  查看圖片庫
                  <svg class="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                  </svg>
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- 文章卡片 -->
          <div class="bg-white/70 backdrop-blur-sm overflow-hidden border border-stone-200/60 rounded-xl hover:border-stone-300/80 transition-all duration-500 group">
            <div class="p-8">
              <h3 class="text-2xl font-extralight text-stone-800 tracking-wider leading-relaxed">文章</h3>
              <p class="mt-4 text-stone-600 font-light leading-relaxed tracking-wide">
                閱讀精選文章，了解校園動態。
              </p>
              <div class="mt-6">
                <NuxtLink to="/article" class="text-stone-600 hover:text-stone-800 font-light tracking-wide transition-colors duration-300 relative group-hover:translate-x-1 inline-flex items-center">
                  閱讀文章
                  <svg class="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                  </svg>
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- 關於我們卡片 -->
          <div class="bg-white/70 backdrop-blur-sm overflow-hidden border border-stone-200/60 rounded-xl hover:border-stone-300/80 transition-all duration-500 group">
            <div class="p-8">
              <h3 class="text-2xl font-extralight text-stone-800 tracking-wider leading-relaxed">關於我們</h3>
              <p class="mt-4 text-stone-600 font-light leading-relaxed tracking-wide">
                了解更多關於 NCTU Young 的故事。
              </p>
              <div class="mt-6">
                <NuxtLink to="/about" class="text-stone-600 hover:text-stone-800 font-light tracking-wide transition-colors duration-300 relative group-hover:translate-x-1 inline-flex items-center">
                  了解更多
                  <svg class="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                  </svg>
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 首頁組件的邏輯

// SEO 優化
useHead({
  title: 'NCTU Young - 交大青年聚集地',
  meta: [
    { name: 'description', content: '交大青年的聚集地，分享生活，分享快樂。瀏覽精彩校園照片，閱讀精選文章，了解更多校園動態。' }
  ]
})
</script>

<style scoped>
/* 優化動畫效果 */
.group:hover .group-hover\:translate-x-1 {
  transform: translateX(0.25rem);
}

/* 響應式設計優化 */
@media (max-width: 640px) {
  h1 {
    font-size: 2.5rem;
    line-height: 1.1;
  }

  .grid {
    gap: 2rem;
  }
}
</style>