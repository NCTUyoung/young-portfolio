<template>
  <HeadlessTransitionRoot appear :show="visibleToasts.length > 0" as="template">
    <div class="fixed top-4 right-4 z-[1250] space-y-2 max-w-sm">
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
            'relative overflow-hidden rounded-xl shadow-lg',
            'border border-stone-200/60 dark:border-stone-700/50',
            'bg-white/95 dark:bg-stone-800/95 backdrop-blur-sm max-w-sm w-full pointer-events-auto'
          ]"
          @mouseenter="pauseTimer(toast.id)"
          @mouseleave="resumeTimer(toast.id)"
        >
          <!-- 進度條 -->
          <div
            v-if="toast.progress !== undefined"
            class="absolute top-0 left-0 h-0.5 opacity-60 transition-all duration-100 ease-linear"
            :class="getToastColor(toast.type)"
            :style="{ width: `${toast.progress}%` }"
          />

          <div class="p-4">
            <div class="flex items-start gap-3">
              <!-- 圖示 -->
              <div class="flex-shrink-0">
                <div
                  :class="[
                    'flex items-center justify-center w-7 h-7 rounded-lg text-white text-sm font-light',
                    getToastColor(toast.type)
                  ]"
                >
                  {{ getToastIcon(toast.type) }}
                </div>
              </div>

              <!-- 內容 -->
              <div class="flex-1 min-w-0">
                <p class="text-sm font-light tracking-wide text-stone-800 dark:text-stone-100">
                  {{ toast.title }}
                </p>
                <p
                  v-if="toast.message"
                  class="mt-0.5 text-xs text-stone-500 dark:text-stone-400 font-light leading-relaxed"
                >
                  {{ toast.message }}
                </p>
              </div>

              <!-- 關閉按鈕 -->
              <div class="flex-shrink-0">
                <button
                  class="p-1 rounded-lg text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100/60 dark:hover:bg-stone-700/60 transition-all duration-200 focus:outline-none"
                  @click="removeToast(toast.id)"
                >
                  <span class="sr-only">關閉</span>
                  <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
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
import { useGlobalToast } from '~/composables/useToast'

// 使用全域 toast
const {
  visibleToasts,
  removeToast,
  getToastIcon,
  getToastColor
} = useGlobalToast()

// 計時器控制
const pauseTimer = (_id: string) => {
  // TODO: 實作暫停計時器邏輯
}

const resumeTimer = (_id: string) => {
  // TODO: 實作恢復計時器邏輯
}
</script>
