<template>
  <!--
    攝影 overview = 章節索引（目次）。
    使用者回饋：舊版把「每個」event 都攤成特稿大圖 + 整條 strip，往下拉很長，失去
    「一組一組」的節奏。改為每個 event 一張精簡刊頭卡（代表照 + 其の N + 名稱 + 枚數/
    地點/日期 + 章首詩 + 全N枚を見る），整面讀作安靜的目次；點任一卡進該 event 沉浸頁
    （/gallery/photography/<event>，預設展開）。地圖移到頁面側欄 aside（見頁面 kage-overview）。

    比例：代表照 box 用離線預算的 image.aspectRatio（零裁切、零 CLS、SSG 可決定），
    不再 runtime <img @load> 量測。守鐵律：hairline 分隔、冷銀「光卓」語意 token、mono 編號。
  -->
  <section class="em" data-world="kage" aria-labelledby="em-heading">
    <!-- 扉頁刊頭 nameplate -->
    <header class="em__masthead">
      <p class="em__eyebrow">影 — Photography</p>
      <h2 id="em-heading" class="em__title font-jp">写真記録</h2>
      <span class="em__rule" aria-hidden="true"/>
      <span class="em__count">
        <span class="em__count-num">{{ String(totalCount).padStart(3, '0') }}</span>
        <span class="em__count-unit">枚 · frames</span>
      </span>
    </header>

    <!-- 章節索引：每個 event 一張卡 -->
    <ol class="em__index">
      <li v-for="(m, mi) in modules" :key="m.eventName" class="em__card">
        <NuxtLink
          :to="`/gallery/photography/${encodeURIComponent(m.eventName)}`"
          class="em__card-link group"
        >
          <div class="em__card-fig">
            <picture class="contents">
              <source :srcset="getGridAvifSrcset(m.featured.filename)" :sizes="cardSizes" type="image/avif">
              <source :srcset="getGridImageSrcset(m.featured.filename)" :sizes="cardSizes" type="image/webp">
              <img
                :src="getThumbPath(m.featured.filename, 800)"
                :srcset="getGridImageSrcset(m.featured.filename)"
                :sizes="cardSizes"
                :alt="m.featured.title"
                class="em__img"
                :loading="mi === 0 ? 'eager' : 'lazy'"
                :fetchpriority="mi === 0 ? 'high' : undefined"
                decoding="async"
              >
            </picture>
            <span class="em__card-no" aria-hidden="true">{{ frameNo(m.featured) }}</span>
          </div>

          <div class="em__card-body">
            <header class="em__card-head">
              <span class="em__card-index">其の {{ kansuji(mi + 1) }}</span>
              <h3 class="em__card-name font-jp">{{ m.eventName }}</h3>
            </header>
            <span class="em__card-meta">
              <span class="em__card-cnt">{{ m.count }} 枚</span>
              <template v-if="m.location"><span class="em__sep" aria-hidden="true">·</span>{{ m.location }}</template>
              <template v-if="m.dateLabel"><span class="em__sep" aria-hidden="true">·</span><span>{{ m.dateLabel }}</span></template>
            </span>
            <p v-if="m.line" class="em__card-line font-jp">「{{ m.line }}」</p>
            <span class="em__enter">
              全 {{ m.count }} 枚を見る<span class="em__enter-arrow" aria-hidden="true">→</span>
            </span>
          </div>
        </NuxtLink>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useImagePath } from '~/composables/useImagePath'
import type { GalleryItem, MixedPhotoItem, SeriesNarrative } from '~~/shared/types/gallery'

const props = defineProps<{ items: MixedPhotoItem[] }>()

const { getThumbPath, getGridImageSrcset, getGridAvifSrcset } = useImagePath()

const cardSizes = '(max-width: 1023px) 100vw, 30vw'

interface Card {
  eventName: string
  count: number
  location: string | null
  line: string | null
  dateLabel: string | null
  featured: GalleryItem
}

/** photography event 群組 → 章節索引卡（代表照 = 該卷第一張）。 */
const modules = computed<Card[]>(() =>
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
        featured: imgs[0]!
      }
    })
)

const totalCount = computed(() => modules.value.reduce((s, m) => s + m.count, 0))

const KANSUJI = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五']
function kansuji (n: number): string { return KANSUJI[n] || String(n) }

/** "2025-12-25" → "2025.12.25"；"2025-12" → "2025.12"；空值 → null。 */
function shortDate (d?: string | null): string | null {
  if (!d) return null
  const m = d.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/)
  if (!m) return null
  return m[3] ? `${m[1]}.${m[2]}.${m[3]}` : `${m[1]}.${m[2]}`
}

