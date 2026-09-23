<template>
  <section
    :id="controlsId"
    class="archive-controls"
    :data-world="world"
    :data-mode="eventMode ? 'event' : 'overview'"
    :data-hydrated="hydrated"
    data-testid="gallery-archive-controls"
    aria-labelledby="gallery-archive-title"
  >
    <div class="archive-controls__identity">
      <div class="archive-controls__heading">
        <p class="archive-controls__eyebrow">{{ identity.eyebrow }}</p>
        <h1 id="gallery-archive-title" class="archive-controls__title font-jp">
          {{ identity.title }}
        </h1>
        <p class="archive-controls__note">{{ identity.note }}</p>
      </div>

      <p class="archive-controls__count">
        <span>{{ String(count).padStart(3, '0') }}</span>
        <small>{{ identity.unit }}</small>
      </p>
    </div>

    <div class="archive-controls__commandbar">
      <GalleryTabBar class="!mb-0" />

      <button
        ref="disclosureButtonRef"
        type="button"
        class="archive-controls__disclosure"
        :aria-controls="drawerId"
        :aria-expanded="drawerOpen"
        data-testid="gallery-filter-disclosure"
        @click="toggleDrawer"
      >
        <span class="archive-controls__disclosure-label">
          <span class="font-jp">{{ drawerOpen ? '閉' : '選' }}</span>
          {{ drawerOpen ? 'Close' : 'Filter' }}
        </span>
        <span class="archive-controls__summary">{{ filterSummary }}</span>
        <Icon
          name="lucide:chevron-down"
          class="archive-controls__chevron"
          :class="{ 'archive-controls__chevron--open': drawerOpen }"
          aria-hidden="true"
        />
      </button>
    </div>

    <Transition name="archive-drawer">
      <div
        v-show="drawerOpen"
        :id="drawerId"
        class="archive-controls__drawer"
        data-testid="gallery-filter-drawer"
      >
        <EventFilter class="!mb-0" />
        <GalleryFilterToolbar class="!mb-0" />
      </div>
    </Transition>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useGalleryStore } from '~/stores/gallery'
import GalleryTabBar from '~/components/GalleryTabBar.vue'
import EventFilter from '~/components/EventFilter.vue'
import GalleryFilterToolbar from '~/components/GalleryFilterToolbar.vue'

type GalleryWorld = 'kai' | 'kage'

const props = withDefaults(defineProps<{
  world: GalleryWorld
  count: number
  selectedEvent?: string | null
  controlsId?: string
}>(), {
  selectedEvent: null,
  controlsId: 'gallery-filter-controls',
})
const emit = defineEmits<{
  'open-change': [open: boolean]
}>()

const galleryStore = useGalleryStore()
const { filterState } = storeToRefs(galleryStore)

const drawerOpen = ref(false)
const hydrated = ref(false)
const disclosureButtonRef = ref<HTMLButtonElement | null>(null)
const drawerId = computed(() => `${props.controlsId}-drawer`)
const eventMode = computed(() => Boolean(props.selectedEvent))

const identity = computed(() => props.world === 'kai'
  ? {
      eyebrow: '繪 — Digital Archive',
      title: '作品索引',
      note: eventMode.value ? '返回製図室，或調整目前的觀看條件。' : '線條、色彩與未完成的想像。',
      unit: '葉 · works',
    }
  : {
      eyebrow: '影 — Photography Archive',
      title: '写真記録',
      note: eventMode.value ? '返回写真記録，或調整目前的觀看條件。' : '光、場所與記憶留下的座標。',
      unit: '枚 · frames',
    })

const filterSummary = computed(() => {
  const event = filterState.value.selectedEvent || '全部事件'
  const year = filterState.value.yearFilter || '全年份'
  const search = filterState.value.searchQuery.trim()
  return [event, year, search ? `「${search}」` : null].filter(Boolean).join(' · ')
})

function toggleDrawer () {
  drawerOpen.value = !drawerOpen.value
}

async function open () {
  drawerOpen.value = true
  await nextTick()
  disclosureButtonRef.value?.focus({ preventScroll: true })
}

watch([() => props.world, () => props.selectedEvent], () => {
  drawerOpen.value = false
})

watch(drawerOpen, openState => emit('open-change', openState))

onMounted(() => {
  hydrated.value = true
})

defineExpose({ open })
</script>

