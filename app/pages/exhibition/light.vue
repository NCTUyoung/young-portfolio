<script setup lang="ts">
import { fetchDigitalWorks, fetchPhotographyWorks } from '~/stores/galleryLoaders'
import { formatDateKey } from '~/utils/formatters'

const stations = [
  {
    anchor: 'painting',
    stop: '繪作',
    category: 'digital',
    filename: 'gallery/2026年電繪作品/23-編輯-4-1.jpg',
    alt: '柑橘枝葉間的洛琪希，帽簷上方垂著一枚果實',
    question: ['柑橘枝葉的光，', '落在哪一處？'],
    detail: '一枚黃澄澄的果實垂在帽簷上方，藍髮人物躲在枝葉的陰影裡。',
    width: 1860,
    height: 2631,
    displayWidth: 566,
    largeWidth: 1131
  },
  {
    anchor: 'flowers',
    stop: '花下',
    category: 'photography',
    filename: 'photography/峨嵋湖風鈴木/DSC_1377-編輯-1.jpg',
    alt: '花枝前舉起手的女子',
    question: ['沿著花枝看，', '人物停在哪裡？'],
    detail: '花枝從畫面上方垂下。順著舉起的手望過去，可以找到藏在枝葉後的眼神。',
    width: 6048,
    height: 4032,
    displayWidth: 800,
    largeWidth: 1600
  },
  {
    anchor: 'bench',
    stop: '長椅',
    category: 'photography',
    filename: 'photography/WBC東京 台澳/DSC_9885-編輯-1.jpg',
    alt: '樹蔭下的長椅與灑在礫石上的日光',
    question: ['礫石與長椅的斜影，', '先看見哪一個？'],
    detail: '長椅留在樹蔭裡，一小片日光穿過枝葉，落在參道的礫石上。',
    width: 4032,
    height: 6048,
    displayWidth: 533,
    largeWidth: 1067
  }
] as const

const { getThumbPath } = useImagePath()
const paintedWorldsUrl = `${useRuntimeConfig().app.baseURL.replace(/\/?$/, '/')}painted-worlds/index.html?from=light`
const stationHash = ref('')
const workHeading = useTemplateRef<HTMLHeadingElement>('workHeading')

const { data: catalogue, error, refresh, status } = await useAsyncData('light-exhibition-works', async () => {
  const [digital, photography] = await Promise.all([fetchDigitalWorks(), fetchPhotographyWorks()])
  const collections = { digital: digital.works, photography: photography.works }
  return stations.map(station => {
    const work = collections[station.category].find(item => item.filename === station.filename)
    if (!work?.event?.name) throw new Error(`Missing catalogue entry: ${station.filename}`)

    return {
      id: work.id,
      title: work.title,
      date: formatDateKey(work.date),
      event: work.event.name
    }
  })
})

const currentIndex = computed(() => {
  return Math.max(stations.findIndex(station => stationHash.value === `#${station.anchor}`), 0)
})
const current = computed(() => stations[currentIndex.value] ?? stations[0])
const currentWork = computed(() => catalogue.value?.[currentIndex.value])
const next = computed(() => stations[currentIndex.value + 1])
const nextWork = computed(() => catalogue.value?.[currentIndex.value + 1])
const workSrcset = computed(() => {
  const work = current.value
  return `${getThumbPath(work.filename, 800)} ${work.displayWidth}w, ${getThumbPath(work.filename, 1600)} ${work.largeWidth}w`
})
const collectionLocation = computed(() => {
  const work = currentWork.value
  if (!work) return
  return {
    path: `/gallery/${current.value.category}/${encodeURIComponent(work.event)}`,
    query: { image: work.id }
  }
})

function syncStationHash () {
  stationHash.value = window.location.hash
}

