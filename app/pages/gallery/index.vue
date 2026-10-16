<template>
  <section class="hall-index" aria-labelledby="hall-index-title">
    <header class="hall-index__header">
      <h1 id="hall-index-title" class="font-jp">作品展廳</h1>
      <p>兩種觀看方式，從各自的入口開始。</p>
    </header>

    <nav class="hall-index__rooms" aria-label="選擇作品展廳">
      <NuxtLink to="/gallery/digital" class="hall-index__room hall-index__room--digital" data-testid="gallery-hall-digital">
        <span class="hall-index__room-name">數位繪畫</span>
        <span class="hall-index__room-description">依創作年份逐件觀看</span>
        <span class="hall-index__room-enter" aria-hidden="true">進入展廳</span>
      </NuxtLink>

      <NuxtLink to="/gallery/photography" class="hall-index__room hall-index__room--photography" data-testid="gallery-hall-photography">
        <span class="hall-index__room-name font-jp">攝影</span>
        <span class="hall-index__room-description">從拍攝地點走進系列</span>
        <span class="hall-index__room-enter" aria-hidden="true">進入展廳</span>
      </NuxtLink>
    </nav>
  </section>
</template>

<script setup lang="ts">
import { SEO_CONFIG } from '~~/shared/config/constants'

const route = useRoute()
const image = Array.isArray(route.query.image) ? route.query.image[0] : route.query.image
const imageCategory = typeof image === 'string' && image.startsWith('digital-')
  ? 'digital'
  : typeof image === 'string' && image.startsWith('photography-')
    ? 'photography'
    : null

if (imageCategory) {
  await navigateTo({ path: `/gallery/${imageCategory}`, query: route.query, hash: route.hash }, { replace: true })
}

const pageUrl = new URL('gallery', SEO_CONFIG.siteUrl).href
const pageDescription = 'NCTU Young 的數位繪畫與攝影作品展廳。依創作年份觀看繪畫，或從拍攝地點走進攝影系列。'

useSeoMeta({
  title: '作品展廳 - NCTU Young',
  description: pageDescription,
  ogTitle: '作品展廳 - NCTU Young',
  ogDescription: pageDescription,
  ogType: 'website',
  ogUrl: pageUrl
})
useHead({ link: [{ rel: 'canonical', href: pageUrl }] })
</script>

<style scoped>
.hall-index {
  display: grid;
  align-content: center;
  gap: clamp(2.5rem, 7vh, 5rem);
  min-height: min(760px, calc(100svh - 5rem));
  max-width: 70rem;
  margin-inline: auto;
  padding: clamp(3rem, 8vh, 5rem) clamp(0.5rem, 2vw, 2rem);
  color: #292524;
}
.hall-index__header { max-width: 42rem; }
.hall-index__header h1 {
  margin: 0;
  font-size: clamp(2.2rem, 4.2vw, 4rem);
  font-weight: 200;
  line-height: 1.25;
  letter-spacing: .08em;
}
.hall-index__header p {
  margin: 1rem 0 0;
  color: #57534e;
  font-size: clamp(.9rem, 1.2vw, 1rem);
  line-height: 1.8;
}
.hall-index__rooms {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(1rem, 3vw, 2.5rem);
}
.hall-index__room {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  min-height: 17rem;
  padding: clamp(1.5rem, 3vw, 2.75rem);
  text-decoration: none;
  border-top: 1px solid currentColor;
  transition: background-color .35s ease;
}
.hall-index__room--digital { color: #403a32; background: #f4f0e7; }
.hall-index__room--digital:hover { background: #eee9dc; }
.hall-index__room--photography { color: #39434a; background: #eef1f3; }
.hall-index__room--photography:hover { background: #e5ebee; }
.hall-index__room-name {
  font-size: clamp(1.6rem, 2.5vw, 2.4rem);
  font-weight: 400;
  line-height: 1.35;
  letter-spacing: .08em;
}
.hall-index__room-description {
  margin-top: .75rem;
  font-size: .95rem;
  line-height: 1.7;
}
.hall-index__room-enter {
  display: inline-block;
  margin-top: auto;
  padding-top: 2.5rem;
  border-bottom: 1px solid currentColor;
  font-size: .82rem;
  line-height: 1.8;
  letter-spacing: .06em;
}
.hall-index__room:focus-visible { outline: 3px solid #a3491f; outline-offset: 4px; }
.dark .hall-index { color: #eee8df; }
.dark .hall-index__header p { color: #cbc1b2; }
.dark .hall-index__room--digital { color: #eee8df; background: #302d2a; }
.dark .hall-index__room--digital:hover { background: #403b35; }
.dark .hall-index__room--photography { color: #ece8df; background: #222a30; }
.dark .hall-index__room--photography:hover { background: #303b43; }
.dark .hall-index__room:focus-visible { outline-color: #e4964a; }
@media (max-width: 640px) {
  .hall-index { min-height: calc(100svh - 5rem); gap: 2rem; padding-block: 2.5rem; }
  .hall-index__rooms { grid-template-columns: 1fr; gap: 1rem; }
  .hall-index__room { min-height: 10rem; padding: 1.25rem 1.5rem; }
  .hall-index__room-enter { padding-top: 1rem; }
}
@media (prefers-reduced-motion: reduce) {
  .hall-index__room { transition: none; }
}
</style>
