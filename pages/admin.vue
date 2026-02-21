<template>
  <div class="min-h-screen bg-stone-50">
    <!-- 頂部導航 -->
    <header class="bg-stone-950 border-b border-stone-800">
      <div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div class="flex items-center space-x-3">
          <div class="w-1 h-6 bg-amber-500"></div>
          <h1 class="text-lg font-light text-stone-100 tracking-wider">後台管理</h1>
        </div>
        <NuxtLink to="/" class="text-stone-400 hover:text-stone-100 text-sm transition-colors duration-200 flex items-center space-x-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>返回首頁</span>
        </NuxtLink>
      </div>
    </header>

    <!-- Tab 導航 -->
    <nav class="max-w-7xl mx-auto px-6 pt-6">
      <div class="bg-white rounded-t-xl border border-stone-200 border-b-0">
        <div class="flex space-x-0 px-2">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'py-4 px-5 border-b-2 font-light text-sm transition-all duration-200 flex items-center space-x-2',
              activeTab === tab.id
                ? 'border-amber-500 text-stone-900'
                : 'border-transparent text-stone-400 hover:text-stone-700 hover:border-stone-300'
            ]"
          >
            <svg v-if="tab.id === 'overview'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <svg v-else-if="tab.id === 'upload'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <svg v-else-if="tab.id === 'manage'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <svg v-else-if="tab.id === 'settings'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{{ tab.name }}</span>
            <span v-if="tab.id === 'upload' && adminStore.selectedFiles.length > 0"
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
              {{ adminStore.selectedFiles.length }}
            </span>
          </button>
        </div>
      </div>
    </nav>

    <!-- 主要內容區域 -->
    <main class="max-w-7xl mx-auto px-6 pb-12">
      <div class="bg-white rounded-b-xl border border-stone-200 border-t-0">

        <!-- 概覽頁面 -->
        <section v-if="activeTab === 'overview'" class="p-8">
          <!-- 頁面標題和控制 -->
          <header class="mb-8 flex justify-between items-start">
            <div>
              <h2 class="text-xl font-light text-stone-900 mb-1 tracking-wide">系統概覽</h2>
              <p class="text-stone-400 text-sm font-light">查看整體數據統計</p>
            </div>
            <div class="flex items-center space-x-3">
              <select
                v-model="adminStore.overviewCategory"
                @change="adminStore.handleOverviewCategoryChange(adminStore.overviewCategory)"
                class="px-3 py-1.5 text-sm border border-stone-200 rounded-lg bg-stone-50 text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              >
                <option value="gallery">繪圖作品</option>
                <option value="photography">攝影作品</option>
              </select>
            </div>
          </header>

          <!-- 統計卡片 -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <div class="border border-stone-100 rounded-xl p-5 bg-stone-50">
              <p class="text-xs text-stone-400 font-light tracking-wider uppercase mb-2">總圖片數</p>
              <p class="text-3xl font-extralight text-stone-800">{{ adminStore.overviewStats.totalImages }}</p>
            </div>
            <div class="border border-amber-100 rounded-xl p-5 bg-amber-50/40">
              <p class="text-xs text-stone-400 font-light tracking-wider uppercase mb-2">本月新增</p>
              <p class="text-3xl font-extralight text-amber-600">{{ adminStore.overviewStats.recentUploads }}</p>
            </div>
            <div class="border border-stone-100 rounded-xl p-5 bg-stone-50">
              <p class="text-xs text-stone-400 font-light tracking-wider uppercase mb-2">
                {{ adminStore.overviewCategory === 'photography' ? '相機型號' : '色彩類型' }}
              </p>
              <p class="text-3xl font-extralight text-stone-800">
                {{ adminStore.overviewCategory === 'photography'
                    ? adminStore.overviewStats.uniqueCameras.length
                    : adminStore.overviewStats.uniqueColors.length }}
              </p>
            </div>
            <div class="border border-stone-100 rounded-xl p-5 bg-stone-50">
              <p class="text-xs text-stone-400 font-light tracking-wider uppercase mb-2">事件數量</p>
              <p class="text-3xl font-extralight text-stone-800">{{ adminStore.overviewStats.events.length || groupedOverviewData.length }}</p>
            </div>
          </div>

          <!-- 月份分布圖表 -->
          <section class="mb-10">
            <h3 class="text-sm font-light text-stone-500 tracking-wider uppercase mb-5">近 6 個月新增</h3>
            <div class="flex items-end space-x-3 h-32">
              <div
                v-for="month in monthlyStats"
                :key="month.label"
                class="flex-1 flex flex-col items-center space-y-2"
              >
                <span class="text-xs text-stone-500 font-light">{{ month.count }}</span>
                <div
                  class="w-full rounded-t-sm bg-amber-400/70 transition-all duration-300 min-h-[4px]"
                  :style="{ height: month.count > 0 ? `${Math.max(8, (month.count / maxMonthCount) * 80)}px` : '4px' }"
                ></div>
                <span class="text-xs text-stone-400 font-light">{{ month.label }}</span>
              </div>
            </div>
          </section>

          <!-- 最近上傳 -->
          <section>
            <h3 class="text-sm font-light text-stone-500 tracking-wider uppercase mb-4">最近上傳</h3>
            <div v-if="adminStore.recentItems.length > 0" class="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-3">
              <div
                v-for="item in adminStore.recentItems.slice(0, 16)"
                :key="item.filename"
                class="group relative aspect-square rounded-lg overflow-hidden bg-stone-100 cursor-pointer"
                :title="item.title"
              >
                <img
                  :src="getImagePath(item.filename)"
                  :alt="item.title"
                  class="w-full h-full object-contain bg-stone-100 group-hover:scale-105 transition-transform duration-300"
                  @error="handleImageError"
                  loading="lazy"
                />
                <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200"></div>
                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <p class="text-white text-xs font-light truncate">{{ item.title }}</p>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-16 text-stone-400">
              <svg class="w-10 h-10 mx-auto mb-3 text-stone-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p class="text-sm font-light">尚無上傳的作品</p>
            </div>
          </section>
        </section>

        <!-- 上傳頁面 -->
        <section v-if="activeTab === 'upload'" class="p-8">
          <header class="mb-8 flex justify-between items-start">
            <div>
              <h2 class="text-xl font-light text-stone-900 mb-1 tracking-wide">上傳作品</h2>
              <p class="text-stone-400 text-sm font-light">新增圖片到您的作品集</p>
            </div>
            <div class="flex items-center space-x-2">
              <label class="text-sm font-light text-stone-500">分類：</label>
              <select
                v-model="adminStore.uploadCategory"
                @change="adminStore.handleUploadCategoryChange(adminStore.uploadCategory)"
                class="px-3 py-1.5 text-sm border border-stone-200 rounded-lg bg-stone-50 text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              >
                <option value="gallery">繪圖作品</option>
                <option value="photography">攝影作品</option>
              </select>
            </div>
          </header>

          <div class="space-y-8">
            <AdminEventForm />
            <AdminFileUploadArea />
            <AdminFilePreview />

            <!-- 上傳按鈕和狀態 -->
            <div class="flex justify-end space-x-3 pt-6 border-t border-stone-100">
              <button
                @click="adminStore.clearFiles"
                class="px-5 py-2 text-sm font-light text-stone-600 bg-stone-100 border border-stone-200 rounded-lg hover:bg-stone-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-400 transition-all duration-200"
              >
                清除所有
              </button>
              <button
                @click="adminStore.uploadFiles"
                :disabled="!adminStore.canUpload || adminStore.uploading"
                class="px-5 py-2 text-sm font-light text-white bg-stone-800 border border-transparent rounded-lg hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              >
                <span v-if="adminStore.uploading" class="flex items-center space-x-2">
                  <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>上傳中…</span>
                </span>
                <span v-else class="flex items-center space-x-2">
                  <span>上傳圖片</span>
                  <span v-if="adminStore.selectedFiles.length > 0" class="px-1.5 py-0.5 bg-amber-500 text-xs text-white rounded-full">
                    {{ adminStore.selectedFiles.length }}
                  </span>
                </span>
              </button>
            </div>

            <!-- 狀態提示 -->
            <div v-if="adminStore.message" class="mt-4">
              <div
                :class="[
                  'p-4 rounded-lg border flex items-start space-x-3',
                  adminStore.messageType === 'success'
                    ? 'bg-stone-50 text-stone-700 border-stone-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                ]"
              >
                <svg v-if="adminStore.messageType === 'success'" class="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <svg v-else class="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="text-sm font-light">{{ adminStore.message }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- 管理頁面 -->
        <section v-if="activeTab === 'manage'" class="p-8">
          <header class="mb-6 flex flex-wrap gap-3 justify-between items-start">
            <div>
              <h2 class="text-xl font-light text-stone-900 mb-1 tracking-wide">管理作品</h2>
              <p class="text-stone-400 text-sm font-light">編輯和管理您的作品集</p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <select
                v-model="adminStore.manageCategory"
                @change="adminStore.handleManageCategoryChange(adminStore.manageCategory)"
                class="px-3 py-1.5 text-sm border border-stone-200 rounded-lg bg-stone-50 text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              >
                <option value="gallery">繪圖作品</option>
                <option value="photography">攝影作品</option>
              </select>

              <select
                v-model="adminStore.selectedEvent"
                class="px-3 py-1.5 text-sm border border-stone-200 rounded-lg bg-stone-50 text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              >
                <option value="">所有事件</option>
                <option v-for="event in adminStore.availableEvents" :key="event" :value="event">
                  {{ event }}
                </option>
              </select>

              <!-- 檢視切換 -->
              <div class="flex items-center bg-stone-100 rounded-lg p-1">
                <button
                  @click="adminStore.manageViewMode = 'grid'"
                  :class="[
                    'px-3 py-1 rounded-md transition-all duration-200 text-xs font-light',
                    adminStore.manageViewMode === 'grid'
                      ? 'bg-white text-stone-800 shadow-sm'
                      : 'text-stone-400 hover:text-stone-600'
                  ]"
                >
                  網格
                </button>
                <button
                  @click="adminStore.manageViewMode = 'list'"
                  :class="[
                    'px-3 py-1 rounded-md transition-all duration-200 text-xs font-light',
                    adminStore.manageViewMode === 'list'
                      ? 'bg-white text-stone-800 shadow-sm'
                      : 'text-stone-400 hover:text-stone-600'
                  ]"
                >
                  列表
                </button>
              </div>

              <!-- 編輯模式 -->
              <button
                @click="adminStore.toggleEditMode"
                :class="[
                  'px-3 py-1.5 text-xs font-light rounded-lg transition-all duration-200 flex items-center space-x-1.5',
                  adminStore.editMode
                    ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200'
                ]"
              >
                <svg v-if="adminStore.editMode" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>{{ adminStore.editMode ? '退出編輯' : '編輯模式' }}</span>
              </button>

              <button
                @click="adminStore.loadGalleryByCategory(adminStore.manageCategory)"
                class="px-3 py-1.5 text-xs font-light text-stone-500 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors duration-200"
                title="重新載入"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </header>

          <!-- 統計資訊 -->
          <div class="mb-5 flex items-center space-x-4 text-xs text-stone-400 font-light bg-stone-50 rounded-lg px-4 py-2.5 border border-stone-100">
            <span>共 <span class="font-medium text-stone-700">{{ adminStore.currentManageData.length }}</span> 張圖片</span>
            <span class="text-stone-200">•</span>
            <span><span class="font-medium text-stone-700">{{ adminStore.groupedManageData.length }}</span> 個事件</span>
            <span v-if="adminStore.selectedEvent" class="text-stone-200">•</span>
            <span v-if="adminStore.selectedEvent" class="text-amber-600 font-medium">
              篩選：{{ adminStore.selectedEvent }}
            </span>
          </div>

          <AdminGalleryView @switch-to-upload="handleSwitchToUpload" />
        </section>

        <!-- 設定頁面 -->
        <section v-if="activeTab === 'settings'" class="p-8">
          <header class="mb-8">
            <h2 class="text-xl font-light text-stone-900 mb-1 tracking-wide">系統設定</h2>
            <p class="text-stone-400 text-sm font-light">配置系統偏好和功能選項</p>
          </header>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- 預設設定 -->
            <div class="border border-stone-100 rounded-xl p-6 bg-stone-50/50">
              <h3 class="text-sm font-medium text-stone-700 mb-5 tracking-wide">預設設定</h3>
              <div class="space-y-5">
                <div>
                  <label class="block text-xs font-light text-stone-500 mb-2 tracking-wider uppercase">預設分類</label>
                  <select
                    v-model="adminStore.globalSettings.defaultUploadCategory"
                    @change="adminStore.updateGlobalSettings({ defaultUploadCategory: adminStore.globalSettings.defaultUploadCategory })"
                    class="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  >
                    <option value="gallery">繪圖作品</option>
                    <option value="photography">攝影作品</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-light text-stone-500 mb-2 tracking-wider uppercase">預設檢視模式</label>
                  <div class="flex space-x-4">
                    <label class="flex items-center text-sm font-light text-stone-600 cursor-pointer">
                      <input
                        v-model="adminStore.globalSettings.defaultViewMode"
                        type="radio"
                        value="grid"
                        class="mr-2 text-amber-500 focus:ring-amber-400"
                        @change="adminStore.updateGlobalSettings({ defaultViewMode: 'grid' })"
                      />
                      網格
                    </label>
                    <label class="flex items-center text-sm font-light text-stone-600 cursor-pointer">
                      <input
                        v-model="adminStore.globalSettings.defaultViewMode"
                        type="radio"
                        value="list"
                        class="mr-2 text-amber-500 focus:ring-amber-400"
                        @change="adminStore.updateGlobalSettings({ defaultViewMode: 'list' })"
                      />
                      列表
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- 圖片處理 -->
            <div class="border border-stone-100 rounded-xl p-6 bg-stone-50/50">
              <h3 class="text-sm font-medium text-stone-700 mb-5 tracking-wide">圖片處理</h3>
              <div class="space-y-5">
                <div>
                  <label class="block text-xs font-light text-stone-500 mb-2 tracking-wider uppercase">
                    圖片品質：<span class="text-amber-600">{{ adminStore.globalSettings.imageQuality }}%</span>
                  </label>
                  <input
                    v-model="adminStore.globalSettings.imageQuality"
                    type="range"
                    min="60"
                    max="100"
                    step="5"
                    class="w-full h-1.5 bg-stone-200 rounded-full appearance-none cursor-pointer accent-amber-500"
                    @change="adminStore.updateGlobalSettings({ imageQuality: parseInt(adminStore.globalSettings.imageQuality.toString()) })"
                  />
                  <div class="flex justify-between text-xs text-stone-400 mt-1">
                    <span>60%</span><span>100%</span>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-light text-stone-500 mb-2 tracking-wider uppercase">
                    批次大小：<span class="text-amber-600">{{ adminStore.globalSettings.batchSize }}</span>
                  </label>
                  <input
                    v-model="adminStore.globalSettings.batchSize"
                    type="range"
                    min="10"
                    max="50"
                    step="5"
                    class="w-full h-1.5 bg-stone-200 rounded-full appearance-none cursor-pointer accent-amber-500"
                    @change="adminStore.updateGlobalSettings({ batchSize: parseInt(adminStore.globalSettings.batchSize.toString()) })"
                  />
                  <div class="flex justify-between text-xs text-stone-400 mt-1">
                    <span>10</span><span>50</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 系統功能 -->
            <div class="border border-stone-100 rounded-xl p-6 bg-stone-50/50">
              <h3 class="text-sm font-medium text-stone-700 mb-5 tracking-wide">系統功能</h3>
              <div class="space-y-5">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-light text-stone-700">自動備份</p>
                    <p class="text-xs text-stone-400 font-light">自動備份上傳的圖片</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input v-model="adminStore.globalSettings.autoBackup" type="checkbox" class="sr-only peer"
                      @change="adminStore.updateGlobalSettings({ autoBackup: adminStore.globalSettings.autoBackup })" />
                    <div class="w-10 h-5 bg-stone-200 peer-focus:ring-2 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-light text-stone-700">顯示圖片資訊</p>
                    <p class="text-xs text-stone-400 font-light">在預覽中顯示 EXIF 資訊</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input v-model="adminStore.globalSettings.showImageInfo" type="checkbox" class="sr-only peer"
                      @change="adminStore.updateGlobalSettings({ showImageInfo: adminStore.globalSettings.showImageInfo })" />
                    <div class="w-10 h-5 bg-stone-200 peer-focus:ring-2 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>
              </div>
            </div>

            <!-- 介面偏好 -->
            <div class="border border-stone-100 rounded-xl p-6 bg-stone-50/50">
              <h3 class="text-sm font-medium text-stone-700 mb-5 tracking-wide">介面偏好</h3>
              <div class="space-y-5">
                <div>
                  <label class="block text-xs font-light text-stone-500 mb-2 tracking-wider uppercase">主題</label>
                  <div class="flex space-x-4">
                    <label class="flex items-center text-sm font-light text-stone-600 cursor-pointer">
                      <input v-model="adminStore.globalSettings.theme" type="radio" value="light" class="mr-2 text-amber-500 focus:ring-amber-400"
                        @change="adminStore.updateGlobalSettings({ theme: 'light' })" />
                      淺色
                    </label>
                    <label class="flex items-center text-sm font-light text-stone-600 cursor-pointer">
                      <input v-model="adminStore.globalSettings.theme" type="radio" value="dark" class="mr-2 text-amber-500 focus:ring-amber-400"
                        @change="adminStore.updateGlobalSettings({ theme: 'dark' })" />
                      深色
                    </label>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-light text-stone-500 mb-2 tracking-wider uppercase">語言</label>
                  <select
                    v-model="adminStore.globalSettings.language"
                    @change="adminStore.updateGlobalSettings({ language: adminStore.globalSettings.language })"
                    class="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  >
                    <option value="zh-TW">繁體中文</option>
                    <option value="zh-CN">簡體中文</option>
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

