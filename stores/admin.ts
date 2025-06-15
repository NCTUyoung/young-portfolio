import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FileWithMeta, GalleryItem, PhotographyItem, CategoryType } from '~/types/gallery'

type UnifiedGalleryItem = GalleryItem | PhotographyItem

export const useAdminStore = defineStore('admin', () => {
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

  // ===== 圖片數據 (按分類分別存儲) =====
  const galleryData = ref<UnifiedGalleryItem[]>([])
  const photographyData = ref<UnifiedGalleryItem[]>([])

  // ===== 計算屬性 =====
  const canUpload = computed(() => {
    return selectedFiles.value.length > 0 && eventName.value.trim() !== ''
  })

  // 獲取當前管理頁面的數據
  const currentManageData = computed(() => {
    return manageCategory.value === 'gallery' ? (galleryData.value || []) : (photographyData.value || [])
  })

  // 獲取當前概覽頁面的數據
  const currentOverviewData = computed(() => {
    return overviewCategory.value === 'gallery' ? (galleryData.value || []) : (photographyData.value || [])
  })

  // 按事件分組的圖片數據 (管理頁面用)
  const groupedManageData = computed(() => {
    const data = currentManageData.value || []
    const groups: Record<string, {
      eventName: string
      description: string
      location: string
      items: UnifiedGalleryItem[]
    }> = {}

    data.forEach(item => {
      let currentEventName = '預設事件'
      let description = '未分類作品'
      let location = ''

      // 檢查是否有事件資訊
      if (manageCategory.value === 'photography' && (item as any).event) {
        const event = (item as any).event
        currentEventName = event.name || '預設事件'
        description = event.description || '未分類作品'
        location = event.location || ''
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
    let result = Object.values(groups).map(group => ({
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

    // 如果有選中特定事件，只返回該事件
    if (selectedEvent.value && selectedEvent.value !== '') {
      result = result.filter(group => group.eventName === selectedEvent.value)
    }

    return result
  })

    // 可用事件列表 (管理頁面篩選用)
  const availableEvents = computed(() => {
    const data = currentManageData.value || []
    const events = new Set<string>()

    data.forEach(item => {
      if (manageCategory.value === 'photography' && (item as any).event) {
        events.add((item as any).event.name || '預設事件')
      } else {
        events.add('預設事件')
      }
    })

    return Array.from(events).sort()
  })

    // 統計資訊 (概覽頁面用)
  const overviewStats = computed(() => {
    const data = currentOverviewData.value || []

    return {
      totalImages: data.length,
      uniqueCameras: overviewCategory.value === 'photography'
        ? Array.from(new Set(data.map(item => (item as any).camera).filter(c => c && c !== 'Unknown')))
        : [],
      uniqueColors: overviewCategory.value === 'gallery'
        ? Array.from(new Set(data.map(item => (item as GalleryItem).color).filter(c => c)))
        : [],
      recentUploads: (() => {
        const now = new Date()
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        return data.filter(item => {
          const itemDate = new Date(item.time)
          return itemDate >= thisMonth
        }).length
      })(),
      events: overviewCategory.value === 'photography'
        ? Array.from(new Set(data.map(item => (item as any).event?.name).filter(e => e)))
        : []
    }
  })

  // 最近項目 (概覽頁面用)
  const recentItems = computed(() => {
    const data = currentOverviewData.value || []
    return data.slice(0, 20).sort((a, b) =>
      new Date(b.time).getTime() - new Date(a.time).getTime()
    )
  })

  // ===== Actions =====

    // 載入指定分類的圖片列表
  const loadGalleryByCategory = async (category: CategoryType) => {
    if (loading.value) return // 防止重複載入

    loading.value = true
    try {
      const response = await $fetch('/api/gallery', {
        query: { category }
      }) as { success: boolean; data: { Img: UnifiedGalleryItem[] } }

      if (response.success && response.data) {
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
    eventName.value = ''
    eventDescription.value = ''
    eventLocation.value = ''
    message.value = ''
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
    if (!editingEventData.value) return

    loading.value = true

    try {
      const response = await $fetch('/api/update-event', {
        method: 'PATCH',
        body: {
          originalEventName: editingEventData.value.originalName,
          newEventName: data.eventName,
          newDescription: data.description,
          newLocation: data.location,
          category: manageCategory.value
        }
      }) as { success: boolean; message: string; updatedCount: number }

      if (response.success) {
        message.value = response.message
        messageType.value = 'success'
        showEventEditDialog.value = false
        editingEventData.value = null
        // 重新載入圖片列表
        await loadGalleryByCategory(manageCategory.value)
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
      const response = await $fetch('/api/delete-image', {
        method: 'DELETE',
        body: {
          filename: pendingDeleteFilename.value,
          category: manageCategory.value
        }
      }) as { success: boolean; message: string }

      if (response.success) {
        message.value = '圖片刪除成功'
        messageType.value = 'success'
        // 重新載入圖片列表
        await loadGalleryByCategory(manageCategory.value)
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
    selectedEvent.value = ''
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

    // 表單狀態
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
    resetState
  }
})