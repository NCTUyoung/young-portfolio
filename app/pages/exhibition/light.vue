<script setup lang="ts">
import { generateImageId } from '~/utils/imageUtils'

definePageMeta({
  middleware(to) {
    if (import.meta.server || !useNuxtApp().isHydrating) return
    const { hash } = window.location
    // An SSR station link can change the fragment while Nuxt resolves its initial route.
    if (/^#(?:painting|flowers|bench)$/.test(hash) && hash !== to.hash) {
      return { path: to.path, query: to.query, hash, replace: true }
    }
  },
})

const works = [
  {
    anchor: 'painting',
    stop: '繪作',
    category: 'digital',
    filename: 'gallery/2026年電繪作品/23-編輯-4-1.jpg',
    title: '唯一真神',
    date: '2026-09-06',
    medium: '數位繪畫',
    series: '2026年電繪作品',
    alt: '柑橘枝葉間的洛琪希，帽簷上方垂著一枚果實',
    question: ['柑橘枝葉的光，', '落在哪一處？'],
    detail: '一枚黃澄澄的果實垂在帽簷上方，藍髮人物躲在枝葉的陰影裡。',
    width: 1860,
    height: 2631,
    displayWidth: 566,
    largeWidth: 1131,
  },
  {
    anchor: 'flowers',
    stop: '花下',
    category: 'photography',
    filename: 'photography/峨嵋湖風鈴木/DSC_1377-編輯-1.jpg',
    title: 'DSC_1377-編輯-1',
    date: '2026-03-15',
    medium: '攝影',
    series: '峨嵋湖風鈴木',
    alt: '花枝前舉起手的女子',
    question: ['沿著花枝看，', '人物停在哪裡？'],
    detail: '花枝從畫面上方垂下。順著舉起的手望過去，可以找到藏在枝葉後的眼神。',
    width: 6048,
    height: 4032,
    displayWidth: 800,
    largeWidth: 1600,
  },
  {
    anchor: 'bench',
    stop: '長椅',
    category: 'photography',
    filename: 'photography/WBC東京 台澳/DSC_9885-編輯-1.jpg',
    title: '長椅與參道',
    date: '2026-03-05',
    medium: '攝影',
    series: 'WBC東京 台澳',
    alt: '樹蔭下的長椅與灑在礫石上的日光',
    question: ['礫石與長椅的斜影，', '先看見哪一個？'],
    detail: '長椅留在樹蔭裡，一小片日光穿過枝葉，落在參道的礫石上。',
    width: 4032,
    height: 6048,
    displayWidth: 533,
    largeWidth: 1067,
  },
] as const

const route = useRoute()
const { getThumbPath } = useImagePath()
const paintedWorldsUrl = `${useRuntimeConfig().app.baseURL.replace(/\/?$/, '/')}painted-worlds/index.html`
const hydrated = ref(false)
const workHeading = useTemplateRef<HTMLHeadingElement>('workHeading')

const currentIndex = computed(() => {
  if (!hydrated.value) return 0
  return Math.max(works.findIndex(work => route.hash === `#${work.anchor}`), 0)
})
const current = computed(() => works[currentIndex.value] ?? works[0])
const previous = computed(() => works[currentIndex.value - 1])
const next = computed(() => works[currentIndex.value + 1])
const workSrcset = computed(() => {
  const work = current.value
  return `${getThumbPath(work.filename, 800)} ${work.displayWidth}w, ${getThumbPath(work.filename, 1600)} ${work.largeWidth}w`
})

const stationLocation = (anchor: typeof works[number]['anchor']) => ({
  path: route.path,
  query: route.query,
  hash: `#${anchor}`,
})

onMounted(() => {
  // URL fragments are available in the browser after the SSR markup hydrates.
  hydrated.value = true
  watch(currentIndex, () => workHeading.value?.focus({ preventScroll: true }), { flush: 'post' })
})

useSeoMeta({
  title: '光落之處',
  description: '沿著展線，從繪作走向攝影。三件作品依序展出：唯一真神、DSC_1377-編輯-1、長椅與參道。',
})
</script>

