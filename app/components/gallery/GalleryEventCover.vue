<template>
  <!--
    Event Cover — 進入 /gallery/photography/<event> 時的扉頁
    啟發自 sites/ryan-mcginley.md（單張全幅 + 簡素 metadata）與
    sites/rinko-kawauchi.md（書頁式克制版面）。
    沉浸型訪客優先：跳過 overview 的 Map/Statement/Strip 三章節，
    直接給該 event 一張代表照 + 三行 editorial metadata + 一個展開鈕。
    路線 A：D1 自動取 group.images[0] 為 cover；無 admin 控制；無 URL state（純 UI）。
  -->
  <section
    v-if="coverImage"
    class="event-cover"
    aria-labelledby="event-cover-heading"
  >
    <!-- 全幅扉頁：80vh / md:88vh，min 420px 兜底 -->
    <div class="event-cover-image relative w-full h-[80vh] md:h-[88vh] min-h-[420px] overflow-hidden bg-stone-100 dark:bg-stone-900">
      <picture>
        <source type="image/avif" :srcset="getAvifThumbPath(coverImage.filename, 1600)">
        <source type="image/webp" :srcset="getThumbPath(coverImage.filename, 1600)">
        <img
          :src="getImagePath(coverImage.filename)"
          :alt="`${eventName} 扉頁 — ${coverImage.title || ''}`"
          class="w-full h-full object-cover"
          :style="coverFocalStyle"
          loading="eager"
          fetchpriority="high"
          decoding="async"
          draggable="false"
        >
      </picture>
      <!-- 圖底淡墨漸層收束：與下方白底 metadata 區自然融合 -->
      <div
        aria-hidden="true"
        class="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-stone-50 dark:from-stone-950 to-transparent pointer-events-none"
      />
    </div>

    <!-- Cover meta + expand CTA：editorial 風格、置中、無 box -->
    <div class="event-cover-meta max-w-3xl mx-auto px-6 py-12 md:py-16 text-center">
      <p class="jp-section-label">扉頁 · Cover</p>
      <h2
        id="event-cover-heading"
        class="font-jp text-3xl md:text-4xl font-extralight tracking-[0.2em] text-stone-800 dark:text-stone-100 mt-4"
      >
        {{ eventName }}
      </h2>
      <span aria-hidden="true" class="jp-hairline mx-auto my-6 block w-24"/>

      <p class="event-cover-meta-line text-[0.7rem] tracking-[0.4em] text-stone-500 dark:text-stone-400 uppercase flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <span v-if="eventInfo?.location">{{ eventInfo.location }}</span>
        <span v-if="eventInfo?.location && timeRange" aria-hidden="true" class="text-stone-300 dark:text-stone-700">·</span>
        <span v-if="timeRange">{{ timeRange }}</span>
        <span v-if="(eventInfo?.location || timeRange) && images.length" aria-hidden="true" class="text-stone-300 dark:text-stone-700">·</span>
        <span class="jp-kansuji">{{ images.length }} 葉</span>
      </p>

      <!--
        ▌卷頭語 Prologue（R24 引入 / R25 改讀 prologue 欄位）
        list 頁 editorial 入口；與 InfoPanel annotation 文案分化。
      -->
      <section v-if="prologue" class="event-cover-prologue" aria-labelledby="event-cover-prologue-heading">
        <p id="event-cover-prologue-heading" class="prologue-eyebrow">卷頭語 · PROLOGUE</p>
        <div class="prologue-narrative">
          <span class="prologue-dropcap" aria-hidden="true">「</span>
          <p class="jp-body prologue-body">{{ prologue.text }}</p>
        </div>
        <div v-if="prologue.mood || (prologue.palette && prologue.palette.length)" class="prologue-meta">
          <p v-if="prologue.mood" class="prologue-mood">
            <span class="prologue-mood__label">気配</span>
            <span class="prologue-mood__value">{{ prologue.mood }}</span>
          </p>
          <div v-if="prologue.palette && prologue.palette.length" class="prologue-palette" :aria-label="`Series palette ${prologue.palette.join(', ')}`">
            <span
              v-for="(c, i) in prologue.palette.slice(0, 5)"
              :key="`${c}-${i}`"
              class="prologue-swatch"
              :style="{ background: c }"
            />
          </div>
        </div>

        <!--
          R44/45：3 軸 metadata 展開 — 工具 / 技法 / 題材
          R45 chip 改 .jp-chip token + filter interactive (button)
          點 chip toggle 過濾，emit filter-change 給父層
        -->
        <dl v-if="axisRows.length" class="event-cover-axes">
          <div v-for="row in axisRows" :key="row.label" class="jp-axis-row">
            <dt>{{ row.label }}</dt>
            <dd>
              <button
                v-for="v in row.values"
                :key="v"
                type="button"
                class="jp-chip jp-chip--kage jp-chip--filter"
                :aria-pressed="activeFilter === v"
                @click="onFilterToggle(v)"
              >{{ v }}</button>
            </dd>
          </div>
        </dl>
      </section>

      <button
        type="button"
        class="cover-expand mt-10 inline-flex items-center gap-3 text-stone-600 dark:text-stone-300 hover:text-accent-600 dark:hover:text-accent-400 transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/60 focus-visible:ring-offset-4 focus-visible:ring-offset-stone-50 dark:focus-visible:ring-offset-stone-950 rounded-sm"
        @click="$emit('expand')"
      >
        <span class="text-xs tracking-[0.4em] uppercase">展開全部</span>
        <span aria-hidden="true" class="block w-12 h-px bg-stone-400/60 dark:bg-stone-500/60 group-hover:bg-accent-500 dark:group-hover:bg-accent-400 transition-colors"/>
        <span aria-hidden="true" class="cover-arrow block text-stone-400 dark:text-stone-500 motion-reduce:animate-none">↓</span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { MixedPhotoItem, SeriesNarrative } from '~~/shared/types/gallery'

