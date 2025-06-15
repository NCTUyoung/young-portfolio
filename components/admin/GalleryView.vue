<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-200">
    <!-- 載入中 -->
    <div v-if="adminStore.loading" class="text-center py-12">
      <div class="inline-flex items-center">
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-gray-500">載入中...</span>
      </div>
    </div>

    <!-- 無數據 -->
    <div v-else-if="adminStore.groupedManageData.length === 0" class="text-center py-12">
      <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
      </svg>
      <p class="text-gray-500 mb-2">尚無作品</p>
      <p class="text-gray-400 text-sm">請先上傳一些圖片</p>
    </div>

    <!-- 事件列表 -->
    <template v-else>
      <div
        v-for="group in adminStore.groupedManageData"
        :key="group.eventName"
        :class="[
          'bg-gray-50 border border-gray-200 rounded-lg overflow-hidden',
          'mx-6 mb-4',
          { 'mt-6': adminStore.groupedManageData.indexOf(group) === 0 }
        ]"
      >
        <!-- 事件標題 -->
        <div
          class="px-4 py-3 bg-white border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
          @click="adminStore.toggleEventExpand(group.eventName)"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <!-- 展開圖標 -->
              <svg
                :class="[
                  'w-4 h-4 text-gray-400 transition-transform duration-200',
                  adminStore.expandedEvents.includes(group.eventName) ? 'rotate-90' : ''
                ]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
              </svg>

              <div>
                <div class="flex items-center space-x-2">
                  <h4 class="text-base font-medium text-gray-900">{{ group.eventName }}</h4>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {{ group.items.length }} 張
                  </span>
                </div>
                <div v-if="group.description || group.location" class="mt-1 text-sm text-gray-500">
                  {{ group.description }}
                  <span v-if="group.location" class="ml-2">📍 {{ group.location }}</span>
                </div>
              </div>
            </div>

            <!-- 操作按鈕 -->
            <div class="flex items-center space-x-1" @click.stop>
              <button
                @click="adminStore.startEditEvent(group.eventName, group.description, group.location)"
                class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                title="編輯事件"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
              <button
                class="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                title="新增圖片"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 圖片網格 -->
        <div
          v-if="adminStore.expandedEvents.includes(group.eventName)"
          class="p-4"
        >
          <!-- 網格檢視 -->
          <div v-if="adminStore.manageViewMode === 'grid'" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            <div
              v-for="item in group.items"
              :key="item.filename"
              class="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200"
            >
              <img
                :src="`/images/${item.filename}`"
                :alt="item.title"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                @error="handleImageError"
                loading="lazy"
              />

              <!-- 編輯模式覆蓋層 -->
              <div
                v-if="adminStore.editMode"
                class="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center"
              >
                <button
                  @click.stop="adminStore.showDeleteConfirm(item.filename, item.title)"
                  class="opacity-0 group-hover:opacity-100 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200 transform scale-90 hover:scale-100"
                  title="刪除圖片"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clip-rule="evenodd" />
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>

              <!-- 圖片資訊 -->
              <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <p class="text-white text-xs font-medium truncate">{{ item.title }}</p>
                <p class="text-white/80 text-xs mt-1">{{ formatDate(item.time) }}</p>
              </div>
            </div>
          </div>

          <!-- 列表檢視 -->
          <div v-else class="space-y-2">
            <div
              v-for="item in group.items"
              :key="item.filename"
              class="flex items-center space-x-4 p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-all duration-200"
            >
              <img
                :src="`/images/${item.filename}`"
                :alt="item.title"
                class="w-12 h-12 object-cover rounded-lg"
                @error="handleImageError"
                loading="lazy"
              />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ item.title }}</p>
                <p class="text-xs text-gray-500">{{ formatDate(item.time) }}</p>
              </div>
              <div v-if="adminStore.editMode" class="flex-shrink-0">
                <button
                  @click="adminStore.showDeleteConfirm(item.filename, item.title)"
                  class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  title="刪除圖片"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clip-rule="evenodd" />
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
const adminStore = useAdminStore()

// 處理圖片載入錯誤
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

// 格式化日期
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return dateString
  }
}
</script>