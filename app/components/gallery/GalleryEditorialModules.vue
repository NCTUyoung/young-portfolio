<template>
  <!--
    攝影 overview 編輯模組（Editorial Module Grid）。
    取代舊「橫向小圖膠卷光桌」(GalleryLightTable)——使用者回饋「圖片太小、排版過時」。
    靈感：wiki/patterns/newspaper-masthead-module-grid.md（報紙刊頭模組網格）。

    每個 event = 一塊報紙頭版式模組：扉頁刊頭 + 特稿大圖（hero）+ 一排「編號 + 日期」支援照，
    + 「全 N 枚を見る →」進該 event 沉浸頁（/gallery/photography/<event>）。

    ── 尊重原圖比例（使用者：「不管原圖比例就解才會蠻奇怪」）──
    不用固定框 object-fit: cover 硬裁。改用 justified 技法（wiki 明示「不可 object-fit:cover」）：
    每張圖 **固定高度、寬度依原比例自然延伸**，零裁切。原比例由 <img> @load 讀 naturalWidth/Height
    寫進 ratios map，套到 aspect-ratio（載入前用 3/2 佔位，載入後校正，避免大幅位移）。

    守鐵律：報紙頭版的粗黑外框 → 降為 hairline；編號黑底方塊 → 冷銀 hairline tab + mono 數字。
    色彩走 kage 冷銀「光卓」語意 token（--fg-2 / --fg-muted / --border / --accent 隨世界與
    light/dark 自動切換）。純 user-initiated hover；守 prefers-reduced-motion。
  -->
  <section ref="rootEl" class="em" data-world="kage" aria-labelledby="em-heading">
    <!-- 扉頁刊頭 nameplate（編輯標題，非舊光卓 bar） -->
    <header class="em__masthead">
      <p class="em__eyebrow">影 — Photography</p>
      <h2 id="em-heading" class="em__title font-jp">写真記録</h2>
      <span class="em__rule" aria-hidden="true"/>
      <span class="em__count">
        <span class="em__count-num">{{ String(totalCount).padStart(3, '0') }}</span>
        <span class="em__count-unit">枚 · frames</span>
      </span>
    </header>

    <!-- 每個 event 一塊報紙頭版式模組 -->
    <template v-for="(m, mi) in modules" :key="m.eventName">
    <article class="em__module">
      <!-- 模組刊頭：其の N · event 名 · 枚數/地點/日期 · 一句宣言 -->
      <header class="em__mod-head">
        <span class="em__mod-index">其の {{ kansuji(mi + 1) }}</span>
        <h3 class="em__mod-name font-jp">{{ m.eventName }}</h3>
        <span class="em__mod-meta">
          <span class="em__mod-cnt">{{ m.count }} 枚</span>
          <template v-if="m.location"><span class="em__mod-sep" aria-hidden="true">·</span>{{ m.location }}</template>
          <template v-if="m.dateLabel"><span class="em__mod-sep" aria-hidden="true">·</span><span class="em__mod-date">{{ m.dateLabel }}</span></template>
        </span>
      </header>

      <!-- 特稿大圖（hero，固定高度、寬度依原比例） -->
      <div class="em__lead">
        <button
          type="button"
          class="em__feat group"
          :style="{ aspectRatio: ar(m.featured.filename) }"
          :aria-label="m.featured.title || '攝影作品'"
          @click="$emit('imageClick', m.featured)"
        >
          <picture class="contents">
            <source :srcset="getGridAvifSrcset(m.featured.filename)" :sizes="featSizes" type="image/avif">
            <source :srcset="getGridImageSrcset(m.featured.filename)" :sizes="featSizes" type="image/webp">
            <img
              :src="getThumbPath(m.featured.filename, 800)"
              :srcset="getGridImageSrcset(m.featured.filename)"
              :sizes="featSizes"
              :alt="m.featured.title"
              :data-fn="m.featured.filename"
              class="em__img"
              :loading="mi === 0 ? 'eager' : 'lazy'"
              :fetchpriority="mi === 0 ? 'high' : undefined"
              decoding="async"
              @load="onImgLoad($event, m.featured.filename)"
            >
          </picture>
          <span class="em__feat-no" aria-hidden="true">{{ frameNo(m.featured, 0) }}</span>
          <span class="em__cap">
            <span class="em__cap-title font-jp">{{ m.featured.title || '未命名' }}</span>
            <span v-if="exifLine(m.featured)" class="em__cap-exif">{{ exifLine(m.featured) }}</span>
          </span>
        </button>

        <!-- 特稿側欄：上緣錨（特稿章別 + frame no）撐住上沿 → 引言 + EXIF 沉底；
             space-between 讓直幅 hero 右側留白讀作「編輯余白」而非破洞（critic M2）。 -->
        <aside class="em__lead-note">
          <header class="em__lead-top">
            <span class="em__lead-kicker">特稿 · Feature</span>
            <span class="em__lead-frame">{{ frameNo(m.featured, 0) }}</span>
          </header>
          <div class="em__lead-foot">
            <p v-if="m.line" class="em__lead-quote font-jp">「{{ m.line }}」</p>
            <span v-if="exifLine(m.featured)" class="em__lead-exif">{{ exifLine(m.featured) }}</span>
          </div>
        </aside>
      </div>

      <!-- 支援照 justified strip：依容器寬把每張（高×原比例寬）打包成行，整行拉齊填滿，
           末行靠左不拉伸（critic M1：消除 flex-wrap 鋸齒）。寬高由 stripRows() 算出 inline。 -->
      <div v-if="m.shots.length" class="em__strip">
        <div
          v-for="(row, ri) in (stripLayout.get(m.eventName) || [])"
          :key="ri"
          class="em__strip-row"
          :style="{ height: row.h + 'px' }"
        >
          <button
            v-for="cell in row.items"
            :key="cell.img.filename"
            type="button"
            class="em__shot group"
            :style="{ width: cell.w + 'px', height: row.h + 'px' }"
            :aria-label="cell.img.title || '攝影作品'"
            @click="$emit('imageClick', cell.img)"
          >
            <span class="em__shot-tab" aria-hidden="true">
              <span class="em__shot-no">{{ String(cell.ti + 2).padStart(2, '0') }}</span>
              <span v-if="shortDate(cell.img.date)" class="em__shot-date">{{ shortDate(cell.img.date) }}</span>
            </span>
            <picture class="contents">
              <source :srcset="getGridAvifSrcset(cell.img.filename)" :sizes="shotSizes" type="image/avif">
              <source :srcset="getGridImageSrcset(cell.img.filename)" :sizes="shotSizes" type="image/webp">
              <img
                :src="getThumbPath(cell.img.filename, 400)"
                :srcset="getGridImageSrcset(cell.img.filename)"
                :sizes="shotSizes"
                :alt="cell.img.title"
                :data-fn="cell.img.filename"
                class="em__img"
                loading="lazy"
                decoding="async"
                @load="onImgLoad($event, cell.img.filename)"
              >
            </picture>
          </button>
        </div>
      </div>

      <!-- 進該 event 沉浸頁（預渲染 event 路由） -->
      <NuxtLink
        :to="`/gallery/photography/${encodeURIComponent(m.eventName)}`"
        class="em__enter"
      >
        全 {{ m.count }} 枚を見る<span class="em__enter-arrow" aria-hidden="true">→</span>
      </NuxtLink>
    </article>
    <!-- 第一塊模組之後插入「踏跡」中段插曲（地圖）：讓照片先迎人，地圖讀作章節而非頂部關卡 -->
    <div v-if="mi === 0" class="em__interlude"><slot name="after-first"/></div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useImagePath } from '~/composables/useImagePath'
