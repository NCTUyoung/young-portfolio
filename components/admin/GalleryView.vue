<template>
  <div>
    <!-- 工具列：搜尋 + 批次模式 -->
    <div class="flex items-center justify-between mb-4 gap-3 flex-wrap">
      <!-- 搜尋框 -->
      <div class="relative flex-1 max-w-xs">
        <svg class="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400 dark:text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜尋圖片名稱…"
          class="w-full rounded-lg border border-stone-200 bg-stone-50 py-1.5 pl-9 pr-3 text-sm text-stone-700 placeholder-stone-300 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-amber-400 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200 dark:placeholder-stone-500"
        >
        <button v-if="searchQuery" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300" @click="searchQuery = ''">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- 批次操作按鈕 -->
      <button
        :class="[
          'px-3 py-1.5 text-xs font-light rounded-lg border transition-all duration-200 flex items-center space-x-1.5',
          batchMode
            ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-950/30'
            : 'border-stone-200 bg-stone-50 text-stone-500 hover:bg-stone-100 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700'
        ]"
        @click="toggleBatchMode"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <span>{{ batchMode ? '退出批次' : '批次操作' }}</span>
      </button>
    </div>

    <!-- 載入中 -->
    <div v-if="adminStore.loading" class="text-center py-16">
      <div class="inline-flex items-center space-x-2 text-stone-400 dark:text-stone-500">
        <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
        </svg>
        <span class="text-sm font-light">載入中…</span>
      </div>
    </div>

    <!-- 無數據 -->
    <div v-else-if="adminStore.groupedManageData.length === 0" class="text-center py-20">
      <svg class="mx-auto mb-4 h-12 w-12 text-stone-200 dark:text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p class="text-stone-400 text-sm font-light">尚無作品，請先上傳圖片</p>
    </div>

    <!-- 搜尋無結果 -->
    <div v-else-if="searchQuery && filteredGroups.length === 0" class="text-center py-16">
      <p class="text-stone-400 text-sm font-light">找不到包含「{{ searchQuery }}」的圖片</p>
    </div>

    <!-- 事件列表 -->
    <template v-else>
      <div
        v-for="group in filteredGroups"
        :key="group.eventName"
          class="mb-4 overflow-hidden rounded-xl border border-stone-200 dark:border-stone-700"
      >
        <!-- 事件標題欄 -->
        <div
          class="cursor-pointer border-b border-stone-100 bg-white px-4 py-3 transition-colors duration-200 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900/60 dark:hover:bg-stone-800/80"
          @click="adminStore.toggleEventExpand(group.eventName)"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <!-- 展開圖標 -->
              <svg
                :class="[
                  'w-4 h-4 text-stone-400 transition-transform duration-200 flex-shrink-0',
                  adminStore.expandedEvents.includes(group.eventName) ? 'rotate-90' : ''
                ]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5l7 7-7 7" />
              </svg>

              <div class="min-w-0">
                <div class="flex items-center space-x-2">
                  <h4 class="text-sm font-light text-stone-800 dark:text-stone-100">{{ group.eventName }}</h4>
                  <span class="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-light text-amber-700 dark:bg-amber-900/50 dark:text-amber-200">
                    {{ group.items.length }} 張
                  </span>
                </div>
                <div v-if="group.description || group.location" class="mt-0.5 text-xs font-light text-stone-400 dark:text-stone-500">
                  <span v-if="group.description">{{ group.description }}</span>
                  <span v-if="group.location" class="ml-2">📍 {{ group.location }}</span>
                </div>
              </div>
            </div>

            <!-- 操作按鈕 -->
            <div class="flex items-center space-x-1 flex-shrink-0" @click.stop>
              <!-- 批次：全選/取消 -->
              <button
                v-if="batchMode"
                class="px-2 py-1 text-xs font-light text-stone-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                :title="isGroupAllSelected(group) ? '取消全選' : '全選此事件'"
                @click="toggleSelectGroup(group)"
              >
                {{ isGroupAllSelected(group) ? '取消' : '全選' }}
              </button>

              <!-- 編輯事件 -->
              <button
                class="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                title="編輯事件"
                @click="adminStore.startEditEvent(group.eventName, group.description, group.location)"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>

              <!-- 新增圖片到此事件 -->
              <button
                class="p-1.5 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                title="新增圖片到此事件"
                @click="$emit('switchToUpload', group.eventName)"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4" />
                </svg>
              </button>

              <!-- 刪除整個事件 -->
              <button
                class="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="刪除整個事件"
                @click="promptDeleteEvent(group.eventName, group.items.length)"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 圖片區域 — 日式過場：紙の展開 + 頂線裝飾 -->
        <Transition name="collapse-fade">
          <div
            v-if="adminStore.expandedEvents.includes(group.eventName)"
            class="collapse-content-admin relative overflow-hidden bg-stone-50/30 p-4 dark:bg-stone-950/40"
          >
            <!-- 頂線裝飾 — 隨內容淡入 -->
            <div class="collapse-accent-line-admin absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-400/50 to-transparent opacity-0" />
          <!-- 網格檢視 -->
          <div v-if="adminStore.manageViewMode === 'grid'" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            <div
              v-for="(item, itemIdx) in group.items"
              :key="item.filename"
              :draggable="adminStore.editMode"
              :class="[
                'group relative aspect-square overflow-hidden rounded-xl bg-stone-100 transition-all duration-200 dark:bg-stone-800',
                adminStore.editMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
                selectedFiles.has(item.filename) ? 'ring-2 ring-amber-400' : 'hover:shadow-md',
                dragOverFilename === item.filename && dragEventName === group.eventName ? 'ring-2 ring-amber-300 opacity-70' : ''
              ]"
              @dragstart="handleDragStart(item.filename, group.eventName)"
              @dragover.prevent
              @drop="handleDrop(item.filename, group.eventName)"
              @click="handleImageClick(item, group.items, itemIdx)"
            >
              <img
                :src="getThumbPath(item.filename, 800)"
                :srcset="getGridImageSrcset(item.filename)"
                :sizes="gridImageSizes"
                :alt="item.title"
                class="h-full w-full bg-stone-100 object-contain transition-transform duration-300 group-hover:scale-105 dark:bg-stone-800"
                loading="lazy"
                decoding="async"
                @error="handleImageError"
              >

              <!-- 批次 checkbox -->
              <div v-if="batchMode" class="absolute top-1.5 left-1.5 z-20" @click.stop>
                <div
                  :class="[
                    'w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all',
                    selectedFiles.has(item.filename)
                      ? 'bg-amber-500 border-amber-500'
                      : 'bg-white/80 border-stone-300 hover:border-amber-400'
                  ]"
                  @click="toggleSelectFile(item.filename)"
                >
                  <svg v-if="selectedFiles.has(item.filename)" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              <!-- 編輯模式操作 -->
              <div
                v-if="adminStore.editMode && !batchMode"
                class="absolute top-1.5 right-1.5 z-20 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity"
                @click.stop
              >
                <button
                  class="p-1.5 bg-white/90 text-stone-600 rounded-lg hover:bg-stone-100 transition-colors shadow-sm"
                  title="編輯"
                  @click="adminStore.startEditImage(item)"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  class="p-1.5 bg-white/90 text-red-500 rounded-lg hover:bg-red-50 transition-colors shadow-sm"
                  title="刪除"
                  @click="adminStore.showDeleteConfirm(item.filename, item.title)"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <!-- hover 資訊 -->
              <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <p class="text-white text-xs font-light truncate">{{ item.title }}</p>
                <p class="text-white/60 text-xs font-light">{{ formatDate(item.time) }}</p>
              </div>
            </div>
          </div>

          <!-- 列表檢視 -->
          <div v-else class="space-y-1.5">
            <div
              v-for="item in group.items"
              :key="item.filename"
              class="flex items-center space-x-3 rounded-xl border border-stone-100 bg-white px-3 py-2.5 transition-all hover:border-stone-200 dark:border-stone-700 dark:bg-stone-900/50 dark:hover:border-stone-600"
            >
              <!-- Checkbox -->
              <div v-if="batchMode" @click.stop>
                <div
                  :class="[
                    'w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all flex-shrink-0',
                    selectedFiles.has(item.filename)
                      ? 'bg-amber-500 border-amber-500'
                      : 'border-stone-300 hover:border-amber-400'
                  ]"
                  @click="toggleSelectFile(item.filename)"
                >
                  <svg v-if="selectedFiles.has(item.filename)" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              <img
                :src="getThumbPath(item.filename, 400)"
                :alt="item.title"
                class="w-10 h-10 object-cover rounded-lg flex-shrink-0 cursor-pointer"
                loading="lazy"
                decoding="async"
                @error="handleImageError"
                @click="openLightbox(item, group.items, group.items.indexOf(item))"
              >
              <div class="flex-1 min-w-0">
                <p class="truncate text-sm font-light text-stone-800 dark:text-stone-100">{{ item.title }}</p>
                <p class="text-xs font-light text-stone-400 dark:text-stone-500">{{ formatDate(item.time) }}</p>
              </div>
              <div v-if="adminStore.editMode" class="flex-shrink-0 flex space-x-1">
                <button class="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors" title="編輯" @click="adminStore.startEditImage(item)">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button class="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="刪除" @click="adminStore.showDeleteConfirm(item.filename, item.title)">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        </Transition>
      </div>
    </template>

    <!-- 批次操作浮動欄 -->
    <Transition name="slide-up">
      <div
        v-if="batchMode && selectedFiles.size > 0"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-4 bg-stone-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl"
      >
        <span class="text-sm font-light">已選 <span class="text-amber-400 font-medium">{{ selectedFiles.size }}</span> 張</span>
        <div class="w-px h-4 bg-stone-700"/>
        <button
          class="text-xs text-stone-400 hover:text-white transition-colors font-light"
          @click="clearSelection"
        >
          取消選取
        </button>
        <button
          class="px-4 py-1.5 bg-red-600 text-white text-xs font-light rounded-lg hover:bg-red-500 transition-colors"
          @click="confirmBatchDelete"
        >
          批次刪除
        </button>
      </div>
    </Transition>

    <!-- 刪除事件確認對話框 -->
    <AdminConfirmDialog
      :is-visible="showDeleteEventDialog"
      title="刪除整個事件"
      :message="`確定要刪除事件「${deleteEventTarget}」及其所有 ${deleteEventCount} 張圖片嗎？`"
      details="此操作無法復原，所有圖片檔案將被永久刪除。"
      @confirm="handleDeleteEvent"
      @cancel="showDeleteEventDialog = false"
    />

    <!-- 批次刪除確認對話框 -->
    <AdminConfirmDialog
      :is-visible="showBatchDeleteDialog"
      title="批次刪除圖片"
      :message="`確定要刪除已選取的 ${selectedFiles.size} 張圖片嗎？`"
      details="此操作無法復原，選取的圖片將被永久刪除。"
      @confirm="executeBatchDelete"
      @cancel="showBatchDeleteDialog = false"
    />

    <!-- Lightbox -->
    <AdminLightbox
      :is-visible="lightboxVisible"
      :images="lightboxImages"
      :initial-index="lightboxIndex"
      @close="lightboxVisible = false"
    />

    <!-- 事件編輯對話框 -->
    <AdminEventEditDialog
      v-if="adminStore.showEventEditDialog && adminStore.editingEventData"
      :show="adminStore.showEventEditDialog"
      :event-name="adminStore.editingEventData.name"
      :description="adminStore.editingEventData.description"
      :location="adminStore.editingEventData.location"
      :loading="adminStore.loading"
      @confirm="adminStore.confirmEditEvent"
      @cancel="adminStore.cancelEditEvent"
    />
  </div>
