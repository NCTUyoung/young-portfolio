<template>
  <div v-if="isVisible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
      <!-- 標題 -->
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">編輯圖片資訊</h3>
      </div>

      <!-- 內容 -->
      <div class="p-6 max-h-[70vh] overflow-y-auto">
        <div v-if="imageData" class="space-y-6">
          <!-- 圖片預覽 -->
          <div class="flex items-start space-x-4">
            <img
              :src="getImagePath(imageData.filename)"
              :alt="imageData.title"
              class="w-24 h-24 object-cover rounded-lg border border-gray-200"
            />
            <div class="flex-1">
              <h4 class="font-medium text-gray-900 mb-1">{{ imageData.filename }}</h4>
              <p class="text-sm text-gray-500">檔案名稱</p>
            </div>
          </div>

          <!-- 基本資訊 -->
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                標題 <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.title"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="請輸入圖片標題"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                描述
              </label>
              <textarea
                v-model="formData.content"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="請輸入圖片描述"
              />
            </div>

            <!-- 創作/拍攝日期 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ category === 'gallery' ? '創作日期' : '拍攝日期' }} <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.date"
                type="date"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p class="text-xs text-gray-500 mt-1">
                {{ category === 'gallery' ? '選擇作品的實際創作日期' : '選擇照片的實際拍攝日期' }}
              </p>
            </div>

            <!-- 繪圖作品專用欄位 -->
            <div v-if="category === 'gallery'" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  顏色標籤
                </label>
                <select
                  v-model="formData.color"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            </div>

            <!-- 攝影作品專用欄位 -->
            <div v-if="category === 'photography'" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  標籤 (用逗號分隔)
                </label>
                <input
                  v-model="formData.tagsString"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例如：人像,街拍,藝術"
                />
                <p class="text-xs text-gray-500 mt-1">
                  相機設定（ISO、光圈、快門等）無法修改，會自動從照片讀取
                </p>
              </div>
            </div>

            <!-- 事件資訊 (如果有的話) -->
            <div v-if="imageData.event" class="border-t pt-4">
              <h5 class="text-sm font-medium text-gray-700 mb-3">事件資訊</h5>
              <div class="space-y-3 bg-gray-50 p-3 rounded-md">
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">事件名稱</label>
                  <p class="text-sm text-gray-900">{{ imageData.event.name }}</p>
                </div>
                <div v-if="imageData.event.description">
                  <label class="block text-xs font-medium text-gray-600 mb-1">事件描述</label>
                  <p class="text-sm text-gray-900">{{ imageData.event.description }}</p>
                </div>
                <div v-if="imageData.event.location">
                  <label class="block text-xs font-medium text-gray-600 mb-1">事件地點</label>
                  <p class="text-sm text-gray-900">{{ imageData.event.location }}</p>
                </div>
              </div>
              <p class="text-xs text-gray-500 mt-2">
                事件資訊請到事件編輯功能中修改
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 按鈕 -->
      <div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
        <button
          @click="cancel"
          type="button"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          取消
        </button>
        <button
          @click="confirm"
          :disabled="!isFormValid"
          type="button"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          保存
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { GalleryItem, PhotographyItem } from '~/types/gallery'

interface Props {
  isVisible: boolean
  imageData: GalleryItem | PhotographyItem | null
  category: 'gallery' | 'photography'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  confirm: [data: {
    title: string
    content: string
    date: string
    color?: string
    tags?: string[]
  }]
  cancel: []
}>()

const { getImagePath } = useImagePath()

// 表單數據
const formData = ref({
  title: '',
  content: '',
  date: '',
  color: 'blue',
  tagsString: ''
})

// 表單驗證
const isFormValid = computed(() => {
  return formData.value.title.trim() !== '' && formData.value.date !== ''
})

// 監聽 imageData 變化，重置表單
watch(() => props.imageData, (newData) => {
  if (newData) {
    // 解析日期字符串，提取日期部分
    const dateStr = newData.time
    let dateOnly = ''

    try {
      // 嘗試解析 "2024 Jan 15" 格式
      const date = new Date(dateStr)
      if (!isNaN(date.getTime())) {
        dateOnly = date.toISOString().split('T')[0]
      } else {
        // 如果解析失敗，使用當前日期
        dateOnly = new Date().toISOString().split('T')[0]
      }
    } catch {
      dateOnly = new Date().toISOString().split('T')[0]
    }

    formData.value = {
      title: newData.title || '',
      content: newData.content || '',
      date: dateOnly,
      color: (newData as GalleryItem).color || 'blue',
      tagsString: props.category === 'photography'
        ? Array.isArray((newData as PhotographyItem).tags)
          ? (newData as PhotographyItem).tags.join(', ')
          : String((newData as PhotographyItem).tags || '')
        : ''
    }
  }
}, { immediate: true })

// 確認按鈕
const confirm = () => {
  if (!isFormValid.value) return

  const updateData: any = {
    title: formData.value.title.trim(),
    content: formData.value.content.trim(),
    date: formData.value.date
  }

  if (props.category === 'gallery') {
    updateData.color = formData.value.color
  } else if (props.category === 'photography') {
    updateData.tags = formData.value.tagsString
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag)
  }

  console.log('Sending update data:', updateData)
  emit('confirm', updateData)
}

// 取消按鈕
const cancel = () => {
  emit('cancel')
}
</script>