<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 導航欄 -->
    <nav class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <div class="flex items-center">
            <h1 class="text-2xl font-bold text-gray-900">後台管理系統</h1>
          </div>
          <div class="flex items-center space-x-4">
            <NuxtLink to="/" class="text-gray-600 hover:text-gray-900">
              返回首頁
            </NuxtLink>
          </div>
        </div>
      </div>
    </nav>

    <!-- 主要內容 -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-xl font-semibold text-gray-900">批次圖片上傳</h2>
          <p class="mt-1 text-sm text-gray-600">
            上傳多張圖片並設定相關資訊，系統會自動更新圖庫JSON檔案
          </p>
        </div>

        <div class="p-6">
          <!-- 分類選擇 -->
          <div class="mb-6">
            <label for="category" class="block text-sm font-medium text-gray-700 mb-2">
              作品分類
            </label>
            <select
              v-model="selectedCategory"
              id="category"
              @change="handleCategoryChange"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="gallery">繪圖作品</option>
              <option value="photography">攝影作品</option>
            </select>
          </div>

          <!-- 事件設定 -->
          <div class="mb-6">
            <label for="event-name" class="block text-sm font-medium text-gray-700 mb-2">
              事件名稱
            </label>
            <input
              v-model="eventName"
              type="text"
              id="event-name"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="例如：2024創作集、春日街拍"
            />
          </div>

          <!-- 攝影作品專用欄位 -->
          <div v-if="selectedCategory === 'photography'" class="mb-6 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="event-description" class="block text-sm font-medium text-gray-700 mb-2">
                  事件描述
                </label>
                <input
                  v-model="eventDescription"
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
                  v-model="eventLocation"
                  type="text"
                  id="event-location"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例如：台北市"
                />
              </div>
            </div>
          </div>

          <!-- 檔案上傳區域 -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              選擇圖片
            </label>
            <div
              @drop="handleDrop"
              @dragover.prevent
              @dragenter.prevent
              class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
            >
              <input
                ref="fileInput"
                type="file"
                multiple
                accept="image/*"
                @change="handleFileSelect"
                class="hidden"
              />
              <div class="space-y-2">
                <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <div class="text-sm text-gray-600">
                  <button
                    @click="fileInput?.click()"
                    class="font-medium text-blue-600 hover:text-blue-500"
                  >
                    點擊選擇檔案
                  </button>
                  或拖拽檔案到這裡
                </div>
                <p class="text-xs text-gray-500">
                  支援 PNG, JPG, GIF 格式，單檔最大50MB，總計最大200MB
                </p>
              </div>
            </div>
          </div>

          <!-- 預覽區域 -->
          <div v-if="selectedFiles.length > 0" class="mb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">
              已選擇的圖片 ({{ selectedFiles.length }})
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div
                v-for="(file, index) in selectedFiles"
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
                  <div v-if="selectedCategory === 'gallery'">
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
                  <div v-if="selectedCategory === 'photography'" class="space-y-2">
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
                    @click="removeFile(index)"
                    class="w-full px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  >
                    移除
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 上傳按鈕 -->
          <div class="flex justify-end space-x-4">
            <button
              @click="clearFiles"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              清除所有
            </button>
            <button
              @click="uploadFiles"
              :disabled="!canUpload || uploading"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="uploading" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                上傳中...
              </span>
              <span v-else>
                上傳圖片 ({{ selectedFiles.length }})
              </span>
            </button>
          </div>

          <!-- 狀態提示 -->
          <div v-if="message" class="mt-4">
            <div
              :class="[
                'p-4 rounded-md',
                messageType === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              ]"
            >
              {{ message }}
            </div>
          </div>
        </div>
      </div>

      <!-- 已上傳圖片列表 -->
      <div class="bg-gradient-to-br from-stone-50 to-neutral-100 rounded-2xl shadow-sm border border-stone-200/50 mt-8 overflow-hidden">
        <div class="px-8 py-6 bg-white/80 backdrop-blur-sm border-b border-stone-200/30">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-2xl font-light text-stone-800 tracking-wide">作品集</h2>
              <p class="mt-2 text-sm text-stone-500 font-light">
                {{ selectedCategory === 'gallery' ? '繪圖作品' : '攝影作品' }} ・ 按事件分組顯示
              </p>
            </div>
            <div class="flex items-center space-x-4">
              <!-- 檢視模式切換 -->
              <div class="flex items-center bg-stone-100/70 rounded-xl p-1">
                <button
                  @click="viewMode = 'grid'"
                  :class="[
                    'p-2.5 rounded-lg transition-all duration-200',
                    viewMode === 'grid'
                      ? 'bg-white text-stone-700 shadow-sm'
                      : 'text-stone-400 hover:text-stone-600 hover:bg-white/50'
                  ]"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  @click="viewMode = 'list'"
                  :class="[
                    'p-2.5 rounded-lg transition-all duration-200',
                    viewMode === 'list'
                      ? 'bg-white text-stone-700 shadow-sm'
                      : 'text-stone-400 hover:text-stone-600 hover:bg-white/50'
                  ]"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
              <button
                @click="loadGallery"
                class="px-5 py-2.5 text-sm font-light text-stone-600 bg-white/70 border border-stone-200/50 rounded-xl hover:bg-white hover:shadow-sm transition-all duration-200"
              >
                重新載入
              </button>
            </div>
          </div>
        </div>

        <div class="p-8">
          <div v-if="loading" class="text-center py-12">
            <div class="inline-flex items-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-stone-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span class="text-stone-500 font-light">載入中...</span>
            </div>
          </div>

          <div v-else-if="groupedGalleryData.length > 0" class="space-y-8">
            <!-- 統計資訊 -->
            <div class="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-stone-200/30">
              <div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div class="group">
                  <div class="text-3xl font-extralight text-stone-700 mb-1">{{ galleryData.length }}</div>
                  <div class="text-xs text-stone-500 font-light tracking-wider uppercase">總圖片數</div>
                </div>
                <div class="group">
                  <div class="text-3xl font-extralight text-amber-600 mb-1">{{ groupedGalleryData.length }}</div>
                  <div class="text-xs text-stone-500 font-light tracking-wider uppercase">事件數量</div>
                </div>
                <div v-if="selectedCategory === 'photography'" class="group">
                  <div class="text-3xl font-extralight text-emerald-600 mb-1">{{ uniqueCameras.length }}</div>
                  <div class="text-xs text-stone-500 font-light tracking-wider uppercase">相機型號</div>
                </div>
                <div v-else class="group">
                  <div class="text-3xl font-extralight text-rose-500 mb-1">{{ uniqueColors.length }}</div>
                  <div class="text-xs text-stone-500 font-light tracking-wider uppercase">顏色類型</div>
                </div>
                <div class="group">
                  <div class="text-3xl font-extralight text-indigo-500 mb-1">{{ recentUploads }}</div>
                  <div class="text-xs text-stone-500 font-light tracking-wider uppercase">本月新增</div>
                </div>
              </div>
            </div>

            <!-- 按事件分組顯示 -->
            <div class="space-y-6">
              <div
                v-for="group in groupedGalleryData"
                :key="group.eventName"
                class="bg-white/40 backdrop-blur-sm border border-stone-200/40 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
              >
                <!-- 事件標題 -->
                <div class="bg-gradient-to-r from-stone-50/80 to-neutral-50/80 px-6 py-4 border-b border-stone-200/30">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                      <h3 class="text-xl font-light text-stone-800 tracking-wide">
                        {{ group.eventName }}
                      </h3>
                      <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-light bg-stone-200/60 text-stone-600 border border-stone-300/30">
                        {{ group.items.length }} 張
                      </span>
                      <button
                        @click="toggleEventExpand(group.eventName)"
                        class="text-stone-400 hover:text-stone-600 transition-colors duration-200"
                      >
                        <svg
                          :class="[
                            'w-5 h-5 transition-transform duration-200',
                            expandedEvents.includes(group.eventName) ? 'rotate-180' : ''
                          ]"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    <div class="text-sm text-stone-500 font-light">
                      {{ group.description }}
                      <span v-if="group.location" class="ml-3 text-stone-400">・ {{ group.location }}</span>
                    </div>
                  </div>
                </div>

                <!-- 圖片內容 -->
                <div
                  v-show="expandedEvents.includes(group.eventName)"
                  class="p-6"
                >
                  <!-- 網格檢視 -->
                  <div
                    v-if="viewMode === 'grid'"
                    class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4"
                  >
                    <div
                      v-for="(item, index) in group.items"
                      :key="index"
                      class="group relative bg-stone-100/50 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                    >
                      <div class="aspect-square">
                        <img
                          :src="`/images/${item.filename}`"
                          :alt="item.title"
                          class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      <!-- 懸浮資訊 -->
                      <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end">
                        <div class="w-full p-4 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                          <h4 class="text-sm font-light truncate mb-1">{{ item.title }}</h4>
                          <p class="text-xs opacity-80 truncate mb-2">{{ item.content }}</p>
                          <div class="flex justify-between items-center">
                            <span class="text-xs opacity-70 font-light">{{ item.time }}</span>
                            <div v-if="selectedCategory === 'photography' && (item as any).camera" class="text-xs opacity-80">
                              {{ (item as any).camera }}
                            </div>
                            <div v-else-if="selectedCategory === 'gallery'" class="flex items-center space-x-1">
                              <span
                                :class="[
                                  'inline-block w-3 h-3 rounded-full border border-white/30',
                                  getColorClass((item as GalleryItem).color || 'blue')
                                ]"
                              ></span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 列表檢視 -->
                  <div v-else class="space-y-3">
                    <div
                      v-for="(item, index) in group.items"
                      :key="index"
                      class="flex items-center space-x-5 p-4 bg-white/60 backdrop-blur-sm rounded-xl hover:bg-white/80 hover:shadow-sm transition-all duration-200 border border-stone-200/30"
                    >
                      <img
                        :src="`/images/${item.filename}`"
                        :alt="item.title"
                        class="w-16 h-16 object-cover rounded-lg flex-shrink-0 shadow-sm"
                        loading="lazy"
                      />
                      <div class="flex-1 min-w-0">
                        <h4 class="text-sm font-light text-stone-800 truncate mb-1">{{ item.title }}</h4>
                        <p class="text-sm text-stone-600 truncate mb-2">{{ item.content }}</p>
                        <div class="flex items-center space-x-4">
                          <span class="text-xs text-stone-400 font-light">{{ item.time }}</span>
                          <span class="text-xs text-stone-400 font-light">{{ item.filename }}</span>
                        </div>
                      </div>
                      <div class="flex-shrink-0">
                        <div v-if="selectedCategory === 'photography' && (item as any).camera" class="text-right">
                          <div class="text-xs text-stone-600 font-light mb-1">{{ (item as any).camera }}</div>
                          <div v-if="(item as any).tags" class="text-xs text-amber-600 font-light">
                            {{ Array.isArray((item as any).tags) ? (item as any).tags.join(' ・ ') : (item as any).tags }}
                          </div>
                        </div>
                        <div v-else-if="selectedCategory === 'gallery'" class="flex items-center">
                          <span
                            :class="[
                              'inline-block w-4 h-4 rounded-full border border-stone-300/50 shadow-sm',
                              getColorClass((item as GalleryItem).color || 'blue')
                            ]"
                          ></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-16 text-stone-400">
            <svg class="mx-auto h-16 w-16 text-stone-300 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p class="text-lg font-light text-stone-500 mb-2">暫無{{ selectedCategory === 'gallery' ? '繪圖作品' : '攝影作品' }}</p>
            <p class="text-sm font-light text-stone-400">上傳一些圖片開始使用吧</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  FileWithMeta,
  GalleryItem,
  PhotographyItem,
  CategoryType,
  COLOR_OPTIONS
} from '~/types/gallery'
import { COLOR_CLASS_MAP } from '~/types/gallery'

