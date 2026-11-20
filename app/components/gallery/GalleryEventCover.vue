<template>
  <section v-if="images.length" class="event-cover" aria-labelledby="event-cover-heading">
    <GalleryPhotoLightTable
      :key="eventName"
      :items="images"
      :event-name="eventName"
      :active-image-id="activeImageId"
      @image-open="$emit('imageOpen', $event)"
    >
      <template #intro>
        <NuxtLink to="/gallery/photography" replace class="event-cover-map-return" data-testid="event-cover-return-map">
          <Icon name="lucide:arrow-left" aria-hidden="true" />
          <span>返回地圖</span>
        </NuxtLink>
        <h1 id="event-cover-heading" class="event-cover-heading font-jp">{{ eventName }}</h1>
        <p class="event-cover-meta-line">
          <span v-if="eventInfo?.location">{{ eventInfo.location }}</span>
          <span v-if="timeRange">{{ timeRange }}</span>
          <span>{{ images.length }} 張影像</span>
        </p>
      </template>
    </GalleryPhotoLightTable>

    <div class="event-cover-notes">
      <div v-if="prologue" class="event-cover-prologue">
        <p class="prologue-body font-jp">{{ prologue.text }}</p>
        <p v-if="prologue.mood" class="prologue-mood">{{ prologue.mood }}</p>
        <dl v-if="axisRows.length" class="event-cover-axes">
          <div v-for="row in axisRows" :key="row.label">
            <dt>{{ row.label }}</dt>
            <dd><span v-for="value in row.values" :key="value">{{ value }}</span></dd>
          </div>
        </dl>
      </div>
      <button
        type="button"
        class="cover-expand"
        aria-controls="event-photo-series"
        :aria-expanded="seriesExpanded"
        :data-hydrated="hydrated"
        @click="$emit('expand')"
      >
        <span>{{ seriesExpanded ? '前往系列照片' : '展開全部' }}</span>
        <Icon name="lucide:arrow-down" aria-hidden="true" />
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import GalleryPhotoLightTable from './GalleryPhotoLightTable.vue'
import type { GalleryItem, MixedPhotoItem } from '~~/shared/types/gallery'

const props = defineProps<{
  group: MixedPhotoItem
  seriesExpanded: boolean
  activeImageId?: string
}>()
defineEmits<{ expand: []; imageOpen: [image: GalleryItem] }>()

const hydrated = ref(false)
onMounted(() => { hydrated.value = true })
const eventName = computed(() => props.group.eventName || '攝影作品')
const eventInfo = computed(() => props.group.eventInfo)
const images = computed(() => props.group.images || [])
const timeRange = computed(() => props.group.timeRange || '')
const narrative = computed(() => images.value[0]?.seriesNarrative)
const prologue = computed(() => {
  const text = narrative.value?.prologue || narrative.value?.narrative
  return text?.trim() ? { text, mood: narrative.value?.mood } : null
})
const axisRows = computed(() => [
  { label: '技法', values: narrative.value?.techniques },
  { label: '題材', values: narrative.value?.topics },
  { label: '工具', values: narrative.value?.tools }
].filter(row => row.values?.length))
</script>

<style scoped>
.event-cover { padding-top: clamp(1.1rem, 3vw, 2.5rem); }
.event-cover-map-return {
  display: inline-flex; align-items: center; gap: 0.5rem; min-height: 44px;
  margin-bottom: 0.6rem; color: var(--museum-muted); font-size: 0.82rem;
  text-decoration: underline; text-underline-offset: 6px; text-decoration-color: var(--museum-line);
}
.event-cover-map-return:hover { color: var(--museum-ink); text-decoration-color: currentColor; }
.event-cover-map-return:focus-visible, .cover-expand:focus-visible { outline: 2px solid var(--museum-ink); outline-offset: 5px; }
.event-cover-heading { font-size: clamp(1.9rem, 4.2vw, 3.9rem); font-weight: 300; letter-spacing: 0.045em; line-height: 1.25; color: var(--museum-ink); overflow-wrap: anywhere; }
.event-cover-meta-line { display: flex; flex-wrap: wrap; gap: 0.25rem 1rem; margin-top: 0.8rem; font-size: 0.82rem; line-height: 1.8; color: var(--museum-muted); }
.event-cover-notes {
  display: grid;
  grid-template-columns: minmax(0, 39rem) auto;
  justify-content: space-between;
  align-items: end;
  gap: 1rem 2rem;
  margin: 1.2rem auto clamp(3rem, 6vw, 5rem);
  padding: clamp(1rem, 3vw, 2rem) clamp(0rem, 2.5vw, 2rem) 0;
  border-top: 1px solid var(--museum-line);
}
.prologue-body { margin: 0; font-size: 1rem; line-height: 2.1; color: var(--museum-ink); }
.prologue-mood { margin-top: 1rem; font-size: 0.8rem; color: var(--museum-muted); }
.event-cover-axes { margin-top: 1.5rem; display: grid; gap: 0.6rem; }
.event-cover-axes > div { display: flex; align-items: baseline; gap: 1rem; font-size: 0.8rem; color: var(--museum-muted); }
.event-cover-axes dt { flex: 0 0 2rem; }
.event-cover-axes dd { display: flex; flex-wrap: wrap; gap: 0.4rem 0.8rem; }
.cover-expand { display: flex; align-items: center; justify-self: end; grid-column: -2 / -1; gap: 0.65rem; min-height: 44px; padding: 0.5rem 0; border-bottom: 1px solid var(--museum-line); color: var(--museum-ink); font-size: 0.82rem; }
.cover-expand:hover { border-color: currentColor; }
@media (max-width: 639px) {
  .event-cover-notes { grid-template-columns: minmax(0, 1fr); }
  .cover-expand { justify-self: start; }
}
</style>
