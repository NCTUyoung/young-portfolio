<template>
  <div class="flex items-start relative" :class="index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'">
    <!-- Timeline Section -->
    <div
      class="md:w-40 flex-shrink-0 text-right md:text-left mb-4 md:mb-0 relative"
      :class="index % 2 === 0 ? 'md:mr-16' : 'md:ml-16 md:text-right'"
    >
      <!-- Timeline 節點 — 菱形日式設計 -->
      <div
        class="absolute hidden md:block z-10"
        :class="index % 2 === 0 ? 'left-[-4.5rem]' : 'right-[-4.5rem]'"
        style="top: 0.2rem;"
      >
        <!-- 外框菱形 -->
        <div class="w-4 h-4 bg-white dark:bg-stone-900 border border-accent-400/60 dark:border-accent-500/60 rotate-45 relative">
          <!-- 內部小菱形 -->
          <div class="absolute inset-[3px] bg-accent-400 dark:bg-accent-500 rotate-0"/>
        </div>
      </div>

      <!-- Event Control Button -->
      <div
        v-if="showEventControl"
        class="absolute hidden md:block z-20"
        :class="index % 2 === 0 ? 'left-[-3.2rem]' : 'right-[-3.2rem]'"
        style="top: 1.4rem;"
      >
        <button
          :class="[
            'w-5 h-5 rounded-full transition-all duration-200 flex items-center justify-center group shadow-sm border',
            isExpanded
              ? 'bg-stone-100 dark:bg-stone-700 border-stone-300 dark:border-stone-600 hover:bg-stone-200 dark:hover:bg-stone-600'
              : 'bg-accent-500 dark:bg-accent-600 border-accent-600 dark:border-accent-500 hover:bg-accent-600'
          ]"
          :title="`${isExpanded ? '折疊' : '展開'} ${eventName} 的作品`"
          @click="eventKey && toggleGroupExpansion(eventKey)"
        >
          <svg
            class="w-2.5 h-2.5 transition-colors duration-200"
            :class="isExpanded ? 'text-stone-500 dark:text-stone-400' : 'text-white'"
            fill="currentColor" viewBox="0 0 20 20"
          >
            <path
              v-if="isExpanded"
              fill-rule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
            <path
              v-else
              fill-rule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>

      <!-- Time Label -->
      <div class="text-sm text-stone-400 dark:text-stone-500 font-light tracking-wide mb-10">
        <span class="transform md:-rotate-90 origin-center whitespace-nowrap inline-block font-jp">
          {{ timeLabel }}
        </span>
      </div>

      <!-- Event Info — 日式側線設計 -->
      <div
        v-if="eventInfo && showEventInfo && (eventInfo.description || eventInfo.location)"
        class="hidden md:block"
        :class="index % 2 === 0 ? '' : 'text-right'"
      >
        <div
          class="py-2 pr-2 bg-stone-50/80 dark:bg-stone-800/50 backdrop-blur-sm rounded-r text-xs max-w-32"
          :class="[
            index % 2 === 0 ? 'border-l-2 border-accent-300/50 dark:border-accent-600/40 pl-3 text-left' : 'border-r-2 border-accent-300/50 dark:border-accent-600/40 pr-3 text-right pl-2'
          ]"
        >
          <div v-if="eventInfo.description" class="text-stone-600 dark:text-stone-300 mb-1 truncate font-light tracking-wide">
            {{ eventInfo.description }}
          </div>
          <div
v-if="eventInfo.location" class="text-stone-400 dark:text-stone-500 truncate flex items-center gap-1"
               :class="index % 2 !== 0 ? 'justify-end' : ''">
            <!-- SVG 位置圖示 -->
            <svg class="w-2.5 h-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <span>{{ eventInfo.location }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Content Slot — 日式過場：紙の展開 + 方向性滑入 + 側線 -->
    <Transition name="collapse-fade" mode="out-in">
      <div
        v-if="shouldShowContent"
        class="flex-1 min-w-0 relative"
        :class="[
          index % 2 === 0 ? 'md:ml-16' : 'md:mr-16',
          index % 2 === 0 ? 'collapse-from-left' : 'collapse-from-right'
        ]"
      >
        <!-- 側線裝飾 — 隨內容淡入，延遲出現 -->
        <div
          class="collapse-accent-line absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-accent-400/50 dark:via-accent-500/40 to-transparent"
          :class="index % 2 === 0 ? 'left-0' : 'right-0 left-auto'"
        />
        <slot />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useGalleryStore, type PhotoEvent } from '~/stores/gallery'

interface Props {
  index: number
  timeLabel: string
  eventInfo?: PhotoEvent | null
  eventKey?: string
  showEventControl?: boolean
  showEventInfo?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  eventInfo: null,
  eventKey: '',
  showEventControl: false,
  showEventInfo: false
})

const galleryStore = useGalleryStore()
const { expandedGroups } = storeToRefs(galleryStore)
const { toggleGroupExpansion } = galleryStore

const eventName = computed(() => props.eventInfo?.name || '事件')

// 預設為展開；只有在使用者操作過該群組時才依照狀態收合/展開
const isExpanded = computed(() => {
  if (!props.eventKey) return true
  const state = expandedGroups.value[props.eventKey]
  return state === undefined ? true : state
})

// 若沒有顯示控制按鈕，內容一律顯示
const shouldShowContent = computed(() => {
  return !props.showEventControl || isExpanded.value
})
</script>

<style scoped>
/* 紙の展開 — 輕微 scale 如紙張落定 */
/* 方向性滑入 — 依時間軸左右，自軸心滑出 */
.collapse-fade-enter-active {
  transition: opacity 0.32s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.32s cubic-bezier(0.16, 1, 0.3, 1);
}
.collapse-fade-enter-active .collapse-accent-line {
  transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.12s;
  opacity: 1;
}
.collapse-fade-leave-active {
  transition: opacity 0.24s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.24s cubic-bezier(0.4, 0, 0.2, 1);
}
.collapse-fade-leave-active .collapse-accent-line {
  transition: opacity 0.15s ease-out;
  opacity: 0;
}
.collapse-fade-enter-from,
.collapse-fade-leave-to {
  opacity: 0;
}
.collapse-fade-enter-from.collapse-from-left,
.collapse-fade-leave-to.collapse-from-left {
  transform: translateX(-14px) translateY(-8px) scale(0.98);
}
.collapse-fade-enter-from.collapse-from-right,
.collapse-fade-leave-to.collapse-from-right {
  transform: translateX(14px) translateY(-8px) scale(0.98);
}
.collapse-fade-enter-to .collapse-accent-line,
.collapse-fade-leave-from .collapse-accent-line {
  opacity: 1;
}
.collapse-fade-enter-from .collapse-accent-line,
.collapse-fade-leave-to .collapse-accent-line {
  opacity: 0;
}
</style>
