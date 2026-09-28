<template>
  <div
    class="event-map-wrapper"
    :class="{
      'event-map-wrapper--compact': variant === 'compact',
      'event-map-wrapper--expanded': isExpanded
    }"
    @mouseenter="onWrapperEnter"
    @mouseleave="onWrapperLeave"
  >
    <div
      ref="mapContainer"
      class="event-map-container"
      role="region"
      aria-label="影的互動拍攝地圖"
    />

    <div v-if="variant !== 'compact'" class="event-map-zoom-controls" aria-label="地圖縮放控制">
      <button
        type="button"
        class="event-map-zoom-button"
        aria-label="放大地圖並靠近照片位置"
        title="放大地圖並靠近照片位置"
        :disabled="mapZoom !== null && mapZoom >= maximumZoom"
        @click="zoomMap(1)"
      >+</button>
      <button
        type="button"
        class="event-map-zoom-button"
        aria-label="縮小地圖"
        title="縮小地圖"
        :disabled="mapZoom !== null && mapZoom <= minimumZoom"
        @click="zoomMap(-1)"
      >−</button>
    </div>

    <svg
      v-if="photoCards.length"
      class="event-map-connectors"
      :viewBox="`0 0 ${photoMapSize.width} ${photoMapSize.height}`"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line
        v-for="card in photoCards"
        :key="`line-${card.name}`"
        :x1="card.anchorX"
        :y1="card.anchorY"
        :x2="card.edgeX"
        :y2="card.edgeY"
        class="event-map-connector"
      />
      <circle
        v-for="card in photoCards"
        :key="`anchor-${card.name}`"
        :cx="card.anchorX"
        :cy="card.anchorY"
        r="3.5"
        class="event-map-anchor"
      />
    </svg>

    <TransitionGroup
      tag="div"
      name="map-photo"
      class="event-map-photo-layer"
      role="group"
      aria-label="地圖上的活動照片；放大或移動地圖可探索更多"
    >
      <button
        v-for="(card, index) in photoCards"
        :key="card.name"
        type="button"
        class="event-map-photo-card"
        :class="{ 'event-map-photo-card--focused': card.name === selectedEventName }"
        :style="{ left: `${card.left}px`, top: `${card.top}px`, '--reveal-delay': `${index * 45}ms` }"
        :aria-label="`進入「${card.name}」組圖，共 ${card.count} 張；${card.locationAccuracy === 'event' ? '活動座標' : '約略地區'}`"
        @click="emit('focus-event', card.name)"
      >
        <img
          :src="getThumbPath(card.coverFilename, 400)"
          :alt="`${card.name} 代表照片`"
          loading="eager"
          decoding="async"
        >
        <span class="event-map-photo-title">{{ card.name }}</span>
        <span class="event-map-photo-location">
          <span>{{ card.locationAccuracy === 'event' ? '活動座標' : '約略地區' }}</span>
          <span v-if="card.location">{{ card.location }}</span>
        </span>
      </button>
    </TransitionGroup>

    <!--
      compact 未展開時顯示「停留展開」hint：
      - 位於地圖中下緣，小、半透明，不搶視覺
      - `@media (hover: hover)` 才有作用；touch-only 裝置 hint 也會顯示但點了沒反應，
        不過「停留」對 touch 裝置本來就不成立，使用者不會期待
      - `pointer-events: none` 不擋 Leaflet 互動
    -->
    <div
      v-if="variant === 'compact' && !isExpanded && showExpandHint"
      class="event-map-expand-hint"
      aria-hidden="true"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" class="event-map-expand-icon">
        <path stroke-linecap="round" stroke-linejoin="round" d="M7 13L3 17m0 0h3.5M3 17v-3.5M13 7l4-4m0 0h-3.5M17 3v3.5" />
      </svg>
      <span>停留放大</span>
    </div>

    <!--
      compact 模式左右兩側加極輕漸層遮罩：
      1. 視覺上呼應 HorizontalStripFeatured 的漸層邊，讓全頁「橫向 band」語彙一致
      2. 地圖 tile 在窄高容器中容易「硬切邊」，軟化邊緣減輕突兀
      仍 `pointer-events: none`，不影響 leaflet 互動
    -->
    <template v-if="variant === 'compact'">
      <div
        class="pointer-events-none absolute top-0 bottom-0 left-0 w-12 z-[400] bg-gradient-to-r from-stone-50/70 dark:from-stone-900/70 to-transparent"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute top-0 bottom-0 right-0 w-12 z-[400] bg-gradient-to-l from-stone-50/70 dark:from-stone-900/70 to-transparent"
        aria-hidden="true"
      />
    </template>

  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, nextTick, computed } from 'vue'
