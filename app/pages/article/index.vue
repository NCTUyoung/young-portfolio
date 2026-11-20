<script setup lang="ts">
import MuseumReadingHeader from '~/components/museum/MuseumReadingHeader.vue'

const previews = [
  {
    title: '設計心得',
    description: '從一張白紙到一張畫的思考路徑：構圖、留白、為什麼這格的色塊比那格重要。電繪思維為主，攝影構圖為輔。',
    track: '繪畫',
    slug: 'design-thinking'
  },
  {
    title: '器材評測 — 119mm 的場邊',
    description: 'Nikon Z f 與 119mm 鏡頭的場邊拍攝，以及 DxO 後製。',
    track: '攝影',
    slug: 'gear-119mm'
  }
]

useSeoMeta({
  title: '文章專區',
  description: '電繪設計心得與 119mm 場邊攝影器材手記。',
  ogTitle: '文章專區 - 創作手記',
  ogDescription: '電繪設計心得與 119mm 場邊攝影器材手記。',
  ogType: 'website',
  ogImage: 'https://nctuyoung.github.io/young-portfolio/images/gallery/2024年電繪作品/23.jpg',
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <div class="article-index">
    <div class="article-index__contents">
      <MuseumReadingHeader title="文章">
        <p>創作手記，記下繪畫、攝影與製作這個網站時的思考。</p>
      </MuseumReadingHeader>

      <section aria-labelledby="article-index-heading">
        <h2 id="article-index-heading" class="article-index__heading font-jp">目次</h2>
        <ul class="article-index__list">
          <li v-for="preview in previews" :key="preview.slug">
            <NuxtLink :to="`/article/${preview.slug}`" class="article-index__entry">
              <div>
                <h3 class="font-jp">{{ preview.title }}</h3>
                <p>{{ preview.description }}</p>
              </div>
              <span class="article-index__track">
                {{ preview.track }}
                <Icon name="lucide:arrow-right" aria-hidden="true" />
              </span>
            </NuxtLink>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style scoped>
.article-index {
  min-block-size: 65svh;
  color: var(--museum-ink);
  background:
    radial-gradient(ellipse 75% 75% at 29% 0%, var(--museum-light), transparent 90%),
    linear-gradient(105deg, transparent 69%, color-mix(in srgb, var(--museum-line) 19%, transparent)),
    var(--museum-paper);
}

.article-index__contents {
  display: grid;
  gap: clamp(2.6rem, 6vw, 6rem);
  max-inline-size: 69rem;
  margin-inline: auto;
  padding: clamp(2.75rem, 7vw, 6rem) clamp(1.25rem, 5vw, 5rem) clamp(4rem, 9vw, 8rem);
}

.article-index__heading {
  margin-block-end: 1rem;
  color: var(--museum-muted);
  font-size: 0.9375rem;
  letter-spacing: 0.15em;
}

.article-index__list {
  border-block-start: 1px solid var(--museum-line);
  list-style: none;
}

.article-index__list li {
  border-block-end: 1px solid var(--museum-line);
}

.article-index__entry {
  display: grid;
  gap: 0.6rem 1rem;
  align-items: start;
  padding-block: clamp(1.1rem, 2.8vw, 2rem);
}

.article-index__entry h3 {
  color: var(--museum-ink);
  font-size: clamp(1.2rem, 2.5vw, 1.65rem);
  line-height: 1.55;
  letter-spacing: 0.04em;
}

.article-index__entry p {
  margin-block-start: 0.45rem;
  max-inline-size: 35em;
  color: var(--museum-muted);
  font-size: 0.9375rem;
  line-height: 1.85;
}

.article-index__track {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
  color: var(--museum-muted);
  font-size: 0.8125rem;
  white-space: nowrap;
}

.article-index__track :deep(.iconify) {
  inline-size: 1rem;
  block-size: 1rem;
}

.article-index__entry:is(:hover, :focus-visible) h3 {
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.25em;
}

.article-index__entry:focus-visible {
  outline: 2px solid var(--museum-ink);
  outline-offset: 3px;
}

@media (min-width: 36rem) {
  .article-index__entry {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .article-index__track {
    margin-block-start: 0.45rem;
  }
}

@media (min-width: 52rem) {
  .article-index__contents {
    grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
    align-items: start;
  }
}
</style>
