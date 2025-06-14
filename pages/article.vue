<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 頁面標題 -->
    <div class="bg-white shadow">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div class="text-center">
          <h1 class="text-4xl font-bold text-gray-900 mb-4">文章專區</h1>
          <p class="text-lg text-gray-600 max-w-2xl mx-auto">
            分享設計心得、技術筆記與創作故事
          </p>
        </div>
      </div>
    </div>

    <!-- 內容區域 -->
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="text-center py-16">
        <div class="text-gray-400 text-6xl mb-6">📝</div>
        <h2 class="text-2xl font-semibold text-gray-900 mb-4">即將推出</h2>
        <p class="text-gray-600 mb-8 max-w-md mx-auto">
          文章功能正在開發中，敬請期待更多精彩內容與設計分享！
        </p>

        <div class="space-x-4">
          <NuxtLink
            to="/gallery"
            class="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            瀏覽作品集
          </NuxtLink>

          <NuxtLink
            to="/"
            class="inline-flex items-center px-6 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors"
          >
            返回首頁
          </NuxtLink>
        </div>
      </div>

      <!-- 預告內容 -->
      <div class="grid md:grid-cols-3 gap-8 mt-16">
        <div class="text-center p-6 bg-white rounded-lg shadow-sm">
          <div class="text-blue-600 text-3xl mb-4">🎨</div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">設計心得</h3>
          <p class="text-gray-600 text-sm">分享設計過程中的思考與技巧</p>
        </div>

        <div class="text-center p-6 bg-white rounded-lg shadow-sm">
          <div class="text-green-600 text-3xl mb-4">💻</div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">技術筆記</h3>
          <p class="text-gray-600 text-sm">記錄開發過程中的學習與收穫</p>
        </div>

        <div class="text-center p-6 bg-white rounded-lg shadow-sm">
          <div class="text-purple-600 text-3xl mb-4">✨</div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">創作故事</h3>
          <p class="text-gray-600 text-sm">每個作品背後的靈感與故事</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 頁面 meta
useHead({
  title: '文章專區',
  meta: [
    {
      name: 'description',
      content: '分享設計心得、技術筆記與創作故事'
    }
  ]
})
</script>