<template>
  <section class="em" aria-labelledby="gallery-archive-title" data-testid="gallery-activity-index">
    <ol class="em__index">
      <li v-for="(m, mi) in modules" :key="m.eventName" class="em__card">
        <NuxtLink
          :to="`/gallery/photography/${encodeURIComponent(m.eventName)}`"
          class="em__card-link group"
        >
          <div class="em__card-fig">
            <picture class="contents">
              <source :srcset="getGridAvifSrcset(m.featured.filename)" :sizes="mi === 0 ? featureSizes : cardSizes" type="image/avif">
              <source :srcset="getGridImageSrcset(m.featured.filename)" :sizes="mi === 0 ? featureSizes : cardSizes" type="image/webp">
              <img
                :src="getThumbPath(m.featured.filename, 800)"
                :srcset="getGridImageSrcset(m.featured.filename)"
                :sizes="mi === 0 ? featureSizes : cardSizes"
                :alt="getGalleryDisplayTitle(m.featured, galleryStore.photographyWorks)"
                class="em__img"
                :style="focalStyle(m.featured)"
                :loading="mi === 0 ? 'eager' : 'lazy'"
                :fetchpriority="mi === 0 ? 'high' : undefined"
                decoding="async"
              >
            </picture>
          </div>

          <div class="em__card-body">
            <header class="em__card-head">
              <h3 class="em__card-name font-jp">{{ m.eventName }}</h3>
            </header>
            <span class="em__card-meta">
              <span class="em__card-cnt">{{ m.count }} 張</span>
              <template v-if="m.location"><span class="em__sep" aria-hidden="true">·</span>{{ m.location }}</template>
              <template v-if="m.dateLabel"><span class="em__sep" aria-hidden="true">·</span><span>{{ m.dateLabel }}</span></template>
            </span>
            <p v-if="m.line" class="em__card-line font-jp">「{{ m.line }}」</p>
            <span class="em__enter">
              看組照 <Icon name="lucide:arrow-right" aria-hidden="true" />
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
import { useGalleryStore } from '~/stores/gallery'
import { getGalleryDisplayTitle } from '~/utils/galleryDisplayTitle'
import type { GalleryItem, MixedPhotoItem, SeriesNarrative } from '~~/shared/types/gallery'

const props = defineProps<{ items: MixedPhotoItem[] }>()
const galleryStore = useGalleryStore()

const { getThumbPath, getGridImageSrcset, getGridAvifSrcset } = useImagePath()

const cardSizes = '(max-width: 479px) 30vw, (max-width: 767px) 38vw, 19vw'
const featureSizes = '(max-width: 767px) 90vw, 50vw'

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

/** "2025-12-25" → "2025.12.25"；"2025-12" → "2025.12"；空值 → null。 */
function shortDate (d?: string | null): string | null {
  if (!d) return null
  const m = d.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/)
  if (!m) return null
  return m[3] ? `${m[1]}.${m[2]}.${m[3]}` : `${m[1]}.${m[2]}`
}

/**
 * 固定 3:2 索引縮圖的 object-position：吃離線 focal 預算（內容感知主體焦點），
 * 讓直幅人像在統一比例框內主體入鏡；無 focal 時退回舊行為 50% 30%。
 */
function focalStyle (img: GalleryItem): Record<string, string> {
  return (typeof img.focalX === 'number' && typeof img.focalY === 'number')
    ? { objectPosition: `${(img.focalX * 100).toFixed(1)}% ${(img.focalY * 100).toFixed(1)}%` }
    : { objectPosition: '50% 30%' }
}
</script>

<style scoped>
.em__index {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 clamp(2rem, 5vw, 5rem);
  margin: 0;
  padding: 0;
  list-style: none;
}
.em__card {
  min-width: 0;
  border-bottom: 1px solid var(--museum-line);
}
.em__card:first-child { grid-column: 1 / -1; }
.em__card-link {
  display: grid;
  grid-template-columns: minmax(0, 38%) minmax(0, 1fr);
  align-items: start;
  gap: clamp(1rem, 2vw, 2rem);
  padding-block: clamp(1.15rem, 2.5vw, 2rem);
}
.em__card:first-child .em__card-link {
  grid-template-columns: minmax(0, 56%) minmax(0, 1fr);
  gap: clamp(1.25rem, 4vw, 4rem);
  align-items: end;
  padding-bottom: clamp(2rem, 5vw, 4.25rem);
}
.em__card-fig {
  aspect-ratio: 3 / 2;
  padding: clamp(0.22rem, 0.7vw, 0.65rem);
  background: var(--museum-light);
  box-shadow: 4px 12px 20px -14px rgb(25 32 34 / 55%);
}
.em__card:first-child .em__card-fig { aspect-ratio: 16 / 10; }
.em__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.em__card:first-child .em__img {
  object-fit: contain;
  background: var(--museum-cool);
}
.em__card-body { min-width: 0; color: var(--museum-ink); }
.em__card-head { margin-bottom: 0.4rem; }
.em__card-name {
  font-size: clamp(1.12rem, 2vw, 1.5rem);
  font-weight: 400;
  line-height: 1.48;
  overflow-wrap: anywhere;
}
.em__card:first-child .em__card-name { font-size: clamp(1.65rem, 3.6vw, 3rem); }
.em__card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0 0.45rem;
  color: var(--museum-muted);
  font-size: 0.77rem;
  font-variant-numeric: tabular-nums;
  line-height: 1.65;
}
.em__card-line {
  margin: 0.65rem 0 0;
  max-width: 29em;
  color: var(--museum-muted);
  font-size: 0.9rem;
  line-height: 1.85;
  overflow-wrap: anywhere;
}
.em__enter {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  margin-top: 0.75rem;
  color: var(--museum-ink);
  font-size: 0.82rem;
  text-decoration: underline;
  text-decoration-color: var(--museum-line);
  text-underline-offset: 0.3em;
}
.em__card-link:hover .em__enter { text-decoration-color: currentColor; }
.em__card-link:focus-visible { outline: 2px solid var(--museum-ink); outline-offset: 4px; }

@media (max-width: 767px) {
  .em__index { grid-template-columns: 1fr; }
  .em__card:first-child .em__card-link { grid-template-columns: 1fr; }
}
@media (max-width: 479px) {
  .em__card-link { grid-template-columns: minmax(0, 32%) minmax(0, 1fr); }
  .em__card:not(:first-child) .em__card-line { font-size: 0.82rem; }
}
</style>
