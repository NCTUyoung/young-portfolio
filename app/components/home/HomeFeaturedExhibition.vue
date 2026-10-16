<template>
  <section v-if="artwork || photograph" id="featured" class="home-exhibition" aria-labelledby="home-exhibition-title">
    <div class="home-exhibition__heading">
      <h2 id="home-exhibition-title" class="font-jp">作品選集</h2>
    </div>

    <div class="home-exhibition__works" :class="{ 'home-exhibition__works--single': !artwork || !photograph }">
      <div v-if="artwork" class="home-exhibition__work home-exhibition__work--art">
        <NuxtLink
          class="home-exhibition__work-link"
          :to="{ path: '/gallery/digital', query: { image: artwork.id } }"
          data-testid="home-exhibit-digital"
        >
          <figure>
            <span class="home-exhibition__art-wall">
              <span class="home-exhibition__art-frame">
                <span class="home-exhibition__art-mat">
                  <picture>
                    <source :srcset="avifSrcset(artwork.filename)" :sizes="imageSizes" type="image/avif">
                    <source :srcset="webpSrcset(artwork.filename)" :sizes="imageSizes" type="image/webp">
                    <img
                      :src="getThumbPath(artwork.filename, 800)"
                      :alt="artwork.title || '數位繪畫作品'"
                      :style="imageRatio(artwork)"
                      loading="lazy"
                      decoding="async"
                    >
                  </picture>
                </span>
              </span>
            </span>
            <figcaption class="home-exhibition__caption">
              <span class="home-exhibition__medium">數位繪畫</span>
              <span class="home-exhibition__title home-exhibition__title--art">{{ artwork.title || '無題' }}</span>
              <span v-if="artwork.time || artwork.date" class="home-exhibition__detail">{{ artwork.time || artwork.date }}</span>
              <span class="home-exhibition__open">觀看作品 <Icon name="lucide:arrow-up-right" aria-hidden="true" /></span>
            </figcaption>
          </figure>
        </NuxtLink>
        <NuxtLink class="home-exhibition__browse" to="/gallery/digital">瀏覽全部繪作 <span aria-hidden="true">→</span></NuxtLink>
      </div>

      <div v-if="photograph" class="home-exhibition__work home-exhibition__work--photo">
        <NuxtLink
          class="home-exhibition__work-link"
          :to="{ path: '/gallery/photography', query: { image: photograph.id } }"
          data-testid="home-exhibit-photography"
        >
          <figure>
            <span class="home-exhibition__photo-surface">
              <span class="home-exhibition__photo-paper">
                <picture>
                  <source :srcset="avifSrcset(photograph.filename)" :sizes="imageSizes" type="image/avif">
                  <source :srcset="webpSrcset(photograph.filename)" :sizes="imageSizes" type="image/webp">
                  <img
                    :src="getThumbPath(photograph.filename, 800)"
                    :alt="photograph.title || '攝影作品'"
                    :style="imageRatio(photograph)"
                    loading="lazy"
                    decoding="async"
                  >
                </picture>
              </span>
            </span>
            <figcaption class="home-exhibition__caption">
              <span class="home-exhibition__medium">攝影</span>
              <span class="home-exhibition__title home-exhibition__title--photo">{{ photograph.title || '無題' }}</span>
              <span v-if="photograph.time || photograph.date" class="home-exhibition__detail">{{ photograph.time || photograph.date }}</span>
              <span v-if="photograph.event?.name || photograph.event?.location" class="home-exhibition__detail">
                {{ [photograph.event?.name, photograph.event?.location].filter(Boolean).join(' · ') }}
              </span>
              <span class="home-exhibition__open">觀看作品 <Icon name="lucide:arrow-up-right" aria-hidden="true" /></span>
            </figcaption>
          </figure>
        </NuxtLink>
        <NuxtLink class="home-exhibition__browse" to="/gallery/photography">瀏覽全部攝影 <span aria-hidden="true">→</span></NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { GalleryItem } from '~~/shared/types/gallery'
