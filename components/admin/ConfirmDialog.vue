<template>
  <Teleport to="body">
    <div
      v-if="isVisible"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      @click.self="cancel"
    >
      <div class="mx-4 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl transition-transform dark:bg-stone-900 dark:ring-1 dark:ring-stone-700">
        <!-- Header -->
        <div class="border-b border-gray-200 px-6 py-4 dark:border-stone-700">
          <div class="flex items-center">
            <div class="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/80">
              <svg class="h-5 w-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-stone-100">{{ title }}</h3>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="px-6 py-4">
          <p class="text-sm leading-relaxed text-gray-600 dark:text-stone-300">
            {{ message }}
          </p>
          <div v-if="details" class="mt-3 rounded-lg bg-gray-50 p-3 dark:bg-stone-800/80">
            <p class="text-xs text-gray-500 dark:text-stone-400">{{ details }}</p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end space-x-3 bg-gray-50 px-6 py-4 dark:bg-stone-800/50">
          <button
            class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700 dark:focus:ring-offset-stone-900"
            @click="cancel"
          >
            取消
          </button>
          <button
            class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            @click="confirm"
          >
            確定刪除
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  isVisible: boolean
  title?: string
  message?: string
  details?: string
}

withDefaults(defineProps<Props>(), {
  title: '確認操作',
  message: '您確定要執行此操作嗎？',
  details: ''
})

const emit = defineEmits<{ (e: 'confirm' | 'cancel'): void }>()

const confirm = () => {
  emit('confirm')
}

const cancel = () => {
  emit('cancel')
}

// 監聽 ESC 鍵
onMounted(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      cancel()
    }
  }

  document.addEventListener('keydown', handleEscape)

  onUnmounted(() => {
    document.removeEventListener('keydown', handleEscape)
  })
})
</script>