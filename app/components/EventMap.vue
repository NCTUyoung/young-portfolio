<template>
  <div
    class="event-map-wrapper"
    :class="{
      'event-map-wrapper--compact': variant === 'compact',
      'event-map-wrapper--expanded': isExpanded,
      'event-map-inset': variant === 'inset'
    }"
    :data-map-zoom="mapZoom"
    :data-event-count="events.length"
  >
    <div class="event-map-stage" @mouseenter="onWrapperEnter" @mouseleave="onWrapperLeave" @wheel="handleMapWheel">
      <div ref="mapContainer" class="event-map-container" role="region" :aria-label="variant === 'inset' ? '其他地點的拍攝地圖' : '影的互動拍攝地圖'" />
    <div
      v-if="variant === 'default'"
      class="event-map-zoom-controls"
      role="group"
      aria-label="地圖控制"
    >
      <button
        type="button"
        class="event-map-overview-button"
        aria-label="顯示全部活動"
        title="顯示全部活動"
        :disabled="events.length === 0"
        @click="fitAllEvents"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M7 3H4a1 1 0 0 0-1 1v3m10-4h3a1 1 0 0 1 1 1v3M3 13v3a1 1 0 0 0 1 1h3m10-4v3a1 1 0 0 1-1 1h-3" />
          <circle cx="10" cy="10" r="3" />
        </svg>
        <span class="sr-only">全覽</span>
      </button>
      <button
        type="button"
        class="event-map-zoom-button"
        aria-label="放大地圖並靠近活動位置"
        title="放大地圖並靠近活動位置"
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
      <button v-if="showAllLocations" type="button" class="event-map-overview-button" aria-label="回到主要拍攝區域" title="回到主要拍攝區域" @click="fitNearbyEvents">近景</button>
    </div>


      <svg v-if="photoCards.length" v-show="!isZooming" class="event-map-connectors" :viewBox="`0 0 ${mapSize.width} ${mapSize.height}`" aria-hidden="true">
        <line v-for="card in photoCards.filter(item => item.anchorVisible)" :key="card.name" :data-event-name="card.name" :x1="card.anchorX" :y1="card.anchorY" :x2="card.x" :y2="card.y" />
      </svg>
      <div v-if="photoCards.length" class="event-map-photos" role="group" :aria-label="variant === 'inset' ? '其他地點的活動照片' : '地圖上的活動照片'">
        <button
          v-for="(card, index) in photoCards"
          :key="card.name"
          type="button"
          class="event-map-photo-card"
          :class="{ 'event-map-photo-card--focused': card.name === selectedEvent?.name, 'event-map-photo-card--left': card.x < 90, 'event-map-photo-card--right': card.x > mapSize.width - 90, 'event-map-photo-card--bottom': card.y > mapSize.height - 70 }"
          :data-event-name="card.name"
          :style="{ left: `${card.x - card.diameter / 2}px`, top: `${card.y - card.diameter / 2}px`, width: `${card.diameter}px`, height: `${card.diameter}px` }"
          :aria-label="`預覽「${card.name}」`"
          :aria-pressed="card.name === selectedEvent?.name"
          :tabindex="index === circleTabIndex ? 0 : -1"
          :title="`${card.name} · ${card.locationAccuracy === 'regional' ? '約略地區' : '活動所在地'}`"
          @click="selectEvent(card.name)"
          @keydown="onCircleKeydown($event, index)"
        >
          <img class="event-map-photo-image" :src="getThumbPath(card.coverFilename, 400)" :style="{ objectPosition: (card.coverAspectRatio ?? 1) < 1 ? '50% 28%' : '50% 50%' }" alt="" loading="eager" decoding="async">
          <span class="event-map-photo-label">{{ card.name }}</span>
        </button>
      </div>
      <aside v-if="hasInset" class="event-map-inset-frame" aria-label="其他拍攝地點" @wheel.stop>
        <p>其他地點</p>
        <EventMap variant="inset" :events="remoteEvents" :selected-event-name="selectedEvent?.name" @select-event="selectEvent" />
      </aside>

      <div v-if="variant === 'default'" class="event-map-instruction">
        <span class="event-map-instruction--pointer">拖曳探索 · Ctrl＋滾輪縮放</span>
        <span class="event-map-instruction--touch">拖曳探索 · 雙指縮放</span>
      </div>
      <div v-if="tilesUnavailable" class="event-map-tile-status" role="status">
        <p>{{ variant === 'inset' ? '地圖暫時無法載入' : '地圖暫時無法載入，仍可選看活動照片。' }}</p>
        <button type="button" @click="retryTiles">重試載入地圖</button>
      </div>
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


    <button v-if="variant === 'default' && selectedEvent" type="button" class="event-map-selection" data-testid="map-series-entry" :aria-label="`進入「${selectedEvent.name}」組圖，共 ${selectedEvent.count} 張`" @click="openSelectedEvent">
      <img :src="getThumbPath(selectedEvent.coverFilename, 800)" :srcset="getGridImageSrcset(selectedEvent.coverFilename)" sizes="(max-width: 639px) calc(100vw - 3rem), 320px" data-full-image="true" alt="" decoding="async">
      <span class="event-map-selection__caption">
        <span class="event-map-photo-title">{{ selectedEvent.name }}</span>
        <span v-if="selectedEventNarrative" class="event-map-selection__narrative">{{ selectedEventNarrative }}</span>
        <span class="event-map-photo-location">{{ selectedEvent.location || '活動所在地' }}<span v-if="selectedEvent.locationAccuracy === 'regional'"> · 約略地區</span></span>
        <span class="event-map-photo-date">{{ selectedEvent.timeRange }} · {{ selectedEvent.count }} 張</span>
        <span class="event-map-selection__open">看這組照片<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M3 10h13m-5-5 5 5-5 5" /></svg></span>
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, nextTick, computed } from 'vue'
import { useDark, useDebounceFn } from '@vueuse/core'
import type * as LeafletNS from 'leaflet'
import type { Map as LeafletMap, LayerGroup, TileLayer, LatLngTuple, CircleMarker } from 'leaflet'
import { layoutPhotoMapCircles, type PhotoMapCircle } from '~/utils/photoMapCircleLayout'
import { PHOTO_MAP_OPENING_EVENTS } from '~/stores/galleryConstants'
import type { SeriesNarrative } from '~~/shared/types/gallery'
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
  coverAspectRatio?: number
  seriesNarrative?: SeriesNarrative
  timeRange: string
  count: number
  location?: string
  locationAccuracy: 'event' | 'regional'
}

