<template>
  <div class="space-y-6">
    <!-- 分類選擇 -->
    <div>
      <label for="category" class="block text-sm font-medium text-gray-700 mb-2">
        作品分類
      </label>
      <select
        v-model="adminStore.uploadCategory"
        id="category"
        @change="adminStore.handleUploadCategoryChange(adminStore.uploadCategory)"
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="gallery">繪圖作品</option>
        <option value="photography">攝影作品</option>
      </select>
    </div>

    <!-- 事件設定 -->
    <div>
      <label for="event-name" class="block text-sm font-medium text-gray-700 mb-2">
        事件名稱
      </label>
      <input
        v-model="adminStore.eventName"
        type="text"
        id="event-name"
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="例如：2024創作集、春日街拍"
      />
    </div>

    <!-- 攝影作品專用欄位 -->
    <div v-if="adminStore.uploadCategory === 'photography'" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="event-description" class="block text-sm font-medium text-gray-700 mb-2">
            事件描述
          </label>
          <input
            v-model="adminStore.eventDescription"
            type="text"
            id="event-description"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="例如：城市日常生活紀錄"
          />
        </div>
        <div>
          <label for="event-location" class="block text-sm font-medium text-gray-700 mb-2">
            拍攝地點
          </label>
          <input
            v-model="adminStore.eventLocation"
            type="text"
            id="event-location"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="例如：台北市"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const adminStore = useAdminStore()
</script>