onMounted(() => {
  // Read the browser fragment after hydration, including clicks on SSR links.
  syncStationHash()
  window.addEventListener('hashchange', syncStationHash)
  watch(currentIndex, () => workHeading.value?.focus({ preventScroll: true }), { flush: 'post' })
})
// Prerendered routes can restore their fragment with replaceState after mount.
onNuxtReady(syncStationHash)
onBeforeUnmount(() => window.removeEventListener('hashchange', syncStationHash))

useSeoMeta({
  title: '光落之處',
  description: '沿著展線，從繪作走向攝影。三件作品依序展出：唯一真神、DSC_1377-編輯-1、長椅與參道。'
})
</script>

<template>
  <article class="light-exhibition" :data-station="current.anchor" aria-labelledby="light-title">
    <header class="light-opening">
      <h1 id="light-title" class="font-jp">光落之處</h1>
      <nav class="light-route" aria-label="展線">
        <ol>
          <li v-for="(station, index) in stations" :id="station.anchor" :key="station.anchor">
            <a
              :href="`#${station.anchor}`"
              :aria-current="currentIndex === index ? 'step' : undefined"
            >{{ station.stop }}</a>
          </li>
        </ol>
      </nav>
    </header>

    <section class="light-room" aria-labelledby="light-work-title">
      <div class="light-room-content">
        <figure
          class="light-work"
          :style="{ '--art-ratio': current.width / current.height }"
          :data-work-id="currentWork?.id"
        >
          <div class="light-frame">
            <img
              :src="getThumbPath(current.filename, 800)"
              :srcset="workSrcset"
              :sizes="current.width > current.height ? '(min-width: 48rem) 36rem, 87vw' : '(min-width: 48rem) 19rem, 15rem'"
              :width="current.width"
              :height="current.height"
              :alt="current.alt"
              fetchpriority="high"
            >
          </div>
          <figcaption class="light-plaque">
            <h2 id="light-work-title" ref="workHeading" class="font-jp" tabindex="-1">
              {{ currentWork?.title ?? current.stop }}
            </h2>
            <p v-if="currentWork" class="light-plaque-meta">
              <span>{{ current.category === 'digital' ? '數位繪畫' : '攝影' }}</span>
              <time :datetime="currentWork.date">{{ currentWork.date.replaceAll('-', '.') }}</time>
              <span>{{ currentWork.event }}</span>
            </p>
            <p v-else class="light-plaque-meta" role="status">
              {{ error ? '館藏資料暫時無法讀取。' : '正在讀取館藏資料。' }}
            </p>
            <div class="light-plaque-links">
              <NuxtLink v-if="collectionLocation" class="light-text-link" :to="collectionLocation">
                {{ current.category === 'digital' ? '查看館藏原作' : '在活動中看這張照片' }}
                <Icon name="lucide:arrow-up-right" aria-hidden="true" />
              </NuxtLink>
              <button
                v-else-if="error"
                class="light-text-link"
                type="button"
                :disabled="status === 'pending'"
                @click="refresh()"
              >
                重試
              </button>
              <a v-if="current.anchor === 'painting'" class="light-text-link" :href="paintedWorldsUrl">
                進入畫界迴廊
                <Icon name="lucide:arrow-up-right" aria-hidden="true" />
              </a>
            </div>
          </figcaption>
        </figure>

        <div class="light-guide">
          <div class="light-note">
            <h3 class="font-jp"><span v-for="part in current.question" :key="part">{{ part }}</span></h3>
            <p>{{ current.detail }}</p>
          </div>

          <a
            v-if="next"
            class="light-view"
            :href="`#${next.anchor}`"
            :aria-label="`觀景窗，下一站：${next.stop}${nextWork ? `，${nextWork.title}` : ''}`"
          >
            <span class="light-view-window">
              <img :src="getThumbPath(next.filename, 400)" alt="" width="224" height="130" decoding="async">
            </span>
            <span class="light-view-caption">
              <span>下一站 · {{ next.stop }}</span>
              <strong v-if="nextWork">{{ nextWork.title }}</strong>
              <Icon class="light-view-arrow" name="lucide:arrow-right" aria-hidden="true" />
            </span>
          </a>

          <NuxtLink v-else class="light-text-link" to="/gallery/photography">
            前往攝影館
            <Icon name="lucide:arrow-right" aria-hidden="true" />
          </NuxtLink>

          <NuxtLink class="light-text-link light-return" to="/">
            <Icon name="lucide:arrow-left" aria-hidden="true" />
            回日光迴廊
          </NuxtLink>
        </div>
      </div>
    </section>
  </article>