</template>

<script setup lang="ts">
defineEmits<{ switchToUpload: [eventName: string] }>()

const adminStore = useAdminStore()
const { getThumbPath, getGridImageSrcset, gridImageSizes } = useImagePath()

// ===== 搜尋 =====
const searchQuery = ref('')

const filteredGroups = computed(() => {
  const groups = adminStore.groupedManageData
  if (!searchQuery.value.trim()) return groups
  const q = searchQuery.value.toLowerCase()
  return groups
    .map(group => ({
      ...group,
      items: group.items.filter(item =>
        item.title?.toLowerCase().includes(q) ||
        item.filename?.toLowerCase().includes(q)
      )
    }))
    .filter(group => group.items.length > 0)
})

// ===== 批次操作 =====
const batchMode = ref(false)
const selectedFiles = ref(new Set<string>())

const toggleBatchMode = () => {
  batchMode.value = !batchMode.value
  if (!batchMode.value) selectedFiles.value.clear()
}

const toggleSelectFile = (filename: string) => {
  if (selectedFiles.value.has(filename)) {
    selectedFiles.value.delete(filename)
  } else {
    selectedFiles.value.add(filename)
  }
  selectedFiles.value = new Set(selectedFiles.value) // 觸發響應性
}

const toggleSelectGroup = (group: { items: { filename: string; title: string; time: string }[] }) => {
  const filenames = group.items.map(i => i.filename)
  const allSelected = filenames.every(fn => selectedFiles.value.has(fn))
  if (allSelected) {
    filenames.forEach(fn => selectedFiles.value.delete(fn))
  } else {
    filenames.forEach(fn => selectedFiles.value.add(fn))
  }
  selectedFiles.value = new Set(selectedFiles.value)
}

