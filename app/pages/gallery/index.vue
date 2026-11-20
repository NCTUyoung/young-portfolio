<template>
  <div class="collection-index">
    <section v-if="!legacyAll" class="collection-index__content" aria-labelledby="collection-heading">
      <h1 id="collection-heading" class="museum-heading collection-index__title">館藏</h1>

      <nav class="collection-rooms" aria-label="館藏目錄">
        <NuxtLink
          v-for="room in rooms"
          :key="room.key"
          :to="room.path"
          :aria-labelledby="`collection-${room.key}-title`"
          :aria-describedby="`collection-${room.key}-description`"
          :data-room="room.key"
          class="collection-entry"
        >
          <div class="collection-entry__plaque">
            <div>
              <h2 :id="`collection-${room.key}-title`" class="museum-heading collection-entry__title">{{ room.name }}</h2>
              <p :id="`collection-${room.key}-description`" class="collection-entry__description">{{ room.description }}</p>
            </div>
            <Icon name="lucide:arrow-right" class="collection-entry__arrow" aria-hidden="true" />
          </div>
          <figure class="collection-entry__display">
            <img
              :src="getThumbPath(room.preview.filename, 400)"
              :alt="room.preview.alt"
              :width="room.preview.width"
              :height="room.preview.height"
              class="collection-entry__image"
              decoding="async"
            >
            <figcaption class="collection-entry__caption" :lang="room.preview.lang">{{ room.preview.title }}</figcaption>
          </figure>
        </NuxtLink>
      </nav>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ alias: ['/gallery/all'] })

const route = useRoute()
const router = useRouter()
const isLegacyAll = (path: string) => /^\/gallery\/all\/?$/.test(path)
const legacyAll = computed(() => isLegacyAll(route.path))
const { getThumbPath } = useImagePath()

useSeoMeta({
  title: '館藏',
  description: '依年份瀏覽數位繪畫，依地點或活動瀏覽攝影作品。',
  robots: computed(() => legacyAll.value ? 'noindex, follow' : undefined)
})

const rooms = [
  {
    key: 'digital',
    path: '/gallery/digital',
    name: '繪畫館',
    description: '依年份看繪畫',
    preview: {
      filename: 'gallery/2025年電繪作品/17.png',
      title: '孤独が描く美学',
      alt: '玻璃水珠後，白衣人物坐在街角',
      lang: 'ja',
      width: 283,
      height: 400
    }
  },
  {
    key: 'photography',
    path: '/gallery/photography#gallery-activities',
    name: '攝影館',
    description: '依地點或活動看照片',
    preview: {
      filename: 'photography/WBC東京 台澳/DSC_9877-編輯-1.jpg',
      title: '櫻枝與晴空',
      alt: '晴空下伸展的櫻花枝條',
      lang: 'zh-Hant',
      width: 400,
      height: 267
    }
  }
]

function redirectLegacyGallery (fullPath: string) {
  const { path, query, hash } = router.resolve(fullPath)
  if (!/^\/gallery(?:\/all)?\/?$/.test(path)) return
  const image = Array.isArray(query.image) ? query.image[0] : query.image
  if (!isLegacyAll(path) && image === undefined) return
  const category = typeof image === 'string' && image.startsWith('digital-') ? 'digital' : 'photography'
  void router.replace({ path: `/gallery/${category}`, query, hash })
}

let hydrated = false
watch(() => router.currentRoute.value.fullPath, (fullPath) => {
  if (hydrated) redirectLegacyGallery(fullPath)
})

// GitHub Pages serves the same prerendered document for every query and hash.
onNuxtReady(() => {
  hydrated = true
  redirectLegacyGallery(router.currentRoute.value.path + window.location.search + window.location.hash)
})
</script>

<style scoped>
.collection-index {
  background: radial-gradient(ellipse 88% 38rem at 50% 0, var(--museum-light), transparent), var(--museum-paper);
  color: var(--museum-ink);
}
.collection-index__content {
  max-width: 71rem;
  margin-inline: auto;
  padding: clamp(1.6rem, 5vw, 4rem) clamp(1rem, 5vw, 3.5rem) clamp(3rem, 8vw, 6.5rem);
}
.collection-index__title {
  margin-bottom: clamp(1.2rem, 3.4vw, 2.6rem);
  font-size: clamp(2rem, 6vw, 4.25rem);
}
.collection-rooms {
  display: grid;
  gap: 1rem;
}
.collection-entry {
  --entry-tone: var(--museum-warm);
  display: grid;
  grid-template-columns: minmax(0, 43%) minmax(0, 1fr);
  align-items: stretch;
  border: 1px solid var(--museum-line);
  background: var(--entry-tone);
  color: var(--museum-ink);
}
.collection-entry[data-room='photography'] { --entry-tone: var(--museum-cool); }
.collection-entry:focus-visible { outline: 2px solid var(--museum-mark); outline-offset: 3px; }

.collection-entry__display {
  grid-area: 1 / 1;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 0.4rem;
  margin: 0;
  padding: clamp(0.55rem, 2.4vw, 1.5rem) 0.4rem;
  border-right: 1px solid var(--museum-line);
  background: radial-gradient(ellipse at 48% 3%, var(--museum-light), transparent);
}
.collection-entry__image {
  display: block;
  width: auto;
  max-width: 100%;
  height: auto;
  max-height: 7rem;
  padding: 0.24rem;
  object-fit: contain;
  background: var(--museum-light);
  box-shadow: 2px 6px 13px -5px rgb(30 24 18 / 42%);
}
.collection-entry[data-room='digital'] .collection-entry__image {
  border: 2px solid color-mix(in srgb, #765e48 70%, var(--entry-tone));
}
.collection-entry__caption {
  color: var(--museum-muted);
  font-size: 0.75rem;
  text-align: center;
}
.collection-entry__plaque {
  grid-area: 1 / 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.35rem;
  padding: clamp(0.65rem, 3vw, 1.75rem);
}
.collection-entry__title { font-size: clamp(1.35rem, 4.9vw, 2.5rem); }
.collection-entry__description {
  margin-top: 0.45rem;
  color: var(--museum-muted);
  font-size: 0.875rem;
  line-height: 1.5;
}
.collection-entry__arrow { flex: none; width: 1rem; height: 1rem; }
.collection-entry:hover .collection-entry__title {
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.25em;
}

@media (min-width: 640px) {
  .collection-rooms {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: clamp(1.5rem, 4vw, 4rem);
  }
  .collection-entry { grid-template-columns: minmax(0, 1fr); grid-template-rows: 1fr auto; }
  .collection-entry__display {
    padding: clamp(1.3rem, 3.8vw, 3.25rem);
    border-right: 0;
    border-bottom: 1px solid var(--museum-line);
  }
  .collection-entry__image { max-height: clamp(11rem, 19vw, 16rem); padding: 0.5rem; }
  .collection-entry[data-room='digital'] .collection-entry__image { border-width: 4px; }
  .collection-entry__plaque { grid-area: 2 / 1; gap: 1rem; }
  .collection-entry__arrow { width: 1.25rem; height: 1.25rem; }
}
</style>
