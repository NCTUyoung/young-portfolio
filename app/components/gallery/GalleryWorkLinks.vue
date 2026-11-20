<template>
  <div v-if="exhibition || paintedRoom" class="work-links">
    <NuxtLink
      v-if="exhibition"
      :to="{ path: '/exhibition/light', hash: exhibition.hash }"
      data-testid="gallery-work-exhibition"
      class="work-links__link"
    >
      <span>{{ exhibition.label }}</span>
      <Icon name="lucide:arrow-up-right" aria-hidden="true" />
    </NuxtLink>
    <a
      v-if="paintedRoom"
      :href="`${baseURL}painted-worlds/index.html?from=work#${paintedRoom.hash}`"
      :data-painted-room="paintedRoom.hash"
      data-testid="gallery-work-painted-room"
      class="work-links__link"
    >
      <span>進入畫界 · {{ paintedRoom.title }}</span>
      <Icon name="lucide:arrow-up-right" aria-hidden="true" />
    </a>
  </div>
</template>

<script lang="ts">
import { computed } from 'vue'

// IDs match the gallery source files and the original artwork in painted-worlds/exhibition.json.
const orchardId = 'digital-gallery/2026年電繪作品/23-編輯-4-1'
const stageId = 'digital-gallery/2026年電繪作品/16-編輯-1'
const paintedRooms = new Map([
  [orchardId, { hash: 'orchard', title: '柑橘樹下' }],
  [stageId, { hash: 'stage', title: '紅色舞台' }]
])

// These are the three works displayed on /exhibition/light.
const exhibitionStops = new Map([
  [orchardId, { hash: '#painting', label: '光落之處 · 繪作' }],
  ['photography-photography/峨嵋湖風鈴木/DSC_1377-編輯-1', { hash: '#flowers', label: '光落之處 · 花下' }],
  ['photography-photography/WBC東京 台澳/DSC_9885-編輯-1', { hash: '#bench', label: '光落之處 · 長椅' }]
])
</script>

<script setup lang="ts">
const props = defineProps<{ workId: string }>()
const baseURL = useRuntimeConfig().app.baseURL.replace(/\/?$/, '/')
const paintedRoom = computed(() => paintedRooms.get(props.workId))
const exhibition = computed(() => exhibitionStops.get(props.workId))
</script>

<style scoped>
.work-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0 clamp(0.85rem, 2vw, 1.5rem);
}
.work-links__link {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 44px;
  color: var(--work-link-ink, var(--museum-ink, var(--fg-2)));
  font-size: 0.8rem;
  text-decoration: underline;
  text-decoration-color: var(--work-link-rule, var(--museum-line, var(--border)));
  text-underline-offset: 0.3em;
}
.work-links__link:hover { text-decoration-color: currentColor; }
.work-links__link:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
</style>