<style scoped>
.archive-controls {
  --archive-accent: var(--accent, #c46023);
  position: relative;
  padding: clamp(2rem, 5vw, 4.5rem) 0 1rem;
  color: var(--fg, rgb(41 37 36));
}

.archive-controls[data-world='kage'] {
  --archive-accent: #52647a;
}

:global(.dark .archive-controls[data-world='kage']) {
  --archive-accent: #9aadc5;
}

.archive-controls::before {
  content: '';
  position: absolute;
  top: clamp(2rem, 5vw, 4.5rem);
  bottom: 1rem;
  left: 0;
  width: 1px;
  background: linear-gradient(to bottom, var(--archive-accent), transparent 78%);
  opacity: 0.62;
}

.archive-controls__identity {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 2rem;
  padding: 0 clamp(1.25rem, 4vw, 3.5rem) clamp(1.75rem, 4vw, 3rem);
}

.archive-controls__heading {
  max-width: 46rem;
}

.archive-controls__eyebrow {
  margin: 0 0 0.85rem;
  color: color-mix(in srgb, var(--archive-accent) 82%, rgb(87 83 78));
  font-size: 0.65rem;
  font-weight: 400;
  letter-spacing: 0.34em;
  text-transform: uppercase;
}

.archive-controls__title {
  margin: 0;
  color: rgb(41 37 36);
  font-size: clamp(3.25rem, 7vw, 6.75rem);
  font-weight: 200;
  letter-spacing: 0.08em;
  line-height: 0.98;
}

:global(.dark .archive-controls__title) {
  color: rgb(245 245 244);
}

.archive-controls__note {
  margin: 1.25rem 0 0;
  max-width: 32rem;
  color: rgb(120 113 108);
  font-size: 0.9rem;
  font-weight: 300;
  letter-spacing: 0.08em;
  line-height: 1.8;
}

:global(.dark .archive-controls__note) {
  color: rgb(168 162 158);
}

.archive-controls__count {
  display: flex;
  align-items: baseline;
  gap: 0.55rem;
  margin: 0;
  color: rgb(68 64 60);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.05em;
}

.archive-controls__count > span {
  font-family: ui-monospace, 'SFMono-Regular', 'Roboto Mono', monospace;
  font-size: clamp(1.2rem, 2vw, 1.65rem);
}

.archive-controls__count small {
  color: rgb(168 162 158);
  font-size: 0.62rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

:global(.dark .archive-controls__count) { color: rgb(231 229 228); }
:global(.dark .archive-controls__count small) { color: rgb(120 113 108); }

.archive-controls__commandbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(17rem, auto);
  align-items: center;
  gap: 1.5rem;
  min-height: 4.5rem;
  padding: 0 clamp(1.25rem, 4vw, 3.5rem);
  border-top: 1px solid rgb(214 211 209 / 0.7);
  border-bottom: 1px solid rgb(214 211 209 / 0.7);
  background: rgb(255 255 255 / 0.38);
}

.archive-controls__commandbar :deep(.gallery-tabs__list) {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  overflow: visible;
}

.archive-controls__commandbar :deep(.gallery-tabs__link) {
  display: flex;
  justify-content: center;
  min-width: 0;
}

.archive-controls__commandbar :deep(.gallery-tabs__divider) {
  display: none;
}

:global(.dark .archive-controls__commandbar) {
  border-color: rgb(87 83 78 / 0.6);
  background: rgb(28 25 23 / 0.35);
}

.archive-controls__disclosure {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.85rem;
  width: 100%;
  min-height: 44px;
  padding: 0.65rem 0;
  color: rgb(87 83 78);
  text-align: left;
}

.archive-controls__disclosure:focus-visible {
  outline: 1px solid var(--archive-accent);
  outline-offset: 4px;
}

.archive-controls__disclosure-label {
  display: inline-flex;
  align-items: baseline;
  gap: 0.45rem;
  color: var(--archive-accent);
  font-size: 0.63rem;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.archive-controls__summary {
  min-width: 0;
  overflow: hidden;
  color: rgb(120 113 108);
  font-size: 0.72rem;
  font-weight: 300;
  letter-spacing: 0.08em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(.dark .archive-controls__summary) { color: rgb(168 162 158); }

.archive-controls__chevron {
  width: 0.9rem;
  height: 0.9rem;
  transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.archive-controls__chevron--open { transform: rotate(180deg); }

.archive-controls__drawer {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(18rem, 0.8fr);
  gap: clamp(1.5rem, 4vw, 4rem);
  padding: clamp(1.5rem, 3vw, 2.5rem) clamp(1.25rem, 4vw, 3.5rem);
  border-bottom: 1px solid rgb(214 211 209 / 0.7);
  background: rgb(250 250 249 / 0.7);
}

:global(.dark .archive-controls__drawer) {
  border-color: rgb(87 83 78 / 0.6);
  background: rgb(28 25 23 / 0.55);
}

.archive-drawer-enter-active,
.archive-drawer-leave-active {
  transition: opacity 180ms ease, transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

.archive-drawer-enter-from,
.archive-drawer-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 767px) {
  .archive-controls {
    padding-top: 1.75rem;
  }

  .archive-controls::before {
    top: 1.75rem;
  }

  .archive-controls__identity {
    grid-template-columns: 1fr;
    gap: 1.2rem;
    padding-bottom: 1.75rem;
  }

  .archive-controls__title {
    font-size: clamp(3.25rem, 17vw, 4.35rem);
    letter-spacing: 0.02em;
    white-space: nowrap;
  }

  .archive-controls__note {
    max-width: 23rem;
    margin-top: 1rem;
  }

  .archive-controls__count {
    justify-self: end;
  }

  .archive-controls__commandbar {
    grid-template-columns: 1fr;
    gap: 0;
    padding-top: 0.75rem;
  }

  .archive-controls__commandbar :deep(.gallery-tabs__count) {
    display: none;
  }

  .archive-controls__disclosure {
    border-top: 1px solid rgb(214 211 209 / 0.55);
  }

  :global(.dark .archive-controls__disclosure) {
    border-color: rgb(87 83 78 / 0.55);
  }

  .archive-controls__drawer {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .archive-controls__chevron,
  .archive-drawer-enter-active,
  .archive-drawer-leave-active {
    transition: none;
  }
}
</style>
