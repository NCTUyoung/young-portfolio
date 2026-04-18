<template>
  <div v-if="adminStore.selectedFiles.length > 0">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-xs font-light uppercase tracking-wider text-stone-500 dark:text-stone-400">
        已選擇圖片 <span class="font-medium text-accent-600 dark:text-accent-400">{{ adminStore.selectedFiles.length }}</span>
      </h3>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="(file, index) in adminStore.selectedFiles"
        :key="index"
        class="overflow-hidden rounded-xl border border-stone-100 bg-stone-50/50 dark:border-stone-700 dark:bg-stone-800/40"
      >
        <!-- 圖片預覽 -->
        <div class="relative">
          <img
            :src="file.preview"
            :alt="file.name"
            class="w-full h-44 object-cover"
          >
          <button
            class="absolute right-2 top-2 rounded-full bg-white/80 p-1.5 text-stone-500 shadow-sm transition-colors duration-200 hover:bg-red-50 hover:text-red-500 dark:bg-stone-800/90 dark:text-stone-300 dark:hover:bg-red-950/80"
            title="移除"
            @click="adminStore.removeFile(index)"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- 表單 -->
        <div class="p-4 space-y-3">
          <div>
            <label class="block text-xs font-light text-stone-400 mb-1 tracking-wide">標題</label>
            <input
              v-model="file.title"
              type="text"
              class="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-sm text-stone-700 placeholder-stone-300 focus:border-transparent focus:outline-none focus:ring-1 focus:ring-accent-400 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200 dark:placeholder-stone-500"
              :placeholder="file.name.split('.')[0]"
            >
          </div>
          <div>
            <label class="block text-xs font-light text-stone-400 mb-1 tracking-wide">描述</label>
            <textarea
              v-model="file.content"
              rows="2"
              class="w-full resize-none rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-sm text-stone-700 placeholder-stone-300 focus:border-transparent focus:outline-none focus:ring-1 focus:ring-accent-400 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200 dark:placeholder-stone-500"
              placeholder="圖片描述…"
            />
          </div>

          <!-- 繪圖作品專用 -->
          <div v-if="adminStore.uploadCategory === 'gallery'" class="space-y-3">
            <div>
              <label class="block text-xs font-light text-stone-400 mb-1 tracking-wide">
                創作日期 <span class="text-red-400">*</span>
              </label>
              <input
                v-model="file.creationDate"
                type="date"
                class="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-sm text-stone-700 focus:border-transparent focus:outline-none focus:ring-1 focus:ring-accent-400 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200"
              >
              <p class="mt-1 text-xs font-light text-stone-400 dark:text-stone-500">已從檔案修改時間自動推斷，可依需求調整</p>
            </div>
            <div>
              <label class="block text-xs font-light text-stone-400 mb-1 tracking-wide">顏色標籤</label>
              <select
                v-model="file.color"
                class="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-sm text-stone-700 focus:border-transparent focus:outline-none focus:ring-1 focus:ring-accent-400 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200"
              >
                <option value="blue">藍色</option>
                <option value="red">紅色</option>
                <option value="green">綠色</option>
                <option value="yellow">黃色</option>
                <option value="purple">紫色</option>
                <option value="orange">橙色</option>
                <option value="amber">琥珀色</option>
              </select>
            </div>
          </div>

          <!-- 攝影作品專用 -->
          <div v-if="adminStore.uploadCategory === 'photography'">
            <label class="block text-xs font-light text-stone-400 mb-1 tracking-wide">標籤（選填）</label>
            <input
              v-model="file.tags"
              type="text"
              class="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-sm text-stone-700 placeholder-stone-300 focus:border-transparent focus:outline-none focus:ring-1 focus:ring-accent-400 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200 dark:placeholder-stone-500"
              placeholder="例如：人像,街拍"
            >
            <p class="mt-1 text-xs font-light text-stone-400 dark:text-stone-500">相機資訊會自動從照片讀取</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const adminStore = useAdminStore()
</script>