interface MapViewSnapshot {
  center: [number, number]
  zoom: number
  allLocations?: boolean
}

const props = withDefaults(
  defineProps<{
    events: EventLocation[]
    /** Restore the locally previewed activity when returning from its gallery. */
    selectedEventName?: string | null
    initialView?: MapViewSnapshot | null
    /** Default is the circle map; inset is a remote-region map; compact retains the map band. */
    variant?: 'default' | 'compact' | 'inset'
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
  (e: 'focus-event' | 'select-event', name: string): void
  (e: 'viewport-change', view: MapViewSnapshot): void
  /** compact 展開狀態變化：宿主可據此顯示／收起框外的「停留放大」提示 */
  (e: 'expand-change', expanded: boolean): void
}>()

type MapPrint = EventLocation & PhotoMapCircle
const mapSize = ref({ width: 0, height: 0 })
const photoCards = ref<MapPrint[]>([])
let layoutFrame = 0
const mapContainer = ref<HTMLDivElement | null>(null)
const previewName = ref(props.selectedEventName)
const tilesUnavailable = ref(false)
const isZooming = ref(false)
const hideConnectors = () => { isZooming.value = true }
const showConnectors = () => { isZooming.value = false }
const mapZoom = ref<number | null>(null)
const minimumZoom = 0
const maximumZoom = 19
const isDark = useDark()
const showAllLocations = ref(props.initialView?.allLocations ?? false)

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

const { getThumbPath, getGridImageSrcset } = useImagePath()

let map: LeafletMap | null = null
let markersLayer: LayerGroup | null = null
let tileLayer: TileLayer | null = null
let resizeObserver: ResizeObserver | null = null
/** 防止 onMounted 與 watch 並發各建一張圖、重疊標記 */
let mapInitPromise: Promise<void> | null = null

/** Activities sharing coordinates have one marker and an accessible chooser. */
const markerGroups = new Map<CircleMarker, EventLocation[]>()

/** 僅在資料變更時重畫標記，避免 deep watch 過度觸發 */
const eventsSignature = computed(() =>
  props.events.map(e => `${e.name}:${e.lat}:${e.lng}:${e.locationAccuracy}:${e.coverFilename}:${e.count}`).join('|')
)

const selectedEvent = computed(() => {
  const selected = props.events.find(event => event.name === (props.variant === 'inset' ? props.selectedEventName : previewName.value))
  if (props.variant === 'inset') return selected
  return selected ?? props.events.find(event => event.name === PHOTO_MAP_OPENING_EVENTS[0]) ?? props.events[0]
})
const selectedEventNarrative = computed(() => {
  const narrative = selectedEvent.value?.seriesNarrative
  return [narrative?.strongest_line, narrative?.prologue, narrative?.narrative]
    .find(line => line?.trim())?.trim()
})

function distanceKm (a: EventLocation, b: EventLocation) {
  const rad = Math.PI / 180
  const latitude = (b.lat - a.lat) * rad
  const longitude = (b.lng - a.lng) * rad
  const h = Math.sin(latitude / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(longitude / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)))
}

