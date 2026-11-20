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
      <div>
        <NuxtLink
          v-if="world === 'kai' && selectedEvent"
          :to="{ path: '/gallery/digital', hash: '#gallery-year-index' }"
          class="archive-controls__return"
          data-testid="gallery-year-return"
        >
          <Icon name="lucide:arrow-left" aria-hidden="true" />
          繪畫館
        </NuxtLink>
        <component :is="hasMapHeading ? 'h2' : 'h1'" id="gallery-archive-title" class="archive-controls__title font-jp" tabindex="-1">
          {{ title }}
        </component>
      </div>
      <p class="archive-controls__count">{{ count }} {{ world === 'kai' ? '件作品' : '張照片' }}</p>
    </div>

    <div class="archive-controls__commandbar">
      <nav class="gallery-tabs__list" aria-label="切換展館">
        <NuxtLink
          :to="{ path: '/gallery/digital', query: route.query }"
          :aria-current="world === 'kai' ? 'location' : undefined"
          class="gallery-tabs__link"
        >
          繪畫館
        </NuxtLink>
        <NuxtLink
          :to="{ path: '/gallery/photography', query: route.query }"
          :aria-current="world === 'kage' ? 'location' : undefined"
          class="gallery-tabs__link"
        >
          攝影館
        </NuxtLink>
      </nav>

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
          {{ drawerOpen ? '收合篩選' : '篩選' }}
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
import EventFilter from '~/components/EventFilter.vue'
import GalleryFilterToolbar from '~/components/GalleryFilterToolbar.vue'

type GalleryWorld = 'kai' | 'kage'

const props = withDefaults(defineProps<{
  world: GalleryWorld
  count: number
  hasMapHeading?: boolean
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
const route = useRoute()
const { filterState } = storeToRefs(galleryStore)

const drawerOpen = ref(false)
const hydrated = ref(false)
const disclosureButtonRef = ref<HTMLButtonElement | null>(null)
const drawerId = computed(() => `${props.controlsId}-drawer`)
const eventMode = computed(() => Boolean(props.selectedEvent))

const title = computed(() => props.world === 'kai'
  ? props.selectedEvent || '繪畫館'
  : props.hasMapHeading ? '拍攝活動' : '攝影館')

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
  color: var(--museum-ink);
  padding: clamp(1.2rem, 3vw, 2.6rem) 0 clamp(0.9rem, 2vw, 1.6rem);
}
.archive-controls[data-world='kage'] { padding-top: 0; }

.archive-controls__identity {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.4rem 1rem;
  padding-bottom: clamp(0.75rem, 1.7vw, 1.4rem);
}
.archive-controls__title {
  margin: 0;
  color: var(--museum-ink);
  font-size: clamp(1.8rem, 4.5vw, 3.6rem);
  font-weight: 300;
  letter-spacing: 0.045em;
  line-height: 1.2;
  overflow-wrap: anywhere;
}
.archive-controls[data-world='kage'] .archive-controls__title { font-size: clamp(1.55rem, 3vw, 2.6rem); }
.archive-controls__title:focus-visible {
  outline: none;
  text-decoration: underline var(--museum-mark) 1px;
  text-underline-offset: 0.2em;
}
.archive-controls__count {
  color: var(--museum-muted);
  font-size: 0.86rem;
  font-variant-numeric: tabular-nums;
}
.archive-controls__return {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 44px;
  color: var(--museum-muted);
  font-size: 0.82rem;
  text-decoration: underline;
  text-decoration-color: var(--museum-line);
  text-underline-offset: 0.3em;
}
.archive-controls__return:hover { color: var(--museum-ink); text-decoration-color: currentColor; }
.archive-controls__return:focus-visible { outline: 2px solid var(--museum-ink); outline-offset: 3px; }

.archive-controls__commandbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(16rem, auto);
  align-items: center;
  gap: 1.25rem;
  min-height: 3.4rem;
  padding-inline: clamp(0.5rem, 2vw, 1.5rem);
  border-block: 1px solid var(--museum-line);
  background: color-mix(in srgb, var(--museum-light) 60%, transparent);
}

.gallery-tabs__list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.gallery-tabs__link {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: 44px;
  border-bottom: 1px solid transparent;
  color: var(--museum-muted);
  font-size: 0.9rem;
}
.gallery-tabs__link[aria-current] {
  border-bottom-color: currentColor;
  color: var(--museum-ink);
  font-weight: 500;
}
.gallery-tabs__link:hover { color: var(--museum-ink); }
.gallery-tabs__link:focus-visible { outline: 2px solid var(--museum-ink); outline-offset: -2px; }

.archive-controls__disclosure {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.85rem;
  width: 100%;
  min-height: 44px;
  padding: 0.65rem 0;
  color: var(--museum-muted);
  text-align: left;
}

.archive-controls__disclosure:focus-visible {
  outline: 1px solid var(--museum-ink);
  outline-offset: 4px;
}

.archive-controls__disclosure-label {
  display: inline-flex;
  align-items: baseline;
  gap: 0.45rem;
  color: var(--museum-ink);
  font-size: 0.8rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.archive-controls__summary {
  min-width: 0;
  overflow: hidden;
  color: var(--museum-muted);
  font-size: 0.875rem;
  font-weight: 300;
  letter-spacing: 0.08em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

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
  border-bottom: 1px solid var(--museum-line);
  background: var(--museum-light);
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
  .archive-controls__commandbar { grid-template-columns: 1fr; gap: 0; }
  .archive-controls__disclosure { border-top: 1px solid var(--museum-line); }
  .archive-controls__drawer { grid-template-columns: 1fr; }
}

@media (prefers-reduced-motion: reduce) {
  .archive-controls__chevron,
  .archive-drawer-enter-active,
  .archive-drawer-leave-active {
    transition: none;
  }
}

</style>
