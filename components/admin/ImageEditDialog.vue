<template>
  <Teleport to="body">
    <div v-if="isVisible" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="cancel">
      <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <!-- 標題 -->
        <div class="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h3 class="text-sm font-medium text-stone-800 tracking-wide">編輯圖片資訊</h3>
          <button @click="cancel" class="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- 內容 -->
        <div class="p-6 max-h-[70vh] overflow-y-auto">
          <div v-if="imageData" class="space-y-6">
            <!-- 圖片預覽 -->
            <div class="flex items-start space-x-4">
              <img
                :src="getImagePath(imageData.filename)"
                :alt="imageData.title"
                class="w-20 h-20 object-cover rounded-xl border border-stone-100"
              />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-light text-stone-800 truncate">{{ imageData.filename }}</p>
                <p class="text-xs text-stone-400 font-light mt-1">檔案名稱</p>
              </div>
            </div>

            <!-- 表單欄位 -->
            <div class="space-y-4">
              <div>
                <label class="block text-xs font-light text-stone-500 mb-2 tracking-wider uppercase">
                  標題 <span class="text-red-400">*</span>
                </label>
                <input
                  v-model="formData.title"
                  type="text"
                  class="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-stone-50 text-stone-700 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  placeholder="請輸入圖片標題"
                />
              </div>

              <div>
                <label class="block text-xs font-light text-stone-500 mb-2 tracking-wider uppercase">描述</label>
                <textarea
                  v-model="formData.content"
                  rows="3"
                  class="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-stone-50 text-stone-700 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none"
                  placeholder="請輸入圖片描述"
                />
              </div>

              <div>
                <label class="block text-xs font-light text-stone-500 mb-2 tracking-wider uppercase">
                  {{ category === 'gallery' ? '創作日期' : '拍攝日期' }} <span class="text-red-400">*</span>
                </label>
                <input
                  v-model="formData.date"
                  type="date"
                  class="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-stone-50 text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                />
              </div>

              <!-- 繪圖作品專用 -->
              <div v-if="category === 'gallery'">
                <label class="block text-xs font-light text-stone-500 mb-2 tracking-wider uppercase">顏色標籤</label>
                <select
                  v-model="formData.color"
                  class="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-stone-50 text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
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

              <!-- 攝影作品專用 -->
              <div v-if="category === 'photography'">
                <label class="block text-xs font-light text-stone-500 mb-2 tracking-wider uppercase">標籤（逗號分隔）</label>
                <input
                  v-model="formData.tagsString"
                  type="text"
                  class="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-stone-50 text-stone-700 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  placeholder="例如：人像,街拍"
                />
                <p class="text-xs text-stone-400 font-light mt-1">相機設定無法修改，會自動從照片讀取</p>
              </div>

              <!-- 事件資訊 -->
              <div v-if="imageData.event" class="border-t border-stone-100 pt-4">
                <h5 class="text-xs font-light text-stone-500 mb-3 tracking-wider uppercase">事件資訊</h5>
                <div class="bg-stone-50 rounded-xl p-4 space-y-2">
                  <div>
                    <p class="text-xs text-stone-400 font-light">事件名稱</p>
                    <p class="text-sm font-light text-stone-700">{{ imageData.event.name }}</p>
                  </div>
                  <div v-if="imageData.event.description">
                    <p class="text-xs text-stone-400 font-light">事件描述</p>
                    <p class="text-sm font-light text-stone-700">{{ imageData.event.description }}</p>
                  </div>
                  <div v-if="imageData.event.location">
                    <p class="text-xs text-stone-400 font-light">地點</p>
                    <p class="text-sm font-light text-stone-700">{{ imageData.event.location }}</p>
                  </div>
                </div>
                <p class="text-xs text-stone-400 font-light mt-2">事件資訊請透過事件編輯功能修改</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 按鈕 -->
        <div class="px-6 py-4 border-t border-stone-100 flex justify-end space-x-3">
          <button
            @click="cancel"
            class="px-4 py-2 text-sm font-light text-stone-600 bg-stone-100 border border-stone-200 rounded-lg hover:bg-stone-200 transition-colors"
          >
            取消
          </button>
          <button
            @click="confirm"
            :disabled="!isFormValid"
            class="px-4 py-2 text-sm font-light text-white bg-stone-800 border border-transparent rounded-lg hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            儲存
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { GalleryItem, PhotographyItem } from '~/types/gallery'

interface Props {
  isVisible: boolean
  imageData: GalleryItem | PhotographyItem | null
  category: 'gallery' | 'photography'
}

const props = defineProps<Props>()
const emit = defineEmits<{
  confirm: [data: { title: string; content: string; date: string; color?: string; tags?: string[] }]
  cancel: []
}>()

const { getImagePath } = useImagePath()

const formData = ref({ title: '', content: '', date: '', color: 'blue', tagsString: '' })

const isFormValid = computed(() => formData.value.title.trim() !== '' && formData.value.date !== '')

watch(() => props.imageData, (newData) => {
  if (newData) {
    let dateOnly = ''
    try {
      const date = new Date(newData.time)
      if (!isNaN(date.getTime())) {
        dateOnly = date.toISOString().split('T')[0]
      } else {
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
    updateData.tags = formData.value.tagsString.split(',').map(t => t.trim()).filter(t => t)
  }
  emit('confirm', updateData)
}

const cancel = () => emit('cancel')

onMounted(() => {
  const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') cancel() }
  document.addEventListener('keydown', handleEsc)
  onUnmounted(() => document.removeEventListener('keydown', handleEsc))
})
</script>