// Prefer the established opening region; otherwise choose the largest nearby group.
const homeEvent = computed(() => props.events.find(event => event.name === PHOTO_MAP_OPENING_EVENTS[0])
  ?? [...props.events].sort((a, b) =>
    props.events.filter(event => distanceKm(b, event) < 800).length
    - props.events.filter(event => distanceKm(a, event) < 800).length
    || a.name.localeCompare(b.name)
  )[0])
const nearbyEvents = computed(() => props.events.filter(event => !homeEvent.value || distanceKm(homeEvent.value, event) < 800))
const remoteEvents = computed(() => props.events.filter(event => homeEvent.value && distanceKm(homeEvent.value, event) >= 800))
const displayedEvents = computed(() => props.variant === 'default' && !showAllLocations.value ? nearbyEvents.value : props.events)
const hasInset = computed(() => props.variant === 'default' && !showAllLocations.value && remoteEvents.value.length > 0)
const circleTabIndex = computed(() => Math.max(0, displayedEvents.value.findIndex(event => event.name === selectedEvent.value?.name)))

function updatePhotoCards () {
  if (!map || props.variant === 'compact') return
  const size = map.getSize()
  mapSize.value = { width: size.x, height: size.y }
  const reserved = hasInset.value ? [{ left: size.x - (size.x < 640 ? 152 : 224), top: 0, right: size.x, bottom: size.x < 640 ? 190 : 230 }] : []
  const circles = layoutPhotoMapCircles(displayedEvents.value.map(event => {
    const point = map!.latLngToContainerPoint([event.lat, event.lng])
    return { name: event.name, x: point.x, y: point.y, selected: event.name === selectedEvent.value?.name }
  }), size.x, size.y, { inset: props.variant === 'inset', reserved })
  const eventsByName = new Map(displayedEvents.value.map(event => [event.name, event]))
  photoCards.value = circles.map(circle => ({ ...eventsByName.get(circle.name)!, ...circle }))
}

function schedulePhotoCards () {
  if (layoutFrame) return
  layoutFrame = requestAnimationFrame(() => {
    layoutFrame = 0
    updatePhotoCards()
  })
}

function refreshMarkerStyles () {
  markerGroups.forEach((events, marker) => {
    const selected = events.some(event => event.name === selectedEvent.value?.name)
    const styles = getMarkerStyles(isDark.value)
    marker.setStyle(selected ? styles.selected : styles.base)
    marker.setRadius(props.variant === 'compact' ? (selected ? 7 : 4) : 3)
    marker.getElement()?.classList.toggle('event-map-marker--selected', selected)
  })
}

function selectEvent (name: string) {
  const event = props.events.find(item => item.name === name)
  if (!event) return
  previewName.value = name
  emit('select-event', name)
  refreshMarkerStyles()
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (map && displayedEvents.value.some(item => item.name === name)) {
    const point = map.latLngToContainerPoint([event.lat, event.lng])
    const size = map.getSize()
    if (point.x < size.x * .35 || point.x > size.x * .65 || point.y < 36 || point.y > size.y - 48) {
      map.panTo([event.lat, event.lng], { animate: !reduceMotion })
    }
  }
  schedulePhotoCards()
}

