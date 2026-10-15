<template>
  <section class="museum" aria-labelledby="museum-heading">
    <h2 id="museum-heading" class="sr-only">繪畫作品展間</h2>
    <div v-if="featured" class="museum__stage">
      <div class="museum__stage-wall">
        <span class="museum__collection-count jp-kansuji">館藏 {{ totalCount }} 件</span>
        <figure class="museum__feature">
          <button
            type="button"
            class="museum__art-button museum__art-button--feature"
            :style="{ '--art-ratio': aspectOf(featured) }"
            :aria-label="`觀看作品：${featured.title || '無題'}`"
            @click="$emit('imageClick', featured)"
          >
            <span class="museum__frame museum__frame--feature">
              <span class="museum__mat">
                <picture class="contents">
                  <source :srcset="getGridAvifSrcset(featured.filename)" :sizes="featureSizes" type="image/avif">
                  <source :srcset="getGridImageSrcset(featured.filename)" :sizes="featureSizes" type="image/webp">
                  <img
                    :src="getThumbPath(featured.filename, 800)"
                    :srcset="getGridImageSrcset(featured.filename)"
                    :sizes="featureSizes"
                    :alt="featured.title || '無題'"
                    class="museum__art"
                    :style="{ aspectRatio: aspectOf(featured) }"
                    loading="eager"
                    fetchpriority="high"
                    decoding="async"
                  >
                </picture>
              </span>
            </span>
          </button>
          <figcaption class="museum__feature-plaque">
            <span class="museum__plaque-line" aria-hidden="true" />
            <span class="museum__plaque-title font-jp">{{ featured.title || '無題' }}</span>
            <span class="museum__plaque-date">{{ featured.time }}</span>
            <span class="museum__plaque-medium">Digital painting</span>
          </figcaption>
        </figure>
      </div>
      <div class="museum__floor" aria-hidden="true" />
    </div>

    <div class="museum__rooms">
      <article v-for="group in remainingGroups" :key="group.eventName" class="museum__room">
        <header class="museum__room-head">
          <h3 class="museum__room-year font-jp">{{ group.year }}</h3>
          <span class="museum__room-count jp-kansuji">{{ group.images.length }} 件</span>
          <p v-if="group.strongestLine" class="museum__room-line font-jp">{{ group.strongestLine }}</p>
        </header>
        <div class="museum__wall">
          <figure v-for="(item, index) in group.images" :key="item.id" class="museum__work">
            <button
              type="button"
              class="museum__art-button"
              :style="{ '--art-ratio': aspectOf(item) }"
              :aria-label="`觀看作品：${item.title || '無題'}`"
              @click="$emit('imageClick', item)"
            >
              <span class="museum__frame">
                <span class="museum__mat">
                  <picture class="contents">
                    <source :srcset="getGridAvifSrcset(item.filename)" :sizes="frameSizes" type="image/avif">
                    <source :srcset="getGridImageSrcset(item.filename)" :sizes="frameSizes" type="image/webp">
                    <img
                      :src="getThumbPath(item.filename, 800)"
                      :srcset="getGridImageSrcset(item.filename)"
                      :sizes="frameSizes"
                      :alt="item.title || '無題'"
                      class="museum__art"
                      :style="{ aspectRatio: aspectOf(item) }"
                      :loading="group.originalIndex === 0 && index < 2 ? 'eager' : 'lazy'"
                      decoding="async"
                    >
                  </picture>
                </span>
              </span>
            </button>
            <figcaption class="museum__work-plaque">
              <span class="museum__work-title font-jp">{{ item.title || '無題' }}</span>
              <span class="museum__work-date">{{ item.time }}</span>
            </figcaption>
          </figure>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useImagePath } from '~/composables/useImagePath'
import { DEFAULT_ASPECT_RATIO } from '~/utils/justifiedGalleryLayout'
import type { GalleryItem } from '~~/shared/types/gallery'

interface YearGroup {
  eventName: string
  year: string
  images: GalleryItem[]
  strongestLine: string | null
}