type UnifiedGalleryItem = GalleryItem | PhotographyItem

// Template ref
const fileInput = ref<HTMLInputElement>()

// 響應式數據
const selectedCategory = ref('gallery')
const eventName = ref('')
const eventDescription = ref('')
const eventLocation = ref('')
const selectedFiles = ref<FileWithMeta[]>([])
const uploading = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')
const galleryData = ref<UnifiedGalleryItem[]>([])
const loading = ref(false)
const viewMode = ref<'grid' | 'list'>('grid')
const expandedEvents = ref<string[]>(['預設事件']) // 預設展開第一個事件

// 計算屬性
const canUpload = computed(() => {
  return selectedFiles.value.length > 0 && eventName.value.trim() !== ''
})

// 按事件分組的圖片數據
const groupedGalleryData = computed(() => {
  const groups: Record<string, {
    eventName: string
    description: string
    location: string
    items: UnifiedGalleryItem[]
  }> = {}

  galleryData.value.forEach(item => {
    let currentEventName = '預設事件'
    let description = '未分類作品'
    let location = ''

    // 檢查是否有事件資訊
    if (selectedCategory.value === 'photography' && (item as any).event) {
      const event = (item as any).event
      currentEventName = event.name || '預設事件'
      description = event.description || '未分類作品'
      location = event.location || ''
    } else if (eventName.value && item.time) {
      // 使用上傳時的事件名稱
      currentEventName = eventName.value
      description = eventDescription.value || '未分類作品'
      location = eventLocation.value || ''
    }

    if (!groups[currentEventName]) {
      groups[currentEventName] = {
        eventName: currentEventName,
        description,
        location,
        items: []
      }
    }

    groups[currentEventName].items.push(item)
  })

  // 轉換為陣列並按時間排序
  return Object.values(groups).map(group => ({
    ...group,
    items: group.items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()),
    // 計算事件的最新時間（用於事件間排序）
    latestTime: Math.max(...group.items.map(item => new Date(item.time).getTime()))
  })).sort((a, b) => {
    // 優先按最新圖片時間排序（新事件在前）
    const timeDiff = b.latestTime - a.latestTime
    if (timeDiff !== 0) return timeDiff
    // 時間相同時按圖片數量排序
    return b.items.length - a.items.length
  })
})