function onCircleKeydown (event: KeyboardEvent, index: number) {
  const count = displayedEvents.value.length
  const nextIndex = event.key === 'ArrowRight' ? (index + 1) % count
    : event.key === 'ArrowLeft' ? (index - 1 + count) % count
      : event.key === 'Home' ? 0 : event.key === 'End' ? count - 1 : null
  if (nextIndex === null) return
  event.preventDefault()
  const activity = displayedEvents.value[nextIndex]
  if (!activity) return
  selectEvent(activity.name)
  const button = event.currentTarget as HTMLButtonElement
  button.parentElement?.querySelectorAll<HTMLButtonElement>('button')[nextIndex]?.focus()
}

function openSelectedEvent () {
  if (!selectedEvent.value) return
  // Capture the visible frame even when navigation interrupts a map animation.
  map?.stop()
  reportViewportChange()
  emit('focus-event', selectedEvent.value.name)
}

function retryTiles () {
  tilesUnavailable.value = false
  tileLayer?.redraw()
}

function reportViewportChange () {
  if (!map) return
  mapZoom.value = map.getZoom()
  const { lat, lng } = map.getCenter()
  emit('viewport-change', { center: [lat, lng], zoom: map.getZoom(), allLocations: showAllLocations.value })
  schedulePhotoCards()
}

function zoomMap (delta: -1 | 1) {
  if (!map) return

  const nextZoom = Math.max(minimumZoom, Math.min(maximumZoom, map.getZoom() + delta))
  if (nextZoom === map.getZoom()) return

  const nearestEvent = displayedEvents.value.find(event => event.name === selectedEvent.value?.name) ?? displayedEvents.value.reduce<EventLocation | undefined>((closest, event) => {
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

function handleMapWheel (event: WheelEvent) {
  if (!map || props.variant !== 'default' || !event.ctrlKey) return

  // Leave ordinary wheel scrolling to the page; Ctrl + wheel is an intentional map zoom.
  event.preventDefault()
  const nextZoom = Math.max(
    minimumZoom,
    Math.min(maximumZoom, map.getZoom() + (event.deltaY < 0 ? 1 : -1))
  )
  if (nextZoom === map.getZoom()) return

  const point = map.mouseEventToContainerPoint(event)
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  map.setZoomAround(point, nextZoom, { animate: !reduceMotion })
}

async function fitAllEvents () {
  if (!map || !props.events.length) return
  const L = await import('leaflet')
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  showAllLocations.value = true
  reportViewportChange()
  await nextTick()
  renderMarkers(L)
  fitInitialMapView(L, !reduceMotion)
}

async function fitNearbyEvents () {
  if (!map) return
  const L = await import('leaflet')
  showAllLocations.value = false
  reportViewportChange()
  await nextTick()
  renderMarkers(L)
  fitInitialMapView(L, !window.matchMedia('(prefers-reduced-motion: reduce)').matches)
}

function invalidateMapSize () {
  if (!map) return
  map.invalidateSize({ animate: false })
  schedulePhotoCards()
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
  })
  tileLayer.on('load', () => {
    const tiles = mapContainer.value?.querySelectorAll<HTMLImageElement>('.leaflet-tile')
    tilesUnavailable.value = !!tiles?.length && !Array.from(tiles).some(tile => tile.complete && tile.naturalWidth > 0)
  })
  tileLayer.addTo(map)
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
      scrollWheelZoom: isCompact ? 'center' : false,
      keyboard: props.variant === 'default',
      attributionControl: props.variant !== 'inset',
      zoomSnap: isCompact ? 1 : .5
    })

    await setTileLayer()

    await nextTick()
    if (!map || !mapContainer.value) return
    invalidateMapSize()

    markersLayer = L.layerGroup().addTo(map)
    renderMarkers(L)
    map.on('moveend zoomend', reportViewportChange)
    map.on('move zoom', schedulePhotoCards)
    map.on('zoomstart', hideConnectors)
    map.on('zoomend', showConnectors)
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
const getMarkerStyles = (dark: boolean) => ({
  base: { radius: 5, color: dark ? '#bac5cb' : '#52647a', weight: 1.5,
    fillColor: dark ? '#14181b' : '#eef1f3', fillOpacity: 1 },
  selected: { radius: 9, color: dark ? '#ece8df' : '#faf7ef', weight: 2,
    fillColor: dark ? '#9aadc5' : '#39434a', fillOpacity: 1 }
})