import { useDark, useDebounceFn } from '@vueuse/core'
import type * as LeafletNS from 'leaflet'
import type { Map as LeafletMap, LayerGroup, TileLayer, LatLngTuple, CircleMarker } from 'leaflet'
// Leaflet CSS 在元件層 import，避開 Vite 7 + Windows 處理 node_modules CSS
// 的 @fs 絕對路徑 MIME 異常；同時享有 code-splitting（非地圖頁不載入）。
import 'leaflet/dist/leaflet.css'

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
  locationAccuracy: 'event' | 'regional'
}

interface MapViewSnapshot {
  center: [number, number]
  zoom: number
}

interface PositionedEvent extends EventLocation {
  left: number
  top: number
  anchorX: number
  anchorY: number
  edgeX: number
  edgeY: number
}

const props = withDefaults(
  defineProps<{
    events: EventLocation[]
    /** 與 Event 篩選同步：選中時地圖飛到該點並強調標記；null 時縮放至全部範圍 */
    selectedEventName?: string | null
    initialView?: MapViewSnapshot | null
    /**
     * 版型變體：
     *   - `default`：420px 高（手機 260px），wheel zoom、鍵盤導覽開啟——適合專頁或詳細模式
     *   - `compact`：160px 高（手機 120px），停用 wheel zoom 與鍵盤（避免與頁面捲動、strip 的鍵盤導覽打架），
     *     hover card 彈在地圖下方外而非內部右下，marker 縮小；用於常駐 summary bar
     */
    variant?: 'default' | 'compact'
    /**
     * 是否顯示框內「停留放大」提示 pill。預設 true（自洽）。
     * 設 false 時提示交由宿主放在地圖框外的余白（header／hairline），避免 pill 壓在
     * tile 上遮擋 marker——見 wiki inspirations/non-occluding-hint.md 方案 A。
     * 此時宿主可改聽 `expand-change` 自行決定何時顯示／收起提示。
     */
    showExpandHint?: boolean
  }>(),
  { selectedEventName: null, initialView: null, variant: 'default', showExpandHint: true }
)

const emit = defineEmits<{
  (e: 'focus-event', name: string): void
  (e: 'viewport-change', view: MapViewSnapshot): void
  /** compact 展開狀態變化：宿主可據此顯示／收起框外的「停留放大」提示 */
  (e: 'expand-change', expanded: boolean): void
}>()

const mapContainer = ref<HTMLDivElement | null>(null)
const photoCards = ref<PositionedEvent[]>([])
const photoMapSize = ref({ width: 0, height: 0 })
const mapZoom = ref<number | null>(null)
const minimumZoom = 0
const maximumZoom = 19
const isDark = useDark()

/**
 * compact 變體的 hover 展開狀態：
 * 滑鼠停在地圖帶 ≥280ms 後 `isExpanded = true` → container 從 160px 長到 480px；
 * 離開後 350ms 收回。延遲的目的是避免使用者「從 hero 快速滾到 strip」途中被誤觸。
 * expand/collapse 動畫結束（~360ms）後呼叫 `runInvalidateWhenIdle()` 讓 Leaflet 重繪，
 * 否則 tile 會停留在舊尺寸導致邊緣空白。
 */
const isExpanded = ref(false)
let expandTimer: ReturnType<typeof setTimeout> | null = null
let collapseTimer: ReturnType<typeof setTimeout> | null = null

const HOVER_EXPAND_DELAY = 280
const HOVER_COLLAPSE_DELAY = 350
/** CSS height transition（0.32s）後保險再多 40ms 確保動畫完成 */
const MAP_RESIZE_AFTER_ANIM = 360

function clearHoverTimers () {
  if (expandTimer) { clearTimeout(expandTimer); expandTimer = null }
  if (collapseTimer) { clearTimeout(collapseTimer); collapseTimer = null }
}

