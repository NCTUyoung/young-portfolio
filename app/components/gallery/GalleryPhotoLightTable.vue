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
          :aria-label="`選看：${neighbor.image.title || '照片'}`"
          @click="selectImage(neighbor.index, true)"
        >
          <picture>
            <source :srcset="getGridAvifSrcset(neighbor.image.filename)" sizes="(max-width: 639px) 22vw, 20vw" type="image/avif">
            <source :srcset="getGridImageSrcset(neighbor.image.filename)" sizes="(max-width: 639px) 22vw, 20vw" type="image/webp">
            <img :src="getThumbPath(neighbor.image.filename, 400)" :alt="neighbor.image.title || '攝影作品'" decoding="async" draggable="false">
          </picture>
        </button>
      </div>

      <figure class="light-table__selected" :style="{ '--photo-ratio': selected.aspectRatio || 1.5 }" data-testid="light-table-selected">
        <button
          ref="selectedButton"
          type="button"
          class="light-table__print light-table__main"
          :aria-label="`放大觀看：${selected.title || '照片'}`"
          data-testid="light-table-open"
          @click="$emit('imageOpen', selected)"
        >
          <picture>
            <source :srcset="mainAvifSrcset" sizes="(max-width: 639px) 75vw, 44vw" type="image/avif">
            <source :srcset="mainWebpSrcset" sizes="(max-width: 639px) 75vw, 44vw" type="image/webp">
            <img
              :src="getThumbPath(selected.filename, 800)"
              :alt="selected.title || '攝影作品'"
              loading="eager"
              fetchpriority="high"
              decoding="async"
              draggable="false"
            >
          </picture>
          <span class="light-table__open-label">查看大圖 <Icon name="lucide:arrow-up-right" aria-hidden="true" /></span>
        </button>
        <figcaption class="light-table__caption">
          <span>{{ selected.title || '未命名' }}</span>
          <span aria-live="polite">{{ selectedIndex + 1 }} / {{ items.length }}</span>
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
          :aria-label="`選看第 ${index + 1} 張：${image.title || '照片'}`"
          :aria-pressed="index === selectedIndex"
          :data-index="index"
          @click="selectImage(index)"
        >
          <span class="light-table__frame-no" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
          <picture>
            <source :srcset="getAvifThumbPath(image.filename, 400)" type="image/avif">
            <img :src="getThumbPath(image.filename, 400)" :alt="image.title || '攝影作品'" :loading="index < 6 ? 'eager' : 'lazy'" decoding="async" draggable="false">
          </picture>
        </button>
      </div>
      <p class="light-table__hint">挑一張，停留片刻。<span>點照片放大觀看</span></p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import type { GalleryItem } from '~~/shared/types/gallery'
import { useImagePath } from '~/composables/useImagePath'

const props = defineProps<{ items: GalleryItem[]; eventName: string; activeImageId?: string }>()
defineEmits<{ imageOpen: [image: GalleryItem] }>()

