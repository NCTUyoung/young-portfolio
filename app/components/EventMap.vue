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
    <div ref="mapContainer" class="event-map-container" />

    <!--
      compact 未展開時顯示「停留展開」hint：
      - 位於地圖中下緣，小、半透明，不搶視覺
      - `@media (hover: hover)` 才有作用；touch-only 裝置 hint 也會顯示但點了沒反應，
        不過「停留」對 touch 裝置本來就不成立，使用者不會期待
      - `pointer-events: none` 不擋 Leaflet 互動
    -->
    <div
      v-if="variant === 'compact' && !isExpanded"
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

    <transition name="event-map-hover">
      <div
        v-if="hoveredEvent"
        class="event-map-hover-card"
        :class="{ 'event-map-hover-card--compact': variant === 'compact' }"
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
}

const props = withDefaults(
  defineProps<{
    events: EventLocation[]
    /** 與 Event 篩選同步：選中時地圖飛到該點並強調標記；null 時縮放至全部範圍 */
    selectedEventName?: string | null
    /**
     * 版型變體：
     *   - `default`：420px 高（手機 260px），wheel zoom、鍵盤導覽開啟——適合專頁或詳細模式
     *   - `compact`：160px 高（手機 120px），停用 wheel zoom 與鍵盤（避免與頁面捲動、strip 的鍵盤導覽打架），
     *     hover card 彈在地圖下方外而非內部右下，marker 縮小；用於常駐 summary bar
     */
    variant?: 'default' | 'compact'
  }>(),
  { selectedEventName: null, variant: 'default' }
)

const emit = defineEmits<{
  (e: 'focus-event', name: string): void
}>()

const mapContainer = ref<HTMLDivElement | null>(null)
const hoveredEvent = ref<EventLocation | null>(null)
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

    // compact 版調整：
    //   - scrollWheelZoom: 'center' → 以地圖中心縮放（而非游標位置），避免 160px 窄帶中
    //     游標貼邊時 zoom 跳位；Leaflet 僅在 hover 於 map container 時攔截 wheel，
    //     離開就還給頁面，所以快速滾過不會卡住頁面捲動。
    //   - keyboard: false → tiny map 的 `+/-` 鍵讓給 strip / timeline 鍵盤導覽。
    //   - 仍保留 dragging / touchZoom / doubleClickZoom 讓使用者可探索。
    const isCompact = props.variant === 'compact'
    map = L.map(mapContainer.value, {
      center: [23.7, 121],
      zoom: isCompact ? 6 : 7,
      zoomControl: false,
      scrollWheelZoom: isCompact ? 'center' : true,
      keyboard: !isCompact,
      attributionControl: !isCompact
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
      // compact 版中飛到單一 event 不要 zoom 到 12（太近看不出地理脈絡），停 9
      const focusZoom = props.variant === 'compact' ? 9 : 12
      runFly(() => mapInstance.flyTo([ev.lat, ev.lng], focusZoom, { duration: flyDuration }))
      return
    }
  }

  const bounds = props.events.map(e => [e.lat, e.lng] as LatLngTuple)
  // compact 版 padding 拉大（避免 marker 貼邊切掉），maxZoom 限得更小
  // 讓「台灣全島 + 日本」等跨區域資料能同框展示而不被強制 zoom-in。
  const isCompact = props.variant === 'compact'
  const fitPadding: [number, number] = isCompact ? [32, 48] : [36, 36]
  const fitMaxZoom = isCompact ? 6 : 12
  const singleZoom = isCompact ? 7 : 10
  if (bounds.length === 1) {
    runFly(() => mapInstance.flyTo(bounds[0], singleZoom, { duration: flyDuration }))
  } else if (bounds.length > 1) {
    const b = L.latLngBounds(bounds)
    runFly(() => mapInstance.flyToBounds(b, { padding: fitPadding, duration: flyDuration, maxZoom: fitMaxZoom }))
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
  clearHoverTimers()
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
.dark .event-map-expand-hint {
  background: rgba(28, 25, 23, 0.82);
  border-color: rgba(228, 150, 74, 0.2);
  color: rgb(168 162 158);
}
.dark .event-map-expand-icon {
  color: rgb(228 150 74);
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
/**
 * compact 版 hover card：
 * 容器本身僅 160px 高，放原尺寸（60px 圖 + 3 行文）會佔滿全高；
 * 改貼右上角、縮小圖至 40px、限 max-width 220px，
 * 並移除 attribution（compact 時 attributionControl:false）不必留空間，
 * bottom/left 都留 0.4rem padding 呈現輕盈浮貼感。
 */
.event-map-hover-card--compact {
  right: 0.55rem;
  bottom: auto;
  top: 0.55rem;
  padding: 0.35rem 0.55rem;
  gap: 0.55rem;
  border-radius: 0.65rem;
  max-width: 220px;
}
.event-map-hover-card--compact .event-map-hover-image {
  width: 40px;
  height: 40px;
  border-radius: 0.5rem;
}
.event-map-hover-card--compact .event-map-hover-title {
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  margin-bottom: 0;
}
.event-map-hover-card--compact .event-map-hover-sub,
.event-map-hover-card--compact .event-map-hover-meta {
  font-size: 0.6rem;
  line-height: 1.35;
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