function onWrapperEnter () {
  if (props.variant !== 'compact') return
  if (collapseTimer) { clearTimeout(collapseTimer); collapseTimer = null }
  if (isExpanded.value) return
  expandTimer = setTimeout(() => {
    isExpanded.value = true
    emit('expand-change', true)
    expandTimer = null
    setTimeout(() => runInvalidateWhenIdle(), MAP_RESIZE_AFTER_ANIM)
  }, HOVER_EXPAND_DELAY)
}

function onWrapperLeave () {
  if (props.variant !== 'compact') return
  if (expandTimer) { clearTimeout(expandTimer); expandTimer = null }
  if (!isExpanded.value) return
  collapseTimer = setTimeout(() => {
    isExpanded.value = false
    emit('expand-change', false)
    collapseTimer = null
    setTimeout(() => runInvalidateWhenIdle(), MAP_RESIZE_AFTER_ANIM)
  }, HOVER_COLLAPSE_DELAY)
}

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
  props.events.map(e => `${e.name}:${e.lat}:${e.lng}:${e.locationAccuracy}:${e.coverFilename}:${e.count}`).join('|')
)

const openingEvents = computed(() => [...props.events]
  .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  .slice(0, 3))

let layoutFrame = 0

function rectanglesOverlap (
  a: { left: number, top: number, right: number, bottom: number },
  b: { left: number, top: number, right: number, bottom: number }
): boolean {
  return a.left < b.right + 10 && a.right + 10 > b.left && a.top < b.bottom + 10 && a.bottom + 10 > b.top
}

function cardEdge (x: number, y: number, left: number, top: number, width: number, height: number) {
  const edgeX = Math.max(left, Math.min(x, left + width))
  const edgeY = Math.max(top, Math.min(y, top + height))
  if (edgeX === x && edgeY === y) return { x: left + width / 2, y: top + height }
  return { x: edgeX, y: edgeY }
}

function updatePhotoCards () {
  if (!map || props.variant === 'compact') return

  const size = map.getSize()
  photoMapSize.value = { width: size.x, height: size.y }

  const openingNames = new Set(openingEvents.value.map(event => event.name))
  const inView = props.events.filter(event => map!.getBounds().contains([event.lat, event.lng]))
  const candidates = map.getZoom() < 7
    ? inView.filter(event => openingNames.has(event.name))
    : inView.sort((a, b) => {
        const featuredDelta = Number(openingNames.has(b.name)) - Number(openingNames.has(a.name))
        if (featuredDelta) return featuredDelta
        const center = map!.getCenter()
        return map!.distance(center, [a.lat, a.lng]) - map!.distance(center, [b.lat, b.lng])
      })

  const maxCards = window.matchMedia('(max-width: 640px)').matches ? 4 : 5
  const width = window.matchMedia('(max-width: 640px)').matches ? 132 : 152
  const height = 138
  const placed: PositionedEvent[] = []
  const reserved: Array<{ left: number, top: number, right: number, bottom: number }> = [
    { left: 0, top: 0, right: 50, bottom: 82 },
    { left: size.x - 126, top: size.y - 30, right: size.x, bottom: size.y }
  ]

  candidates.slice(0, maxCards).forEach(event => {
    const point = map!.latLngToContainerPoint([event.lat, event.lng])
    const positions = [
      { left: point.x + 18, top: point.y - height - 14 },
      { left: point.x - width - 18, top: point.y - height - 14 },
      { left: point.x + 18, top: point.y + 14 },
      { left: point.x - width - 18, top: point.y + 14 },
      { left: point.x - width / 2, top: point.y - height - 22 },
      { left: point.x - width / 2, top: point.y + 22 }
    ]

    let best: { left: number, top: number, right: number, bottom: number } | null = null
    let bestConflicts = Number.POSITIVE_INFINITY
    for (const position of positions) {
      const left = Math.max(8, Math.min(size.x - width - 8, position.left))
      const top = Math.max(8, Math.min(size.y - height - 30, position.top))
      const rect = { left, top, right: left + width, bottom: top + height }
      const conflicts = reserved.filter(other => rectanglesOverlap(rect, other)).length
      if (conflicts < bestConflicts) {
        best = rect
        bestConflicts = conflicts
      }
      if (!conflicts) break
    }
    if (!best || bestConflicts > 0) {
      const columns = size.x >= width * 2 + 24
        ? [8, Math.round((size.x - width) / 2), size.x - width - 8]
        : [8, size.x - width - 8]
      const rows = [8, Math.max(8, Math.round((size.y - height) / 2)), Math.max(8, size.y - height - 30)]
      const fallback = rows.flatMap(top => columns.map(left => ({
        left,
        top,
        right: left + width,
        bottom: top + height
      })))
        .filter(rect => rect.left >= 0 && rect.top >= 0 && rect.right <= size.x && rect.bottom <= size.y)
        .filter(rect => reserved.every(other => !rectanglesOverlap(rect, other)))
        .sort((a, b) => {
          const distanceToAnchor = (rect: typeof a) => Math.hypot(
            rect.left + width / 2 - point.x,
            rect.top + height / 2 - point.y
          )
          return distanceToAnchor(a) - distanceToAnchor(b)
        })[0]

      const maxConnectorDistance = Math.max(width, height) * 2
      if (!fallback || Math.hypot(
        fallback.left + width / 2 - point.x,
        fallback.top + height / 2 - point.y
      ) > maxConnectorDistance) return
      best = fallback
    }

    reserved.push(best)
    const edge = cardEdge(point.x, point.y, best.left, best.top, width, height)
    placed.push({
      ...event,
      left: best.left,
      top: best.top,
      anchorX: point.x,
      anchorY: point.y,
      edgeX: edge.x,
      edgeY: edge.y
    })
  })

  photoCards.value = placed
}