useSeoMeta({
  title: '後台管理',
  robots: 'noindex, nofollow'
})

const adminStore = useAdminStore()
const { getImagePath } = useImagePath()

// Tab 狀態
const activeTab = ref('overview')

const tabs = [
  { id: 'overview', name: '概覽' },
  { id: 'upload', name: '上傳' },
  { id: 'manage', name: '管理' },
  { id: 'settings', name: '設定' }
]

// 處理「新增圖片到事件」的 Tab 切換
const handleSwitchToUpload = (eventName: string) => {
  adminStore.uploadCategory = adminStore.manageCategory
  adminStore.eventMode = 'existing'
  adminStore.selectedExistingEvent = eventName
  activeTab.value = 'upload'
}

// 圖片載入錯誤
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

// 格式化日期
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return dateString
  }
}

// 概覽分組（用於事件數量顯示）
const groupedOverviewData = computed(() => {
  const data = adminStore.currentOverviewData || []
  const events = new Set<string>()
  data.forEach(item => {
    if ((item as any).event?.name) {
      events.add((item as any).event.name)
    } else {
      const year = new Date(item.time).getFullYear()
      events.add(`${year}年`)
    }
  })
  return Array.from(events)
})

// 月份統計（近6個月）
const monthlyStats = computed(() => {
  const data = adminStore.currentOverviewData || []
  const now = new Date()
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const next = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 1)
    const count = data.filter(item => {
      const t = new Date(item.time)
      return t >= d && t < next
    }).length
    return {
      label: d.toLocaleDateString('zh-TW', { month: 'short' }),
      count
    }
  })
})

const maxMonthCount = computed(() => Math.max(1, ...monthlyStats.value.map(m => m.count)))

// 初始化
onMounted(async () => {
  try {
    adminStore.loadGlobalSettings()
    await Promise.all([
      adminStore.loadGalleryByCategory('gallery'),
      adminStore.loadGalleryByCategory('photography')
    ])
    await nextTick()
    if (adminStore.groupedManageData.length > 0) {
      adminStore.expandedEvents = [adminStore.groupedManageData[0].eventName]
    }
  } catch (error) {
    console.error('Failed to initialize admin page:', error)
  }
})
</script>
