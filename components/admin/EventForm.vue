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

    <!-- 攝影作品事件設定 -->
    <div v-if="adminStore.uploadCategory === 'photography'" class="space-y-4">
      <!-- 事件模式選擇 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-3">
          事件設定 <span class="text-red-500">*</span>
        </label>
        <div class="space-y-3">
          <label class="flex items-center">
            <input
              v-model="adminStore.eventMode"
              type="radio"
              value="new"
              class="mr-3 text-blue-600 focus:ring-blue-500"
            />
            <span class="text-sm text-gray-700">創建新事件</span>
          </label>
          <label v-if="availablePhotographyEvents.length > 0" class="flex items-center">
            <input
              v-model="adminStore.eventMode"
              type="radio"
              value="existing"
              class="mr-3 text-blue-600 focus:ring-blue-500"
            />
            <span class="text-sm text-gray-700">添加到現有事件</span>
          </label>
        </div>
      </div>

      <!-- 選擇現有事件 -->
      <div v-if="adminStore.eventMode === 'existing' && availablePhotographyEvents.length > 0">
        <label for="existing-event" class="block text-sm font-medium text-gray-700 mb-2">
          選擇事件 <span class="text-red-500">*</span>
        </label>
        <select
          v-model="adminStore.selectedExistingEvent"
          id="existing-event"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">請選擇事件...</option>
          <option v-for="event in availablePhotographyEvents" :key="event" :value="event">
            {{ event }}
          </option>
        </select>
      </div>

      <!-- 創建新事件 -->
      <div v-if="adminStore.eventMode === 'new'">
        <label for="event-name" class="block text-sm font-medium text-gray-700 mb-2">
          事件名稱 <span class="text-red-500">*</span>
        </label>
        <input
          v-model="adminStore.eventName"
          type="text"
          id="event-name"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="例如：春日街拍、2024新北耶誕城"
        />
      </div>

      <!-- 事件詳細信息（僅新事件需要） -->
      <div v-if="adminStore.eventMode === 'new'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      <!-- 現有事件提示 -->
      <div v-if="adminStore.eventMode === 'existing' && adminStore.selectedExistingEvent" class="bg-green-50 border border-green-200 rounded-lg p-4">
        <div class="flex items-start">
          <svg class="w-5 h-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <h4 class="text-sm font-medium text-green-800 mb-1">添加到現有事件</h4>
            <p class="text-sm text-green-700">
              圖片將被添加到「{{ adminStore.selectedExistingEvent }}」事件中，並保持該事件的原有設定。
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 自動事件推斷說明 -->
    <div v-else class="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div class="flex items-start">
        <svg class="w-5 h-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <div>
          <h4 class="text-sm font-medium text-blue-800 mb-1">自動事件分類</h4>
          <p class="text-sm text-blue-700">
            繪圖作品會根據創作時間自動分類到對應年份的事件中，例如「2024年電繪作品」。
          </p>
        </div>
      </div>
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

// 計算屬性 - 獲取攝影作品的可用事件列表
const availablePhotographyEvents = computed(() => adminStore.availablePhotographyEvents)
</script>