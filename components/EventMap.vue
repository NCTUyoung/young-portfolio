<template>
  <div class="event-map-wrapper">
    <div ref="mapContainer" class="event-map-container" />

    <transition name="event-map-hover">
      <div
        v-if="hoveredEvent"
        class="event-map-hover-card"
      >
        <img
          :src="getThumbPath(hoveredEvent.coverFilename, 400)"
          :alt="hoveredEvent.name"
          class="event-map-hover-image"
          loading="lazy"
          decoding="async"
        >
        <div class="event-map-hover-text">
          <p class="event-map-hover-title">
            {{ hoveredEvent.name }}
          </p>
          <p class="event-map-hover-sub">
            {{ hoveredEvent.timeRange }}
          </p>
          <p v-if="hoveredEvent.location" class="event-map-hover-meta">
            {{ hoveredEvent.location }}
          </p>
          <p class="event-map-hover-meta">
            {{ hoveredEvent.count }} 張作品
          </p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import { useDark } from '@vueuse/core'
import type * as LeafletNS from 'leaflet'
import type { Map as LeafletMap, LayerGroup, TileLayer, LatLngTuple } from 'leaflet'

type LeafletModule = typeof LeafletNS

interface EventLocation {
  name: string
  lat: number
  lng: number
  coverFilename: string
  timeRange: string
  count: number
  location?: string
}

const props = defineProps<{
  events: EventLocation[]
}>()

const emit = defineEmits<{
  (e: 'focus-event', name: string): void
}>()

const mapContainer = ref<HTMLDivElement | null>(null)
const hoveredEvent = ref<EventLocation | null>(null)
const isDark = useDark()

const { getThumbPath } = useImagePath()

let map: LeafletMap | null = null
let markersLayer: LayerGroup | null = null
let tileLayer: TileLayer | null = null
let resizeObserver: ResizeObserver | null = null

function invalidateMapSize () {
  if (!map) return
  map.invalidateSize({ animate: false })
}

const TILE_URLS = {
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
}

const setTileLayer = async (dark: boolean) => {
  if (!map || !import.meta.client) return
  const L = await import('leaflet')
  const url = dark ? TILE_URLS.dark : TILE_URLS.light
  if (tileLayer) {
    map.removeLayer(tileLayer)
  }
  tileLayer = L.tileLayer(url, {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  }).addTo(map)
}

const initMap = async () => {
  if (!import.meta.client || map || !mapContainer.value) return

  const L = await import('leaflet')

  map = L.map(mapContainer.value, {
    center: [23.7, 121],
    zoom: 7,
    zoomControl: false
  })

  await setTileLayer(isDark.value)

  markersLayer = L.layerGroup().addTo(map)
  renderMarkers(L)

  await nextTick()
  invalidateMapSize()
  requestAnimationFrame(() => invalidateMapSize())
  setTimeout(() => invalidateMapSize(), 200)
}

const renderMarkers = (L: LeafletModule) => {
  const mapInstance = map
  const markers = markersLayer
  if (!mapInstance || !markers) return
  markers.clearLayers()

  if (!props.events.length) return

  const bounds: LatLngTuple[] = []
  const dark = isDark.value
  const baseStyle = dark
    ? { radius: 7, color: '#e4b07a', weight: 1, fillColor: '#e8a84a', fillOpacity: 0.85 }
    : { radius: 7, color: '#e4b07a', weight: 1, fillColor: '#db7b2e', fillOpacity: 0.8 }

  props.events.forEach(event => {

    const marker = L.circleMarker([event.lat, event.lng], baseStyle)

    marker.on('mouseover', () => {
      hoveredEvent.value = event
      marker.setStyle({
        radius: 9,
        weight: 1.6,
        fillOpacity: 0.95
      })
      // 不主動開 Popup，讓畫面更乾淨，資訊交給右下角圖片卡片
    })

    marker.on('mouseout', () => {
      hoveredEvent.value = null
      marker.setStyle(baseStyle)
    })

    marker.on('click', () => {
      emit('focus-event', event.name)
    })

    marker.addTo(markers)
    bounds.push([event.lat, event.lng])
  })

  if (bounds.length > 1) {
    mapInstance.fitBounds(bounds, { padding: [30, 30] })
  } else if (bounds.length === 1) {
    mapInstance.setView(bounds[0], 10)
  }
}