import { formatShutterSpeed } from '~/utils/formatters'
import type { GalleryItem, MixedPhotoItem, SeriesNarrative } from '~~/shared/types/gallery'

const props = defineProps<{ items: MixedPhotoItem[] }>()
defineEmits<{ imageClick: [item: GalleryItem] }>()

const { getThumbPath, getGridImageSrcset, getGridAvifSrcset } = useImagePath()

const featSizes = '(max-width: 1023px) 100vw, 64vw'
const shotSizes = '(max-width: 1023px) 40vw, 22vw'

interface Module {
  eventName: string
  count: number
  location: string | null
  line: string | null
  dateLabel: string | null
  featured: GalleryItem
  shots: GalleryItem[]
}

/** photography event 群組 → 報紙頭版式模組：特稿 hero + 編號支援照。 */
const modules = computed<Module[]>(() =>
  props.items
    .filter(g => g.images && g.images.length)
    .map((g) => {
      const imgs = g.images || []
      const sn = (imgs[0] as { seriesNarrative?: SeriesNarrative } | undefined)?.seriesNarrative
      return {
        eventName: g.eventName || '其他作品',
        count: imgs.length,
        location: imgs[0]?.event?.location || null,
        line: sn?.strongest_line?.trim() || null,
        dateLabel: shortDate(imgs[0]?.date) || null,
        featured: imgs[0]!,
        shots: imgs.slice(1, 7)
      }
    })
)