<template>
  <article class="light-exhibition" aria-labelledby="light-title">
    <header class="light-opening">
      <div>
        <h1 id="light-title" class="font-jp">光落之處</h1>
        <p>沿著展線，從繪作走向攝影。</p>
      </div>
      <nav class="light-route" aria-label="展線">
        <ol>
          <li v-for="(work, index) in works" :key="work.anchor">
            <NuxtLink v-slot="{ href, navigate }" :to="stationLocation(work.anchor)" custom>
              <a
                :id="work.anchor"
                :href="href ?? `#${work.anchor}`"
                :aria-current="currentIndex === index ? 'step' : undefined"
                @click="navigate"
              >
                <span class="light-stop-number" aria-hidden="true">{{ index + 1 }}</span>
                {{ work.stop }}
              </a>
            </NuxtLink>
          </li>
        </ol>
      </nav>
    </header>

    <section class="light-room" aria-labelledby="light-work-title">
      <div class="light-room-content">
        <figure
          class="light-work"
          :style="{ '--art-ratio': current.width / current.height }"
          :data-work-id="generateImageId(current.category, current.filename)"
        >
          <div class="light-frame">
            <img
              :src="getThumbPath(current.filename, 800)"
              :srcset="workSrcset"
              :sizes="current.width > current.height ? '(min-width: 48rem) 36rem, 87vw' : '(min-width: 48rem) 18rem, 15rem'"
              :width="current.width"
              :height="current.height"
              :alt="current.alt"
              fetchpriority="high"
            >
          </div>
          <figcaption class="light-plaque">
            <h2 id="light-work-title" ref="workHeading" class="font-jp" tabindex="-1">{{ current.title }}</h2>
            <p>
              <time :datetime="current.date">{{ current.date.replaceAll('-', '.') }}</time>
              <span>{{ current.medium }}</span>
              <span>{{ current.series }}</span>
            </p>
            <a v-if="current.anchor === 'painting'" class="light-text-link light-painted-worlds" :href="paintedWorldsUrl">
              進入畫界迴廊
              <Icon name="lucide:arrow-up-right" aria-hidden="true" />
            </a>
          </figcaption>
        </figure>

        <div class="light-guide">
          <NuxtLink v-if="next" v-slot="{ href, navigate }" :to="stationLocation(next.anchor)" custom>
            <a class="light-view" :href="href ?? `#${next.anchor}`" :aria-label="`觀景窗 · 前往〈${next.title}〉`" @click="navigate">
              <span class="light-view-window">
                <img :src="getThumbPath(next.filename, 400)" alt="" width="224" height="130" decoding="async">
              </span>
              <span class="light-view-caption">
                <span>觀景窗</span>
                <strong>{{ next.title }}</strong>
                <Icon class="light-view-arrow" name="lucide:arrow-right" aria-hidden="true" />
              </span>
            </a>
          </NuxtLink>

          <div class="light-note">
            <h3 class="font-jp"><span v-for="part in current.question" :key="part">{{ part }}</span></h3>
            <p>{{ current.detail }}</p>
          </div>

          <NuxtLink v-if="!next" class="light-text-link light-exit" to="/gallery/photography">
            前往攝影展廳
            <Icon name="lucide:arrow-up-right" aria-hidden="true" />
          </NuxtLink>

          <div v-if="previous" class="light-return">
            <NuxtLink v-slot="{ href, navigate }" :to="stationLocation(previous.anchor)" custom>
              <a class="light-text-link" :href="href ?? `#${previous.anchor}`" @click="navigate">
                <Icon name="lucide:arrow-left" aria-hidden="true" />
                上一站<span class="sr-only"> · {{ previous.stop }}</span>
              </a>
            </NuxtLink>
            <NuxtLink v-if="!next" v-slot="{ href, navigate }" :to="stationLocation(works[0].anchor)" custom>
              <a class="light-text-link" :href="href ?? `#${works[0].anchor}`" @click="navigate">回到第一站</a>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </article>
</template>

<style scoped>
.light-exhibition {
  --wall: #eee9dc;
  --wall-light: #f9f6ed;
  --wall-edge: #ddd5c6;
  --ink: #403a32;
  --muted: #685f53;
  --line: #b1a493;
  --accent: #a3491f;
  --frame: #594435;
  --mat: #f7f3e9;
  --window-rim: #d1c6b4 #eee7da #f8f2e7 #a89a85;
  --top-light: #fffaf0;
  color: var(--ink);
  background: var(--wall);
  margin-block: clamp(1rem, 2.5vw, 2rem) clamp(2.5rem, 6vw, 5rem);
}