import { useImagePath } from '~/composables/useImagePath'

defineProps<{ artwork?: GalleryItem; photograph?: GalleryItem }>()

const { getThumbPath, getAvifThumbPath } = useImagePath()
const imageSizes = '(max-width: 767px) calc(100vw - 48px), (max-width: 1279px) 45vw, 620px'

function webpSrcset (filename: string): string {
  return ([400, 800, 1600] as const).map(width => `${getThumbPath(filename, width)} ${width}w`).join(', ')
}

function avifSrcset (filename: string): string {
  return ([400, 800, 1600] as const).map(width => `${getAvifThumbPath(filename, width)} ${width}w`).join(', ')
}

function imageRatio (item: GalleryItem): { aspectRatio?: string } {
  return item.aspectRatio && item.aspectRatio > 0 ? { aspectRatio: String(item.aspectRatio) } : {}
}
</script>

<style scoped>
.home-exhibition {
  width: min(100%, 80rem);
  margin-inline: auto;
  padding: clamp(5rem, 9vw, 9rem) clamp(1.5rem, 5vw, 5rem);
  color: #292524;
}
.home-exhibition__heading { margin-bottom: clamp(2.5rem, 5vw, 4.5rem); }
.home-exhibition__heading h2 { font-size: clamp(2rem, 4vw, 3.5rem); font-weight: 400; letter-spacing: .08em; line-height: 1.3; }
.home-exhibition__works { display: grid; grid-template-columns: minmax(0, 1.12fr) minmax(0, .88fr); gap: clamp(2.5rem, 5vw, 5.5rem); align-items: start; }
.home-exhibition__works--single { grid-template-columns: minmax(0, 1fr); max-width: 46rem; }
.home-exhibition__work { min-width: 0; margin: 0; }
.home-exhibition__work figure { margin: 0; }
.home-exhibition__work--photo { padding-top: clamp(2rem, 7vw, 6rem); }
.home-exhibition__works--single .home-exhibition__work--photo { padding-top: 0; }
.home-exhibition__work-link { display: block; min-width: 0; color: inherit; text-decoration: none; }
.home-exhibition__work-link:focus-visible, .home-exhibition__browse:focus-visible { outline: 2px solid #a3491f; outline-offset: 6px; }
.home-exhibition__art-wall, .home-exhibition__photo-surface { display: flex; align-items: center; justify-content: center; width: 100%; min-width: 0; }
.home-exhibition__art-wall { min-height: clamp(22rem, 45vw, 38rem); padding: clamp(1.25rem, 3vw, 3rem); background: #e7dfd2; }
.home-exhibition__art-frame { display: block; max-width: 100%; padding: clamp(.45rem, 1vw, .8rem); background: #554235; box-shadow: 2px 3px 5px rgb(31 24 18 / 18%), 8px 18px 32px -10px rgb(31 24 18 / 32%); transition: transform .45s cubic-bezier(.16, 1, .3, 1), box-shadow .45s ease; }
.home-exhibition__art-mat { display: block; max-width: 100%; padding: clamp(.6rem, 1.6vw, 1.3rem); background: #f4ede1; }
.home-exhibition__photo-surface { min-height: clamp(21rem, 35vw, 33rem); padding: clamp(1.25rem, 3vw, 3rem); background: #dce2e3; }
.home-exhibition__photo-paper { display: block; max-width: 100%; padding: clamp(.55rem, 1.2vw, 1rem) clamp(.55rem, 1.2vw, 1rem) clamp(1rem, 2vw, 1.75rem); background: #faf7ef; box-shadow: 5px 25px 35px -13px rgb(36 42 43 / 35%); transition: transform .45s cubic-bezier(.16, 1, .3, 1), box-shadow .45s ease; }
.home-exhibition picture, .home-exhibition img { display: block; max-width: 100%; }
.home-exhibition img { width: auto; height: auto; max-height: min(60vh, 35rem); object-fit: contain; }
.home-exhibition__work-link:hover .home-exhibition__art-frame, .home-exhibition__work-link:focus-visible .home-exhibition__art-frame { transform: translateY(-5px); box-shadow: 2px 7px 9px rgb(31 24 18 / 20%), 8px 23px 34px -10px rgb(31 24 18 / 35%); }
.home-exhibition__work-link:hover .home-exhibition__photo-paper, .home-exhibition__work-link:focus-visible .home-exhibition__photo-paper { transform: translateY(-5px); box-shadow: 5px 29px 38px -13px rgb(36 42 43 / 40%); }
.home-exhibition__caption { display: flex; flex-direction: column; align-items: flex-start; gap: .3rem; min-width: 0; padding: 1.4rem 0 0; }
.home-exhibition__medium { margin-bottom: .3rem; color: #78573d; font-size: .75rem; letter-spacing: .14em; }
.home-exhibition__work--photo .home-exhibition__medium { color: #495c65; }
.home-exhibition__title { max-width: 100%; font-size: clamp(1.15rem, 1.8vw, 1.45rem); line-height: 1.5; overflow-wrap: anywhere; }
.home-exhibition__title--art { font-family: 'Zen Kaku Gothic New', 'Noto Sans TC', sans-serif; }
.home-exhibition__title--photo { font-family: 'Shippori Mincho', 'Noto Serif JP', serif; }
.home-exhibition__detail { color: #57534e; font-size: .875rem; line-height: 1.6; overflow-wrap: anywhere; }
.home-exhibition__open { display: inline-flex; align-items: center; gap: .4rem; min-height: 2.75rem; margin-top: .45rem; color: #57534e; font-size: .8125rem; }
.home-exhibition__open :deep(svg) { width: .9rem; height: .9rem; }
.home-exhibition__browse { display: inline-flex; align-items: center; gap: .6rem; min-height: 2.75rem; margin-top: 1.1rem; border-bottom: 1px solid #a8a29e; color: #44403c; font-size: .875rem; text-decoration: none; }
.home-exhibition__browse:hover { border-bottom-color: currentColor; }
.dark .home-exhibition { color: #f5f5f4; }
.dark .home-exhibition__detail, .dark .home-exhibition__open { color: #d6d3d1; }
.dark .home-exhibition__art-wall { background: #352e28; }
.dark .home-exhibition__art-frame { background: #4a382e; }
.dark .home-exhibition__art-mat { background: #d9cdbd; }
.dark .home-exhibition__photo-surface { background: #303c43; }
.dark .home-exhibition__photo-paper { background: #302e28; }
.dark .home-exhibition__medium { color: #f2bc8a; }
.dark .home-exhibition__work--photo .home-exhibition__medium { color: #bacbd3; }
.dark .home-exhibition__browse { border-bottom-color: #78716c; color: #e7e5e4; }
@media (max-width: 767px) {
  .home-exhibition__works { grid-template-columns: minmax(0, 1fr); gap: 4rem; }
  .home-exhibition__work--photo { padding-top: 0; }
  .home-exhibition__art-wall, .home-exhibition__photo-surface { min-height: 0; padding: clamp(1rem, 5vw, 2rem); }
  .home-exhibition img { max-height: 30rem; }
}
@media (prefers-reduced-motion: reduce) {
  .home-exhibition__art-frame, .home-exhibition__photo-paper { transition: none; }
  .home-exhibition__work-link:hover .home-exhibition__art-frame, .home-exhibition__work-link:focus-visible .home-exhibition__art-frame, .home-exhibition__work-link:hover .home-exhibition__photo-paper, .home-exhibition__work-link:focus-visible .home-exhibition__photo-paper { transform: none; }
}
</style>