const totalCount = computed(() => modules.value.reduce((s, m) => s + m.count, 0))

/**
 * 原圖比例 map：<img> @load 讀 naturalWidth/Height 寫入，套到 aspect-ratio。
 * 載入前以 3/2 佔位（多數橫幅近此值），載入後校正；零裁切、最小位移。
 *
 * 效能（修「首次點圖庫非常卡」）：先前用響應式物件存比例，每張圖 @load 都直接 mutate →
 * 觸發整個 <section> 重渲染並對全部 modules 重算 justified 版面（~80 載入 × ~10 模組的
 * O(n²) reflow 風暴，正是首屏卡頓主因）。改為：比例寫進「待補」非響應式 Map，並以
 * requestAnimationFrame 把同一幀內的多次 @load 合批，每幀最多一次替換 ratiosRef（單一響應式
 * 觸發）→ 版面重算頻率從「每張圖一次」降到「每幀一次」。
 */
const ratiosRef = ref(new Map<string, number>())
const pendingRatios = new Map<string, number>()
let flushScheduled = false
function recordRatio (filename: string, img: HTMLImageElement) {
  if (!img.naturalWidth || !img.naturalHeight) return
  pendingRatios.set(filename, img.naturalWidth / img.naturalHeight)
  if (flushScheduled || typeof window === 'undefined') return
  flushScheduled = true
  requestAnimationFrame(() => {
    flushScheduled = false
    const next = new Map(ratiosRef.value)
    for (const [k, v] of pendingRatios) next.set(k, v)
    pendingRatios.clear()
    ratiosRef.value = next // 每幀單一響應式觸發，合批所有 @load
  })
}
function onImgLoad (e: Event, filename: string) {
  recordRatio(filename, e.target as HTMLImageElement)
}
function ar (filename: string): string {
  const r = ratiosRef.value.get(filename)
  return r ? `${r}` : '3 / 2'
}
/** 數值版原比例（justified 計算用）；未知時退回 1.5（≈3:2 橫幅）。 */
function ratioOf (filename: string): number {
  const r = ratiosRef.value.get(filename)
  return r && r > 0 ? r : 1.5
}

/* ── justified strip 版面 ──
   量測容器寬，把支援照依「目標行高 × 原比例寬」貪婪打包成行；整行縮放至剛好填滿容器寬，
   末行維持目標高、靠左不拉伸 → 行末永遠齊整（消 flex-wrap 鋸齒，critic M1）。
   ratios 由 @load 補上後自動重算（reactive）；SSR/未量測前用 1180 估，掛載後校正。 */
const rootEl = ref<HTMLElement | null>(null)
const containerW = ref(1180)
const STRIP_GAP = 12 // px，與 .em__strip-row CSS gap 對齊
let ro: ResizeObserver | null = null
onMounted(() => {
  if (!rootEl.value || typeof ResizeObserver === 'undefined') return
  containerW.value = rootEl.value.clientWidth || containerW.value
  // 已快取的 <img> 在 Vue 綁定 @load 前就 complete，load 事件不再觸發 →
  // ratios 卡在 3/2 佔位，直幅圖被塞進橫幅框內信箱化（右側留白）。掛載時補掃一次，
  // 直接讀 naturalWidth/Height 回填（修「圖片旁一堆空白、未緊密結合」）。
  for (const img of rootEl.value.querySelectorAll<HTMLImageElement>('img.em__img')) {
    const fn = img.dataset.fn
    if (fn && img.complete) recordRatio(fn, img)
  }
  ro = new ResizeObserver((entries) => {
    for (const e of entries) if (e.contentRect.width) containerW.value = e.contentRect.width
  })
  ro.observe(rootEl.value)
})
onBeforeUnmount(() => { ro?.disconnect(); ro = null })