:global(.dark .light-exhibition) {
  --wall: #302d2a;
  --wall-light: #403b35;
  --wall-edge: #272421;
  --ink: #eee8df;
  --muted: #cbc1b2;
  --line: #85786b;
  --accent: #efab77;
  --frame: #8d6f55;
  --mat: #d8d0c1;
  --window-rim: #514a40 #716657 #7d7060 #463e35;
  --top-light: #665845;
}

.light-exhibition ::selection {
  color: var(--wall-light);
  background: var(--ink);
}

.light-exhibition a:focus-visible,
.light-plaque h2:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 4px;
}

.light-opening {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  justify-content: space-between;
  gap: 0.85rem 2.5rem;
  padding: clamp(1.35rem, 3vw, 2.75rem) clamp(1rem, 5vw, 4.5rem) clamp(0.9rem, 2vw, 1.7rem);
  border-bottom: 1px solid var(--line);
}

.light-opening h1 {
  font-size: clamp(2.15rem, 4.4vw, 4.25rem);
  font-weight: 400;
  letter-spacing: 0.065em;
  line-height: 1.14;
}

.light-opening p {
  margin-top: 0.65rem;
  color: var(--muted);
  font-size: 0.875rem;
  letter-spacing: 0.045em;
}

.light-route ol {
  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  width: clamp(12.5rem, 24vw, 18.5rem);
  list-style: none;
}

.light-route ol::before {
  position: absolute;
  z-index: -1;
  inset: 1.2rem 16.66% auto;
  border-top: 1px solid var(--line);
  content: '';
}

.light-route a {
  display: flex;
  min-height: 2.75rem;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0;
  color: var(--muted);
  font-size: 0.8125rem;
  scroll-margin-top: calc(5.5rem + env(safe-area-inset-top, 0px));
}

.light-stop-number {
  display: grid;
  width: 1.8rem;
  height: 1.8rem;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: var(--wall);
  font-variant-numeric: tabular-nums;
}

.light-route a[aria-current='step'] {
  color: var(--ink);
  font-weight: 600;
}

.light-route a[aria-current='step'] .light-stop-number {
  color: var(--wall-light);
  border-color: var(--ink);
  background: var(--ink);
}

.light-route a:hover {
  text-decoration: underline;
  text-underline-offset: 0.25em;
}

.light-room {
  position: relative;
  isolation: isolate;
  background: linear-gradient(100deg, var(--wall-edge), var(--wall-light) 25%, var(--wall) 65%, var(--wall-edge));
}

.light-room::before {
  position: absolute;
  z-index: -1;
  inset: 0 0 auto;
  height: clamp(2rem, 5vw, 4.75rem);
  clip-path: polygon(0 0, 100% 0, 89% 100%, 11% 100%);
  background:
    linear-gradient(90deg, var(--wall-edge) 19%, transparent 19% 81%, var(--wall-edge) 81%),
    linear-gradient(90deg, transparent 39%, var(--wall) 39% calc(39% + 1px), transparent calc(39% + 1px) 61%, var(--wall) 61% calc(61% + 1px), transparent calc(61% + 1px)),
    linear-gradient(180deg, var(--wall-light), var(--top-light));
  border-bottom: 1px solid color-mix(in srgb, var(--line) 55%, transparent);
  content: '';
}

.light-room-content {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr);
  align-items: center;
  gap: clamp(2rem, 6vw, 6rem);
  max-width: 68rem;
  margin-inline: auto;
  padding: clamp(3rem, 6.1vw, 5.5rem) clamp(2.5rem, 6vw, 5.25rem) clamp(2.25rem, 5vw, 4rem);
}

.light-work {
  width: min(100%, calc(clamp(22rem, 49svh, 28rem) * var(--art-ratio)));
  justify-self: center;
  min-width: 0;
}

