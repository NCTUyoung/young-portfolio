<template>
  <div>
    <!-- 英雄区域 -->
    <div class="bg-white">
      <div class="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <div class="text-center">
          <h1 class="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            欢迎来到 NCTU Young
          </h1>
          <p class="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            这里是交大青年的聚集地，分享生活，分享快乐。
          </p>
        </div>
      </div>
    </div>

    <!-- 特色内容 -->
    <div class="bg-gray-50 py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <!-- 图片库卡片 -->
          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-6">
              <h3 class="text-lg font-medium text-gray-900">图片库</h3>
              <p class="mt-2 text-sm text-gray-500">
                浏览精彩的校园生活照片，记录美好瞬间。
              </p>
              <div class="mt-4">
                <NuxtLink to="/gallery" class="text-indigo-600 hover:text-indigo-500">
                  查看图片库 →
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- 文章卡片 -->
          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-6">
              <h3 class="text-lg font-medium text-gray-900">文章</h3>
              <p class="mt-2 text-sm text-gray-500">
                阅读精选文章，了解校园动态。
              </p>
              <div class="mt-4">
                <NuxtLink to="/article" class="text-indigo-600 hover:text-indigo-500">
                  阅读文章 →
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- 关于我们卡片 -->
          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-6">
              <h3 class="text-lg font-medium text-gray-900">关于我们</h3>
              <p class="mt-2 text-sm text-gray-500">
                了解更多关于 NCTU Young 的故事。
              </p>
              <div class="mt-4">
                <NuxtLink to="/about" class="text-indigo-600 hover:text-indigo-500">
                  了解更多 →
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
// 首页组件的逻辑
</script>