const props = defineProps<{ groups: YearGroup[] }>()
defineEmits<{ imageClick: [item: GalleryItem] }>()

const { getThumbPath, getGridImageSrcset, getGridAvifSrcset } = useImagePath()
const featureSizes = '(max-width: 767px) 88vw, (max-width: 1200px) 65vw, 850px'
const frameSizes = '(max-width: 767px) 86vw, (max-width: 1200px) 42vw, 550px'

const allImages = computed(() => props.groups.flatMap(group => group.images))
const totalCount = computed(() => allImages.value.length)
const featured = computed(() => {
  const images = allImages.value
  const hero = images.find(item => item.series?.includes('hero'))
  if (hero) return hero
  return images.reduce<GalleryItem | null>((latest, item) => {
    if (!latest) return item
    const itemTime = Date.parse(item.date || item.time) || Date.parse(item.time) || 0
    const latestTime = Date.parse(latest.date || latest.time) || Date.parse(latest.time) || 0
    return itemTime > latestTime ? item : latest
  }, null)
})
const remainingGroups = computed(() => props.groups
  .map((group, originalIndex) => ({
    ...group,
    originalIndex,
    images: group.images.filter(item => item.id !== featured.value?.id)
  }))
  .filter(group => group.images.length > 0))

function aspectOf (item: GalleryItem): string {
  return String(item.aspectRatio && item.aspectRatio > 0 ? item.aspectRatio : DEFAULT_ASPECT_RATIO)
}
</script>

