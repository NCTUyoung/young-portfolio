<template>
  <HeadlessTransitionRoot appear :show="visibleToasts.length > 0" as="template">
    <div class="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <TransitionGroup
        enter="transform ease-out duration-300 transition"
        enter-from="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
        enter-to="translate-y-0 opacity-100 sm:translate-x-0"
        leave="transition ease-in duration-100"
        leave-from="opacity-100"
        leave-to="opacity-0"
        move-class="transition duration-300"
        tag="div"
        class="space-y-2"
      >
        <div
          v-for="toast in visibleToasts"
          :key="toast.id"
          :class="[
            'relative overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5',
            'bg-white dark:bg-gray-800 max-w-sm w-full pointer-events-auto'
          ]"
          @mouseenter="pauseTimer(toast.id)"
          @mouseleave="resumeTimer(toast.id)"
        >
          <!-- 進度條 -->
          <div
            v-if="toast.progress !== undefined"
            class="absolute top-0 left-0 h-1 bg-current opacity-30 transition-all duration-100 ease-linear"
            :class="getToastColor(toast.type)"
            :style="{ width: `${toast.progress}%` }"
          />

          <div class="p-4">
            <div class="flex items-start">
              <!-- 圖示 -->
              <div class="flex-shrink-0">
                <div
                  :class="[
                    'flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-medium',
                    getToastColor(toast.type)
                  ]"
                >
                  {{ getToastIcon(toast.type) }}
                </div>
              </div>

              <!-- 內容 -->
              <div class="ml-3 w-0 flex-1">
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ toast.title }}
                </p>
                <p
                  v-if="toast.message"
                  class="mt-1 text-sm text-gray-500 dark:text-gray-400"
                >
                  {{ toast.message }}
                </p>
              </div>

              <!-- 關閉按鈕 -->
              <div class="ml-4 flex-shrink-0 flex">
                <button
                  @click="removeToast(toast.id)"
                  class="bg-white dark:bg-gray-800 rounded-md inline-flex text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <span class="sr-only">關閉</span>
                  <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fill-rule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </HeadlessTransitionRoot>
</template>

<script setup lang="ts">
import {
  TransitionRoot as HeadlessTransitionRoot,
} from '@headlessui/vue'
import { TransitionGroup } from 'vue'
import { useGlobalToast } from '~/composables/useToast'

// 使用全域 toast
const {
  visibleToasts,
  removeToast,
  getToastIcon,
  getToastColor
} = useGlobalToast()

// 計時器控制（這裡需要擴展 composable 來支援暫停/恢復）
const pauseTimer = (id: string) => {
  // TODO: 實作暫停計時器邏輯
  console.log('Pause timer for:', id)
}

const resumeTimer = (id: string) => {
  // TODO: 實作恢復計時器邏輯
  console.log('Resume timer for:', id)
}
</script>