/** frame number：自檔名抽近似負片序號（DSC_7030 → 7030A），抽不到退回 01A。 */
function frameNo (img: GalleryItem): string {
  const m = img.filename?.match(/(\d{2,5})(?:[-_.]|\.\w+$)/)
  const n = m?.[1]
  return n ? `${n}A` : '01A'
}
</script>

<style scoped>
/* =========================================================
   攝影 overview 章節索引（目次）
   冷銀「光卓」語彙；hairline 分隔；mono 編號/日期；代表照依離線預算比例（不裁切）。
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
  margin-bottom: 0.4rem;
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

/* ── 章節索引 ── */
.em__index {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}
.em__card { border-bottom: 1px solid var(--border); }
.em__card:last-child { border-bottom: 0; }

.em__card-link {
  display: grid;
  grid-template-columns: minmax(0, 30%) 1fr;
  gap: clamp(1.2rem, 3vw, 2.6rem);
  align-items: start;
  padding: clamp(1.5rem, 3vw, 2.6rem) 0;
  text-decoration: none;
}

/* 代表照：索引用固定 3:2 縮圖（整面目次節奏一致、可快速掃描）；hairline 框 + 角落 frame no。
   注意：原比例瀑布流用在「進入事件後」的接觸印樣格，此處索引刻意統一比例。 */
.em__card-fig {
  position: relative;
  overflow: hidden;
  aspect-ratio: 3 / 2;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: var(--surface);
}
.em__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.6s cubic-bezier(0.2, 0.6, 0.2, 1), filter 0.6s ease;
  filter: saturate(0.94);
}
.group:hover .em__img { transform: scale(1.035); filter: saturate(1.02); }
.group:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.em__card-no {
  position: absolute;
  top: 0.55rem;
  left: 0.55rem;
  font-family: var(--em-mono);
  font-size: 0.58rem;
  letter-spacing: 0.12em;
  color: #eef2f5;
  background: rgba(20, 24, 27, 0.5);
  padding: 0.1rem 0.4rem;
  border-radius: 1px;
  backdrop-filter: blur(2px);
}

/* 卡片文字 */
.em__card-body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding-top: 0.2rem;
}
.em__card-head {
  display: flex;
  align-items: baseline;
  gap: 0.9rem;
  flex-wrap: wrap;
}
.em__card-index {
  font-family: 'Noto Serif JP', serif;
  font-size: 0.66rem;
  letter-spacing: 0.3em;
  color: var(--accent);
  white-space: nowrap;
}
.em__card-name {
  font-size: clamp(1.3rem, 2.4vw, 1.85rem);
  font-weight: 400;
  letter-spacing: 0.08em;
  line-height: 1.15;
  color: var(--fg-2);
  transition: color 0.25s ease;
}
.group:hover .em__card-name { color: color-mix(in srgb, var(--accent) 70%, var(--fg-2)); }
.em__card-meta {
  display: inline-flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.45rem;
  font-family: var(--em-mono);
  font-variant-numeric: tabular-nums;
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  color: var(--fg-muted);
}
.em__sep { opacity: 0.5; }
.em__card-line {
  margin: 0;
  font-size: clamp(0.92rem, 1.2vw, 1.12rem);
  font-weight: 300;
  line-height: 1.95;
  letter-spacing: 0.05em;
  color: var(--fg-2);
}

/* 進 event 連結文案（卡片本身即連結，此處作視覺 CTA） */
.em__enter {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.2rem;
  font-family: 'Noto Serif JP', serif;
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  color: var(--fg-muted);
  transition: color 0.25s ease, gap 0.25s ease;
}
.group:hover .em__enter { color: var(--accent); gap: 0.85rem; }
.em__enter-arrow { font-family: var(--em-mono); transition: transform 0.25s ease; }
.group:hover .em__enter-arrow { transform: translateX(2px); }

/* ── mobile/tablet ── */
@media (max-width: 1023px) {
  /* mobile/tablet 保留頁面既有 filmpanel-m 房間標牌 → 隱藏本元件扉頁 nameplate 避免雙標牌 */
  .em__masthead { display: none; }
}
/* 真手機才上下堆疊；平板維持左右卡（縮圖固定 3:2 不會脹大、目次仍緊湊） */
@media (max-width: 639px) {
  .em__card-link {
    grid-template-columns: 1fr;
    gap: 0.9rem;
    padding: 1.8rem 0;
  }
}

/* reduced-motion：關閉縮放/位移 */
@media (prefers-reduced-motion: reduce) {
  .em__img,
  .em__card-name,
  .em__enter,
  .em__enter-arrow { transition: none; }
  .group:hover .em__img { transform: none; }
}
</style>