<style scoped>
.museum {
  --museum-wall: #eee9dc;
  --museum-wall-light: #f9f6ed;
  --museum-wood: #594435;
  --museum-mat: #f7f3e9;
  --museum-ink: #403a32;
  --museum-muted: #685f53;
  color: var(--museum-ink);
  padding-bottom: clamp(3.5rem, 7vw, 6rem);
}
.dark .museum {
  --museum-wall: #302d2a;
  --museum-wall-light: #403b35;
  --museum-wood: #8d6f55;
  --museum-mat: #d8d0c1;
  --museum-ink: #eee8df;
  --museum-muted: #cbc1b2;
}
.museum__stage {
  position: relative;
  overflow: hidden;
  background: var(--museum-wall);
  margin-inline: calc(-1 * clamp(0rem, 2vw, 2rem));
}
.museum__stage-wall {
  position: relative;
  isolation: isolate;
  padding: clamp(3rem, 5vw, 4rem) clamp(1rem, 5vw, 5rem) clamp(2rem, 4vw, 3rem);
  background: radial-gradient(ellipse 63% 85% at 43% 25%, var(--museum-wall-light), var(--museum-wall) 95%);
}
.museum__collection-count {
  position: absolute;
  top: clamp(1rem, 2vw, 1.6rem);
  right: clamp(1.2rem, 5vw, 5rem);
  color: var(--museum-muted);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
}
.museum__stage-wall::before,
.museum__stage-wall::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  pointer-events: none;
  background: rgba(59, 49, 39, 0.12);
}
.museum__stage-wall::before { left: clamp(0.8rem, 3vw, 3rem); }
.museum__stage-wall::after { right: clamp(0.8rem, 3vw, 3rem); }
.dark .museum__stage-wall::before,
.dark .museum__stage-wall::after { background: rgba(255, 243, 220, 0.12); }
.museum__floor {
  height: clamp(1.1rem, 2.6vw, 2rem);
  border-top: 1px solid rgba(76, 58, 40, 0.24);
  background: linear-gradient(175deg, rgba(101, 75, 52, 0.15), transparent 80%);
}
.dark .museum__floor {
  border-top-color: rgba(238, 222, 197, 0.18);
  background: linear-gradient(175deg, rgba(0, 0, 0, 0.2), transparent 80%);
}
.museum__feature {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(2rem, 5vw, 5rem);
  margin: 0 auto;
  max-width: 75rem;
}
.museum__art-button {
  display: block;
  width: min(100%, calc(29rem * var(--art-ratio)));
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  flex: 0 1 auto;
}
.museum__art-button--feature {
  width: min(100%, calc(clamp(20rem, 44svh, 32rem) * var(--art-ratio)));
}
.museum__art-button:focus-visible { outline: none; }
.museum__frame {
  display: block;
  padding: clamp(0.28rem, 0.55vw, 0.5rem);
  background: var(--museum-wood);
  box-shadow: 2px 3px 5px rgba(31, 24, 18, 0.18), 8px 18px 32px -10px rgba(31, 24, 18, 0.32);
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.museum__art-button:hover .museum__frame,
.museum__art-button:focus-visible .museum__frame {
  transform: translateY(-3px);
  box-shadow: 2px 4px 6px rgba(31, 24, 18, 0.2), 10px 23px 38px -10px rgba(31, 24, 18, 0.38);
}
.museum__art-button:focus-visible .museum__frame {
  outline: 2px solid var(--museum-ink);
  outline-offset: 5px;
}
.museum__mat {
  display: block;
  padding: clamp(0.55rem, 1.4vw, 1.1rem);
  background: var(--museum-mat);
}
.museum__frame--feature .museum__mat { padding: clamp(0.8rem, 2vw, 1.6rem); }
.museum__art {
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
}
.museum__feature-plaque {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: min(12rem, 22%);
  min-width: 8rem;
  color: var(--museum-ink);
}
.museum__plaque-line {
  display: block;
  width: 1.7rem;
  height: 1px;
  background: currentColor;
  margin-bottom: 1.1rem;
  opacity: 0.55;
}
.museum__plaque-title {
  font-size: clamp(1.1rem, 1.7vw, 1.45rem);
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.museum__plaque-date,
.museum__plaque-medium {
  margin-top: 0.65rem;
  color: var(--museum-muted);
  font-size: 0.78rem;
  line-height: 1.5;
}
.museum__plaque-medium { margin-top: 0.15rem; }
.museum__rooms {
  display: flex;
  flex-direction: column;
  gap: clamp(3.5rem, 6vw, 5.5rem);
  padding-top: clamp(3.5rem, 6vw, 5.5rem);
}
.museum__room-head {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.7rem 1.2rem;
  padding-bottom: 1rem;
  margin-bottom: clamp(2rem, 3vw, 3rem);
  border-bottom: 1px solid rgba(89, 68, 53, 0.2);
}
.dark .museum__room-head { border-bottom-color: rgba(221, 205, 183, 0.25); }
.museum__room-year {
  margin: 0;
  font-size: clamp(1.8rem, 3vw, 2.5rem);
  font-weight: 400;
  line-height: 1.1;
}
.museum__room-count,
.museum__room-line {
  color: var(--museum-muted);
  font-size: 0.82rem;
}
.museum__room-line {
  flex-basis: 100%;
  margin: 0;
  line-height: 1.7;
}
.museum__wall {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: clamp(3rem, 6vw, 5rem) clamp(2rem, 5vw, 5rem);
}
.museum__work {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  margin: 0;
}
.museum__work-plaque {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: min(100%, 29rem);
  gap: 0.2rem;
  padding-top: 1rem;
}
.museum__work-title {
  color: var(--museum-ink);
  font-size: 0.92rem;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.museum__work-date {
  color: var(--museum-muted);
  font-size: 0.72rem;
  line-height: 1.5;
}
@media (max-width: 767px) {
  .museum__feature { flex-direction: column; gap: 1.5rem; }
  .museum__feature-plaque { align-self: flex-start; width: auto; min-width: 0; margin-left: clamp(0rem, 5vw, 2rem); }
  .museum__plaque-line { margin-bottom: 0.5rem; }
  .museum__wall { grid-template-columns: minmax(0, 1fr); }
}
@media (prefers-reduced-motion: reduce) {
  .museum__frame { transition: none; }
  .museum__art-button:hover .museum__frame,
  .museum__art-button:focus-visible .museum__frame { transform: none; }
}
</style>
