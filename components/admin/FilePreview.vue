<template>
  <div v-if="adminStore.selectedFiles.length > 0">
    <h3 class="text-lg font-medium text-gray-900 mb-4">
      已選擇的圖片 ({{ adminStore.selectedFiles.length }})
    </h3>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="(file, index) in adminStore.selectedFiles"
        :key="index"
        class="bg-gray-50 rounded-lg p-4"
      >
        <div class="aspect-w-16 aspect-h-9 mb-3">
          <img
            :src="file.preview"
            :alt="file.name"
            class="w-full h-48 object-cover rounded-md"
          />
        </div>
        <div class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">
              標題
            </label>
            <input
              v-model="file.title"
              type="text"
              class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              :placeholder="file.name.split('.')[0]"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">
              描述
            </label>
            <textarea
              v-model="file.content"
              rows="2"
              class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="圖片描述..."
            />
          </div>
          <!-- 繪圖作品專用欄位 -->
          <div v-if="adminStore.uploadCategory === 'gallery'">
            <label class="block text-xs font-medium text-gray-700 mb-1">
              顏色標籤
            </label>
            <select
              v-model="file.color"
              class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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
          <!-- 攝影作品專用欄位 -->
          <div v-if="adminStore.uploadCategory === 'photography'" class="space-y-2">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">
                額外標籤 (可選)
              </label>
              <input
                v-model="file.tags"
                type="text"
                class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="例如：人像,街拍,藝術"
              />
              <p class="text-xs text-gray-500 mt-1">
                相機設定（ISO、光圈、快門等）會自動從照片讀取
              </p>
            </div>
          </div>
          <button
            @click="adminStore.removeFile(index)"
            class="w-full px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            移除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const adminStore = useAdminStore()
</script>

<style scoped>
.aspect-w-16 {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
}

.aspect-w-16 > img {
  position: absolute;
  height: 100%;
  width: 100%;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}
</style>