const { getThumbPath, getAvifThumbPath, getGridImageSrcset, getGridAvifSrcset } = useImagePath()
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
  --table-paper: #faf7ef;
  --table-ink: #39434a;
  --table-muted: #58656d;
  --table-line: #bbc4c8;
  color: var(--table-ink);
  padding: 1rem clamp(0.5rem, 2vw, 2rem) 2rem;
}
.light-table__surface { position: relative; min-height: clamp(35rem, 76svh, 48rem); }
.light-table__intro { position: relative; width: 43%; z-index: 2; padding: 0.5rem 0 0; }
.light-table__neighbors { position: absolute; left: 1%; top: 12rem; bottom: 1rem; width: 45%; }
.light-table__print {
  display: block;
  background: var(--table-paper);
  padding: clamp(0.5rem, 1.2vw, 1rem);
  box-shadow: 3px 14px 22px -9px rgb(44 48 46 / 28%);
  transition: transform 450ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 450ms ease;
}
.light-table__print picture, .light-table__print img { display: block; width: 100%; }
.light-table__print img { object-fit: contain; }
.light-table__print:focus-visible, .light-table__thumb:focus-visible { outline: 2px solid var(--accent-ink); outline-offset: 5px; }
.light-table__neighbor { position: absolute; width: 50%; height: 44%; }
.light-table__neighbor picture { height: 100%; }
.light-table__neighbor img { height: 100%; }
.light-table__neighbor--1 { left: 1%; top: 25%; transform: rotate(-7deg); }
.light-table__neighbor--2 { right: -1%; top: 0; width: 47%; transform: rotate(-5deg); }
.light-table__neighbor--3 { right: -1%; bottom: 0; width: 48%; transform: rotate(6deg); }
.light-table__neighbor:hover, .light-table__neighbor:focus-visible { transform: translateY(-6px) rotate(0deg); z-index: 3; }
.light-table__selected { position: absolute; right: 3%; top: 0.75rem; width: min(44%, calc(clamp(25rem, 57svh, 36rem) * var(--photo-ratio) + 2rem)); margin: 0; transform: rotate(2deg); }
.light-table__main { width: 100%; padding-bottom: 0.8rem; box-shadow: 5px 25px 35px -13px rgb(36 42 43 / 35%); }
.light-table__main img { height: auto; aspect-ratio: var(--photo-ratio); }
.light-table__main:hover, .light-table__main:focus-visible { transform: translateY(-6px); box-shadow: 5px 30px 40px -13px rgb(36 42 43 / 40%); }
.light-table__open-label { display: flex; justify-content: flex-end; align-items: center; gap: 0.5rem; padding-top: 0.9rem; font-size: 0.75rem; color: var(--table-ink); }
.light-table__caption { display: flex; justify-content: space-between; gap: 1rem; padding: 1rem 0.2rem; color: var(--table-muted); font-size: 0.75rem; line-height: 1.6; transform: rotate(-2deg); }
.light-table__caption span:first-child { min-width: 0; overflow-wrap: anywhere; }
.light-table__caption span:last-child { white-space: nowrap; font-variant-numeric: tabular-nums; }
.light-table__footer { display: flex; align-items: flex-end; gap: 2rem; margin-top: 1rem; }
.light-table__strip { display: flex; gap: 0.35rem; padding: 0.3rem 0.4rem 0.5rem; overflow-x: auto; max-width: 70%; scrollbar-width: thin; scrollbar-color: var(--table-line) transparent; }
.light-table__thumb { position: relative; flex: 0 0 5rem; padding: 0.25rem 0.35rem 0.6rem; opacity: 0.65; border-bottom: 2px solid transparent; transition: opacity 180ms ease; }
.light-table__thumb::before, .light-table__thumb::after { content: ''; position: absolute; top: 1.6rem; bottom: 0.9rem; width: 3px; background: radial-gradient(ellipse at center, var(--table-line) 1px, transparent 1.8px) 0 0 / 3px 8px repeat-y; }
.light-table__thumb::before { left: 0; }.light-table__thumb::after { right: 0; }
.light-table__thumb:hover, .light-table__thumb[aria-pressed='true'] { opacity: 1; }
.light-table__thumb[aria-pressed='true'] { border-bottom-color: var(--accent-ink); }
.light-table__frame-no { display: block; margin-bottom: 0.35rem; color: var(--table-muted); font-size: 0.65rem; font-variant-numeric: tabular-nums; text-align: left; }
.light-table__thumb img { display: block; width: 100%; height: 3.8rem; object-fit: cover; }
.light-table__hint { margin-left: auto; color: var(--table-muted); font-family: var(--font-jp); font-size: 0.8rem; line-height: 1.9; white-space: nowrap; }
.light-table__hint span { display: block; font-family: var(--font-sans); font-size: 0.7rem; }
.dark .light-table { --table-paper: #302e28; --table-ink: #ece8df; --table-muted: #bac5cb; --table-line: #64717a; }
.dark .light-table__print { box-shadow: 3px 14px 22px -9px rgb(0 0 0 / 65%); }
.dark .light-table__main { box-shadow: 5px 25px 35px -13px rgb(0 0 0 / 75%); }
@media (max-width: 1023px) {
  .light-table__neighbors { top: 13rem; }
  .light-table__selected { right: 1%; width: min(47%, calc(clamp(25rem, 57svh, 36rem) * var(--photo-ratio) + 2rem)); }
  .light-table__intro { width: 46%; }
  .light-table__strip { max-width: 75%; }
  .light-table__hint { white-space: normal; }
}
@media (max-width: 639px) {
  .light-table { padding: 0.5rem 0 1.25rem; }
  .light-table__surface { min-height: 0; display: grid; grid-template-columns: 20% minmax(0, 1fr); }
  .light-table__intro { width: 100%; padding: 0 0 1.5rem; grid-column: 1 / -1; }
  .light-table__selected { position: relative; inset: auto; width: min(95%, calc(clamp(17rem, 43svh, 24rem) * var(--photo-ratio) + 1.2rem)); margin-left: auto; margin-right: 2%; grid-row: 2; grid-column: 2; }
  .light-table__main { padding: 0.6rem 0.6rem 0.75rem; }
  .light-table__open-label { font-size: 0.7rem; padding-top: 0.7rem; }
  .light-table__caption { font-size: 0.7rem; gap: 0.5rem; padding-top: 0.8rem; }
  .light-table__neighbors { position: relative; inset: auto; width: 100%; height: 12rem; grid-row: 2; grid-column: 1; align-self: center; }
  .light-table__neighbor { width: 100%; height: 5.8rem; padding: 0.3rem; }
  .light-table__neighbor--1 { left: 0; top: 0; transform: rotate(-7deg); }
  .light-table__neighbor--2 { right: 0; top: 6.5rem; width: 100%; transform: rotate(4deg); }
  .light-table__neighbor--3 { display: none; }
  .light-table__footer { display: block; margin-top: 0.75rem; }
  .light-table__strip { max-width: 100%; }
  .light-table__thumb { flex-basis: 4.25rem; }
  .light-table__thumb img { height: 3.3rem; }
  .light-table__hint { margin: 0.75rem 0 0; font-size: 0.75rem; }
  .light-table__hint span { display: inline; margin-left: 1rem; }
}
@media (prefers-reduced-motion: reduce) {
  .light-table__print, .light-table__thumb { transition: none; }
  .light-table__main:hover, .light-table__main:focus-visible { transform: none; }
  .light-table__neighbor:hover, .light-table__neighbor:focus-visible { transform: none; }
}
</style>
