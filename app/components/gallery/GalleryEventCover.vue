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
.event-cover { padding-top: 1.5rem; }
.event-cover-map-return {
  display: inline-flex; align-items: center; gap: 0.5rem; min-height: 44px;
  margin-bottom: 0.8rem; color: var(--fg-3); font-size: 0.8rem;
  text-decoration: underline; text-underline-offset: 6px; text-decoration-color: var(--border);
}
.event-cover-map-return:hover { color: var(--accent-ink); text-decoration-color: currentColor; }
.event-cover-map-return:focus-visible, .cover-expand:focus-visible { outline: 2px solid var(--accent-ink); outline-offset: 5px; }
.event-cover-heading { font-size: clamp(1.9rem, 3.5vw, 3.3rem); font-weight: 400; letter-spacing: 0.08em; line-height: 1.5; color: var(--fg-2); overflow-wrap: anywhere; }
.event-cover-meta-line { display: flex; flex-wrap: wrap; gap: 0.25rem 1rem; margin-top: 0.8rem; font-size: 0.75rem; line-height: 1.8; color: var(--fg-3); }
.event-cover-notes { max-width: 48rem; margin: 3rem auto 4rem; padding: 0 1rem; }
.event-cover-prologue { border-top: 1px solid var(--border-soft); padding-top: 2rem; }
.prologue-body { margin: 0; font-size: 1rem; line-height: 2.1; color: var(--fg-3); }
.prologue-mood { margin-top: 1rem; font-size: 0.8rem; color: var(--fg-muted); }
.event-cover-axes { margin-top: 1.5rem; display: grid; gap: 0.6rem; }
.event-cover-axes > div { display: flex; align-items: baseline; gap: 1rem; font-size: 0.75rem; color: var(--fg-3); }
.event-cover-axes dt { flex: 0 0 2rem; }
.event-cover-axes dd { display: flex; flex-wrap: wrap; gap: 0.4rem 0.8rem; }
.cover-expand { display: flex; align-items: center; justify-content: center; gap: 1rem; min-height: 44px; margin: 2rem auto 0; padding: 0.5rem 0; border-bottom: 1px solid var(--border); color: var(--fg-3); font-size: 0.8rem; letter-spacing: 0.12em; }
.cover-expand:hover { color: var(--accent-ink); }
@media (max-width: 639px) { .event-cover { padding-top: 0.5rem; } .event-cover-heading { font-size: 1.8rem; } .event-cover-notes { margin: 2rem auto 3rem; padding: 0; } }
</style>
