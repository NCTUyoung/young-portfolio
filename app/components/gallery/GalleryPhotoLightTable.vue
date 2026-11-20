<template>
  <section v-if="selected" class="light-table" aria-label="暗房選片光桌" data-testid="photo-light-table">
    <div class="light-table__surface">
      <div class="light-table__intro"><slot name="intro" /></div>

      <div v-if="neighbors.length" class="light-table__neighbors" aria-label="其他照片">
        <button
          v-for="(neighbor, index) in neighbors"
          :key="neighbor.image.filename"
          type="button"
          class="light-table__print light-table__neighbor"
          :class="`light-table__neighbor--${index + 1}`"
          :aria-label="`選看：${getGalleryDisplayTitle(neighbor.image, galleryStore.photographyWorks)}`"
          @click="selectImage(neighbor.index, true)"
        >
          <picture>
            <source :srcset="getGridAvifSrcset(neighbor.image.filename)" sizes="(max-width: 639px) 22vw, 20vw" type="image/avif">
            <source :srcset="getGridImageSrcset(neighbor.image.filename)" sizes="(max-width: 639px) 22vw, 20vw" type="image/webp">
            <img :src="getThumbPath(neighbor.image.filename, 400)" :alt="getGalleryDisplayTitle(neighbor.image, galleryStore.photographyWorks)" decoding="async" draggable="false">
          </picture>
        </button>
      </div>

      <figure class="light-table__selected" :style="{ '--photo-ratio': selected.aspectRatio || 1.5 }" data-testid="light-table-selected">
        <button
          ref="selectedButton"
          type="button"
          class="light-table__print light-table__main"
          :aria-label="`放大觀看：${getGalleryDisplayTitle(selected, galleryStore.photographyWorks)}`"
          data-testid="light-table-open"
          @click="$emit('imageOpen', selected)"
        >
          <picture>
            <source :srcset="mainAvifSrcset" sizes="(max-width: 639px) 75vw, 44vw" type="image/avif">
            <source :srcset="mainWebpSrcset" sizes="(max-width: 639px) 75vw, 44vw" type="image/webp">
            <img
              :src="getThumbPath(selected.filename, 800)"
              :alt="getGalleryDisplayTitle(selected, galleryStore.photographyWorks)"
              loading="eager"
              fetchpriority="high"
              decoding="async"
              draggable="false"
            >
          </picture>
          <span class="light-table__open-label">查看大圖 <Icon name="lucide:arrow-up-right" aria-hidden="true" /></span>
        </button>
        <figcaption class="light-table__caption">
          <span>{{ getGalleryDisplayTitle(selected, galleryStore.photographyWorks) }}</span>
          <span aria-live="polite">{{ selectedIndex + 1 }} / {{ items.length }}</span>
          <GalleryWorkLinks :work-id="selected.id" />
        </figcaption>
      </figure>
    </div>

    <div class="light-table__footer">
      <div class="light-table__strip" role="group" aria-label="選擇照片" @keydown="onStripKeydown">
        <button
          v-for="(image, index) in items"
          :key="image.filename"
          :ref="element => setThumbnailRef(element, index)"
          type="button"
          class="light-table__thumb"
          :aria-label="`選看第 ${index + 1} 張：${getGalleryDisplayTitle(image, galleryStore.photographyWorks)}`"
          :aria-pressed="index === selectedIndex"
          :data-index="index"
          @click="selectImage(index)"
        >
          <span class="light-table__frame-no" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
          <picture>
            <source :srcset="getAvifThumbPath(image.filename, 400)" type="image/avif">
            <img :src="getThumbPath(image.filename, 400)" :alt="getGalleryDisplayTitle(image, galleryStore.photographyWorks)" :loading="index < 6 ? 'eager' : 'lazy'" decoding="async" draggable="false">
          </picture>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import type { GalleryItem } from '~~/shared/types/gallery'
import { useImagePath } from '~/composables/useImagePath'
import { useGalleryStore } from '~/stores/gallery'
import { getGalleryDisplayTitle } from '~/utils/galleryDisplayTitle'
import GalleryWorkLinks from './GalleryWorkLinks.vue'

const props = defineProps<{ items: GalleryItem[]; eventName: string; activeImageId?: string }>()
defineEmits<{ imageOpen: [image: GalleryItem] }>()

