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
import { onMounted, onBeforeUnmount, ref, watch, nextTick, computed } from 'vue'
import { useDark, useDebounceFn } from '@vueuse/core'
import type * as LeafletNS from 'leaflet'
import type { Map as LeafletMap, LayerGroup, TileLayer, LatLngTuple, CircleMarker } from 'leaflet'

type LeafletModule = typeof LeafletNS

/** Leaflet 未公開型別：縮放／慣性平移動畫期間避免 invalidateSize */
type LeafletMapWithInternals = LeafletMap & {
  _animatingZoom?: boolean
  _panAnim?: { _inProgress?: boolean }
}

interface EventLocation {
  name: string
  lat: number
  lng: number
  coverFilename: string
  timeRange: string
  count: number
  location?: string
}

const props = withDefaults(
  defineProps<{
    events: EventLocation[]
    /** 與 Event 篩選同步：選中時地圖飛到該點並強調標記；null 時縮放至全部範圍 */
    selectedEventName?: string | null
  }>(),
  { selectedEventName: null }
)

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
/** 防止 onMounted 與 watch 並發各建一張圖、重疊標記 */
let mapInitPromise: Promise<void> | null = null

/** 事件名稱 → 圓點（每事件名唯一），供篩選同步時改樣式與 flyTo */
const markerByName = new Map<string, CircleMarker>()

/** 僅在資料變更時重畫標記，避免 deep watch 過度觸發 */
const eventsSignature = computed(() =>
  props.events.map(e => `${e.name}:${e.lat}:${e.lng}`).join('|')
)

function invalidateMapSize () {
  if (!map) return
  map.invalidateSize({ animate: false })
}

/** flyTo 完成後 Leaflet 不會清 _flyToFrame，不可用內部 RAF 判斷；改由程式標記 */
let programmaticFlyActive = false
let flyToOpId = 0

function isMapInMotion (mapInstance: LeafletMap): boolean {
  if (programmaticFlyActive) return true
  const m = mapInstance as LeafletMapWithInternals
  if (m._animatingZoom) return true
  if (m._panAnim?._inProgress) return true
  return false
}

/** 動畫中延後到 moveend 再 invalidate，避免與 flyTo／慣性平移打架 */
let invalidatePendingAfterMoveEnd = false
function runInvalidateWhenIdle () {
  if (!map) return
  if (isMapInMotion(map)) {
    if (invalidatePendingAfterMoveEnd) return
    invalidatePendingAfterMoveEnd = true
    map.once('moveend', () => {
      invalidatePendingAfterMoveEnd = false
      invalidateMapSize()
    })
    return
  }
  invalidateMapSize()
}

/** ResizeObserver 若在動畫期間反覆 invalidate，圓點標記會抖動 */
const debouncedInvalidateMapSize = useDebounceFn(() => {
  runInvalidateWhenIdle()
}, 120)

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
  if (mapInitPromise) {
    await mapInitPromise
    return
  }

  mapInitPromise = (async () => {
    const L = await import('leaflet')
    if (map || !mapContainer.value) return

    map = L.map(mapContainer.value, {
      center: [23.7, 121],
      zoom: 7,
      zoomControl: false
    })

    await setTileLayer(isDark.value)

    await nextTick()
    invalidateMapSize()

    markersLayer = L.layerGroup().addTo(map)
    renderMarkers(L)

    await nextTick()
    runInvalidateWhenIdle()
    debouncedInvalidateMapSize()
  })()

  try {
    await mapInitPromise
  } finally {
    mapInitPromise = null
  }
}

/**
 * 與 tailwind.config accent（赤陶／琥珀）+ stone 主題一致：細邊、低飽和填色，避免螢光黃橘
 * @see tailwind.config.js colors.accent
 */
const getMarkerStyles = (dark: boolean) => {
  const base = dark
    ? {
        radius: 6,
        color: '#e4964a',
        weight: 1.5,
        fillColor: '#292524',
        fillOpacity: 0.94
      }
    : {
        radius: 6,
        color: '#c46023',
        weight: 1.5,
        fillColor: '#fdf8f0',
        fillOpacity: 0.98
      }
  const selected = dark
    ? {
        radius: 9,
        color: '#f4d5b0',
        weight: 2,
        fillColor: '#db7b2e',
        fillOpacity: 0.96
      }
    : {
        radius: 9,
        color: '#a3491f',
        weight: 2,
        fillColor: '#faecd9',
        fillOpacity: 1
      }
  return { base, selected }
}