const props = defineProps<{
  group: MixedPhotoItem
}>()

const emit = defineEmits<{
  expand: []
  /** R45：點 chip 觸發單 filter（null = 清除）— 父層自行決定是否過濾 grid */
  'filter-change': [filter: string | null]
}>()

/** R45：當前激活的單一 chip filter（同層 chip click toggle off/on） */
const activeFilter = ref<string | null>(null)
function onFilterToggle (value: string) {
  activeFilter.value = activeFilter.value === value ? null : value
  emit('filter-change', activeFilter.value)
}

const { getImagePath, getThumbPath, getAvifThumbPath } = useImagePath()

const eventName = computed(() => props.group.eventName ?? '')
const eventInfo = computed(() => props.group.eventInfo ?? null)
const images = computed(() => props.group.images ?? [])
const timeRange = computed(() => props.group.timeRange ?? '')

const coverImage = computed(() => images.value[0] ?? null)

/**
 * 88vh 扉頁 hero 的 object-position：吃離線 focal 預算讓主體入鏡（直幅人像不切頭/不切錯）；
 * 無 focal 時退回 50% 30%。與 GalleryEditorialModules.focalStyle 同一份焦點資料。
 */
const coverFocalStyle = computed<Record<string, string>>(() => {
  const i = coverImage.value
  return (i && typeof i.focalX === 'number' && typeof i.focalY === 'number')
    ? { objectPosition: `${(i.focalX * 100).toFixed(1)}% ${(i.focalY * 100).toFixed(1)}%` }
    : { objectPosition: '50% 30%' }
})

/**
 * 卷頭語 prologue — R25 起優先讀 prologue，fallback 到 legacy narrative。
 * 與 InfoPanel annotation 文案分化，避免「印兩次」。
 * 同 event 內所有 image 共享，從 coverImage 拿即可。
 */
const prologue = computed<{ text: string; mood?: string; palette?: string[] } | null>(() => {
  const sn = (coverImage.value as { seriesNarrative?: SeriesNarrative } | null)?.seriesNarrative
  if (!sn) return null
  const text = sn.prologue || sn.narrative
  return text && text.trim() ? { text, mood: sn.mood, palette: sn.palette } : null
})

/** R44：3 軸 metadata — 從 coverImage.seriesNarrative 取 tools/techniques/topics 三 row */
const axisRows = computed<{ label: string; values: string[] }[]>(() => {
  const sn = (coverImage.value as { seriesNarrative?: SeriesNarrative } | null)?.seriesNarrative
  if (!sn) return []
  const rows: { label: string; values: string[] }[] = []
  if (sn.techniques?.length) rows.push({ label: '技法', values: sn.techniques })
  if (sn.topics?.length) rows.push({ label: '題材', values: sn.topics })
  if (sn.tools?.length) rows.push({ label: '工具', values: sn.tools })
  return rows
})
</script>

<style scoped>
.cover-arrow {
  animation: cover-bounce 2.4s ease-in-out infinite;
}

@keyframes cover-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(4px); }
}

@media (prefers-reduced-motion: reduce) {
  .cover-arrow { animation: none; }
}