const { getThumbPath, getAvifThumbPath, getGridImageSrcset, getGridAvifSrcset } = useImagePath()
const galleryStore = useGalleryStore()
const selectedFilename = ref<string | null>(null)
const selectedButton = ref<HTMLButtonElement | null>(null)
const mounted = ref(false)
onMounted(() => { mounted.value = true })
const thumbnails = new Map<number, HTMLButtonElement>()
const selectedIndex = computed(() => Math.max(0, props.items.findIndex(image => image.filename === selectedFilename.value)))
const selected = computed(() => props.items[selectedIndex.value])
const neighbors = computed(() => props.items
  .map((image, index) => ({ image, index }))
  .filter(({ index }) => index !== selectedIndex.value)
  .slice(0, 3))

const mainWebpSrcset = computed(() => selected.value
  ? `${getGridImageSrcset(selected.value.filename)}, ${getThumbPath(selected.value.filename, 1600)} 1600w` : '')
const mainAvifSrcset = computed(() => selected.value
  ? `${getGridAvifSrcset(selected.value.filename)}, ${getAvifThumbPath(selected.value.filename, 1600)} 1600w` : '')

// Selection is local to the table. Only opening the viewer owns the ?image= route.
watch([() => props.eventName, () => props.items], ([eventName, items], [previousEvent]) => {
  if (eventName !== previousEvent || !items.some(image => image.filename === selectedFilename.value)) {
    selectedFilename.value = null
  }
})

// Read the viewer's selection without becoming another owner of route or scroll state.
watch([() => props.activeImageId, mounted], ([id, ready]) => {
  if (!ready) return
  const image = props.items.find(item => item.id === id)
  if (image) selectedFilename.value = image.filename
}, { immediate: true })

async function selectImage (index: number, focusPrint = false) {
  const image = props.items[index]
  if (!image) return
  selectedFilename.value = image.filename
  if (focusPrint) {
    await nextTick()
    selectedButton.value?.focus({ preventScroll: true })
  }
}

function setThumbnailRef (element: Element | ComponentPublicInstance | null, index: number) {
  if (element instanceof HTMLButtonElement) thumbnails.set(index, element)
  else thumbnails.delete(index)
}

function onStripKeydown (event: KeyboardEvent) {
  if (!(event.target instanceof HTMLButtonElement)) return
  const current = Number(event.target.dataset.index)
  const last = props.items.length - 1
  const destination = event.key === 'ArrowRight' ? Math.min(current + 1, last)
    : event.key === 'ArrowLeft' ? Math.max(current - 1, 0)
      : event.key === 'Home' ? 0 : event.key === 'End' ? last : null
  if (destination === null) return
  event.preventDefault()
  selectImage(destination)
  thumbnails.get(destination)?.focus({ preventScroll: true })
  thumbnails.get(destination)?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' })
}
</script>