</template>

<style scoped>
.light-exhibition {
  --station-tint: var(--museum-cool);
  color: var(--museum-ink);
  background: var(--museum-paper);
  margin-block: clamp(0.6rem, 2vw, 1.8rem) clamp(2rem, 5vw, 4.5rem);
}

.light-exhibition[data-station='painting'] {
  --station-tint: var(--museum-warm);
}

.light-exhibition :is(a, button):focus-visible,
.light-plaque h2:focus-visible {
  outline: 2px solid var(--museum-ink);
  outline-offset: 4px;
}

.light-opening {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  justify-content: space-between;
  gap: 0.8rem 2rem;
  padding: clamp(1.35rem, 3vw, 2.25rem) clamp(1.15rem, 5.5vw, 5.5rem) clamp(0.65rem, 2vw, 1.25rem);
  border-bottom: 1px solid var(--museum-line);
}

.light-opening h1 {
  font-size: clamp(2rem, 4.5vw, 3.75rem);
  font-weight: 300;
  letter-spacing: 0.07em;
  line-height: 1.2;
}

.light-route ol {
  display: flex;
  list-style: none;
}

.light-route li {
  scroll-margin-top: calc(5.5rem + env(safe-area-inset-top, 0px));
}

.light-route a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding-inline: clamp(0.85rem, 2.8vw, 1.55rem);
  min-height: 2.75rem;
  border-bottom: 1px solid var(--museum-line);
  color: var(--museum-muted);
  font-size: 0.875rem;
  letter-spacing: 0.08em;
}

.light-route a[aria-current='step'] {
  border-color: currentColor;
  color: var(--museum-ink);
  font-weight: 600;
}

.light-route a:hover {
  color: var(--museum-ink);
}

.light-room {
  background:
    radial-gradient(ellipse 63% 68% at 40% 0%, var(--museum-light), transparent 88%),
    linear-gradient(102deg, color-mix(in srgb, var(--station-tint) 12%, transparent), transparent 29% 67%, color-mix(in srgb, var(--station-tint) 15%, transparent)),
    var(--museum-paper);
}

.light-room-content {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(0, 1fr);
  align-items: start;
  gap: clamp(2rem, 6.5vw, 6rem);
  max-width: 65rem;
  margin-inline: auto;
  padding: clamp(2.4rem, 5.5vw, 4.75rem) clamp(2rem, 6vw, 5rem) clamp(2.5rem, 6vw, 4.5rem);
}

.light-work {
  width: min(100%, calc(clamp(22rem, 51svh, 31rem) * var(--art-ratio)));
  justify-self: center;
  min-width: 0;
}

.light-frame {
  padding: clamp(0.65rem, 1.5vw, 1.05rem);
  border: clamp(0.25rem, 0.55vw, 0.48rem) solid color-mix(in srgb, var(--museum-ink) 44%, var(--station-tint));
  background: color-mix(in srgb, var(--museum-paper) 86%, var(--museum-light));
  box-shadow: 0.5rem 1rem 2rem -0.8rem rgb(21 17 14 / 38%);
}

.light-frame img {
  display: block;
  width: 100%;
  height: auto;
}

.light-plaque {
  margin-top: 1.35rem;
  padding-top: 0.85rem;
  border-top: 1px solid var(--museum-line);
}