/* ===== 卷頭語 Prologue（R24 引入 / R25 polish） ===== */
.event-cover-prologue {
  max-width: 38rem;
  margin: 2.8rem auto 0;
  padding: 2rem 0 0;
  text-align: left;
  position: relative;
}
/* 強化 hairline — 用 gradient 漸隱 + 加長，與單一 border-top 區隔；置中朱印小點 */
.event-cover-prologue::before {
  content: '';
  position: absolute;
  top: 0;
  left: 15%;
  right: 15%;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent 0%,
    rgb(168 162 158 / 0.5) 50%,
    transparent 100%
  );
}
.event-cover-prologue::after {
  content: '';
  position: absolute;
  top: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  border-radius: 9999px;
  background: rgb(217 123 46 / 0.85);
}
.prologue-eyebrow {
  font-size: 0.62rem;
  letter-spacing: 0.36em;
  color: rgb(217 123 46 / 0.85); /* accent-500 */
  text-transform: uppercase;
  font-weight: 300;
  margin: 0 0 1.1rem;
  text-align: center;
}
.prologue-narrative {
  position: relative;
  padding-left: 2rem;
}
.prologue-dropcap {
  position: absolute;
  left: -0.6rem;
  top: -0.95rem;
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  font-size: 3rem;
  line-height: 1;
  color: rgb(217 123 46 / 0.55);
  pointer-events: none;
}
.prologue-body {
  font-size: 1.02rem !important;
  line-height: 2 !important;
  color: rgb(68 64 60) !important;
  margin: 0;
  /* 取消 text-indent — dropcap 已承擔首行視覺啟筆，避免雙重縮排 */
}
:global(.dark) .prologue-body {
  color: rgb(214 211 209 / 0.92) !important;
}
.prologue-meta {
  margin-top: 1.2rem;
  padding-left: 1.4rem;
  display: flex;
  align-items: center;
  gap: 1.4rem;
  flex-wrap: wrap;
}
.prologue-mood {
  margin: 0;
  display: inline-flex;
  align-items: baseline;
  gap: 0.55rem;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
}
.prologue-mood__label {
  font-family: 'Noto Serif JP', serif;
  color: rgb(217 123 46 / 0.82);
  letter-spacing: 0.18em;
}
.prologue-mood__value {
  font-style: italic;
  color: rgb(120 113 108);
  font-family: 'Inter', sans-serif;
  letter-spacing: 0.05em;
}
:global(.dark) .prologue-mood__value {
  color: rgb(168 162 158);
}
.prologue-palette {
  display: flex;
  gap: 6px;
}
.prologue-swatch {
  width: 18px;
  height: 18px;
  border: 1px solid rgb(168 162 158 / 0.32);
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.12);
}

/* R44：3 軸 metadata 展開（工具 / 技法 / 題材） */
.event-cover-axes {
  margin: 1.8rem auto 0;
  max-width: 36rem;
  padding: 1.2rem 0 0;
  border-top: 1px solid rgb(168 162 158 / 0.18);
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}
.event-cover-axes__row {
  display: flex;
  align-items: baseline;
  gap: 0.85rem;
  flex-wrap: wrap;
  text-align: left;
}
.event-cover-axes__row dt {
  flex-shrink: 0;
  width: 3.2rem;
  font-family: 'Noto Serif JP', serif;
  font-size: 0.74rem;
  letter-spacing: 0.24em;
  color: rgb(217 123 46 / 0.85);
}
:global(.dark) .event-cover-axes__row dt {
  color: rgb(231 184 125 / 0.85);
}
.event-cover-axes__row dd {
  margin: 0;
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.event-cover-axes__chip {
  display: inline-block;
  padding: 0.16rem 0.6rem;
  font-size: 0.72rem;
  letter-spacing: 0.05em;
  color: rgb(120 113 108);
  background: rgb(245 244 240 / 0.55);
  border: 1px solid rgb(168 162 158 / 0.3);
  border-radius: 9999px;
  font-weight: 300;
}
:global(.dark) .event-cover-axes__chip {
  color: rgb(214 211 209);
  background: rgb(41 37 36 / 0.5);
  border-color: rgb(120 113 108 / 0.4);
}

@media (min-width: 640px) {
  .event-cover-prologue {
    padding-top: 2rem;
    margin-top: 2.8rem;
  }
  .prologue-body { font-size: 1rem !important; }
}
@media (prefers-reduced-motion: reduce) {
  .prologue-dropcap { transition: none; }
}
</style>