const styleForEvent = (eventName: string, dark: boolean) => {
  const { base, selected } = getMarkerStyles(dark)
  return props.selectedEventName === eventName ? selected : base
}

const applyMapViewForSelection = (L: LeafletModule) => {
  const mapInstance = map
  if (!mapInstance || !props.events.length) return

  const name = props.selectedEventName
  const flyDuration = 1.15

  const runFly = (fn: () => void) => {
    programmaticFlyActive = true
    const op = ++flyToOpId
    mapInstance.once('moveend', () => {
      if (op === flyToOpId) programmaticFlyActive = false
    })
    fn()
  }

  if (name) {
    const ev = props.events.find(e => e.name === name)
    if (ev) {
      runFly(() => mapInstance.flyTo([ev.lat, ev.lng], 12, { duration: flyDuration }))
      return
    }
  }

  const bounds = props.events.map(e => [e.lat, e.lng] as LatLngTuple)
  if (bounds.length === 1) {
    runFly(() => mapInstance.flyTo(bounds[0], 10, { duration: flyDuration }))
  } else if (bounds.length > 1) {
    const b = L.latLngBounds(bounds)
    runFly(() => mapInstance.flyToBounds(b, { padding: [36, 36], duration: flyDuration, maxZoom: 12 }))
  }
}

const renderMarkers = (L: LeafletModule) => {
  const mapInstance = map
  const markers = markersLayer
  if (!mapInstance || !markers) return
  markers.clearLayers()
  markerByName.clear()

  if (!props.events.length) return

  const dark = isDark.value
  const { base, selected } = getMarkerStyles(dark)

  props.events.forEach(event => {
    const initialStyle = styleForEvent(event.name, dark)
    const marker = L.circleMarker([event.lat, event.lng], initialStyle)
    markerByName.set(event.name, marker)

    marker.on('mouseover', () => {
      hoveredEvent.value = event
      const isSel = props.selectedEventName === event.name
      if (isSel) {
        marker.setStyle({
          ...selected,
          radius: 10,
          weight: 2.25,
          fillOpacity: 1
        })
      } else {
        marker.setStyle({
          ...base,
          radius: 8,
          weight: 2,
          fillOpacity: dark ? 0.98 : 1
        })
      }
    })

    marker.on('mouseout', () => {
      hoveredEvent.value = null
      marker.setStyle(styleForEvent(event.name, dark))
    })

    marker.on('click', () => {
      emit('focus-event', event.name)
    })

    marker.addTo(markers)
  })

  applyMapViewForSelection(L)
}

onMounted(async () => {
  await initMap()
  if (mapContainer.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      debouncedInvalidateMapSize()
    })
    resizeObserver.observe(mapContainer.value)
  }
})

watch(
  eventsSignature,
  async () => {
    if (!import.meta.client) return
    const L = await import('leaflet')
    if (!map) {
      await initMap()
      return
    }
    renderMarkers(L)
    debouncedInvalidateMapSize()
  }
)

watch(isDark, async (dark) => {
  if (!import.meta.client || !map) return
  await setTileLayer(dark)
  const L = await import('leaflet')
  renderMarkers(L)
})

watch(
  () => props.selectedEventName,
  async () => {
    if (!import.meta.client || !map || !props.events.length || markerByName.size === 0) return
    const L = await import('leaflet')
    const dark = isDark.value
    markerByName.forEach((marker, eventName) => {
      marker.setStyle(styleForEvent(eventName, dark))
    })
    applyMapViewForSelection(L)
  }
)

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

/* 不在 SVG 上使用 filter：flyTo 平移時部分瀏覽器會出現路徑重影，誤以為多一顆標記 */

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
  background: rgba(253, 248, 240, 0.94);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 24px rgba(41, 37, 36, 0.1), 0 2px 8px rgba(196, 96, 35, 0.06);
  border: 1px solid rgba(196, 96, 35, 0.2);
  z-index: 1000;
  pointer-events: none;
  max-width: 260px;
}
.dark .event-map-hover-card {
  background: rgba(28, 25, 23, 0.94);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(228, 150, 74, 0.22);
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