function schedulePhotoCardLayout () {
  if (layoutFrame) cancelAnimationFrame(layoutFrame)
  layoutFrame = requestAnimationFrame(() => {
    layoutFrame = 0
    updatePhotoCards()
  })
}

function reportViewportChange () {
  if (!map) return
  mapZoom.value = map.getZoom()
  const { lat, lng } = map.getCenter()
  emit('viewport-change', { center: [lat, lng], zoom: map.getZoom() })
  schedulePhotoCardLayout()
}

function zoomMap (delta: -1 | 1) {
  if (!map) return

  const nextZoom = Math.max(minimumZoom, Math.min(maximumZoom, map.getZoom() + delta))
  if (nextZoom === map.getZoom()) return

  const selectedEvent = props.events.find(event => event.name === props.selectedEventName)
  const nearestEvent = selectedEvent ?? props.events.reduce<EventLocation | undefined>((closest, event) => {
    if (!closest) return event
    const center = map!.getCenter()
    return map!.distance(center, [event.lat, event.lng]) < map!.distance(center, [closest.lat, closest.lng])
      ? event
      : closest
  }, undefined)
  const center = map.getCenter()
  const anchor: LatLngTuple = nearestEvent ? [nearestEvent.lat, nearestEvent.lng] : [center.lat, center.lng]
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  map.setZoomAround(anchor, nextZoom, { animate: !reduceMotion })
}

function invalidateMapSize () {
  if (!map) return
  map.invalidateSize({ animate: false })
}

