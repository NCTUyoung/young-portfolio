<template>
  <div class="min-h-screen bg-stone-50 text-stone-900 transition-colors dark:bg-stone-950 dark:text-stone-100">
    <!-- 頂部導航 -->
    <header class="border-b border-stone-800 bg-stone-950 dark:border-stone-800">
      <div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div class="flex items-center space-x-3">
          <div class="w-1 h-6 bg-amber-500"/>
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
      <div class="rounded-t-xl border border-stone-200 border-b-0 bg-white dark:border-stone-700 dark:bg-stone-900/90">
        <div class="flex space-x-0 px-2">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="[
              'py-4 px-5 border-b-2 font-light text-sm transition-all duration-200 flex items-center space-x-2',
              activeTab === tab.id
                ? 'border-amber-500 text-stone-900 dark:text-stone-50'
                : 'border-transparent text-stone-400 hover:border-stone-300 hover:text-stone-700 dark:text-stone-500 dark:hover:border-stone-600 dark:hover:text-stone-200'
            ]"
            @click="setActiveTab(tab.id)"
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
            <span
v-if="tab.id === 'upload' && adminStore.selectedFiles.length > 0"
                  class="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
              {{ adminStore.selectedFiles.length }}
            </span>
          </button>
        </div>
      </div>
    </nav>

    <!-- 全域錯誤（載入／API）：不與上傳區塊內訊息衝突時顯示於頂部 -->
    <div
      v-if="pageReady && adminStore.message && adminStore.messageType === 'error' && activeTab !== 'upload'"
      class="max-w-7xl mx-auto px-6 pt-4"
      role="alert"
    >
      <div class="flex items-start justify-between gap-3 rounded-xl border border-red-200/80 bg-red-50/95 px-4 py-3 text-red-900 shadow-sm dark:border-red-900/50 dark:bg-red-950/60 dark:text-red-100">
        <p class="text-sm font-light leading-relaxed">{{ adminStore.message }}</p>
        <button
          type="button"
          class="shrink-0 text-xs text-red-700/80 underline underline-offset-2 hover:text-red-900 dark:text-red-300 dark:hover:text-red-100"
          @click="adminStore.message = ''"
        >
          關閉
        </button>
      </div>
    </div>

    <!-- 主要內容區域 -->
    <main class="max-w-7xl mx-auto px-6 pb-12">
      <!-- 首次載入：與前台 Gallery 類似的日式 loading -->
      <div
        v-if="!pageReady"
        class="flex min-h-[min(55vh,380px)] flex-col items-center justify-center gap-5 rounded-b-xl border border-stone-200 border-t-0 bg-white py-24 dark:border-stone-700 dark:bg-stone-900/80"
        role="status"
        aria-live="polite"
      >
        <div class="relative w-10 h-10">
          <div class="absolute inset-0 border border-amber-300/60 rounded-full animate-spin dark:border-amber-500/50" style="animation-duration: 2s;" />
          <div
            class="absolute inset-[6px] border border-amber-400/40 rounded-full animate-spin dark:border-amber-400/35"
            style="animation-duration: 3s; animation-direction: reverse;"
          />
        </div>
        <p class="jp-section-label text-stone-500 dark:text-stone-400">Loading</p>
        <p class="text-xs font-light tracking-wide text-stone-400 dark:text-stone-500">載入作品資料中…</p>
      </div>

      <div v-else class="rounded-b-xl border border-stone-200 border-t-0 bg-white dark:border-stone-700 dark:bg-stone-900/80">

        <!-- 概覽頁面 — 日式排版 -->
        <section v-if="visitedTabs.has('overview')" v-show="activeTab === 'overview'" class="p-8 md:p-10">
          <!-- 頂部裝飾細線 -->
          <div class="deco-line-h w-full mb-6" />

          <!-- 小標 + 分類切換（底線 Tab 風格） -->
          <header class="mb-10">
            <p class="jp-section-label mb-4">Overview</p>
            <div class="flex flex-wrap items-center gap-x-1 gap-y-2">
              <button
                v-for="cat in [{ id: 'gallery', name: '繪圖作品' }, { id: 'photography', name: '攝影作品' }]"
                :key="cat.id"
                class="relative px-4 py-2.5 font-light tracking-wide transition-all duration-300 rounded-none"
                :class="adminStore.overviewCategory === cat.id
                  ? 'text-stone-800 dark:text-stone-100'
                  : 'text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300'"
                @click="adminStore.overviewCategory = cat.id; adminStore.handleOverviewCategoryChange(cat.id)"
              >
                <span
                  :class="[
                    'absolute bottom-0 left-1/2 -translate-x-1/2 h-px transition-all duration-300 ease-out',
                    adminStore.overviewCategory === cat.id
                      ? 'w-full bg-gradient-to-r from-transparent via-amber-500 to-transparent'
                      : 'w-0 bg-transparent'
                  ]"
                />
                <span class="text-sm">{{ cat.name }}</span>
              </button>
            </div>
          </header>

          <!-- 統計 — 橫向流式佈局，側線分隔 -->
          <div class="mb-12 flex flex-wrap gap-x-8 gap-y-6 border-y border-stone-100 py-6 dark:border-stone-800">
            <div class="flex min-w-0 items-baseline gap-3">
              <span class="shrink-0 text-xs font-light uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500">總數</span>
              <span class="font-extralight text-2xl tabular-nums text-stone-800 md:text-3xl dark:text-stone-100">{{ adminStore.overviewStats.totalImages }}</span>
            </div>
            <div class="hidden h-8 w-px self-center bg-gradient-to-b from-transparent via-stone-200 to-transparent dark:via-stone-600 sm:block" />
            <div class="flex min-w-0 items-baseline gap-3">
              <span class="shrink-0 text-xs font-light uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500">本月</span>
              <span class="font-extralight text-2xl tabular-nums text-amber-600 md:text-3xl dark:text-amber-400">{{ adminStore.overviewStats.recentUploads }}</span>
            </div>
            <div class="hidden h-8 w-px self-center bg-gradient-to-b from-transparent via-stone-200 to-transparent dark:via-stone-600 sm:block" />
            <div class="flex min-w-0 items-baseline gap-3">
              <span class="shrink-0 text-xs font-light uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500">
                {{ adminStore.overviewCategory === 'photography' ? '相機' : '色彩' }}
              </span>
              <span class="font-extralight text-2xl tabular-nums text-stone-800 md:text-3xl dark:text-stone-100">
                {{ adminStore.overviewCategory === 'photography'
                  ? adminStore.overviewStats.uniqueCameras.length
                  : adminStore.overviewStats.uniqueColors.length }}
              </span>
            </div>
            <div class="hidden h-8 w-px self-center bg-gradient-to-b from-transparent via-stone-200 to-transparent dark:via-stone-600 sm:block" />
            <div class="flex min-w-0 items-baseline gap-3">
              <span class="shrink-0 text-xs font-light uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500">事件</span>
              <span class="font-extralight text-2xl tabular-nums text-stone-800 md:text-3xl dark:text-stone-100">{{ adminStore.overviewStats.events.length || groupedOverviewData.length }}</span>
            </div>
          </div>

          <!-- 近 6 個月 — 細線柱狀，簡約 -->
          <section class="mb-12">
            <p class="jp-section-label mb-5">近 6 個月</p>
            <div class="flex items-end gap-2 md:gap-4 h-28">
              <div
                v-for="month in monthlyStats"
                :key="month.label"
                class="flex-1 flex flex-col items-center gap-2"
              >
                <span class="text-xs font-light tabular-nums text-stone-400 dark:text-stone-500">{{ month.count }}</span>
                <div
                  class="min-h-[2px] w-full rounded-sm bg-gradient-to-t from-amber-400/80 to-amber-300/50 transition-all duration-500 dark:from-amber-500/70 dark:to-amber-600/40"
                  :style="{ height: month.count > 0 ? `${Math.max(6, (month.count / maxMonthCount) * 72)}px` : '2px' }"
                />
                <span class="text-[0.65rem] font-light tracking-wider text-stone-400 dark:text-stone-500">{{ month.label }}</span>
              </div>
            </div>
          </section>

          <!-- 最近上傳 — 余白感網格 -->
          <section>
            <p class="jp-section-label mb-5">最近上傳</p>
            <div v-if="adminStore.recentItems.length > 0" class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 md:gap-4">
              <div
                v-for="item in adminStore.recentItems.slice(0, 16)"
                :key="item.filename"
                class="group relative aspect-square overflow-hidden cursor-pointer"
                :title="item.title"
              >
                <div class="absolute inset-0 border border-stone-100 transition-colors duration-300 group-hover:border-amber-300/50 dark:border-stone-700 dark:group-hover:border-amber-500/40" />
                <img
                  :src="getThumbPath(item.filename, 400)"
                  :alt="item.title"
                  class="h-full w-full bg-stone-50/50 object-contain transition-transform duration-500 ease-out group-hover:scale-[1.02] dark:bg-stone-800/50"
                  loading="lazy"
                  decoding="async"
                  @error="handleImageError"
                >
                <div class="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div class="absolute bottom-0 left-0 right-0 p-2.5 translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <p class="text-white text-xs font-light truncate">{{ item.title }}</p>
                </div>
              </div>
            </div>
            <div v-else class="py-20 text-center">
              <span class="font-jp text-7xl font-thin text-stone-200/80 dark:text-stone-700">無</span>
              <p class="mt-4 text-sm font-light tracking-wide text-stone-400 dark:text-stone-500">尚無上傳的作品</p>
            </div>
          </section>
        </section>

        <!-- 上傳頁面 -->
        <section v-if="visitedTabs.has('upload')" v-show="activeTab === 'upload'" class="p-8">
          <header class="mb-8 flex justify-between items-start">
            <div>
              <h2 class="mb-1 text-xl font-light tracking-wide text-stone-900 dark:text-stone-100">上傳作品</h2>
              <p class="text-sm font-light text-stone-400 dark:text-stone-500">新增圖片到您的作品集</p>
            </div>
            <div class="flex items-center space-x-2">
              <label class="text-sm font-light text-stone-500 dark:text-stone-400">分類：</label>
              <select
                v-model="adminStore.uploadCategory"
                class="rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm text-stone-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-amber-400 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200"
                @change="adminStore.handleUploadCategoryChange(adminStore.uploadCategory)"
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
            <div class="flex justify-end space-x-3 border-t border-stone-100 pt-6 dark:border-stone-800">
              <button
                class="rounded-lg border border-stone-200 bg-stone-100 px-5 py-2 text-sm font-light text-stone-600 transition-all duration-200 hover:bg-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700 dark:focus:ring-offset-stone-900"
                @click="adminStore.clearFiles"
              >
                清除所有
              </button>
              <button
                :disabled="!adminStore.canUpload || adminStore.uploading"
                class="rounded-lg border border-transparent bg-stone-800 px-5 py-2 text-sm font-light text-white transition-all duration-200 hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-amber-700 dark:hover:bg-amber-600 dark:focus:ring-amber-500 dark:focus:ring-offset-stone-900"
                @click="adminStore.uploadFiles"
              >
                <span v-if="adminStore.uploading" class="flex items-center space-x-2">
                  <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
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
                  'flex items-start space-x-3 rounded-lg border p-4',
                  adminStore.messageType === 'success'
                    ? 'border-stone-200 bg-stone-50 text-stone-700 dark:border-stone-600 dark:bg-stone-800/80 dark:text-stone-200'
                    : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-200'
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
        <section v-if="visitedTabs.has('manage')" v-show="activeTab === 'manage'" class="p-8">
          <header class="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 class="mb-1 text-xl font-light tracking-wide text-stone-900 dark:text-stone-100">管理作品</h2>
              <p class="text-sm font-light text-stone-400 dark:text-stone-500">編輯和管理您的作品集</p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <select
                v-model="adminStore.manageCategory"
                class="rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm text-stone-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-amber-400 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200"
                @change="adminStore.handleManageCategoryChange(adminStore.manageCategory)"
              >
                <option value="gallery">繪圖作品</option>
                <option value="photography">攝影作品</option>
              </select>

              <select
                v-model="adminStore.selectedEvent"
                class="rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm text-stone-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-amber-400 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200"
              >
                <option value="">所有事件</option>
                <option v-for="event in adminStore.availableEvents" :key="event" :value="event">
                  {{ event }}
                </option>
              </select>

              <!-- 檢視切換 -->
              <div class="flex items-center rounded-lg bg-stone-100 p-1 dark:bg-stone-800">
                <button
                  :class="[
                    'rounded-md px-3 py-1 text-xs font-light transition-all duration-200',
                    adminStore.manageViewMode === 'grid'
                      ? 'bg-white text-stone-800 shadow-sm dark:bg-stone-700 dark:text-stone-100'
                      : 'text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300'
                  ]"
                  @click="adminStore.manageViewMode = 'grid'"
                >
                  網格
                </button>
                <button
                  :class="[
                    'rounded-md px-3 py-1 text-xs font-light transition-all duration-200',
                    adminStore.manageViewMode === 'list'
                      ? 'bg-white text-stone-800 shadow-sm dark:bg-stone-700 dark:text-stone-100'
                      : 'text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300'
                  ]"
                  @click="adminStore.manageViewMode = 'list'"
                >
                  列表
                </button>
              </div>

              <!-- 編輯模式 -->
              <button
                :class="[
                  'flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-light transition-all duration-200',
                  adminStore.editMode
                    ? 'border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/70'
                    : 'border border-stone-200 bg-stone-100 text-stone-600 hover:bg-stone-200 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700'
                ]"
                @click="adminStore.toggleEditMode"
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
                class="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-light text-stone-500 transition-colors duration-200 hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700"
                title="重新載入"
                @click="adminStore.loadGalleryByCategory(adminStore.manageCategory)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </header>

          <!-- 統計資訊 -->
          <div class="mb-5 flex items-center space-x-4 rounded-lg border border-stone-100 bg-stone-50 px-4 py-2.5 text-xs font-light text-stone-400 dark:border-stone-800 dark:bg-stone-800/60 dark:text-stone-500">
            <span>共 <span class="font-medium text-stone-700 dark:text-stone-200">{{ adminStore.currentManageData.length }}</span> 張圖片</span>
            <span class="text-stone-200 dark:text-stone-600">•</span>
            <span><span class="font-medium text-stone-700 dark:text-stone-200">{{ adminStore.groupedManageData.length }}</span> 個事件</span>
            <span v-if="adminStore.selectedEvent" class="text-stone-200 dark:text-stone-600">•</span>
            <span v-if="adminStore.selectedEvent" class="font-medium text-amber-600 dark:text-amber-400">
              篩選：{{ adminStore.selectedEvent }}
            </span>
          </div>

          <AdminGalleryView @switch-to-upload="handleSwitchToUpload" />
        </section>

        <!-- 設定頁面 -->
        <section v-if="visitedTabs.has('settings')" v-show="activeTab === 'settings'" class="p-8">
          <header class="mb-8">
            <h2 class="mb-1 text-xl font-light tracking-wide text-stone-900 dark:text-stone-100">系統設定</h2>
            <p class="text-sm font-light text-stone-400 dark:text-stone-500">配置系統偏好和功能選項</p>
          </header>

          <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <!-- 預設設定 -->
            <div class="rounded-xl border border-stone-100 bg-stone-50/50 p-6 dark:border-stone-800 dark:bg-stone-900/50">
              <h3 class="mb-5 text-sm font-medium tracking-wide text-stone-700 dark:text-stone-200">預設設定</h3>
              <div class="space-y-5">
                <div>
                  <label class="mb-2 block text-xs font-light uppercase tracking-wider text-stone-500 dark:text-stone-400">預設分類</label>
                  <select
                    v-model="adminStore.globalSettings.defaultUploadCategory"
                    class="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-amber-400 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200"
                    @change="adminStore.updateGlobalSettings({ defaultUploadCategory: adminStore.globalSettings.defaultUploadCategory })"
                  >
                    <option value="gallery">繪圖作品</option>
                    <option value="photography">攝影作品</option>
                  </select>
                </div>
                <div>
                  <label class="mb-2 block text-xs font-light uppercase tracking-wider text-stone-500 dark:text-stone-400">預設檢視模式</label>
                  <div class="flex space-x-4">
                    <label class="flex cursor-pointer items-center text-sm font-light text-stone-600 dark:text-stone-300">
                      <input
                        v-model="adminStore.globalSettings.defaultViewMode"
                        type="radio"
                        value="grid"
                        class="mr-2 text-amber-500 focus:ring-amber-400"
                        @change="adminStore.updateGlobalSettings({ defaultViewMode: 'grid' })"
                      >
                      網格
                    </label>
                    <label class="flex cursor-pointer items-center text-sm font-light text-stone-600 dark:text-stone-300">
                      <input
                        v-model="adminStore.globalSettings.defaultViewMode"
                        type="radio"
                        value="list"
                        class="mr-2 text-amber-500 focus:ring-amber-400"
                        @change="adminStore.updateGlobalSettings({ defaultViewMode: 'list' })"
                      >
                      列表
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- 圖片處理 -->
            <div class="rounded-xl border border-stone-100 bg-stone-50/50 p-6 dark:border-stone-800 dark:bg-stone-900/50">
              <h3 class="mb-5 text-sm font-medium tracking-wide text-stone-700 dark:text-stone-200">圖片處理</h3>
              <div class="space-y-5">
                <div>
                  <label class="mb-2 block text-xs font-light uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    圖片品質：<span class="text-amber-600 dark:text-amber-400">{{ adminStore.globalSettings.imageQuality }}%</span>
                  </label>
                  <input
                    v-model="adminStore.globalSettings.imageQuality"
                    type="range"
                    min="60"
                    max="100"
                    step="5"
                    class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-stone-200 accent-amber-500 dark:bg-stone-700"
                    @change="adminStore.updateGlobalSettings({ imageQuality: parseInt(adminStore.globalSettings.imageQuality.toString()) })"
                  >
                  <div class="mt-1 flex justify-between text-xs text-stone-400 dark:text-stone-500">
                    <span>60%</span><span>100%</span>
                  </div>
                </div>
                <div>
                  <label class="mb-2 block text-xs font-light uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    批次大小：<span class="text-amber-600 dark:text-amber-400">{{ adminStore.globalSettings.batchSize }}</span>
                  </label>
                  <input
                    v-model="adminStore.globalSettings.batchSize"
                    type="range"
                    min="10"
                    max="50"
                    step="5"
                    class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-stone-200 accent-amber-500 dark:bg-stone-700"
                    @change="adminStore.updateGlobalSettings({ batchSize: parseInt(adminStore.globalSettings.batchSize.toString()) })"
                  >
                  <div class="mt-1 flex justify-between text-xs text-stone-400 dark:text-stone-500">
                    <span>10</span><span>50</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 系統功能 -->
            <div class="rounded-xl border border-stone-100 bg-stone-50/50 p-6 dark:border-stone-800 dark:bg-stone-900/50">
              <h3 class="mb-5 text-sm font-medium tracking-wide text-stone-700 dark:text-stone-200">系統功能</h3>
              <div class="space-y-5">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-light text-stone-700 dark:text-stone-200">自動備份</p>
                    <p class="text-xs font-light text-stone-400 dark:text-stone-500">自動備份上傳的圖片</p>
                  </div>
                  <label class="relative inline-flex cursor-pointer items-center">
                    <input