const isGroupAllSelected = (group: { items: { filename: string; title: string; time: string }[] }) =>
  group.items.length > 0 && group.items.every(i => selectedFiles.value.has(i.filename))

const clearSelection = () => {
  selectedFiles.value = new Set()
}

const showBatchDeleteDialog = ref(false)
const confirmBatchDelete = () => { showBatchDeleteDialog.value = true }
const executeBatchDelete = async () => {
  showBatchDeleteDialog.value = false
  await adminStore.batchDeleteImages(Array.from(selectedFiles.value))
  selectedFiles.value = new Set()
  batchMode.value = false
}

// ===== 刪除事件 =====
const showDeleteEventDialog = ref(false)
const deleteEventTarget = ref('')
const deleteEventCount = ref(0)

const promptDeleteEvent = (eventName: string, count: number) => {
  deleteEventTarget.value = eventName
  deleteEventCount.value = count
  showDeleteEventDialog.value = true
}

const handleDeleteEvent = async () => {
  showDeleteEventDialog.value = false
  await adminStore.deleteEvent(deleteEventTarget.value)
}

// ===== 拖曳排序 =====
const dragFilename = ref('')
const dragEventName = ref('')
const dragOverFilename = ref('')

const handleDragStart = (filename: string, eventName: string) => {
  dragFilename.value = filename
  dragEventName.value = eventName
}