interface StripCell { img: GalleryItem; w: number; ti: number }
interface StripRow { h: number; items: StripCell[] }
function packRows (shots: GalleryItem[], cw: number): StripRow[] {
  const targetH = cw < 700 ? 150 : 200
  const rows: StripRow[] = []
  let cur: GalleryItem[] = []
  let ratioSum = 0
  for (const img of shots) {
    cur.push(img)
    ratioSum += ratioOf(img.filename)
    const rowW = ratioSum * targetH + (cur.length - 1) * STRIP_GAP
    if (rowW >= cw) {
      const h = (cw - (cur.length - 1) * STRIP_GAP) / ratioSum
      rows.push({ h, items: cur.map(im => ({ img: im, w: ratioOf(im.filename) * h, ti: 0 })) })
      cur = []
      ratioSum = 0
    }
  }
  if (cur.length) {
    // 末行：維持目標高、靠左（不放大填滿）
    rows.push({ h: targetH, items: cur.map(im => ({ img: im, w: ratioOf(im.filename) * targetH, ti: 0 })) })
  }
  // ti = 原始順序索引（編號 tab 顯示 ti+2，因特稿為 01）
  let idx = 0
  for (const r of rows) for (const it of r.items) it.ti = idx++
  return rows
}

/**
 * 各 module 的 justified 版面：只在 containerW 或 ratiosRef（比例合批補上）變動時整體重算一次，
 * 取代「模板 v-for 內每次 render 都對 ~10 個模組逐一 inline 呼叫 stripRows」的逐圖重算風暴。
 * packRows → ratioOf 會讀 ratiosRef.value，故比例每幀替換時此 computed 自動重算一次。
 */
const stripLayout = computed<Map<string, StripRow[]>>(() => {
  const cw = containerW.value
  const map = new Map<string, StripRow[]>()
  for (const m of modules.value) map.set(m.eventName, packRows(m.shots, cw))
  return map
})

const KANSUJI = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五']
function kansuji (n: number): string { return KANSUJI[n] || String(n) }

/** "2025-12-25" → "2025.12.25"；"2025-12" → "2025.12"；空值 → null。 */
function shortDate (d?: string | null): string | null {
  if (!d) return null
  const m = d.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/)
  if (!m) return null
  return m[3] ? `${m[1]}.${m[2]}.${m[3]}` : `${m[1]}.${m[2]}`
}

function exifLine (img: GalleryItem): string | null {
  const parts: string[] = []
  if (img.focalLength) parts.push(`${img.focalLength}mm`)
  if (img.aperture) parts.push(`f/${img.aperture}`)
  if (img.shutterSpeed) parts.push(formatShutterSpeed(img.shutterSpeed))
  return parts.length ? parts.join(' · ') : null
}

/** frame number：自檔名抽近似負片序號（DSC_7030 → 7030A），抽不到退回索引補零。 */
function frameNo (img: GalleryItem, ii: number): string {
  const m = img.filename?.match(/(\d{2,5})(?:[-_.]|\.\w+$)/)
  const n = m?.[1]
  return n ? `${n}A` : String(ii + 1).padStart(2, '0') + 'A'
}
</script>

<style scoped>
/* =========================================================
   攝影 overview 編輯模組（newspaper-masthead-module-grid 改編）
   冷銀「光卓」語彙；hairline 取代粗框；mono 編號/日期；
   全圖固定高度、寬度依原比例（不裁切）；語意 token 自動 light/dark。
   ========================================================= */
.em {
  --em-mono: ui-monospace, 'SFMono-Regular', 'Roboto Mono', monospace;
  max-width: 80rem;
  margin: 0 auto;
}

/* ── 扉頁刊頭 nameplate ── */
.em__masthead {
  display: flex;
  align-items: baseline;
  gap: 1.1rem;
  padding-bottom: 1rem;
  margin-bottom: 2.4rem;
  border-bottom: 1px solid var(--border);
}
.em__eyebrow {
  margin: 0;
  font-family: 'Noto Serif JP', serif;
  font-size: 0.62rem;
  letter-spacing: 0.42em;
  color: var(--accent);
  white-space: nowrap;
}
.em__title {
  margin: 0;
  font-size: clamp(1.6rem, 3vw, 2.3rem);
  font-weight: 400;
  letter-spacing: 0.18em;
  line-height: 1;
  color: var(--fg-2);
}
.em__rule { flex: 1 1 auto; height: 1px; background: var(--hairline); transform: translateY(-0.35rem); }
.em__count { display: flex; align-items: baseline; gap: 0.4rem; white-space: nowrap; }
.em__count-num {
  font-family: var(--em-mono);
  font-variant-numeric: tabular-nums;
  font-size: 1.15rem;
  letter-spacing: 0.05em;
  color: var(--fg-2);
}
.em__count-unit { font-size: 0.64rem; letter-spacing: 0.2em; color: var(--fg-muted); }