v-model="adminStore.globalSettings.autoBackup" type="checkbox" class="peer sr-only"
                      @change="adminStore.updateGlobalSettings({ autoBackup: adminStore.globalSettings.autoBackup })" >
                    <div class="peer h-5 w-10 rounded-full bg-stone-200 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-amber-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-amber-300 dark:bg-stone-600"/>
                  </label>
                </div>
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-light text-stone-700 dark:text-stone-200">顯示圖片資訊</p>
                    <p class="text-xs font-light text-stone-400 dark:text-stone-500">在預覽中顯示 EXIF 資訊</p>
                  </div>
                  <label class="relative inline-flex cursor-pointer items-center">
                    <input
v-model="adminStore.globalSettings.showImageInfo" type="checkbox" class="peer sr-only"
                      @change="adminStore.updateGlobalSettings({ showImageInfo: adminStore.globalSettings.showImageInfo })" >
                    <div class="peer h-5 w-10 rounded-full bg-stone-200 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-amber-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-amber-300 dark:bg-stone-600"/>
                  </label>
                </div>
              </div>
            </div>

            <!-- 介面偏好 -->
            <div class="rounded-xl border border-stone-100 bg-stone-50/50 p-6 dark:border-stone-800 dark:bg-stone-900/50">
              <h3 class="mb-5 text-sm font-medium tracking-wide text-stone-700 dark:text-stone-200">介面偏好</h3>
              <div class="space-y-5">
                <div>
                  <label class="mb-2 block text-xs font-light uppercase tracking-wider text-stone-500 dark:text-stone-400">主題</label>
                  <div class="flex space-x-4">
                    <label class="flex cursor-pointer items-center text-sm font-light text-stone-600 dark:text-stone-300">
                      <input