// 統計資訊
const uniqueCameras = computed(() => {
  if (selectedCategory.value !== 'photography') return []
  const cameras = new Set<string>()
  galleryData.value.forEach(item => {
    const camera = (item as any).camera
    if (camera && camera !== 'Unknown') {
      cameras.add(camera)
    }
  })
  return Array.from(cameras)
})

const uniqueColors = computed(() => {
  if (selectedCategory.value !== 'gallery') return []
  const colors = new Set<string>()
  galleryData.value.forEach(item => {
    const color = (item as GalleryItem).color
    if (color) {
      colors.add(color)
    }
  })
  return Array.from(colors)
})

const recentUploads = computed(() => {
  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  return galleryData.value.filter(item => {
    const itemDate = new Date(item.time)
    return itemDate >= thisMonth
  }).length
})

// 分類切換處理
const handleCategoryChange = () => {
  // 清空表單數據
  selectedFiles.value = []
  eventName.value = ''
  eventDescription.value = ''
  eventLocation.value = ''
  message.value = ''

  // 重新載入對應分類的圖片列表
  loadGallery()
}

// 檔案選擇處理
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    processFiles(Array.from(target.files))
  }
}

// 拖拽處理
const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer?.files) {
    processFiles(Array.from(event.dataTransfer.files))
  }
}