const styleForEvent = (eventName: string, dark: boolean) => {
  const { base, selected } = getMarkerStyles(dark)
  return selectedEvent.value?.name === eventName ? selected : base
}

const fitInitialMapView = (L: LeafletModule, animate = false) => {
  const mapInstance = map
  if (!mapInstance || !props.events.length) return

  const bounds = displayedEvents.value.map(event => [event.lat, event.lng] as LatLngTuple)
  const isCompact = props.variant === 'compact'
  const isInset = props.variant === 'inset'
  const padding: [number, number] = isCompact ? [32, 48] : isInset ? [30, 30] : mapInstance.getSize().x < 640 ? [32, 70] : [100, 100]
  const maximum = isCompact || showAllLocations.value ? 6 : isInset ? 8 : 10
  if (bounds.length === 1 && bounds[0]) mapInstance.setView(bounds[0], isCompact ? 7 : 8, { animate })
  else if (bounds.length > 1) mapInstance.fitBounds(L.latLngBounds(bounds), { padding, maxZoom: maximum, animate })
}

const renderMarkers = (L: LeafletModule) => {
  const mapInstance = map
  const markers = markersLayer
  if (!mapInstance || !markers) return
  markers.clearLayers()
  markerGroups.clear()

  if (!props.events.length) return

  const dark = isDark.value

  const locations = new Map<string, EventLocation[]>()
  displayedEvents.value.forEach(event => {
    const key = `${event.lat}:${event.lng}`
    locations.set(key, [...(locations.get(key) ?? []), event])
  })

  locations.forEach(events => {
    const event = events[0]!
    const initialStyle = styleForEvent(event.name, dark)
    const marker = L.circleMarker([event.lat, event.lng], {
      ...initialStyle,
      radius: props.variant === 'compact' ? initialStyle.radius : 3,
      interactive: props.variant === 'compact',
      className: 'event-map-marker',
      dashArray: event.locationAccuracy === 'regional' ? '2 2' : undefined
    })
    const label = document.createElement('span')
    label.textContent = events.length > 1
      ? `${event.location ?? event.name} · ${events.length} 組活動`
      : `${event.name} · ${event.locationAccuracy === 'event' ? '活動所在地' : '約略地區'}`
    marker.bindTooltip(label, { direction: 'top', offset: [0, -8], opacity: 1 })
    markerGroups.set(marker, events)

    if (props.variant === 'compact') marker.on('click', () => emit('focus-event', event.name))

    marker.addTo(markers)
    const element = marker.getElement()
    if (props.variant === 'compact') {
      element?.setAttribute('tabindex', '0')
      element?.setAttribute('role', 'button')
      element?.setAttribute('aria-label', label.textContent ?? event.name)
      element?.addEventListener('keydown', (key) => {
        const keyboard = key as KeyboardEvent
        if (keyboard.key === 'Enter' || keyboard.key === ' ') {
          key.preventDefault()
          emit('focus-event', event.name)
        }
      })
    } else {
      // Accessible photo buttons own selection; coordinate dots are decoration.
      element?.setAttribute('tabindex', '-1')
      element?.setAttribute('focusable', 'false')
      element?.setAttribute('aria-hidden', 'true')
    }

  })
  refreshMarkerStyles()
  schedulePhotoCards()
}

