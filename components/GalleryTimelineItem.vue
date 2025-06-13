<template>
  <div class="flex items-start relative" :class="index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'">
    <!-- Timeline Section -->
    <div
      class="md:w-40 flex-shrink-0 text-right md:text-left mb-4 md:mb-0 relative"
      :class="index % 2 === 0 ? 'md:mr-16' : 'md:ml-16 md:text-right'"
    >
      <!-- Timeline Dot -->
      <div
        class="absolute w-4 h-4 bg-white border-2 border-gray-400 rounded-full hidden md:block z-10"
        :class="index % 2 === 0 ? 'left-[-4.5rem]' : 'right-[-4.5rem]'"
      ></div>

      <!-- Event Control Button -->
      <div
        v-if="showEventControl"
        class="absolute hidden md:block z-20"
        :class="index % 2 === 0 ? 'left-[-3.5rem]' : 'right-[-3.5rem]'"
      >
        <button
          @click="eventKey && toggleGroupExpansion(eventKey)"
          :class="[
            'w-5 h-5 rounded-full transition-all duration-200 flex items-center justify-center group shadow-sm',
            isExpanded ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
          ]"
          :title="`${isExpanded ? '折疊' : '展開'} ${eventName} 的作品`"
        >
          <svg class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              v-if="isExpanded"
              fill-rule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clip-rule="evenodd"
            ></path>
            <path
              v-else
              fill-rule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clip-rule="evenodd"
            ></path>
          </svg>
        </button>
      </div>

      <!-- Time Label -->
      <div class="text-sm text-gray-500 font-light tracking-wide mb-10">
        <span class="transform md:-rotate-90 origin-center whitespace-nowrap inline-block">
          {{ timeLabel }}
        </span>
      </div>

      <!-- Event Info -->
      <div
        v-if="eventInfo && showEventInfo && (eventInfo.description || eventInfo.location)"
        class="hidden md:block"
        :class="index % 2 === 0 ? '' : 'text-right'"
      >
        <div
          class="p-2 bg-white/90 backdrop-blur-sm rounded text-xs shadow-sm max-w-32"
          :class="index % 2 === 0 ? 'text-left' : 'text-right'"
        >
          <div v-if="eventInfo.description" class="text-gray-700 mb-1 truncate">
            {{ eventInfo.description }}
          </div>
          <div v-if="eventInfo.location" class="text-gray-500 truncate">
            📍 {{ eventInfo.location }}
          </div>
        </div>
      </div>
    </div>

    <!-- Content Slot -->
    <div
      class="flex-1 md:max-w-2xl"
      :class="index % 2 === 0 ? 'md:ml-16' : 'md:mr-16'"
    >
      <slot />
    </div>
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
  showEventControl: false,
  showEventInfo: false
})

const galleryStore = useGalleryStore()
const { expandedGroups } = storeToRefs(galleryStore)
const { toggleGroupExpansion } = galleryStore

const eventName = computed(() => props.eventInfo?.name || '事件')
const isExpanded = computed(() =>
  props.eventKey ? expandedGroups.value[props.eventKey] || false : false
)
</script>