.light-plaque h2 {
  width: fit-content;
  max-width: 100%;
  font-size: clamp(1.2rem, 2.2vw, 1.6rem);
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.light-plaque-meta,
.light-plaque-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.15rem 0.8rem;
}

.light-plaque-meta {
  margin-top: 0.45rem;
  color: var(--museum-muted);
  font-size: 0.8125rem;
  line-height: 1.6;
  font-variant-numeric: tabular-nums;
}

.light-plaque-links {
  margin-top: 0.2rem;
}

.light-text-link {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  gap: 0.35em;
  font-size: 0.875rem;
  text-align: start;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.3em;
}

.light-text-link:hover {
  text-decoration-thickness: 2px;
}

.light-guide {
  display: grid;
  justify-items: start;
  gap: clamp(0.95rem, 2.6vw, 1.6rem);
  max-width: 19.5rem;
  padding-top: clamp(1.4rem, 5.5vw, 5.5rem);
}

.light-note h3 {
  max-width: 13em;
  font-size: clamp(1.35rem, 2.65vw, 2.1rem);
  font-weight: 400;
  line-height: 1.5;
}

.light-note h3 span {
  display: inline-block;
}

.light-note p {
  margin-top: 0.65rem;
  color: var(--museum-muted);
  font-size: 0.9375rem;
  line-height: 1.85;
}

.light-view {
  display: grid;
  gap: 0.45rem;
  width: min(100%, 16.5rem);
}

.light-view-window {
  overflow: hidden;
  border: solid;
  border-width: 0.35rem 0.4rem 0.6rem 0.65rem;
  border-color:
    color-mix(in srgb, var(--museum-line) 68%, var(--museum-ink))
    var(--museum-line)
    var(--museum-paper)
    color-mix(in srgb, var(--museum-line) 80%, var(--museum-ink));
  box-shadow: 0.35rem 0.55rem 0.95rem -0.38rem rgb(21 17 14 / 31%);
}

.light-view-window img {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 12 / 7;
  object-fit: cover;
  transition: transform 360ms cubic-bezier(.16, 1, .3, 1);
}

.light-view:is(:hover, :focus-visible) img {
  transform: scale(1.04);
}

.light-view-caption {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  min-height: 2.75rem;
  gap: 0.15rem 0.65rem;
  font-size: 0.875rem;
}

.light-view-caption > span:first-child {
  color: var(--museum-muted);
  font-size: 0.8125rem;
}

.light-view-caption strong {
  grid-column: 1;
  font-weight: 500;
  overflow-wrap: anywhere;
}

.light-view-arrow {
  grid-area: 1 / 2 / 3 / 3;
}

.light-view:hover strong {
  text-decoration: underline;
  text-underline-offset: 0.25em;
}

.light-return {
  border-top: 1px solid var(--museum-line);
  padding-inline-end: 1.5rem;
}

@media (max-width: 47.99rem) {
  .light-room-content {
    grid-template-columns: minmax(0, 1fr);
    gap: clamp(1.5rem, 5vw, 2.5rem);
    padding-inline: clamp(1rem, 5vw, 2.5rem);
  }

  .light-work {
    width: min(100%, calc(clamp(19rem, 44svh, 24rem) * var(--art-ratio)));
  }

  .light-guide {
    width: 100%;
    max-width: 32rem;
    justify-self: center;
    padding-top: 0;
  }

  .light-note h3 {
    max-width: none;
  }

  .light-view {
    grid-template-columns: clamp(5.5rem, 25vw, 7.5rem) minmax(0, 1fr);
    align-items: center;
    gap: 0.65rem;
    width: 100%;
    max-width: 21rem;
  }

  .light-view-window {
    border-width: 0.25rem 0.24rem 0.42rem 0.45rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .light-view-window img {
    transition: none;
  }

  .light-view:is(:hover, :focus-visible) img {
    transform: none;
  }
}
</style>