.light-frame {
  padding: clamp(0.85rem, 2vw, 1.5rem);
  border: clamp(0.3rem, 0.6vw, 0.55rem) solid var(--frame);
  background: var(--mat);
  box-shadow: 2px 3px 5px rgb(31 24 18 / 18%), 8px 18px 32px -10px rgb(31 24 18 / 32%);
}

.light-frame img {
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
}

.light-plaque {
  margin-top: 1.15rem;
  padding-top: 0.8rem;
  border-top: 1px solid var(--line);
}

.light-plaque h2 {
  width: fit-content;
  max-width: 100%;
  font-size: clamp(1.1rem, 1.7vw, 1.45rem);
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.light-plaque p {
  display: flex;
  flex-wrap: wrap;
  gap: 0.15rem 0.65rem;
  margin-top: 0.4rem;
  color: var(--muted);
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;
}

.light-guide {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 19rem;
}

.light-note {
  order: -1;
}

.light-note h3 {
  max-width: 12em;
  font-size: clamp(1.3rem, 2.2vw, 1.9rem);
  line-height: 1.5;
}

.light-note h3 span {
  display: inline-block;
}

.light-note p {
  margin: 0.7rem 0 1.5rem;
  color: var(--muted);
  font-size: 0.9rem;
  line-height: 1.85;
}

.light-view {
  display: block;
  width: min(100%, 16.5rem);
}

.light-view-window {
  display: block;
  overflow: hidden;
  border: solid;
  border-width: 0.6rem 0.55rem 0.78rem 0.8rem;
  border-color: var(--window-rim);
  box-shadow: 4px 8px 15px -3px rgb(38 30 24 / 30%);
}

.light-view-window img {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 224 / 130;
  object-fit: cover;
  transition: transform 400ms cubic-bezier(.16, 1, .3, 1);
}

.light-view:is(:hover, :focus-visible) img {
  transform: scale(1.045);
}

.light-view-caption {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.45rem;
  min-height: 2.75rem;
  color: var(--muted);
  font-size: 0.8125rem;
}

.light-view-caption strong {
  color: var(--ink);
  font-weight: 500;
  overflow-wrap: anywhere;
}

.light-view:hover strong {
  text-decoration: underline;
  text-underline-offset: 0.25em;
}

.light-text-link {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  gap: 0.4em;
  color: var(--accent);
  font-size: 0.875rem;
  text-decoration: underline;
  text-underline-offset: 0.27em;
}

.light-text-link:hover {
  color: var(--ink);
}

.light-exit {
  border-top: 1px solid var(--line);
  padding-top: 0.3rem;
}

.light-return {
  display: flex;
  flex-wrap: wrap;
  gap: 0 1.1rem;
}

@media (max-width: 47.99rem) {
  .light-opening {
    align-items: start;
  }

  .light-route ol {
    margin-inline-start: -0.8rem;
  }

  .light-room-content {
    grid-template-columns: minmax(0, 1fr);
    gap: clamp(0.9rem, 5vw, 2rem);
    padding-inline: clamp(1rem, 5vw, 2.5rem);
  }

  .light-work {
    width: min(100%, calc(clamp(18rem, 42svh, 23rem) * var(--art-ratio)));
  }

  .light-guide {
    width: 100%;
    max-width: 32rem;
    justify-self: center;
  }

  .light-note {
    order: 0;
  }

  .light-view + .light-note {
    margin-top: 1.1rem;
  }

  .light-note h3 {
    max-width: none;
  }

  .light-view {
    display: grid;
    grid-template-columns: clamp(5.5rem, 25vw, 7rem) minmax(0, 1fr);
    align-items: center;
    gap: 0.65rem;
    width: 100%;
    max-width: 20rem;
  }

  .light-view-window {
    border-width: 0.35rem 0.3rem 0.5rem 0.5rem;
  }

  .light-view-caption {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.1rem 0.45rem;
  }

  .light-view-caption > span:first-child,
  .light-view-caption strong {
    grid-column: 1;
  }

  .light-view-arrow {
    grid-area: 1 / 2 / 3 / 3;
  }

  .light-painted-worlds {
    min-height: 2rem;
    font-size: 0.8125rem;
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

@media (forced-colors: active) {
  .light-route a[aria-current='step'] .light-stop-number {
    border: 2px solid Highlight;
  }
}
</style>
