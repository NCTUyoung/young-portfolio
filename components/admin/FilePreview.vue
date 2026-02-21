<template>
  <div v-if="adminStore.selectedFiles.length > 0">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-xs font-light text-stone-500 tracking-wider uppercase">
        已選擇圖片 <span class="text-amber-600 font-medium">{{ adminStore.selectedFiles.length }}</span>
      </h3>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="(file, index) in adminStore.selectedFiles"
        :key="index"
        class="border border-stone-100 rounded-xl overflow-hidden bg-stone-50/50"
      >
        <!-- 圖片預覽 -->
        <div class="relative">
          <img
            :src="file.preview"
            :alt="file.name"
            class="w-full h-44 object-cover"
          />
          <button
            @click="adminStore.removeFile(index)"
            class="absolute top-2 right-2 p-1.5 bg-white/80 text-stone-500 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors duration-200 shadow-sm"
            title="移除"
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
              class="w-full px-2.5 py-1.5 text-sm border border-stone-200 rounded-lg bg-white text-stone-700 placeholder-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-transparent"
              :placeholder="file.name.split('.')[0]"
            />
          </div>
          <div>
            <label class="block text-xs font-light text-stone-400 mb-1 tracking-wide">描述</label>
            <textarea
              v-model="file.content"
              rows="2"
              class="w-full px-2.5 py-1.5 text-sm border border-stone-200 rounded-lg bg-white text-stone-700 placeholder-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-transparent resize-none"
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
                class="w-full px-2.5 py-1.5 text-sm border border-stone-200 rounded-lg bg-white text-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-xs font-light text-stone-400 mb-1 tracking-wide">顏色標籤</label>
              <select
                v-model="file.color"
                class="w-full px-2.5 py-1.5 text-sm border border-stone-200 rounded-lg bg-white text-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-transparent"
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
              class="w-full px-2.5 py-1.5 text-sm border border-stone-200 rounded-lg bg-white text-stone-700 placeholder-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-transparent"
              placeholder="例如：人像,街拍"
            />
            <p class="text-xs text-stone-400 font-light mt-1">相機資訊會自動從照片讀取</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const adminStore = useAdminStore()
</script>
