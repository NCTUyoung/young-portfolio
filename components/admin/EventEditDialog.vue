<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    @click.self="$emit('cancel')"
  >
    <div
      class="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all"
      @click.stop
    >
      <!-- 標題列 -->
      <div class="flex justify-between items-center p-6 border-b border-stone-200">
        <h3 class="text-lg font-medium text-stone-800">編輯事件</h3>
        <button
          @click="$emit('cancel')"
          class="text-stone-400 hover:text-stone-600 transition-colors"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>

      <!-- 表單內容 -->
      <div class="p-6 space-y-4">
        <!-- 事件名稱 -->
        <div>
          <label class="block text-sm font-medium text-stone-700 mb-2">
            事件名稱 <span class="text-red-500">*</span>
          </label>
          <input
            v-model="localEventName"
            type="text"
            class="w-full px-3 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="輸入事件名稱"
            :disabled="loading"
          />
        </div>

        <!-- 事件描述 -->
        <div>
          <label class="block text-sm font-medium text-stone-700 mb-2">
            事件描述
          </label>
          <textarea
            v-model="localDescription"
            rows="3"
            class="w-full px-3 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            placeholder="輸入事件描述"
            :disabled="loading"
          />
        </div>

        <!-- 事件地點 -->
        <div>
          <label class="block text-sm font-medium text-stone-700 mb-2">
            事件地點
          </label>
          <input
            v-model="localLocation"
            type="text"
            class="w-full px-3 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="輸入事件地點"
            :disabled="loading"
          />
        </div>
      </div>

      <!-- 操作按鈕 -->
      <div class="flex justify-end space-x-3 p-6 border-t border-stone-200">
        <button
          @click="$emit('cancel')"
          :disabled="loading"
          class="px-4 py-2.5 text-sm font-medium text-stone-600 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          取消
        </button>
        <button
          @click="handleConfirm"
          :disabled="loading || !localEventName.trim()"
          class="px-4 py-2.5 text-sm font-medium text-white bg-blue-500 border border-blue-500 rounded-lg hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
        >
          <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ loading ? '儲存中...' : '儲存' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  show: boolean
  eventName: string
  description: string
  location: string
  loading: boolean
}

interface Emits {
  (e: 'confirm', data: { eventName: string; description: string; location: string }): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 本地狀態 - 避免直接修改 props
const localEventName = ref(props.eventName)
const localDescription = ref(props.description)
const localLocation = ref(props.location)

// 監聽 props 變化更新本地狀態
watch(() => props.eventName, (newVal) => {
  localEventName.value = newVal
})

watch(() => props.description, (newVal) => {
  localDescription.value = newVal
})

watch(() => props.location, (newVal) => {
  localLocation.value = newVal
})

const handleConfirm = () => {
  if (!localEventName.value.trim()) return

  emit('confirm', {
    eventName: localEventName.value.trim(),
    description: localDescription.value.trim(),
    location: localLocation.value.trim()
  })
}
</script>