/* ── 每個 event 模組 ── */
/* content-visibility:auto — 離開視窗的 event 模組跳過版面/繪製，長卷 overview 首屏只算可見模組；
   contain-intrinsic-size 預留估計高度避免捲動跳動（修「首次點圖庫非常卡」之繪製成本）。 */
.em__module {
  margin-bottom: 4.5rem;
}
.em__module:last-child { margin-bottom: 0; }

/* 「踏跡」中段插曲：與前後模組以余白拉開，讀作章節間奏（slot 為空時不留多餘空白） */
.em__interlude:not(:empty) { margin-bottom: 4.5rem; }

.em__mod-head {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: baseline;
  gap: 0.5rem 1rem;
  margin-bottom: 1.1rem;
}
.em__mod-index {
  font-family: 'Noto Serif JP', serif;
  font-size: 0.68rem;
  letter-spacing: 0.3em;
  color: var(--accent);
  white-space: nowrap;
}
.em__mod-name {
  font-size: clamp(1.25rem, 2.4vw, 1.7rem);
  font-weight: 400;
  letter-spacing: 0.08em;
  line-height: 1.1;
  color: var(--fg-2);
}
.em__mod-meta {
  grid-column: 3;
  grid-row: 1;
  display: inline-flex;
  align-items: baseline;
  gap: 0.5rem;
  font-family: var(--em-mono);
  font-variant-numeric: tabular-nums;
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  color: var(--fg-muted);
  white-space: nowrap;
}
.em__mod-sep { opacity: 0.5; }

/* 共用相框：hairline、不裁切（圖自然填滿 box，box 比例＝圖比例） */
.em__feat,
.em__shot {
  position: relative;
  display: block;
  overflow: hidden;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: var(--surface);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.em__img {
  width: 100%;
  height: 100%;
  /* contain：穩態 box 比例＝原圖比例 → 滿框零留白；@load 補正前的瞬間退為信箱框（letterbox）
     而非裁切，守「零裁切」承諾（critic M2）。底用 surface，短暫信箱框不突兀。 */
  object-fit: contain;
  display: block;
  transition: transform 0.5s cubic-bezier(0.2, 0.6, 0.2, 1), filter 0.5s ease;
  filter: saturate(0.94);
}
.group:hover .em__img { transform: scale(1.035); filter: saturate(1.02); }
.group:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

/* ── 特稿 hero：固定高度、寬度依原比例；右側留白做成「特稿＋引言」編輯側欄 ── */
.em__lead { display: flex; align-items: stretch; gap: clamp(1rem, 2.4vw, 2.4rem); }
.em__feat {
  height: clamp(340px, 56vh, 640px);
  width: auto;
  max-width: 72%;
  flex: 0 0 auto;
}
.em__lead-note {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.9rem;
  padding: 0.1rem 0 0.5rem clamp(1rem, 2vw, 2rem);
  border-left: 1px solid var(--border);
}
/* 上緣錨：章別 + frame no + hairline，撐住側欄上沿（無此塊則直幅 hero 右上 2/3 讀作破洞） */
.em__lead-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.6rem;
  padding-bottom: 0.55rem;
  border-bottom: 1px solid var(--border);
}
.em__lead-kicker {
  font-family: 'Noto Serif JP', serif;
  font-size: 0.6rem;
  letter-spacing: 0.3em;
  color: var(--accent);
  white-space: nowrap;
}
.em__lead-frame {
  font-family: var(--em-mono);
  font-variant-numeric: tabular-nums;
  font-size: 0.62rem;
  letter-spacing: 0.1em;
  color: var(--fg-muted);
}
.em__lead-foot { display: flex; flex-direction: column; gap: 0.9rem; }
.em__lead-quote {
  margin: 0;
  font-size: clamp(0.95rem, 1.25vw, 1.3rem);
  font-weight: 300;
  line-height: 2.05;
  letter-spacing: 0.06em;
  color: var(--fg-2);
}
.em__lead-exif {
  font-family: var(--em-mono);
  font-size: 0.66rem;
  letter-spacing: 0.1em;
  color: var(--fg-muted);
}