// 處理檔案
const processFiles = (files: File[]) => {
  files.forEach(file => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const newFile: FileWithMeta = {
          file,
          name: file.name,
          preview: e.target?.result as string,
          title: file.name.split('.')[0],
          content: '',
          color: 'blue'
        }

        // 如果是攝影分類，添加攝影專用欄位
        if (selectedCategory.value === 'photography') {
          (newFile as any).tags = ''
        }

        selectedFiles.value.push(newFile)
      }
      reader.readAsDataURL(file)
    }
  })
}

// 移除檔案
const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1)
}

// 清除所有檔案
const clearFiles = () => {
  selectedFiles.value = []
  message.value = ''
}

// 上傳檔案
const uploadFiles = async () => {
  if (!canUpload.value) return

  uploading.value = true
  message.value = ''

  try {
    const formData = new FormData()
    formData.append('event', eventName.value)
    formData.append('eventDescription', eventDescription.value)
    formData.append('eventLocation', eventLocation.value)
    formData.append('category', selectedCategory.value)

    selectedFiles.value.forEach((fileData) => {
      formData.append('files', fileData.file)
      formData.append(`title_${fileData.name}`, fileData.title)
      formData.append(`content_${fileData.name}`, fileData.content)

      if (selectedCategory.value === 'photography') {
        // 攝影作品專用欄位 - 只需要傳遞用戶自定義標籤
        if (fileData.tags) formData.append(`tags_${fileData.name}`, fileData.tags)
      } else {
        // 繪圖作品專用欄位
        formData.append(`color_${fileData.name}`, fileData.color || 'blue')
      }
    })

    const response = await $fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    if (response.success) {
      message.value = response.message
      messageType.value = 'success'
      selectedFiles.value = []
      eventName.value = ''
      eventDescription.value = ''
      eventLocation.value = ''
      // 重新載入圖片列表
      await loadGallery()
    }
  } catch (error) {
    console.error('Upload failed:', error)
    message.value = '上傳失敗，請稍後再試'
    messageType.value = 'error'
  } finally {
    uploading.value = false
  }
}

// 載入圖片列表
const loadGallery = async () => {
  loading.value = true
  try {
    const response = await $fetch('/api/gallery', {
      query: { category: selectedCategory.value }
    }) as { success: boolean; data: { Img: GalleryItem[] } }
    if (response.success && response.data) {
      // 載入數據並按時間排序（新到舊）
      const sortedData = (response.data.Img || []).sort((a, b) => {
        return new Date(b.time).getTime() - new Date(a.time).getTime()
      })
      galleryData.value = sortedData
    }
  } catch (error) {
    console.error('Load gallery failed:', error)
    message.value = '載入圖片列表失敗，請稍後再試'
    messageType.value = 'error'
  } finally {
    loading.value = false
  }
}

// 顏色樣式對應
const getColorClass = (color?: string) => {
  if (!color) return 'bg-gray-500'
  return COLOR_CLASS_MAP[color] || 'bg-gray-500'
}

// 切換事件展開/收合
const toggleEventExpand = (eventName: string) => {
  const index = expandedEvents.value.indexOf(eventName)
  if (index > -1) {
    expandedEvents.value.splice(index, 1)
  } else {
    expandedEvents.value.push(eventName)
  }
}

// 組件掛載時載入圖片列表
onMounted(() => {
  loadGallery()
  // 預設展開第一個事件
  nextTick(() => {
    if (groupedGalleryData.value.length > 0) {
      expandedEvents.value = [groupedGalleryData.value[0].eventName]
    }
  })
})

// 頁面標題
useHead({
  title: '後台管理 - 圖片上傳'
})
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