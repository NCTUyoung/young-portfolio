import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FileWithMeta, GalleryItem, PhotographyItem, CategoryType } from '~/types/gallery'
import type { GalleryListApiResponse, UnifiedGalleryItem } from '~/stores/adminTypes'
import {
  computeCanUpload,
  pickDataByCategory,
  buildGroupedManageData,
  buildAvailableEventsForManage,
  buildOverviewStats,
  buildRecentOverviewItems,
  extractPhotographyEventNames
} from '~/stores/adminSelectors'
import { API_CONFIG } from '~/config/constants'
import { useApi } from '~/composables/useApi'
import * as adminApi from '~/stores/adminApiClient'

export const useAdminStore = defineStore('admin', () => {
  const { createApiRequest } = useApi()
  // ===== 基本狀態 =====
  const loading = ref(false)
  const uploading = ref(false)
  const message = ref('')
  const messageType = ref<'success' | 'error'>('success')

  // ===== 各頁面獨立狀態 =====
  // 概覽頁面
  const overviewCategory = ref<CategoryType>('gallery')
  const overviewViewMode = ref<'grid' | 'list'>('grid')

  // 上傳頁面
  const uploadCategory = ref<CategoryType>('gallery')
  const eventMode = ref<'new' | 'existing'>('new') // 新增：事件模式
  const selectedExistingEvent = ref('') // 新增：選中的現有事件
  const eventName = ref('')
  const eventDescription = ref('')
  const eventLocation = ref('')
  const selectedFiles = ref<FileWithMeta[]>([])

  // 管理頁面
  const manageCategory = ref<CategoryType>('gallery')
  const manageViewMode = ref<'grid' | 'list'>('grid')
  const selectedEvent = ref<string>('') // 新增：選中的事件篩選
  const expandedEvents = ref<string[]>(['預設事件'])
  const editMode = ref(false)
  const editingEventName = ref('')

  // 設定頁面
  const globalSettings = ref({
    defaultUploadCategory: 'gallery' as CategoryType,
    defaultViewMode: 'grid' as 'grid' | 'list',
    imageQuality: 90,
    autoBackup: true,
    showImageInfo: true,
    batchSize: 20,
    theme: 'light' as 'light' | 'dark',
    language: 'zh-TW'
  })

  // ===== 編輯事件對話框 =====
  const showEventEditDialog = ref(false)
  const editingEventData = ref<{
    originalName: string
    name: string
    description: string
    location: string
  } | null>(null)

  // ===== 確認對話框 =====
  const showConfirmDialog = ref(false)
  const pendingDeleteFilename = ref('')
  const deleteImageInfo = ref<{ title: string; filename: string } | null>(null)

  // ===== 圖片編輯對話框 =====
  const showImageEditDialog = ref(false)
  const editingImageData = ref<UnifiedGalleryItem | null>(null)

  // ===== 圖片數據 (按分類分別存儲) =====
  const galleryData = ref<UnifiedGalleryItem[]>([])
  const photographyData = ref<UnifiedGalleryItem[]>([])

  // ===== 計算屬性（純邏輯見 adminSelectors）=====
  const canUpload = computed(() => computeCanUpload({
    fileCount: selectedFiles.value.length,
    uploading: uploading.value,
    uploadCategory: uploadCategory.value,
    eventMode: eventMode.value,
    eventName: eventName.value,
    selectedExistingEvent: selectedExistingEvent.value
  }))

  const currentManageData = computed(() =>
    pickDataByCategory(manageCategory.value, galleryData.value, photographyData.value)
  )

  const currentOverviewData = computed(() =>
    pickDataByCategory(overviewCategory.value, galleryData.value, photographyData.value)
  )

  const groupedManageData = computed(() =>
    buildGroupedManageData(
      currentManageData.value || [],
      manageCategory.value,
      selectedEvent.value
    )
  )

  const availableEvents = computed(() =>
    buildAvailableEventsForManage(currentManageData.value || [], manageCategory.value)
  )

  const overviewStats = computed(() =>
    buildOverviewStats(currentOverviewData.value || [], overviewCategory.value)
  )

  const recentItems = computed(() =>
    buildRecentOverviewItems(currentOverviewData.value || [])
  )

  const availablePhotographyEvents = computed(() =>
    extractPhotographyEventNames(photographyData.value || [])
  )

  // ===== Actions =====

    // 載入指定分類的圖片列表（經 useApi 重試；不顯示全域 toast，沿用頁面 message）
  const loadGalleryByCategory = async (category: CategoryType, options?: { force?: boolean }) => {
    if (loading.value && !options?.force) return // 防止重複載入（force 時強制重新載入）

    loading.value = true
    try {
      const { execute } = createApiRequest(
        () => adminApi.fetchGalleryList(category),
        { showToast: false, retries: API_CONFIG.retryAttempts }
      )
      const response = await execute() as GalleryListApiResponse | null

      if (response?.success && response.data) {
        const sortedData = (response.data.Img || []).sort((a, b) => {
          return new Date(b.time).getTime() - new Date(a.time).getTime()
        })

        if (category === 'gallery') {
          galleryData.value = sortedData
        } else {
          photographyData.value = sortedData
        }
      }
    } catch (error) {
      console.error('Load gallery failed:', error)
      if (typeof window !== 'undefined') {
        message.value = '載入圖片列表失敗，請稍後再試'
        messageType.value = 'error'
      }
    } finally {
      loading.value = false
    }
  }

  // 概覽頁面分類切換
  const handleOverviewCategoryChange = (category: CategoryType) => {
    overviewCategory.value = category
    if ((category === 'gallery' && galleryData.value.length === 0) ||
        (category === 'photography' && photographyData.value.length === 0)) {
      loadGalleryByCategory(category)
    }
  }

  // 管理頁面分類切換
  const handleManageCategoryChange = (category: CategoryType) => {
    manageCategory.value = category
    selectedEvent.value = '' // 重置事件篩選
    if ((category === 'gallery' && galleryData.value.length === 0) ||
        (category === 'photography' && photographyData.value.length === 0)) {
      loadGalleryByCategory(category)
    }
  }

  // 上傳頁面分類切換
  const handleUploadCategoryChange = (category: CategoryType) => {
    uploadCategory.value = category
    // 清空表單數據
    selectedFiles.value = []
    eventMode.value = 'new'
    selectedExistingEvent.value = ''
    eventName.value = ''
    eventDescription.value = ''
    eventLocation.value = ''
    message.value = ''

    // 載入攝影作品數據以獲取可用事件列表
    if (category === 'photography' && photographyData.value.length === 0) {
      loadGalleryByCategory('photography')
    }
  }

  // 設定更新
  const updateGlobalSettings = (newSettings: Partial<typeof globalSettings.value>) => {
    globalSettings.value = { ...globalSettings.value, ...newSettings }
    // 這裡可以加入保存到本地存儲的邏輯
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminSettings', JSON.stringify(globalSettings.value))
    }
  }

  // 載入設定
  const loadGlobalSettings = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('adminSettings')
      if (saved) {
        try {
          globalSettings.value = { ...globalSettings.value, ...JSON.parse(saved) }
        } catch (error) {
          console.error('Failed to load settings:', error)
        }
      }
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
          if (uploadCategory.value === 'photography') {
            newFile.tags = ''
          } else {
            // 如果是繪圖分類，從 file.lastModified 推斷創作日期
            // lastModified 為檔案最後修改時間（毫秒），通常接近創作時間
            const inferredDate = new Date(file.lastModified)
            const isValidDate = !isNaN(inferredDate.getTime()) && inferredDate.getFullYear() > 1970
            newFile.creationDate = isValidDate
              ? inferredDate.toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0] // fallback 為今天
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

      // 根據事件模式設定事件資訊
      if (uploadCategory.value === 'photography') {
        if (eventMode.value === 'existing') {
          formData.append('event', selectedExistingEvent.value)
          formData.append('addToExistingEvent', 'true')
        } else {
          formData.append('event', eventName.value)
          formData.append('eventDescription', eventDescription.value)
          formData.append('eventLocation', eventLocation.value)
        }
      }

      formData.append('category', uploadCategory.value)

      selectedFiles.value.forEach((fileData) => {
        formData.append('files', fileData.file)
        formData.append(`title_${fileData.name}`, fileData.title)
        formData.append(`content_${fileData.name}`, fileData.content)

        if (uploadCategory.value === 'photography') {
          // 攝影作品專用欄位 - 只需要傳遞用戶自定義標籤
          if (fileData.tags) formData.append(`tags_${fileData.name}`, fileData.tags)
        } else {
          // 繪圖作品專用欄位
          formData.append(`color_${fileData.name}`, fileData.color || 'blue')
          if (fileData.creationDate) {
            formData.append(`creationDate_${fileData.name}`, fileData.creationDate)
          }
        }
      })

      const { execute } = createApiRequest(
        () => adminApi.postUpload(formData),
        { showToast: false, retries: API_CONFIG.retryAttempts }
      )
      const response = await execute()

      if (response?.success) {
        message.value = response.message
        messageType.value = 'success'
        selectedFiles.value = []
        eventMode.value = 'new'
        selectedExistingEvent.value = ''
        eventName.value = ''
        eventDescription.value = ''
        eventLocation.value = ''
        // 重新載入對應分類的圖片列表
        await loadGalleryByCategory(uploadCategory.value)
      }
    } catch (error) {
      console.error('Upload failed:', error)
      message.value = '上傳失敗，請稍後再試'
      messageType.value = 'error'
    } finally {
      uploading.value = false
    }
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

  // 切換編輯模式
  const toggleEditMode = () => {
    editMode.value = !editMode.value
    if (!editMode.value) {
      editingEventName.value = ''
    }
  }

  // 開始編輯事件
  const startEditEvent = (eventNameValue: string, description?: string, location?: string) => {
    editingEventData.value = {
      originalName: eventNameValue,
      name: eventNameValue,
      description: description || '',
      location: location || ''
    }
    showEventEditDialog.value = true
  }

  // 確認編輯事件
  const confirmEditEvent = async (data: { eventName: string; description: string; location: string }) => {
    const editing = editingEventData.value
    if (!editing) return

    loading.value = true

    try {
      const { execute } = createApiRequest(
        () => adminApi.patchUpdateEvent({
          originalEventName: editing.originalName,
          newEventName: data.eventName,
          newDescription: data.description,
          newLocation: data.location,
          category: manageCategory.value
        }),
        { showToast: false, retries: API_CONFIG.retryAttempts }
      )
      const response = await execute()

      if (response?.success) {
        message.value = response.message
        messageType.value = 'success'
        showEventEditDialog.value = false
        editingEventData.value = null
        // 強制重新載入圖片列表以取得更新後的事件資訊
        await loadGalleryByCategory(manageCategory.value, { force: true })
      }
    } catch (error) {
      console.error('Update event failed:', error)
      message.value = '更新事件失敗，請稍後再試'
      messageType.value = 'error'
    } finally {
      loading.value = false
    }
  }

  // 取消編輯事件
  const cancelEditEvent = () => {
    showEventEditDialog.value = false
    editingEventData.value = null
  }

  // 顯示刪除確認對話框
  const showDeleteConfirm = (filename: string, title: string) => {
    deleteImageInfo.value = { title, filename }
    pendingDeleteFilename.value = filename
    showConfirmDialog.value = true
  }

  // 確認刪除圖片
  const confirmDeleteImage = async () => {
    if (!pendingDeleteFilename.value) return

    loading.value = true
    showConfirmDialog.value = false

    try {
      const { execute } = createApiRequest(
        () => adminApi.deleteImageRequest({
          filename: pendingDeleteFilename.value,
          category: manageCategory.value
        }),
        { showToast: false, retries: API_CONFIG.retryAttempts }
      )
      const response = await execute()

      if (response?.success) {
        message.value = '圖片刪除成功'
        messageType.value = 'success'
        await loadGalleryByCategory(manageCategory.value, { force: true })
      }
    } catch (error) {
      console.error('Delete failed:', error)
      message.value = '刪除失敗，請稍後再試'
      messageType.value = 'error'
    } finally {
      loading.value = false
      pendingDeleteFilename.value = ''
      deleteImageInfo.value = null
    }
  }

  // 取消刪除
  const cancelDeleteImage = () => {
    showConfirmDialog.value = false
    pendingDeleteFilename.value = ''
    deleteImageInfo.value = null
  }

  // 重置狀態
  const resetState = () => {
    selectedFiles.value = []
    eventName.value = ''
    eventDescription.value = ''
    eventLocation.value = ''
    message.value = ''
    messageType.value = 'success'
    uploading.value = false
    editMode.value = false
    editingEventName.value = ''
    showConfirmDialog.value = false
    pendingDeleteFilename.value = ''
    deleteImageInfo.value = null
    showEventEditDialog.value = false
    editingEventData.value = null
    showImageEditDialog.value = false
    editingImageData.value = null
    selectedEvent.value = ''
  }

  // 開始編輯圖片
  const startEditImage = (image: UnifiedGalleryItem) => {
    editingImageData.value = image
    showImageEditDialog.value = true
  }

  // 確認編輯圖片
  const confirmEditImage = async (updateData: {
    title: string
    content: string
    date: string
    color?: string
    tags?: string[]
  }) => {
    if (!editingImageData.value) return

    // 先關閉對話框，提升用戶體驗
    showImageEditDialog.value = false
    const originalImage = editingImageData.value
    editingImageData.value = null

    // 樂觀更新：先在本地更新數據
    try {
      console.log('開始樂觀更新...')
      console.log('原始圖片:', originalImage)
      console.log('更新數據:', updateData)

      // 找到本地數據中對應的圖片並更新
      const dataArray = manageCategory.value === 'gallery' ? galleryData.value : photographyData.value
      console.log('當前數據數組長度:', dataArray.length)

      const imageIndex = dataArray.findIndex(img => img.filename === originalImage.filename)
      console.log('找到圖片索引:', imageIndex)

      if (imageIndex !== -1) {
        console.log('更新前的圖片:', dataArray[imageIndex])

        // 建立更新後的圖片對象
        const updatedImage = { ...dataArray[imageIndex] }
        updatedImage.title = updateData.title
        if (manageCategory.value === 'gallery') {
          (updatedImage as GalleryItem).description = updateData.content
        } else {
          (updatedImage as PhotographyItem).content = updateData.content
        }

        // 處理日期格式轉換
        if (updateData.date) {
          console.log('原始日期:', updateData.date)
          const date = new Date(updateData.date)
          const year = date.getFullYear()
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          const month = monthNames[date.getMonth()]
          const day = String(date.getDate()).padStart(2, '0')
          updatedImage.time = `${year} ${month} ${day}`
          console.log('轉換後的時間:', updatedImage.time)
        }

        // 分類特定更新
        if (manageCategory.value === 'gallery' && updateData.color) {
          (updatedImage as GalleryItem & { color?: string }).color = updateData.color
        } else if (manageCategory.value === 'photography' && updateData.tags) {
          (updatedImage as GalleryItem).tags = updateData.tags
        }

        console.log('更新後的圖片:', updatedImage)

                // 更新本地數據 - 直接替換以觸發響應性
        dataArray.splice(imageIndex, 1, updatedImage)
        console.log('本地數據已更新')

        // 強制觸發響應性更新 - 重新分配數組以確保 Vue 偵測到變化
        if (manageCategory.value === 'gallery') {
          galleryData.value = [...galleryData.value]
        } else {
          photographyData.value = [...photographyData.value]
        }

        // 顯示成功訊息
        message.value = '圖片資訊更新成功'
        messageType.value = 'success'
      } else {
        console.error('找不到要更新的圖片')
      }
    } catch (error) {
      console.error('本地更新失敗:', error)
    }

    // 在背景調用 API 同步到伺服器
    try {
      loading.value = true

      const { execute } = createApiRequest(
        () => adminApi.patchUpdateImage({
          filename: originalImage.filename,
          category: manageCategory.value,
          updates: updateData
        }),
        { showToast: false, retries: API_CONFIG.retryAttempts }
      )
      const response = await execute()

      if (!response?.success) {
        message.value = '同步到伺服器失敗，請重新整理頁面'
        messageType.value = 'error'
        await loadGalleryByCategory(manageCategory.value, { force: true })
      }
    } catch (error) {
      console.error('API 同步失敗:', error)
      message.value = '同步到伺服器失敗，本地已更新，請重新整理頁面確認'
      messageType.value = 'error'
    } finally {
      loading.value = false
    }
  }

  // 取消編輯圖片
  const cancelEditImage = () => {
    showImageEditDialog.value = false
    editingImageData.value = null
  }

  // 刪除整個事件（含所有圖片）
  const deleteEvent = async (eventName: string) => {
    loading.value = true
    try {
      const { execute } = createApiRequest(
        () => adminApi.deleteEventRequest({ eventName, category: manageCategory.value }),
        { showToast: false, retries: API_CONFIG.retryAttempts }
      )
      const response = await execute()

      if (response?.success) {
        message.value = response.message
        messageType.value = 'success'
        await loadGalleryByCategory(manageCategory.value, { force: true })
      }
    } catch (error) {
      console.error('Delete event failed:', error)
      message.value = '刪除事件失敗，請稍後再試'
      messageType.value = 'error'
    } finally {
      loading.value = false
    }
  }

  // 批次刪除圖片
  const batchDeleteImages = async (filenames: string[]) => {
    if (filenames.length === 0) return
    loading.value = true
    let successCount = 0
    try {
      for (const filename of filenames) {
        try {
          await adminApi.deleteImageRequest({ filename, category: manageCategory.value })
          successCount++
        } catch (e) {
          console.error(`Failed to delete ${filename}:`, e)
        }
      }
      message.value = `成功刪除 ${successCount} 張圖片`
      messageType.value = 'success'
      await loadGalleryByCategory(manageCategory.value, { force: true })
    } catch (error) {
      console.error('Batch delete failed:', error)
      message.value = '批次刪除失敗'
      messageType.value = 'error'
    } finally {
      loading.value = false
    }
  }

  // 重新排序事件內的圖片（本地更新）
  const reorderEventImages = (eventName: string, newOrder: string[]) => {
    const dataArray = manageCategory.value === 'gallery' ? galleryData.value : photographyData.value
    // 依照 newOrder 重新排列同一 event 的圖片
    const eventItems = dataArray.filter(img => {
      const imgEv = img as GalleryItem & { event?: { name?: string } }
      if (imgEv.event?.name) return imgEv.event.name === eventName
      const year = new Date(img.time).getFullYear()
      return `${year}年電繪作品` === eventName
    })
    const otherItems = dataArray.filter(img => !eventItems.includes(img))
    const reordered = newOrder
      .map(fn => eventItems.find(img => img.filename === fn))
      .filter(Boolean) as typeof dataArray

    const merged = [...reordered, ...otherItems]
    if (manageCategory.value === 'gallery') {
      galleryData.value = merged
    } else {
      photographyData.value = merged
    }
  }

  return {
    // 基本狀態
    loading,
    uploading,
    message,
    messageType,

    // 各頁面獨立狀態
    overviewCategory,
    overviewViewMode,
    uploadCategory,
    manageCategory,
    manageViewMode,
    selectedEvent,
    expandedEvents,
    editMode,
    editingEventName,
    globalSettings,

    // 對話框狀態
    showConfirmDialog,
    pendingDeleteFilename,
    deleteImageInfo,
    showEventEditDialog,
    editingEventData,
    showImageEditDialog,
    editingImageData,

    // 表單狀態
    eventMode,
    selectedExistingEvent,
    eventName,
    eventDescription,
    eventLocation,
    selectedFiles,

    // 數據
    galleryData,
    photographyData,
    currentManageData,
    currentOverviewData,
    groupedManageData,
    availableEvents,
    availablePhotographyEvents,
    overviewStats,
    recentItems,

    // 計算屬性
    canUpload,

    // Actions
    loadGalleryByCategory,
    handleOverviewCategoryChange,
    handleManageCategoryChange,
    handleUploadCategoryChange,
    updateGlobalSettings,
    loadGlobalSettings,
    processFiles,
    removeFile,
    clearFiles,
    uploadFiles,
    toggleEventExpand,
    toggleEditMode,
    startEditEvent,
    confirmEditEvent,
    cancelEditEvent,
    showDeleteConfirm,
    confirmDeleteImage,
    cancelDeleteImage,
    startEditImage,
    confirmEditImage,
    cancelEditImage,
    deleteEvent,
    batchDeleteImages,
    reorderEventImages,
    resetState
  }
})