/* 特稿角落 frame no（mono，hairline tab） */
.em__feat-no {
  position: absolute;
  top: 0.6rem;
  left: 0.6rem;
  font-family: var(--em-mono);
  font-size: 0.6rem;
  letter-spacing: 0.12em;
  color: #eef2f5;
  background: rgba(20, 24, 27, 0.5);
  padding: 0.12rem 0.42rem;
  border-radius: 1px;
  backdrop-filter: blur(2px);
}

/* 特稿底部 caption（hover 浮現） */
.em__cap {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 1.5rem 0.9rem 0.7rem;
  background: linear-gradient(to top, rgba(12, 15, 18, 0.78), transparent);
  opacity: 0;
  transform: translateY(0.4rem);
  transition: opacity 0.35s ease, transform 0.35s ease;
}
.group:hover .em__cap,
.group:focus-visible .em__cap { opacity: 1; transform: translateY(0); }
.em__cap-title { font-size: 0.82rem; letter-spacing: 0.04em; color: #f3f5f7; }
.em__cap-exif {
  font-family: var(--em-mono);
  font-size: 0.6rem;
  letter-spacing: 0.08em;
  color: rgba(226, 232, 238, 0.8);
}

/* ── 支援照 justified strip：rows 由 JS 打包，整行填滿、末行靠左（寬高 inline） ── */
.em__strip {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-top: 0.8rem;
}
.em__strip-row {
  display: flex;
  gap: 12px; /* 與 STRIP_GAP 對齊，justified 計算才精準 */
}
.em__shot { flex: 0 0 auto; } /* width/height 由 inline style 決定 */
.em__shot-tab {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  display: inline-flex;
  align-items: baseline;
  gap: 0.4rem;
  padding: 0.2rem 0.46rem;
  font-family: var(--em-mono);
  font-variant-numeric: tabular-nums;
  background: rgba(238, 242, 245, 0.82);
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  border-bottom-right-radius: 2px;
  backdrop-filter: blur(2px);
}
.em__shot-no { font-size: 0.62rem; letter-spacing: 0.06em; color: #2b3640; }
.em__shot-date { font-size: 0.52rem; letter-spacing: 0.05em; color: #66788c; }

/* 進 event 連結 */
.em__enter {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.1rem;
  font-family: 'Noto Serif JP', serif;
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  color: var(--fg-muted);
  text-decoration: none;
  transition: color 0.25s ease, gap 0.25s ease;
}
.em__enter:hover { color: var(--accent); gap: 0.85rem; }
.em__enter-arrow { font-family: var(--em-mono); transition: transform 0.25s ease; }
.em__enter:hover .em__enter-arrow { transform: translateX(2px); }

/* dark：tab/no 底色翻深 */
:global(.dark) .em__shot-tab { background: rgba(20, 24, 27, 0.7); border-color: rgba(154, 173, 197, 0.25); }
:global(.dark) .em__shot-no { color: #e7ecf1; }
:global(.dark) .em__shot-date { color: rgba(190, 200, 212, 0.78); }
:global(.dark) .em__feat-no { background: rgba(0, 0, 0, 0.55); color: #e7ecf1; }

/* ── mobile/tablet ── */
@media (max-width: 1023px) {
  /* mobile 保留頁面既有 filmpanel-m 房間標牌 → 隱藏本元件扉頁 nameplate 避免雙標牌 */
  .em__masthead { display: none; }
  /* mobile：特稿全寬自然高（直幅在窄屏全寬剛好），側欄改置於下方 */
  .em__lead { flex-direction: column; gap: 0.85rem; }
  .em__feat { height: auto; width: 100%; max-width: 100%; }
  .em__lead-note {
    border-left: none;
    padding: 0;
    justify-content: flex-start;
    gap: 0.7rem;
  }
  /* mobile：side-note 在 featured 下方堆疊，space-between 會把上下撐太開 → 退回 flex-start */
  .em__lead-top { padding-bottom: 0.4rem; }
  .em__lead-foot { gap: 0.5rem; }
  .em__strip { gap: 0.6rem; }
  .em__module { margin-bottom: 3.2rem; }
}

/* reduced-motion：關閉縮放/位移，僅留淡入 */
@media (prefers-reduced-motion: reduce) {
  .em__img,
  .em__cap,
  .em__enter,
  .em__enter-arrow { transition: none; }
  .group:hover .em__img { transform: none; }
}
</style>