function isMapInMotion (mapInstance: LeafletMap): boolean {
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

const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

const setTileLayer = async () => {
  if (!map || tileLayer || !import.meta.client) return
  const L = await import('leaflet')
  tileLayer = L.tileLayer(TILE_URL, {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
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

    // compact 版調整：
    //   - scrollWheelZoom: 'center' → 以地圖中心縮放（而非游標位置），避免 160px 窄帶中
    //     游標貼邊時 zoom 跳位；Leaflet 僅在 hover 於 map container 時攔截 wheel，
    //     離開就還給頁面，所以快速滾過不會卡住頁面捲動。
    //   - keyboard: false → tiny map 的 `+/-` 鍵讓給 strip / timeline 鍵盤導覽。
    //   - 仍保留 dragging / touchZoom / doubleClickZoom 讓使用者可探索。
    const isCompact = props.variant === 'compact'
    const savedView = props.initialView
    map = L.map(mapContainer.value, {
      center: savedView?.center ?? [23.7, 121],
      zoom: savedView?.zoom ?? (isCompact ? 6 : 5),
      zoomControl: false,
      scrollWheelZoom: isCompact ? 'center' : true,
      keyboard: !isCompact,
      attributionControl: true
    })

    await setTileLayer()

    await nextTick()
    invalidateMapSize()

    markersLayer = L.layerGroup().addTo(map)
    renderMarkers(L)
    map.on('moveend zoomend', reportViewportChange)
    if (!savedView) fitInitialMapView(L)
    mapZoom.value = map.getZoom()

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

const fitInitialMapView = (L: LeafletModule) => {
  const mapInstance = map
  if (!mapInstance || !props.events.length) return

  const bounds = props.events.map(e => [e.lat, e.lng] as LatLngTuple)
  const isCompact = props.variant === 'compact'
  const fitPadding: [number, number] = isCompact ? [32, 48] : [36, 36]
  const fitMaxZoom = 6
  const singleZoom = isCompact ? 7 : 10
  if (bounds.length === 1 && bounds[0]) {
    const only = bounds[0]
    mapInstance.setView(only, singleZoom, { animate: false })
  } else if (bounds.length > 1) {
    const b = L.latLngBounds(bounds)
    mapInstance.fitBounds(b, { padding: fitPadding, maxZoom: fitMaxZoom, animate: false })
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

  props.events.forEach(event => {
    const initialStyle = styleForEvent(event.name, dark)
    const marker = L.circleMarker([event.lat, event.lng], initialStyle)
    markerByName.set(event.name, marker)

    marker.on('click', () => {
      emit('focus-event', event.name)
    })

    marker.addTo(markers)
  })

  schedulePhotoCardLayout()
}

onMounted(async () => {
  await initMap()
  if (mapContainer.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      debouncedInvalidateMapSize()
      schedulePhotoCardLayout()
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

watch(isDark, async () => {
  if (!import.meta.client || !map) return
  const L = await import('leaflet')
  renderMarkers(L)
})

watch(
  () => props.selectedEventName,
  () => {
    if (!import.meta.client || !map || !props.events.length || markerByName.size === 0) return
    const dark = isDark.value
    markerByName.forEach((marker, eventName) => {
      marker.setStyle(styleForEvent(eventName, dark))
    })
    schedulePhotoCardLayout()
  }
)

onBeforeUnmount(() => {
  clearHoverTimers()
  if (resizeObserver) {
    if (mapContainer.value) {
      resizeObserver.unobserve(mapContainer.value)
    }
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (map) {
    map.off('moveend zoomend', reportViewportChange)
    map.remove()
    map = null
    markersLayer = null
  }
  if (layoutFrame) {
    cancelAnimationFrame(layoutFrame)
    layoutFrame = 0
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

/**
 * compact 版的外框改得更「帶狀」：
 * 圓角縮小、shadow 取消（band 式不需要卡片感）、邊框淡化。
 * 目的是讓它在 header 與 strip 之間「低調分隔」而非「醒目卡片」。
 */
.event-map-wrapper--compact {
  @apply rounded-xl border-stone-200/60 dark:border-stone-700/40;
  box-shadow: none;
}

.event-map-container {
  width: 100%;
  min-width: 0;
  height: 420px;
}

/*
 * compact：160px（桌機）/ 120px（手機）。
 * 加 transition 讓 hover 展開順暢；timing 與 JS 的 `MAP_RESIZE_AFTER_ANIM` (360ms)
 * 對齊——CSS 動畫 0.32s + 40ms buffer = JS invalidateSize 時 tile 已落位。
 */
.event-map-wrapper--compact .event-map-container {
  height: 160px;
  transition: height 0.32s cubic-bezier(0.4, 0, 0.2, 1);
}

/* hover 展開：桌機長到 480px（舒適瀏覽高度，比 default 的 420 大一點表示「專注」） */
.event-map-wrapper--compact.event-map-wrapper--expanded .event-map-container {
  height: 480px;
}

@media (max-width: 768px) {
  .event-map-container {
    height: 260px;
  }
  .event-map-wrapper--compact .event-map-container {
    height: 120px;
  }
  /* 手機 hover 展開不太可能被觸發，但保險給個縮小版尺寸 */
  .event-map-wrapper--compact.event-map-wrapper--expanded .event-map-container {
    height: 340px;
  }
}

/* 無障礙：不喜歡動畫的使用者直接切換尺寸 */
@media (prefers-reduced-motion: reduce) {
  .event-map-wrapper--compact .event-map-container {
    transition: none;
  }
}

/*
 * 展開狀態下左右漸層遮罩要淡化——遮罩是為了 160px 窄帶的硬邊軟化，
 * 480px 時再蓋會無端遮蔽內容。
 */
.event-map-wrapper--compact.event-map-wrapper--expanded > [class*="bg-gradient-to"] {
  opacity: 0;
  transition: opacity 0.2s ease-out;
}

/*
 * 「停留放大」hint：
 * 中下緣 pill，icon + 文字組合；半透明、低對比，只在 compact 未展開時顯示，
 * 主動提示可 hover 探索。mouseenter 後 280ms 才展開，hint 這段時間仍可見，
 * 展開瞬間 v-if=false 消失（無需 fade）。
 */
.event-map-expand-hint {
  position: absolute;
  left: 50%;
  bottom: 0.5rem;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.65rem;
  border-radius: 9999px;
  background: rgba(253, 248, 240, 0.82);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(196, 96, 35, 0.18);
  font-size: 0.58rem;
  font-family: 'Noto Sans JP', system-ui, -apple-system, sans-serif;
  letter-spacing: 0.22em;
  color: rgb(120 113 108);
  z-index: 500;
  pointer-events: none;
  opacity: 0.78;
}
.event-map-expand-icon {
  width: 0.7rem;
  height: 0.7rem;
  color: rgb(196 96 35);
  opacity: 0.8;
}

.event-map-zoom-controls {
  position: absolute;
  top: 0.65rem;
  left: 0.65rem;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgb(214 211 209 / 0.95);
  border-radius: 0.3rem;
  background: rgb(250 250 249 / 0.96);
  box-shadow: 0 1px 5px rgb(41 37 36 / 0.2);
}

.event-map-zoom-button {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  color: rgb(41 37 36);
  font-family: Arial, sans-serif;
  font-size: 1.55rem;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
}

.event-map-zoom-button + .event-map-zoom-button {
  border-top: 1px solid rgb(214 211 209 / 0.95);
}

.event-map-zoom-button:hover:not(:disabled) {
  background: rgb(231 229 228 / 0.8);
}

.event-map-zoom-button:focus-visible {
  position: relative;
  z-index: 1;
  outline: 2px solid rgb(164 92 48);
  outline-offset: -3px;
}

.event-map-zoom-button:disabled {
  color: rgb(168 162 158);
  cursor: default;
}

.dark .event-map-zoom-controls {
  border-color: rgb(87 83 78 / 0.95);
  background: rgb(41 37 36 / 0.96);
}

.dark .event-map-zoom-button {
  color: rgb(245 245 244);
}

.dark .event-map-zoom-button + .event-map-zoom-button {
  border-color: rgb(87 83 78 / 0.95);
}

.dark .event-map-zoom-button:hover:not(:disabled) {
  background: rgb(68 64 60 / 0.9);
}

.dark .event-map-zoom-button:focus-visible {
  outline-color: rgb(231 184 125);
}

.dark .event-map-zoom-button:disabled {
  color: rgb(120 113 108);
}

.dark .event-map-expand-hint {
  background: rgba(28, 25, 23, 0.82);
  border-color: rgba(228, 150, 74, 0.2);
  color: rgb(168 162 158);
}
.dark .event-map-expand-icon {
  color: rgb(228 150 74);
}

.event-map-connectors,
.event-map-photo-layer {
  position: absolute;
  inset: 0;
}

.event-map-connectors {
  z-index: 650;
  overflow: visible;
  pointer-events: none;
}

.event-map-connector {
  stroke: rgb(164 92 48 / 0.9);
  stroke-width: 1.6;
  vector-effect: non-scaling-stroke;
}

.event-map-anchor {
  fill: rgb(164 92 48);
  stroke: rgb(250 250 249);
  stroke-width: 1.5;
  vector-effect: non-scaling-stroke;
}

.dark .event-map-connector {
  stroke: rgb(231 184 125 / 0.95);
}

.dark .event-map-anchor {
  fill: rgb(231 184 125);
  stroke: rgb(41 37 36);
}

.event-map-photo-layer {
  z-index: 700;
  pointer-events: none;
}

.event-map-photo-card {
  position: absolute;
  display: grid;
  grid-template-rows: 66px 1fr auto;
  gap: 0;
  width: 152px;
  height: 138px;
  overflow: hidden;
  padding: 0;
  border: 1px solid rgb(214 211 209 / 0.9);
  border-radius: 0.35rem;
  background: rgb(250 250 249 / 0.97);
  color: rgb(41 37 36);
  text-align: left;
  box-shadow: 0 3px 12px rgb(41 37 36 / 0.13);
  cursor: pointer;
  pointer-events: auto;
  transition: border-color 160ms ease, box-shadow 160ms ease;
}

.event-map-photo-card:hover,
.event-map-photo-card--focused {
  border-color: rgb(164 92 48 / 0.85);
  box-shadow: 0 5px 18px rgb(41 37 36 / 0.22);
}

.event-map-photo-card:focus-visible {
  outline: 2px solid rgb(164 92 48);
  outline-offset: 3px;
  z-index: 1;
}

.event-map-photo-card img {
  width: 100%;
  height: 66px;
  object-fit: cover;
  background: rgb(231 229 228);
}

.event-map-photo-title {
  align-self: center;
  min-width: 0;
  padding: 0.1rem 0.5rem 0;
  overflow: hidden;
  font-family: 'Noto Serif JP', serif;
  font-size: 0.8rem;
  line-height: 1.25rem;
  letter-spacing: 0.08em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-map-photo-location {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.05rem;
  min-width: 0;
  padding: 0 0.5rem 0.35rem;
  color: rgb(87 83 78);
  font-size: 0.72rem;
  line-height: 1.05rem;
  white-space: nowrap;
}

.event-map-photo-location span:first-child {
  flex: none;
  color: rgb(164 92 48);
}

.event-map-photo-location span:last-child {
  max-width: 100%;
  font-size: 0.68rem;
  overflow: hidden;
  color: rgb(87 83 78);
  text-overflow: ellipsis;
}

.dark .event-map-photo-card {
  border-color: rgb(87 83 78 / 0.9);
  background: rgb(41 37 36 / 0.97);
  color: rgb(245 245 244);
  box-shadow: 0 3px 14px rgb(0 0 0 / 0.42);
}

.dark .event-map-photo-card:hover,
.dark .event-map-photo-card--focused {
  border-color: rgb(231 184 125 / 0.9);
}

.dark .event-map-photo-card:focus-visible {
  outline-color: rgb(231 184 125);
}

.dark .event-map-photo-card img {
  background: rgb(68 64 60);
}

.dark .event-map-photo-location,
.dark .event-map-photo-location span:last-child {
  color: rgb(214 211 209);
}

.dark .event-map-photo-location span:first-child {
  color: rgb(231 184 125);
}

.map-photo-enter-active {
  transition: opacity 220ms ease, transform 260ms cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: var(--reveal-delay, 0ms);
}

.map-photo-enter-from {
  opacity: 0;
  transform: translateY(8px) scale(0.97);
}

.map-photo-leave-active {
  transition: opacity 120ms ease;
}

.map-photo-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  .event-map-photo-card {
    width: 132px;
  }

  .event-map-photo-card img {
    height: 66px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .map-photo-enter-active,
  .map-photo-leave-active,
  .event-map-photo-card {
    transition: none;
  }
}

/* OSM 單一瓦片來源：只在 tile pane 調色，不重新請求整張地圖。 */
.event-map-container :deep(.leaflet-tile-pane) {
  filter: grayscale(0.9) contrast(1.05);
}
.dark .event-map-container :deep(.leaflet-tile-pane) {
  filter: grayscale(1) invert(0.9) contrast(1.08) brightness(0.7);
}

/* 不在 SVG 上使用 filter：flyTo 平移時部分瀏覽器會出現路徑重影，誤以為多一顆標記 */

.event-map-container :deep(.leaflet-control-attribution) {
  font-size: 0.6rem;
  opacity: 0.85;
}
.dark .event-map-container :deep(.leaflet-control-attribution) {
  opacity: 0.9;
}
.dark .event-map-container :deep(.leaflet-control-attribution a) {
  color: rgba(255, 255, 255, 0.9);
}

</style>