const handleDrop = (targetFilename: string, targetEventName: string) => {
  dragOverFilename.value = ''
  if (!dragFilename.value || dragFilename.value === targetFilename) return
  if (dragEventName.value !== targetEventName) return

  const group = adminStore.groupedManageData.find(g => g.eventName === targetEventName)
  if (!group) return

  const items = [...group.items]
  const fromIdx = items.findIndex(i => i.filename === dragFilename.value)
  const toIdx = items.findIndex(i => i.filename === targetFilename)
  if (fromIdx === -1 || toIdx === -1) return

  const newOrder = items.map(i => i.filename)
  const [moved] = newOrder.splice(fromIdx, 1)
  newOrder.splice(toIdx, 0, moved)

  adminStore.reorderEventImages(targetEventName, newOrder)
  dragFilename.value = ''
  dragEventName.value = ''
}

// ===== Lightbox =====
const lightboxVisible = ref(false)
const lightboxImages = ref<{ filename: string; title: string; time?: string }[]>([])
const lightboxIndex = ref(0)

const openLightbox = (item: { filename: string; title: string; time: string }, items: { filename: string; title: string; time: string }[], idx: number) => {
  lightboxImages.value = items.map(i => ({ filename: i.filename, title: i.title, time: i.time }))
  lightboxIndex.value = idx
  lightboxVisible.value = true
}

const handleImageClick = (item: { filename: string; title: string; time: string }, items: { filename: string; title: string; time: string }[], idx: number) => {
  if (batchMode.value) {
    toggleSelectFile(item.filename)
  } else if (!adminStore.editMode) {
    openLightbox(item, items, idx)
  }
}

// ===== 共用 =====
const handleImageError = (event: Event) => {
  (event.target as HTMLImageElement).style.display = 'none'
}

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return dateString
  }
}
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

/* 日式過場：紙の展開 + 頂線裝飾 */
.collapse-fade-enter-active {
  transition: opacity 0.32s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.32s cubic-bezier(0.16, 1, 0.3, 1);
}
.collapse-fade-enter-active .collapse-accent-line-admin {
  transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.1s;
  opacity: 1;
}
.collapse-fade-leave-active {
  transition: opacity 0.24s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.24s cubic-bezier(0.4, 0, 0.2, 1);
}
.collapse-fade-leave-active .collapse-accent-line-admin {
  transition: opacity 0.12s ease-out;
  opacity: 0;
}
.collapse-fade-enter-from,
.collapse-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}
.collapse-fade-enter-from .collapse-accent-line-admin,
.collapse-fade-leave-to .collapse-accent-line-admin {
  opacity: 0;
}
</style>