v-model="adminStore.globalSettings.theme" type="radio" value="light" class="mr-2 text-amber-500 focus:ring-amber-400"
                        @change="adminStore.updateGlobalSettings({ theme: 'light' })" >
                      淺色
                    </label>
                    <label class="flex cursor-pointer items-center text-sm font-light text-stone-600 dark:text-stone-300">
                      <input
v-model="adminStore.globalSettings.theme" type="radio" value="dark" class="mr-2 text-amber-500 focus:ring-amber-400"
                        @change="adminStore.updateGlobalSettings({ theme: 'dark' })" >
                      深色
                    </label>
                  </div>
                </div>
                <div>
                  <label class="mb-2 block text-xs font-light uppercase tracking-wider text-stone-500 dark:text-stone-400">語言</label>
                  <select
                    v-model="adminStore.globalSettings.language"
                    class="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-amber-400 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200"
                    @change="adminStore.updateGlobalSettings({ language: adminStore.globalSettings.language })"
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
const { getThumbPath } = useImagePath()

/** 首次雙分類載入完成前不渲染主內容，避免空白閃爍 */
const pageReady = ref(false)

// Tab 狀態 — 延遲掛載：僅在首次造訪時渲染，之後用 v-show 切換，避免卡頓
const activeTab = ref('overview')
const visitedTabs = ref(new Set<string>(['overview']))

const setActiveTab = (tabId: string) => {
  if (!visitedTabs.value.has(tabId)) {
    visitedTabs.value = new Set([...visitedTabs.value, tabId])
  }
  activeTab.value = tabId
}

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

// 概覽分組（用於事件數量顯示）
const groupedOverviewData = computed(() => {
  const data = adminStore.currentOverviewData || []
  const events = new Set<string>()
  data.forEach(item => {
    const itemEv = item as { event?: { name?: string }; time: string }
    if (itemEv.event?.name) {
      events.add(itemEv.event.name)
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
  } finally {
    pageReady.value = true
  }
})
</script>