onMounted(async () => {
  await initMap()
  if (mapContainer.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      debouncedInvalidateMapSize()
      schedulePhotoCards()
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

watch(() => props.selectedEventName, (name) => {
  previewName.value = name
  refreshMarkerStyles()
  schedulePhotoCards()
})

onBeforeUnmount(() => {
  if (layoutFrame) cancelAnimationFrame(layoutFrame)
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
    map.off('move zoom', schedulePhotoCards)
    map.off('zoomstart', hideConnectors)
    map.off('zoomend', showConnectors)
    map.remove()
    map = null
    markersLayer = null
  }
})
</script>

<style scoped>
.event-map-wrapper {
  --map-ink: #39434a;
  --map-muted: #58656d;
  --map-line: #bbc4c8;
  --map-surface: #e6ecef;
  --map-paper: #faf7ef;
  display: block;
  color: var(--map-ink);
  min-width: 0;
}
.dark .event-map-wrapper {
  --map-ink: #ece8df;
  --map-muted: #bac5cb;
  --map-line: #64717a;
  --map-surface: #1d252a;
  --map-paper: #302e28;
}
.event-map-stage { position: relative; min-width: 0; isolation: isolate; background: var(--map-surface); }
.event-map-container { width: 100%; height: 600px; background: var(--map-surface); }
.event-map-photos, .event-map-connectors { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.event-map-photos { z-index: 650; }
.event-map-connectors { z-index: 600; overflow: hidden; }
.event-map-connectors line { stroke: var(--map-muted); stroke-width: 1; vector-effect: non-scaling-stroke; }
.event-map-photo-card { position: absolute; display: block; padding: 2px; border-radius: 50%; background: var(--map-paper); box-shadow: 1px 3px 7px rgb(36 42 43 / .25); color: var(--map-ink); cursor: pointer; pointer-events: auto; }
.event-map-photo-card--focused { z-index: 2; outline: 2px solid var(--map-ink); outline-offset: 2px; }
.event-map-photo-image { display: block; width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
.event-map-photo-label { position: absolute; top: calc(100% + 8px); left: 50%; transform: translateX(-50%); width: max-content; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 3px 6px; background: var(--map-paper); color: var(--map-ink); font-size: .72rem; pointer-events: none; opacity: 0; }
.event-map-photo-card:hover .event-map-photo-label, .event-map-photo-card:focus-visible .event-map-photo-label { opacity: 1; }
.event-map-photo-card--left .event-map-photo-label { left: 0; transform: none; }
.event-map-photo-card--right .event-map-photo-label { left: auto; right: 0; transform: none; }
.event-map-photo-card--bottom .event-map-photo-label { top: auto; bottom: calc(100% + 8px); }
.event-map-photo-card:hover { z-index: 3; }
.event-map-photo-card:focus-visible, .event-map-selection:focus-visible { outline: 2px solid var(--map-ink); outline-offset: 4px; }
.event-map-inset-frame { position: absolute; z-index: 750; top: 12px; right: 12px; width: 200px; border: 1px solid var(--map-line); background: var(--map-surface); }
.event-map-inset-frame > p { height: 24px; margin: 0; padding: 4px 8px; color: var(--map-muted); font-size: .68rem; }
.event-map-inset .event-map-container { height: 180px; }
.event-map-inset .event-map-photo-label { display: none; }
.event-map-inset .event-map-tile-status { top: -24px; left: 0; right: 0; height: 24px; padding: 0 4px; font-size: .6rem; }
.event-map-inset .event-map-tile-status p { display: none; }
.event-map-inset .event-map-tile-status button { min-height: 24px; margin: 0; }
.event-map-selection { display: grid; grid-template-columns: minmax(0, 32%) minmax(0, 1fr); align-items: center; gap: 1.5rem; width: 100%; min-height: 180px; margin-top: 1rem; padding: 1rem; text-align: left; background: var(--map-paper); color: var(--map-ink); }
.event-map-selection > img { display: block; width: 100%; height: auto; max-height: 220px; object-fit: contain; }
.event-map-selection__caption { display: flex; flex-direction: column; min-width: 0; overflow-wrap: anywhere; }
.event-map-photo-title { font-family: var(--font-jp, 'Shippori Mincho', serif); font-size: 1.2rem; line-height: 1.5; }
.event-map-selection__narrative { max-width: 65ch; margin: .6rem 0 .8rem; font-family: var(--font-jp, 'Shippori Mincho', serif); font-size: .88rem; line-height: 1.8; }
.event-map-photo-date, .event-map-photo-location { color: var(--map-muted); font-size: .78rem; line-height: 1.6; }
.event-map-selection__open { display: inline-flex; align-items: center; align-self: flex-start; gap: .75rem; margin-top: .85rem; border-bottom: 1px solid currentColor; padding-bottom: .15rem; font-size: .8rem; }
.event-map-selection__open svg { width: 20px; height: 20px; }
.event-map-instruction { position: absolute; z-index: 700; bottom: 1.6rem; left: 1rem; padding: .3rem .5rem; background: var(--map-paper); color: var(--map-ink); font-size: .68rem; pointer-events: none; }
.event-map-instruction--touch { display: none; }
.event-map-tile-status { position: absolute; z-index: 800; left: 4.5rem; right: 1rem; top: 1rem; padding: 1rem; background: var(--map-paper); color: var(--map-ink); font-size: .8rem; }
.event-map-tile-status button { margin-top: .5rem; min-height: 44px; text-decoration: underline; text-underline-offset: 4px; }
.event-map-container :deep(.leaflet-tooltip) { border: 0; border-radius: 2px; background: var(--map-paper); color: var(--map-ink); box-shadow: none; font-family: inherit; font-size: .75rem; }
.event-map-wrapper--compact { display: block; }
/**
 * compact 版的外框改得更「帶狀」：
 * 圓角縮小、shadow 取消（band 式不需要卡片感）、邊框淡化。
 * 目的是讓它在 header 與 strip 之間「低調分隔」而非「醒目卡片」。
 */
.event-map-wrapper--compact {
  @apply rounded-xl border-stone-200/60 dark:border-stone-700/40;
  box-shadow: none;
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
.event-map-wrapper--compact.event-map-wrapper--expanded .event-map-stage > [class*="bg-gradient-to"] {
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
  top: 1rem;
  left: 1rem;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgb(214 211 209 / 0.95);
  border-radius: 2px;
  background: rgb(250 250 249 / 0.96);
  box-shadow: none;
}

.event-map-zoom-button {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  color: rgb(41 37 36);
  font-family: inherit;
  font-size: 1.55rem;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
}

.event-map-overview-button {
  display: flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  color: rgb(41 37 36);
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  cursor: pointer;
}

.event-map-overview-button svg {
  width: 1rem;
  height: 1rem;
  flex: none;
}

.event-map-overview-button + .event-map-zoom-button,
.event-map-zoom-button + .event-map-zoom-button {
  border-top: 1px solid rgb(214 211 209 / 0.95);
}

.event-map-overview-button:hover:not(:disabled),
.event-map-zoom-button:hover:not(:disabled) {
  background: rgb(231 229 228 / 0.8);
}

.event-map-overview-button:focus-visible,
.event-map-zoom-button:focus-visible {
  position: relative;
  z-index: 1;
  outline: 2px solid rgb(164 92 48);
  outline-offset: -3px;
}

.event-map-overview-button:disabled,
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

.dark .event-map-overview-button {
  color: rgb(245 245 244);
}

.dark .event-map-overview-button + .event-map-zoom-button,
.dark .event-map-zoom-button + .event-map-zoom-button {
  border-color: rgb(87 83 78 / 0.95);
}

.dark .event-map-overview-button:hover:not(:disabled),
.dark .event-map-zoom-button:hover:not(:disabled) {
  background: rgb(68 64 60 / 0.9);
}

.dark .event-map-overview-button:focus-visible,
.dark .event-map-zoom-button:focus-visible {
  outline-color: rgb(231 184 125);
}

.dark .event-map-overview-button:disabled,
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

/* OSM 單一瓦片來源：只在 tile pane 調色，不重新請求整張地圖。 */
.event-map-container :deep(.leaflet-tile-pane) {
  filter: grayscale(1) contrast(.85) brightness(1.1);
  opacity: .68;
}
.dark .event-map-container :deep(.leaflet-tile-pane) {
  filter: grayscale(1) invert(0.9) contrast(1.08) brightness(0.7);
  opacity: .8;
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


@media (max-width: 639px) {
  .event-map-container { height: 500px; }
  .event-map-inset-frame { width: 128px; }
  .event-map-inset .event-map-container { height: 140px; }
  .event-map-selection { grid-template-columns: minmax(0, 1fr); gap: .9rem; padding: .85rem; }
  .event-map-selection > img { max-height: 220px; }
  .event-map-photo-title { font-size: 1.05rem; }
  .event-map-selection__narrative { margin: .4rem 0 .65rem; font-size: .82rem; }
  .event-map-photo-date, .event-map-photo-location { font-size: .72rem; }
  .event-map-selection__open { margin-top: .75rem; }
}
@media (hover: none) {
  .event-map-instruction--pointer { display: none; }
  .event-map-instruction--touch { display: inline; }
  .event-map-expand-hint { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .event-map-photo-card { transition: none; }
}
</style>
