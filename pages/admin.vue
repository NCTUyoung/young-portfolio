<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 頂部導航 -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <h1 class="text-2xl font-bold text-gray-900">後台管理系統</h1>
        <NuxtLink to="/" class="text-gray-600 hover:text-gray-900">返回首頁</NuxtLink>
          </div>
    </header>

    <!-- Tab 導航 -->
    <nav class="max-w-7xl mx-auto px-6 pt-6">
      <div class="bg-white rounded-t-xl shadow-sm border-b border-gray-200">
        <div class="flex space-x-8 px-6">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 flex items-center space-x-2',
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            <!-- 圖標 -->
            <svg v-if="tab.id === 'overview'" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
            </svg>
            <svg v-else-if="tab.id === 'upload'" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
            <svg v-else-if="tab.id === 'manage'" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            <svg v-else-if="tab.id === 'settings'" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
            </svg>

            <span>{{ tab.name }}</span>
            <span v-if="tab.id === 'upload' && adminStore.selectedFiles.length > 0"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {{ adminStore.selectedFiles.length }}
            </span>
          </button>
        </div>
      </div>
    </nav>

    <!-- 主要內容區域 -->
    <main class="max-w-7xl mx-auto px-6 pb-8">
      <div class="bg-white rounded-b-xl shadow-sm">

        <!-- 概覽頁面 -->
        <section v-if="activeTab === 'overview'" class="p-8">
          <!-- 頁面標題和控制 -->
          <header class="mb-8 flex justify-between items-start">
            <div>
              <h2 class="text-2xl font-light text-gray-900 mb-2">系統概覽</h2>
              <p class="text-gray-600">查看整體數據統計和最近活動</p>
            </div>
            <div class="flex items-center space-x-4">
              <div class="flex items-center space-x-2">
                <label class="text-sm font-medium text-gray-700">分類：</label>
                <select
                  v-model="adminStore.overviewCategory"
                  @change="adminStore.handleOverviewCategoryChange(adminStore.overviewCategory)"
                  class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="gallery">繪圖作品</option>
                  <option value="photography">攝影作品</option>
                </select>
        </div>
              <div class="flex items-center space-x-2">
                <label class="text-sm font-medium text-gray-700">檢視：</label>
                <div class="flex items-center bg-gray-100 rounded-lg p-1">
            <button
                    @click="adminStore.overviewViewMode = 'grid'"
                    :class="[
                      'p-1.5 rounded-md transition-all duration-200 text-xs',
                      adminStore.overviewViewMode === 'grid'
                        ? 'bg-white text-gray-700 shadow-sm'
                        : 'text-gray-400 hover:text-gray-600'
                    ]"
                  >
                    網格
            </button>
            <button
                    @click="adminStore.overviewViewMode = 'list'"
                    :class="[
                      'p-1.5 rounded-md transition-all duration-200 text-xs',
                      adminStore.overviewViewMode === 'list'
                        ? 'bg-white text-gray-700 shadow-sm'
                        : 'text-gray-400 hover:text-gray-600'
                    ]"
                  >
                    列表
                  </button>
                </div>
              </div>
            </div>
          </header>

          <!-- 統計卡片 -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-blue-600 text-sm font-medium">總圖片數</p>
                  <p class="text-2xl font-bold text-blue-900">{{ adminStore.overviewStats.totalImages }}</p>
                </div>
                <svg class="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>

            <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-green-600 text-sm font-medium">本月新增</p>
                  <p class="text-2xl font-bold text-green-900">{{ adminStore.overviewStats.recentUploads }}</p>
                </div>
                <svg class="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>

            <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-purple-600 text-sm font-medium">
                    {{ adminStore.overviewCategory === 'photography' ? '相機數量' : '色彩數量' }}
                  </p>
                  <p class="text-2xl font-bold text-purple-900">
                    {{ adminStore.overviewCategory === 'photography'
                        ? adminStore.overviewStats.uniqueCameras.length
                        : adminStore.overviewStats.uniqueColors.length }}
                  </p>
                </div>
                <svg class="w-8 h-8 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>

            <div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-orange-600 text-sm font-medium">事件數量</p>
                  <p class="text-2xl font-bold text-orange-900">{{ adminStore.overviewStats.events.length || 1 }}</p>
                </div>
                <svg class="w-8 h-8 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <!-- 最近上傳 -->
          <section class="mt-8">
            <h3 class="text-lg font-medium text-gray-900 mb-4">最近上傳的作品</h3>
            <div v-if="adminStore.recentItems.length > 0" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div
                v-for="item in adminStore.recentItems.slice(0, 12)"
                :key="item.filename"
                class="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                :title="item.title"
              >
                <img
                  :src="getImagePath(item.filename)"
                  :alt="item.title"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  @error="handleImageError"
                  loading="lazy"
                />
                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200"></div>
                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <p class="text-white text-xs font-medium truncate">{{ item.title }}</p>
                  <p class="text-white/80 text-xs mt-1">{{ formatDate(item.time) }}</p>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-12 text-gray-500">
              <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
              </svg>
              <p>尚無上傳的作品</p>
            </div>
          </section>
        </section>

        <!-- 上傳頁面 -->
        <section v-if="activeTab === 'upload'" class="p-8">
          <header class="mb-8 flex justify-between items-start">
            <div>
              <h2 class="text-2xl font-light text-gray-900 mb-2">上傳作品</h2>
              <p class="text-gray-600">新增圖片到您的作品集</p>
            </div>
            <div class="flex items-center space-x-2">
              <label class="text-sm font-medium text-gray-700">分類：</label>
              <select
                v-model="adminStore.uploadCategory"
                @change="adminStore.handleUploadCategoryChange(adminStore.uploadCategory)"
                class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="gallery">繪圖作品</option>
                <option value="photography">攝影作品</option>
              </select>
            </div>
          </header>

          <div class="space-y-8">
            <!-- 事件設定表單 -->
            <AdminEventForm />

            <!-- 檔案上傳區域 -->
            <AdminFileUploadArea />

            <!-- 檔案預覽區域 -->
            <AdminFilePreview />

            <!-- 上傳按鈕和狀態 -->
            <div class="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                @click="adminStore.clearFiles"
                class="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
              >
                清除所有
              </button>
              <button
                @click="adminStore.uploadFiles"
                :disabled="!adminStore.canUpload || adminStore.uploading"
                class="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <span v-if="adminStore.uploading" class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  上傳中...
                </span>
                <span v-else>
                  上傳圖片
                  <span v-if="adminStore.selectedFiles.length > 0" class="ml-1 px-2 py-0.5 bg-blue-500 text-xs text-white rounded-full">
                    {{ adminStore.selectedFiles.length }}
                  </span>
                </span>
              </button>
            </div>

            <!-- 狀態提示 -->
            <div v-if="adminStore.message" class="mt-6">
              <div
                :class="[
                  'p-4 rounded-lg border',
                  adminStore.messageType === 'success'
                    ? 'bg-green-50 text-green-800 border-green-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                ]"
              >
                <div class="flex items-start">
                  <svg v-if="adminStore.messageType === 'success'" class="w-5 h-5 text-green-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  <svg v-else class="w-5 h-5 text-red-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                  <span>{{ adminStore.message }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 管理頁面 -->
        <section v-if="activeTab === 'manage'" class="p-8">
          <header class="mb-6 flex justify-between items-start">
            <div>
              <h2 class="text-2xl font-light text-gray-900 mb-2">管理作品</h2>
              <p class="text-gray-600">編輯和管理您的作品集</p>
            </div>
            <div class="flex items-center space-x-4">
              <div class="flex items-center space-x-2">
                <label class="text-sm font-medium text-gray-700">分類：</label>
                <select
                  v-model="adminStore.manageCategory"
                  @change="adminStore.handleManageCategoryChange(adminStore.manageCategory)"
                  class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="gallery">繪圖作品</option>
                  <option value="photography">攝影作品</option>
                </select>
              </div>
              <div class="flex items-center space-x-2">
                <label class="text-sm font-medium text-gray-700">事件：</label>
                <select
                  v-model="adminStore.selectedEvent"
                  class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">所有事件</option>
                  <option v-for="event in adminStore.availableEvents" :key="event" :value="event">
                    {{ event }}
                  </option>
                </select>
              </div>
              <div class="flex items-center space-x-2">
                <label class="text-sm font-medium text-gray-700">檢視：</label>
                <div class="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    @click="adminStore.manageViewMode = 'grid'"
                    :class="[
                      'p-1.5 rounded-md transition-all duration-200 text-xs',
                      adminStore.manageViewMode === 'grid'
                        ? 'bg-white text-gray-700 shadow-sm'
                        : 'text-gray-400 hover:text-gray-600'
                    ]"
                  >
                    網格
                  </button>
                  <button
                    @click="adminStore.manageViewMode = 'list'"
                    :class="[
                      'p-1.5 rounded-md transition-all duration-200 text-xs',
                      adminStore.manageViewMode === 'list'
                        ? 'bg-white text-gray-700 shadow-sm'
                        : 'text-gray-400 hover:text-gray-600'
                    ]"
                  >
                    列表
                  </button>
                </div>
              </div>
              <button
                @click="adminStore.toggleEditMode"
              :class="[
                  'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  adminStore.editMode
                    ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200'
                ]"
              >
                <svg v-if="adminStore.editMode" class="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
                <svg v-else class="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                {{ adminStore.editMode ? '退出編輯' : '編輯模式' }}
              </button>
              <button
                @click="adminStore.loadGalleryByCategory(adminStore.manageCategory)"
                class="px-3 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                重新載入
              </button>
            </div>
          </header>

          <!-- 統計資訊 -->
          <div class="mb-6 flex items-center space-x-4 text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-3">
            <span>共 <span class="font-medium text-gray-900">{{ adminStore.currentManageData.length }}</span> 張圖片</span>
            <span class="text-gray-300">•</span>
            <span><span class="font-medium text-gray-900">{{ adminStore.groupedManageData.length }}</span> 個事件</span>
            <span v-if="adminStore.selectedEvent" class="text-gray-300">•</span>
            <span v-if="adminStore.selectedEvent" class="text-blue-600 font-medium">
              篩選：{{ adminStore.selectedEvent }}
            </span>
          </div>

          <AdminGalleryView />
        </section>

        <!-- 設定頁面 -->
        <section v-if="activeTab === 'settings'" class="p-8">
          <header class="mb-8">
            <h2 class="text-2xl font-light text-gray-900 mb-2">系統設定</h2>
            <p class="text-gray-600">配置系統偏好和功能選項</p>
          </header>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- 預設設定 -->
            <div class="bg-gray-50 rounded-lg p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">預設設定</h3>
              <div class="space-y-4">
                <div>
                                     <label class="block text-sm font-medium text-gray-700 mb-2">預設分類</label>
                   <select
                     v-model="adminStore.globalSettings.defaultUploadCategory"
                     @change="adminStore.updateGlobalSettings({ defaultUploadCategory: adminStore.globalSettings.defaultUploadCategory })"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   >
                    <option value="gallery">繪圖作品</option>
                    <option value="photography">攝影作品</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">預設檢視模式</label>
                  <div class="flex space-x-4">
                    <label class="flex items-center">
                      <input
                        v-model="adminStore.globalSettings.defaultViewMode"
                        type="radio"
                        value="grid"
                        class="mr-2 text-blue-600 focus:ring-blue-500"
                        @change="adminStore.updateGlobalSettings({ defaultViewMode: 'grid' })"
                      />
                      網格檢視
                    </label>
                    <label class="flex items-center">
                      <input
                        v-model="adminStore.globalSettings.defaultViewMode"
                        type="radio"
                        value="list"
                        class="mr-2 text-blue-600 focus:ring-blue-500"
                        @change="adminStore.updateGlobalSettings({ defaultViewMode: 'list' })"
                      />
                      列表檢視
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- 圖片處理 -->
            <div class="bg-gray-50 rounded-lg p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">圖片處理</h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    圖片品質：{{ adminStore.globalSettings.imageQuality }}%
                  </label>
                  <input
                    v-model="adminStore.globalSettings.imageQuality"
                    type="range"
                    min="60"
                    max="100"
                    step="5"
                    class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    @change="adminStore.updateGlobalSettings({ imageQuality: parseInt(adminStore.globalSettings.imageQuality.toString()) })"
                  />
                  <div class="flex justify-between text-xs text-gray-500 mt-1">
                    <span>60%</span>
                    <span>100%</span>
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    批次處理大小：{{ adminStore.globalSettings.batchSize }}
                  </label>
                  <input
                    v-model="adminStore.globalSettings.batchSize"
                    type="range"
                    min="10"
                    max="50"
                    step="5"
                    class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    @change="adminStore.updateGlobalSettings({ batchSize: parseInt(adminStore.globalSettings.batchSize.toString()) })"
                  />
                  <div class="flex justify-between text-xs text-gray-500 mt-1">
                    <span>10</span>
                    <span>50</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 系統功能 -->
            <div class="bg-gray-50 rounded-lg p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">系統功能</h3>
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <label class="text-sm font-medium text-gray-700">自動備份</label>
                    <p class="text-xs text-gray-500">自動備份上傳的圖片</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input
                      v-model="adminStore.globalSettings.autoBackup"
                      type="checkbox"
                      class="sr-only peer"
                      @change="adminStore.updateGlobalSettings({ autoBackup: adminStore.globalSettings.autoBackup })"
                    />
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div class="flex items-center justify-between">
                  <div>
                    <label class="text-sm font-medium text-gray-700">顯示圖片資訊</label>
                    <p class="text-xs text-gray-500">在預覽中顯示 EXIF 資訊</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input
                      v-model="adminStore.globalSettings.showImageInfo"
                      type="checkbox"
                      class="sr-only peer"
                      @change="adminStore.updateGlobalSettings({ showImageInfo: adminStore.globalSettings.showImageInfo })"
                    />
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
          </div>
        </div>
      </div>

            <!-- 介面偏好 -->
            <div class="bg-gray-50 rounded-lg p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">介面偏好</h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">主題</label>
                  <div class="flex space-x-4">
                    <label class="flex items-center">
                      <input
                        v-model="adminStore.globalSettings.theme"
                        type="radio"
                        value="light"
                        class="mr-2 text-blue-600 focus:ring-blue-500"
                        @change="adminStore.updateGlobalSettings({ theme: 'light' })"
                      />
                      淺色
                    </label>
                    <label class="flex items-center">
                      <input
                        v-model="adminStore.globalSettings.theme"
                        type="radio"
                        value="dark"
                        class="mr-2 text-blue-600 focus:ring-blue-500"
                        @change="adminStore.updateGlobalSettings({ theme: 'dark' })"
                      />
                      深色
                    </label>
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">語言</label>
                  <select
                    v-model="adminStore.globalSettings.language"
                    @change="adminStore.updateGlobalSettings({ language: adminStore.globalSettings.language })"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="zh-TW">繁體中文</option>
                    <option value="zh-CN">简体中文</option>
                    <option value="en-US">English</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </main>

    <!-- 確認刪除對話框 -->
    <AdminConfirmDialog
      :is-visible="adminStore.showConfirmDialog"
      title="刪除圖片"
      :message="`您確定要刪除圖片「${adminStore.deleteImageInfo?.title}」嗎？`"
      details="此操作無法復原，圖片將從檔案系統和資料庫中永久移除。"
      @confirm="adminStore.confirmDeleteImage"
      @cancel="adminStore.cancelDeleteImage"
    />

    <!-- 圖片編輯對話框 -->
    <AdminImageEditDialog
      :is-visible="adminStore.showImageEditDialog"
      :image-data="adminStore.editingImageData"
      :category="adminStore.manageCategory"
      @confirm="adminStore.confirmEditImage"
      @cancel="adminStore.cancelEditImage"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'

const adminStore = useAdminStore()
const { getImagePath } = useImagePath()

// Tab 狀態
const activeTab = ref('overview')

// Tab 定義
const tabs = ref([
  { id: 'overview', name: '概覽' },
  { id: 'upload', name: '上傳' },
  { id: 'manage', name: '管理' },
  { id: 'settings', name: '設定' }
])

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

// 初始化
onMounted(async () => {
  try {
    // 載入設定
    adminStore.loadGlobalSettings()

    // 載入預設資料（兩個分類都載入）
    await Promise.all([
      adminStore.loadGalleryByCategory('gallery'),
      adminStore.loadGalleryByCategory('photography')
    ])

  // 預設展開第一個事件
    await nextTick()
    if (adminStore.groupedManageData.length > 0) {
      adminStore.expandedEvents = [adminStore.groupedManageData[0].eventName]
    }
  } catch (error) {
    console.error('Failed to initialize admin page:', error)
  }
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