onMounted(async () => {
  await initMap()
  if (mapContainer.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      invalidateMapSize()
    })
    resizeObserver.observe(mapContainer.value)
  }
})

watch(
  () => props.events,
  async () => {
    if (!import.meta.client) return
    const L = await import('leaflet')
    if (!map) {
      await initMap()
      return
    }
    renderMarkers(L)
    setTimeout(() => {
      invalidateMapSize()
    }, 200)
  },
  { deep: true }
)

watch(isDark, async (dark) => {
  if (!import.meta.client || !map) return
  await setTileLayer(dark)
  const L = await import('leaflet')
  renderMarkers(L)
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    if (mapContainer.value) {
      resizeObserver.unobserve(mapContainer.value)
    }
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (map) {
    map.remove()
    map = null
    markersLayer = null
  }
})
</script>

<style scoped>
.event-map-wrapper {
  @apply w-full min-w-0 rounded-2xl border border-stone-200/80 dark:border-stone-700/70 overflow-hidden bg-stone-50/60 dark:bg-stone-900/40 relative;
  /* Isolate Leaflet panes (z-index up to ~1000) so they cannot stack above the fixed navbar */
  isolation: isolate;
  box-shadow: 0 2px 8px rgba(168, 162, 158, 0.1), 0 1px 3px rgba(168, 162, 158, 0.05);
}

.event-map-container {
  width: 100%;
  min-width: 0;
  height: 420px;
}

@media (max-width: 768px) {
  .event-map-container {
    height: 260px;
  }
}

/* 淺色模式：微灰階與對比；深色模式：地圖已是深色，僅微調 */
.event-map-container :deep(.leaflet-tile-pane) {
  filter: grayscale(0.9) contrast(1.05);
}
.dark .event-map-container :deep(.leaflet-tile-pane) {
  filter: grayscale(0.6) contrast(1.02);
}

.event-map-container :deep(.leaflet-control-attribution) {
  font-size: 0.6rem;
  opacity: 0.45;
}
.dark .event-map-container :deep(.leaflet-control-attribution) {
  opacity: 0.35;
}
.dark .event-map-container :deep(.leaflet-control-attribution a) {
  color: rgba(255, 255, 255, 0.6);
}

.event-map-hover-card {
  position: absolute;
  right: 1.25rem;
  bottom: 2.4rem; /* 往上移一點，避免和 attribution 重疊變形 */
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.9rem;
  border-radius: 1rem;
  background: rgba(250, 249, 247, 0.92);
  backdrop-filter: blur(10px);
  box-shadow: 0 12px 30px rgba(41, 37, 36, 0.18);
  border: 1px solid rgba(214, 211, 209, 0.7);
  z-index: 1000;
  pointer-events: none;
  max-width: 260px;
}
.dark .event-map-hover-card {
  background: rgba(38, 38, 38, 0.92);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(68, 64, 60, 0.6);
}

.event-map-hover-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 0.75rem;
  border: none;
  background: transparent;
}

.event-map-hover-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.event-map-hover-title {
  font-family: 'Noto Serif JP', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 0.78rem;
  letter-spacing: 0.16em;
  margin-bottom: 0.12rem;
  color: rgb(41 37 36);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dark .event-map-hover-title {
  color: rgb(245 245 244);
}

.event-map-hover-sub {
  font-size: 0.7rem;
  color: rgb(120 113 108);
  margin-bottom: 0.08rem;
}
.dark .event-map-hover-sub {
  color: rgb(168 162 158);
}

.event-map-hover-meta {
  font-size: 0.65rem;
  color: rgb(168 162 158);
}
.dark .event-map-hover-meta {
  color: rgb(120 113 108);
}

.event-map-hover-enter-active,
.event-map-hover-leave-active {
  transition: opacity 0.2s ease-out, transform 0.2s ease-out;
}
.event-map-hover-enter-from,
.event-map-hover-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

@media (max-width: 768px) {
  .event-map-hover-card {
    right: 0.9rem;
    bottom: 2.1rem;
    padding: 0.5rem 0.75rem;
    max-width: 220px;
  }

  .event-map-hover-image {
    width: 50px;
    height: 50px;
  }
}
</style>

