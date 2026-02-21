<template>
  <div class="space-y-5">
    <!-- 攝影作品事件設定 -->
    <div v-if="adminStore.uploadCategory === 'photography'" class="space-y-4">
      <div>
        <label class="block text-xs font-light text-stone-500 mb-3 tracking-wider uppercase">
          事件設定 <span class="text-red-400">*</span>
        </label>
        <div class="space-y-2">
          <label class="flex items-center cursor-pointer">
            <input
              v-model="adminStore.eventMode"
              type="radio"
              value="new"
              class="mr-3 text-amber-500 focus:ring-amber-400"
            >
            <span class="text-sm font-light text-stone-700">建立新事件</span>
          </label>
          <label v-if="availablePhotographyEvents.length > 0" class="flex items-center cursor-pointer">
            <input
              v-model="adminStore.eventMode"
              type="radio"
              value="existing"
              class="mr-3 text-amber-500 focus:ring-amber-400"
            >
            <span class="text-sm font-light text-stone-700">加入現有事件</span>
          </label>
        </div>
      </div>

      <!-- 選擇現有事件 -->
      <div v-if="adminStore.eventMode === 'existing' && availablePhotographyEvents.length > 0">
        <label class="block text-xs font-light text-stone-500 mb-2 tracking-wider uppercase">
          選擇事件 <span class="text-red-400">*</span>
        </label>
        <select
          v-model="adminStore.selectedExistingEvent"
          class="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-stone-50 text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
        >
          <option value="">請選擇事件…</option>
          <option v-for="event in availablePhotographyEvents" :key="event" :value="event">
            {{ event }}
          </option>
        </select>
      </div>

      <!-- 建立新事件 -->
      <div v-if="adminStore.eventMode === 'new'">
        <label class="block text-xs font-light text-stone-500 mb-2 tracking-wider uppercase">
          事件名稱 <span class="text-red-400">*</span>
        </label>
        <input
          v-model="adminStore.eventName"
          type="text"
          class="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-stone-50 text-stone-700 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          placeholder="例如：春日街拍、2024 新北耶誕城"
        >
      </div>

      <!-- 事件詳細（新事件） -->
      <div v-if="adminStore.eventMode === 'new'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-light text-stone-500 mb-2 tracking-wider uppercase">事件描述</label>
          <input
            v-model="adminStore.eventDescription"
            type="text"
            class="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-stone-50 text-stone-700 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            placeholder="例如：城市日常生活紀錄"
          >
        </div>
        <div>
          <label class="block text-xs font-light text-stone-500 mb-2 tracking-wider uppercase">拍攝地點</label>
          <input
            v-model="adminStore.eventLocation"
            type="text"
            class="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-stone-50 text-stone-700 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            placeholder="例如：台北市"
          >
        </div>
      </div>

      <!-- 現有事件提示 -->
      <div v-if="adminStore.eventMode === 'existing' && adminStore.selectedExistingEvent" class="bg-amber-50 border border-amber-100 rounded-lg p-4">
        <div class="flex items-start space-x-3">
          <svg class="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p class="text-xs font-medium text-amber-800 mb-1">加入現有事件</p>
            <p class="text-xs text-amber-700 font-light">
              圖片將被加入「{{ adminStore.selectedExistingEvent }}」，並保留該事件的原有設定。
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 繪圖作品：自動事件說明 -->
    <div v-else class="bg-stone-50 border border-stone-100 rounded-lg p-4">
      <div class="flex items-start space-x-3">
        <svg class="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p class="text-xs font-medium text-stone-600 mb-1">自動事件分類</p>
          <p class="text-xs text-stone-500 font-light">
            繪圖作品會根據創作時間自動分類到對應年份的事件中，例如「2024年電繪作品」。
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const adminStore = useAdminStore()
const availablePhotographyEvents = computed(() => adminStore.availablePhotographyEvents)
</script>
