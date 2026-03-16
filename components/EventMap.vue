<template>
  <div class="event-map-wrapper">
    <div ref="mapContainer" class="event-map-container" />

    <transition name="event-map-hover">
      <div
        v-if="hoveredEvent"
        class="event-map-hover-card"
      >
        <img
          :src="getImagePath(hoveredEvent.coverFilename)"
          :alt="hoveredEvent.name"
          class="event-map-hover-image"
          loading="lazy"
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
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'

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

const { getImagePath } = useImagePath()

let map: any = null
let markersLayer: any = null

const initMap = async () => {
  if (!process.client || map || !mapContainer.value) return

  const L = await import('leaflet')

  map = L.map(mapContainer.value, {
    center: [23.7, 121],
    zoom: 7,
    zoomControl: false
  })

  // 使用偏簡約的 CartoDB light 風格，減少街道細節干擾
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  }).addTo(map)

  markersLayer = L.layerGroup().addTo(map)
  renderMarkers(L)
}

const renderMarkers = (L: any) => {
  if (!markersLayer) return
  markersLayer.clearLayers()

  if (!props.events.length) return

  const bounds: any[] = []

  props.events.forEach(event => {
    const baseStyle = {
      radius: 7,
      color: '#e4b07a',
      weight: 1,
      fillColor: '#db7b2e',
      fillOpacity: 0.8
    }

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

    marker.addTo(markersLayer)
    bounds.push([event.lat, event.lng])
  })

  if (bounds.length > 1) {
    map.fitBounds(bounds, { padding: [30, 30] })
  } else if (bounds.length === 1) {
    map.setView(bounds[0], 10)
  }
}

onMounted(async () => {
  await initMap()
})

watch(
  () => props.events,
  async () => {
    if (!process.client) return
    const L = await import('leaflet')
    if (!map) {
      await initMap()
      return
    }
    renderMarkers(L)
    setTimeout(() => {
      map.invalidateSize()
    }, 200)
  },
  { deep: true }
)

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
    markersLayer = null
  }
})
</script>

<style scoped>
.event-map-wrapper {
  @apply rounded-2xl border border-stone-200/80 dark:border-stone-700/70 overflow-hidden bg-stone-50/60 dark:bg-stone-900/40 relative;
  box-shadow: 0 2px 8px rgba(168, 162, 158, 0.1), 0 1px 3px rgba(168, 162, 158, 0.05);
}

.event-map-container {
  width: 100%;
  height: 420px;
}

@media (max-width: 768px) {
  .event-map-container {
    height: 260px;
  }
}

/* 讓地圖本身更「乾淨」：微灰階與對比 */
.event-map-container :deep(.leaflet-tile-pane) {
  filter: grayscale(0.9) contrast(1.05);
}

.event-map-container :deep(.leaflet-control-attribution) {
  font-size: 0.6rem;
  opacity: 0.45;
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

.event-map-hover-sub {
  font-size: 0.7rem;
  color: rgb(120 113 108);
  margin-bottom: 0.08rem;
}

.event-map-hover-meta {
  font-size: 0.65rem;
  color: rgb(168 162 158);
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