<style scoped>
.light-table {
  --table-paper: var(--museum-light);
  --table-ink: var(--museum-ink);
  --table-muted: var(--museum-muted);
  --table-line: var(--museum-line);
  color: var(--table-ink);
}
.light-table__surface {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  grid-template-rows: auto 1fr;
  align-items: start;
  gap: clamp(0.75rem, 2.5vw, 2.5rem) clamp(1.4rem, 4vw, 4rem);
  min-height: clamp(24rem, 53svh, 38rem);
  padding: clamp(1rem, 3vw, 3rem);
  background:
    radial-gradient(ellipse 76% 105% at 64% 0, var(--museum-light), transparent 100%),
    var(--museum-cool);
  border-inline: 1px solid var(--table-line);
}
.light-table__intro { grid-area: 1 / 1; }
.light-table__neighbors {
  grid-area: 2 / 1;
  align-self: end;
  display: flex;
  align-items: end;
  gap: clamp(0.3rem, 1vw, 0.8rem);
  padding: 0.75rem 0 1rem;
}
.light-table__print {
  display: block;
  background: var(--table-paper);
  padding: clamp(0.4rem, 1.1vw, 0.92rem);
  box-shadow: 3px 14px 24px -10px rgb(22 29 30 / 38%);
  transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
}
.light-table__print picture, .light-table__print img { display: block; width: 100%; }
.light-table__print img { object-fit: contain; }
.light-table__print:focus-visible, .light-table__thumb:focus-visible { outline: 2px solid var(--table-ink); outline-offset: 3px; }
.light-table__neighbor { width: 33%; min-height: 44px; }
.light-table__neighbor img { aspect-ratio: 4 / 5; }
.light-table__neighbor--1 { transform: rotate(-5deg); }
.light-table__neighbor--2 { transform: rotate(3deg) translateY(-0.6rem); }
.light-table__neighbor--3 { transform: rotate(-3deg); }
.light-table__neighbor:hover, .light-table__neighbor:focus-visible { transform: translateY(-0.25rem); z-index: 1; }
.light-table__selected {
  grid-area: 1 / 2 / 3;
  justify-self: center;
  width: min(100%, calc(clamp(20rem, 54svh, 36rem) * var(--photo-ratio) + 2rem));
  margin: 0;
}
.light-table__main { width: 100%; }
.light-table__main img { height: auto; aspect-ratio: var(--photo-ratio); }
.light-table__main:hover { transform: translateY(-0.2rem); }
.light-table__open-label {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.45rem;
  padding-top: 0.65rem;
  font-size: 0.76rem;
  color: var(--table-muted);
}
.light-table__caption {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0 0.75rem;
  padding: 0.72rem 0.1rem 0;
  color: var(--table-ink);
  font-size: 0.84rem;
  line-height: 1.6;
}
.light-table__caption > span:first-child { min-width: 0; overflow-wrap: anywhere; }
.light-table__caption > span:nth-child(2) { white-space: nowrap; font-variant-numeric: tabular-nums; color: var(--table-muted); }
.light-table__caption :deep(.work-links) { flex-basis: 100%; }
.light-table__footer { padding: 0.75rem 0 0.25rem; border-top: 1px solid var(--table-line); }
.light-table__strip { display: flex; gap: 0.35rem; padding: 0.3rem 0.4rem 0.5rem; overflow-x: auto;  scrollbar-width: thin; scrollbar-color: var(--table-line) transparent; }
.light-table__thumb { position: relative; flex: 0 0 5rem; padding: 0.25rem 0.35rem 0.6rem; opacity: 0.65; border-bottom: 2px solid transparent; transition: opacity 180ms ease; }
.light-table__thumb::before, .light-table__thumb::after { content: ''; position: absolute; top: 1.6rem; bottom: 0.9rem; width: 3px; background: radial-gradient(ellipse at center, var(--table-line) 1px, transparent 1.8px) 0 0 / 3px 8px repeat-y; }
.light-table__thumb::before { left: 0; }.light-table__thumb::after { right: 0; }
.light-table__thumb:hover, .light-table__thumb[aria-pressed='true'] { opacity: 1; }
.light-table__thumb[aria-pressed='true'] { border-bottom-color: var(--table-ink); }
.light-table__frame-no { display: block; margin-bottom: 0.35rem; color: var(--table-muted); font-size: 0.8rem; font-variant-numeric: tabular-nums; text-align: left; }
.light-table__thumb img { display: block; width: 100%; height: 3.8rem; object-fit: cover; }
@media (max-width: 639px) {
  .light-table__surface {
    grid-template-columns: minmax(0, 16%) minmax(0, 1fr);
    grid-template-rows: auto auto;
    gap: 1rem 0.85rem;
    min-height: 0;
    padding: 0.75rem clamp(0.4rem, 2.5vw, 1rem) 1rem;
  }
  .light-table__intro { grid-area: 1 / 1 / auto / -1; }
  .light-table__neighbors { flex-direction: column; align-self: center; }
  .light-table__neighbor { width: 100%; padding: 0.23rem; }
  .light-table__neighbor--2 { transform: rotate(4deg); }
  .light-table__neighbor--3 { display: none; }
  .light-table__selected { grid-area: 2 / 2; width: min(100%, calc(25rem * var(--photo-ratio) + 1.2rem)); }
  .light-table__surface:not(:has(.light-table__neighbors)) .light-table__selected { grid-column: 1 / -1; }
  .light-table__thumb { flex-basis: 4.25rem; }
  .light-table__thumb img { height: 3.3rem; }
}
@media (prefers-reduced-motion: reduce) {
  .light-table__print, .light-table__thumb { transition: none; }
  .light-table__main:hover,
  .light-table__neighbor:hover,
  .light-table__neighbor:focus-visible { transform: none; }
}
</style>
