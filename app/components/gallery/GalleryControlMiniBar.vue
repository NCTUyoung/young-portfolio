<template>
  <button
    type="button"
    class="group pointer-events-auto w-full border-b border-stone-200/70 bg-stone-50/85 px-4 py-2.5 text-left backdrop-blur-sm transition-colors hover:bg-stone-50/95 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-400/70 dark:border-stone-700/60 dark:bg-stone-900/82 dark:hover:bg-stone-900/92 dark:focus-visible:ring-accent-500/70 sm:px-6"
    data-testid="gallery-filter-mini-toggle"
    :aria-controls="controlsId"
    :aria-expanded="expanded"
    :aria-label="ariaLabel"
    @click="$emit('expand')"
  >
    <div class="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
      <p class="min-w-0 truncate text-[0.7rem] font-light tracking-[0.18em] text-stone-600 dark:text-stone-300">
        {{ summaryText }}
      </p>
      <span class="shrink-0 text-[0.62rem] font-light tracking-[0.28em] text-stone-500 transition-colors group-hover:text-accent-600 dark:text-stone-400 dark:group-hover:text-accent-400">
        FILTERS
      </span>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  controlsId: string
  categoryLabel: string
  eventLabel: string
  yearLabel: string
  searchLabel: string
  expanded?: boolean
}>()

defineEmits<{
  (e: 'expand'): void
}>()

const summaryText = computed(() => {
  return [
    `Category ${props.categoryLabel}`,
    `Event ${props.eventLabel}`,
    `Year ${props.yearLabel}`,
    `Search ${props.searchLabel}`
  ].join(' · ')
})

const ariaLabel = computed(() => {
  return `目前篩選：分類 ${props.categoryLabel}、事件 ${props.eventLabel}、年份 ${props.yearLabel}、搜尋 ${props.searchLabel}。按下可展開完整篩選控制區。`
})
</script>

