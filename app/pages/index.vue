<template>
  <div>
    <h1 class="sr-only">NCTU Young — 數位繪畫與攝影作品集</h1>
    <!-- 繪／影並列入口：展牆與選片光桌 -->
    <section
      class="hero-spread"
      role="region"
      aria-roledescription="封面對開主視覺"
      aria-label="繪と影 — 左繪右影對開扉頁，點任一半進入對應圖片庫"
    >
      <div class="hero-spread__pages">
        <NuxtLink
          to="/gallery/digital"
          class="hero-page hero-page--kai"
          aria-label="進入繪世界 — 繪畫作品展廳"
        >
          <span class="hero-page__gallery-wall" aria-hidden="true"/>
          <span class="hero-page__scene hero-page__scene--kai">
            <span class="hero-page__frame">
              <span class="hero-page__mat">
                <img
                  v-if="heroCollage.art"
                  :src="heroCollage.art"
                  :alt="`電繪作品代表 — ${heroCollage.artTitle}`"
                  class="hero-page__art"
                  fetchpriority="high"
                  loading="eager"
                  decoding="async"
                >
              </span>
            </span>
          </span>
          <span class="hero-page__caption hero-page__caption--kai">
            <span class="hero-page__title hero-page__title--kai">繪作</span>
            <span class="hero-page__detail">{{ heroCollage.artTitle }}</span>
            <span class="hero-page__enter">走進展廳 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg></span>
          </span>
        </NuxtLink>

        <div class="hero-spine" aria-hidden="true">
          <span class="hero-spine__kana font-jp">繪<span>／</span>影</span>
        </div>

        <NuxtLink
          to="/gallery/photography"
          class="hero-page hero-page--kage"
          aria-label="開啟影世界攝影地圖"
        >
          <span class="hero-page__scene hero-page__scene--kage">
            <span class="hero-page__print hero-page__print--sub">
              <img v-if="heroCollage.sub" :src="heroCollage.sub" :alt="heroCollage.subTitle" loading="eager" decoding="async">
            </span>
            <span class="hero-page__print hero-page__print--main">
              <img v-if="heroCollage.main" :src="heroCollage.main" :alt="heroCollage.mainTitle" fetchpriority="high" loading="eager" decoding="async">
            </span>
          </span>
          <span class="hero-page__caption hero-page__caption--kage">
            <span class="hero-page__title hero-page__title--kage">影作</span>
            <span class="hero-page__detail">一張張，從光裡挑出來。</span>
            <span class="hero-page__enter">開啟攝影地圖 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg></span>
          </span>
        </NuxtLink>
      </div>
    </section>

    <div v-if="photoError || digitalError" role="alert" data-testid="home-gallery-error" class="mx-auto max-w-5xl px-6 py-16 text-stone-700 dark:text-stone-200">
      <p>作品資料暫時無法載入，請重新載入。</p>
      <button type="button" class="mt-3 inline-flex min-h-11 items-center underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-500 disabled:cursor-wait disabled:opacity-60" :disabled="galleryPending" @click="reloadGallery">
        {{ galleryPending ? '載入中…' : '重新載入作品' }}
      </button>
    </div>

    <section id="about" class="home-about" aria-labelledby="home-about-heading">
      <div class="home-about__portrait">
        <img :src="avatarPath" alt="Young 的插畫肖像" loading="lazy" decoding="async">
      </div>
      <div class="home-about__text">
        <h2 id="home-about-heading" class="home-section-title">關於作者<span lang="ja">作者について</span></h2>
        <p class="home-about__name">NCTU Young</p>
        <p class="home-about__medium">數位繪畫・攝影</p>
        <p class="home-about__description">插畫自幾何、角色至場景；攝影以街拍、活動與城市夜景為主，用 Nikon Z 系統把當下的光影留下。</p>
        <p class="home-about__description">零碎日常亦會在 Instagram 與 Threads 更新。</p>
        <div class="home-about__social"><SocialMediaLinks variant="bare" /></div>
        <div class="home-about__links">
          <NuxtLink :to="galleryTarget">{{ galleryCtaLabel }}</NuxtLink>
          <NuxtLink to="/article">閱讀文章</NuxtLink>
        </div>
      </div>
    </section>

    <section id="journey" class="home-journey" aria-labelledby="home-journey-heading">
      <span id="dialogue" class="home-journey__anchor" aria-hidden="true" />
      <div class="home-journey__intro">
        <h2 id="home-journey-heading" class="home-section-title">創作沿革<span lang="ja">歩み</span></h2>
        <p>電繪始於 {{ digitalManifesto.startYear }}，攝影始於 {{ photographyManifesto.startYear }}。</p>
      </div>
      <details class="home-journey__details" data-testid="home-journey-details">
        <summary>
          <span>完整創作沿革</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
        </summary>
        <ol>
          <li v-for="milestone in milestones" :key="`${milestone.year}-${milestone.title}`">
            <time :datetime="milestone.year">{{ milestone.year }}</time>
            <div>
              <h3>{{ milestone.title }}</h3>
              <p>{{ milestone.description }}</p>
            </div>
          </li>
        </ol>
      </details>
    </section>

    <section id="epilogue" class="home-signature" aria-label="作者署名">
      <button type="button" class="home-signature__seal" aria-label="回到頁首" @click="scrollToTop">
        <span class="jp-seal" aria-hidden="true"><span class="jp-seal-ink">楊</span></span>
      </button>
      <p class="home-signature__name">Young</p>
      <p class="home-signature__line" lang="ja">影と繪を、同じ墨で。</p>
      <p class="home-signature__year">二〇二六</p>
      <a href="#" @click.prevent="scrollToTop">回到頁首<span aria-hidden="true"> ↑</span></a>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useImagePath } from '~/composables/useImagePath'
import { SEO_CONFIG, SOCIAL_LINKS } from '~~/shared/config/constants'
import { buildPersonSchema, buildWebSiteSchema, toHeadScripts } from '~/utils/siteSchema'
import { useGalleryStore } from '~/stores/gallery'
import { fetchPhotographyWorks, fetchDigitalWorks } from '~/stores/galleryLoaders'

const { getThumbPath } = useImagePath()
const galleryStore = useGalleryStore()
const { digitalManifesto, photographyManifesto } = storeToRefs(galleryStore)
const { data: photoPayload, error: photoError, status: photoStatus, refresh: refreshPhotography } = await useAsyncData('home-photography', fetchPhotographyWorks)
const { data: digitalPayload, error: digitalError, status: digitalStatus, refresh: refreshDigital } = await useAsyncData('home-digital', fetchDigitalWorks)
const galleryPending = computed(() => photoStatus.value === 'pending' || digitalStatus.value === 'pending')

async function reloadGallery () {
  await Promise.all([refreshPhotography(), refreshDigital()])
}

watch(photoPayload, value => {
  if (value) galleryStore.hydrateFromPayload({ photography: value })
}, { immediate: true })
watch(digitalPayload, value => {
  if (value) galleryStore.hydrateFromPayload({ digital: value })
}, { immediate: true })

const avatarPath = getThumbPath('gallery/2024年電繪作品/55.jpg', 400)
const HERO_FALLBACK = 'photography/WBC東京 台澳/DSC_9877-編輯-1.jpg'
const HERO_DIGITAL_FALLBACK = 'gallery/2026年電繪作品/21-編輯-編輯-編輯-1.jpg'
const HERO_PHOTO_SUB_FALLBACK = 'photography/Annber 外拍/DSC_2702-編輯-1.jpg'
const heroSource = computed(() => photoPayload.value?.works?.find(work => work.series?.includes('hero'))?.filename || HERO_FALLBACK)
const heroImage = computed(() => getThumbPath(heroSource.value, 800))
const heroImageAbsolute = computed(() => `${SEO_CONFIG.siteUrl}images/${heroSource.value.split('/').map(encodeURIComponent).join('/')}`)

const heroCollage = computed(() => {
  const digitalWorks = digitalPayload.value?.works ?? []
  const photoWorks = photoPayload.value?.works ?? []
  const artwork = digitalWorks.find(work => work.series?.includes('hero')) || digitalWorks[0]
  const photoSub = photoWorks.find(work => work.series?.includes('hero-2'))
    || photoWorks.find(work => work.series?.includes('featured') && work.filename !== heroSource.value)
    || photoWorks.find(work => work.filename !== heroSource.value)
  const artSource = artwork?.filename || HERO_DIGITAL_FALLBACK
  const subSource = photoSub?.filename || HERO_PHOTO_SUB_FALLBACK
  return {
    art: getThumbPath(artSource, 800),
    artTitle: artwork?.title || '數位繪畫作品',
    main: heroImage.value,
    mainTitle: photoWorks.find(work => work.filename === heroSource.value)?.title || '攝影作品',
    sub: getThumbPath(subSource, 800),
    subTitle: photoSub?.title || '攝影作品'
  }
})

// Preserve existing shared ?focus= links and session-based gallery destinations.
type HeroFocus = 'balanced' | 'kai' | 'kage'
const route = useRoute()
const heroFocus = ref<HeroFocus>('balanced')
onMounted(() => {
  const queryFocus = Array.isArray(route.query.focus) ? route.query.focus[0] : route.query.focus
  if (queryFocus === 'kai' || queryFocus === 'kage') heroFocus.value = queryFocus
  else {
    const stored = window.sessionStorage.getItem('nctu-hero-focus')
    if (stored === 'kai' || stored === 'kage') heroFocus.value = stored
  }
})
const galleryTarget = computed(() => heroFocus.value === 'kai' ? '/gallery/digital' : heroFocus.value === 'kage' ? '/gallery/photography' : '/gallery')
const galleryCtaLabel = computed(() => heroFocus.value === 'kai' ? '瀏覽繪畫作品' : heroFocus.value === 'kage' ? '瀏覽攝影作品' : '瀏覽全部作品')

const milestones = [
  { year: '2018', title: '開始數位繪畫', description: '嘗試幾何風格動物插畫與經典畫作再創作。' },
  { year: '2020', title: '深入角色創作', description: '進行人物角色設計，探索多元的創作風格。' },
  { year: '2024', title: '電繪技法精進', description: '累積大量作品，風格更加成熟與多樣。' },
  { year: '2024', title: '踏入攝影領域', description: '入手 Nikon Z f，開始記錄城市街拍與活動紀實。' },
  { year: '2025', title: '建立作品集', description: '將電繪與攝影整理成個人作品集。' }
]

function scrollToTop () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
}

// SEO — og:image / twitterImage / personImage 皆指向 heroImageAbsolute，
// 與扉頁視覺本體同源；換 hero 張數只需改 photographyList.json 的 series=hero。
// 注意：nuxt.config.ts 的 app.head.meta 也寫了一份 og:image（全站預設），
// useSeoMeta 為 page-level 後註冊，會 **覆寫** 同 property；兩處建議保持一致。
useSeoMeta({
  title: 'NCTU Young - 數位藝術與攝影作品集',
  description:
    'NCTU Young 的個人作品集：數位電繪與攝影。圖片庫依類別與事件瀏覽，攝影附地圖與拍攝資訊。',
  ogTitle: 'Young Portfolio - 數位藝術與攝影',
  ogDescription:
    'NCTU Young 的個人作品集：數位電繪與攝影。圖片庫依類別與事件瀏覽，攝影附地圖與拍攝資訊。',
  ogType: 'website',
  ogUrl: SEO_CONFIG.siteUrl,
  ogImage: () => heroImageAbsolute.value,
  ogImageAlt: () => heroCollage.value.mainTitle,
  twitterCard: 'summary_large_image',
  twitterTitle: 'Young Portfolio - 數位藝術與攝影',
  twitterDescription:
    'NCTU Young 的個人作品集：數位電繪與攝影。圖片庫依類別與事件瀏覽，攝影附地圖與拍攝資訊。',
  twitterImage: () => heroImageAbsolute.value
})

// ===== JSON-LD 結構化資料（Person + WebSite）=====
// Google / Bing 會把 Person 的 sameAs 連向 GitHub/IG/Threads，形成作者
// knowledge graph；ImageGallery / ImageObject 會以 SEO_CONFIG.siteUrl 作 Person
// 主標，所以這裡和 gallery page 的 `gallerySchemaAuthor.url` 保持一致。
// personImage 使用 heroImageAbsolute.value（伺服器端渲染時會 snapshot 一次）。
const siteIdentity = computed(() => ({
  siteUrl: SEO_CONFIG.siteUrl,
  siteName: SEO_CONFIG.siteName,
  siteDescription: SEO_CONFIG.siteDescription,
  personName: 'NCTU Young',
  personAlternateName: 'jimmyyoung1995',
  personJobTitle: 'Digital Painter · Photographer',
  personDescription: SEO_CONFIG.siteDescription,
  personImage: heroImageAbsolute.value,
  socialLinks: [
    SOCIAL_LINKS.github,
    SOCIAL_LINKS.facebook,
    SOCIAL_LINKS.instagram,
    SOCIAL_LINKS.threads
  ],
  knowsAbout: ['Digital Painting', 'Photography', 'Portrait', 'Street Photography']
}))

useHead({
  script: toHeadScripts([
    buildPersonSchema(siteIdentity.value),
    buildWebSiteSchema(siteIdentity.value)
  ])
})
</script>

<style scoped>
/* The two entrances share a viewport but use different viewing surfaces. */
.hero-spread {
  position: relative;
  height: 82svh;
  min-height: 640px;
  overflow: hidden;
  background: #eeeae3;
}
.hero-spread__pages {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  height: 100%;
}
.hero-page {
  position: relative;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  min-width: 0;
  overflow: hidden;
  text-decoration: none;
}
.hero-page--kai {
  color: #302820;
  background: #eee5d6;
}
.hero-page--kage {
  color: #283846;
  background: linear-gradient(155deg, #f1f4f6, #dce5eb);
}
.dark .hero-page--kai {
  color: #eee3d1;
  background: #29241f;
}
.dark .hero-page--kage {
  color: #e2e9ee;
  background: linear-gradient(155deg, #29343c, #18232b);
}
.hero-page__scene {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 0;
}
.hero-page__scene--kai {
  padding: clamp(3rem, 8vh, 7rem) clamp(1.5rem, 5vw, 5rem) 0;
  background: radial-gradient(ellipse 58% 53% at 50% 24%, rgba(255, 252, 241, 0.92), transparent 100%);
}
.dark .hero-page__scene--kai {
  background: radial-gradient(ellipse 58% 53% at 50% 24%, rgba(177, 145, 103, 0.18), transparent 100%);
}
.hero-page__gallery-wall {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(to bottom, transparent 76%, rgba(113, 88, 64, 0.06) 91%, rgba(113, 88, 64, 0.12));
}
.hero-page__frame {
  position: relative;
  display: grid;
  place-items: center;
  width: min(67%, 470px);
  height: min(82%, 520px);
  min-width: 0;
  min-height: 0;
  padding: clamp(5px, 0.65vw, 9px);
  background: #493a2e;
  box-shadow: 0 16px 32px rgba(59, 43, 26, 0.21), 0 3px 7px rgba(59, 43, 26, 0.16);
  transition: transform 550ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 550ms;
}
.hero-page__mat {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  padding: clamp(12px, 2vw, 28px);
  background: #f5f0e5;
  box-shadow: inset 0 0 0 1px rgba(78, 62, 43, 0.18);
}
.hero-page__art {
  display: block;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
}
.dark .hero-page__frame { background: #614d3a; }
.dark .hero-page__mat { background: #dfd4c3; }
.hero-page__scene--kage {
  padding: clamp(2.5rem, 6vh, 5rem) clamp(1.25rem, 4vw, 4rem) 0;
}
.hero-page__print {
  position: absolute;
  display: block;
  padding: clamp(6px, 0.7vw, 10px);
  padding-bottom: clamp(18px, 2.4vw, 34px);
  background: #f8f8f5;
  box-shadow: 0 16px 31px rgba(55, 74, 89, 0.19), 0 3px 6px rgba(55, 74, 89, 0.12);
  transition: transform 550ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 550ms;
}
.hero-page__print img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.hero-page__print--main {
  z-index: 2;
  left: 18%;
  top: 13%;
  width: min(54%, 370px);
  height: 71%;
  transform: rotate(-3deg);
}
.hero-page__print--sub {
  z-index: 1;
  right: 8%;
  top: 30%;
  width: min(39%, 275px);
  height: 54%;
  transform: rotate(7deg);
}
.dark .hero-page__print { background: #dddeda; }
.hero-page__caption {
  z-index: 3;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: baseline;
  column-gap: clamp(1rem, 2.4vw, 2.5rem);
  row-gap: 0.4rem;
  min-height: 120px;
  padding: 1rem clamp(1.5rem, 4.5vw, 4.5rem) clamp(1.5rem, 4vh, 3rem);
}
.hero-page__title {
  font-size: clamp(1.7rem, 2.6vw, 2.6rem);
  line-height: 1.25;
  font-weight: 500;
  white-space: nowrap;
}
.hero-page__title--kai {
  font-family: 'Zen Kaku Gothic New', 'Noto Sans TC', sans-serif;
  letter-spacing: 0.08em;
}
.hero-page__title--kage {
  font-family: 'Shippori Mincho', 'Noto Serif JP', serif;
  letter-spacing: 0.11em;
}
.hero-page__detail {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.8rem;
  letter-spacing: 0.04em;
  opacity: 0.78;
}
.hero-page__enter {
  grid-column: 2;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  width: fit-content;
  border-bottom: 1px solid currentColor;
  padding-bottom: 0.2rem;
  font-size: 0.83rem;
  letter-spacing: 0.08em;
}
.hero-page__enter svg {
  width: 1rem;
  height: 1rem;
  transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
}
.hero-page--kai:hover .hero-page__frame,
.hero-page--kai:focus-visible .hero-page__frame {
  transform: translateY(-5px);
  box-shadow: 0 24px 42px rgba(59, 43, 26, 0.24), 0 5px 10px rgba(59, 43, 26, 0.15);
}
.hero-page--kage:hover .hero-page__print--main,
.hero-page--kage:focus-visible .hero-page__print--main {
  transform: translateY(-10px) rotate(-1deg);
  box-shadow: 0 25px 42px rgba(55, 74, 89, 0.24), 0 6px 12px rgba(55, 74, 89, 0.15);
}
.hero-page:hover .hero-page__enter svg,
.hero-page:focus-visible .hero-page__enter svg { transform: translate(2px, -2px); }
.hero-page:focus-visible { outline: 3px solid #9d592e; outline-offset: -5px; }
.dark .hero-page:focus-visible { outline-color: #d2ad83; }
.hero-spine {
  position: absolute;
  z-index: 4;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
  background: rgba(90, 76, 64, 0.22);
  pointer-events: none;
}
.hero-spine__kana {
  position: absolute;
  top: 2rem;
  left: 50%;
  transform: translateX(-50%);
  writing-mode: vertical-rl;
  padding: 0.7rem 0.3rem;
  background: #f1eee8;
  font-size: 0.9rem;
  letter-spacing: 0.28em;
  white-space: nowrap;
  color: #554e49;
}
.hero-spine__kana span { opacity: 0.48; }
.dark .hero-spine { background: rgba(230, 222, 211, 0.22); }
.dark .hero-spine__kana { color: #e3d6c7; background: #282b2b; }
@media (max-width: 1023px) {
  .hero-spread { height: 83svh; min-height: 610px; }
  .hero-spread__pages { grid-template-columns: 1fr; grid-template-rows: minmax(0, 1fr) minmax(0, 1fr); }
  .hero-page__scene--kai { padding: 1.2rem 1.2rem 0; }
  .hero-page__scene--kage { padding: 0.8rem 1.2rem 0; }
  .hero-page__frame { width: min(45%, 255px); height: 84%; }
  .hero-page__print--main { left: 23%; top: 6%; width: min(42%, 260px); height: 82%; }
  .hero-page__print--sub { right: 15%; top: 18%; width: min(32%, 200px); height: 65%; }
  .hero-page__caption {
    min-height: 74px;
    padding: 0.3rem 1.5rem 1rem;
    column-gap: 1rem;
  }
  .hero-page__title { font-size: 1.35rem; }
  .hero-page__detail { font-size: 0.72rem; }
  .hero-page__enter { font-size: 0.74rem; }
  .hero-spine { top: 50%; bottom: auto; left: 0; right: 0; width: auto; height: 1px; }
  .hero-spine__kana {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    writing-mode: horizontal-tb;
    padding: 0.25rem 0.8rem;
    font-size: 0.75rem;
  }
}
@media (max-width: 480px) {
  .hero-page__frame { width: min(52%, 205px); }
  .hero-page__print--main { left: 17%; width: 51%; }
  .hero-page__print--sub { right: 10%; width: 39%; }
  .hero-page__caption { grid-template-columns: auto minmax(0, 1fr); }
}
@media (prefers-reduced-motion: reduce) {
  .hero-page__frame, .hero-page__print, .hero-page__enter svg { transition: none; }
  .hero-page:hover .hero-page__frame,
  .hero-page:focus-visible .hero-page__frame,
  .hero-page:hover .hero-page__print--main,
  .hero-page:focus-visible .hero-page__print--main,
  .hero-page:hover .hero-page__enter svg,
  .hero-page:focus-visible .hero-page__enter svg { transform: none; }
}

.home-section-title { margin: 0; font-family: var(--font-jp, 'Noto Serif JP', serif); font-size: clamp(1.5rem, 2.5vw, 2rem); font-weight: 400; line-height: 1.4; letter-spacing: .08em; }
.home-section-title > span { display: block; margin-top: .5rem; color: #78716c; font-size: .875rem; letter-spacing: .12em; }
.home-about, .home-journey { width: min(calc(100% - 3rem), 1024px); margin-inline: auto; scroll-margin-top: 6rem; }
.home-about { display: grid; grid-template-columns: minmax(0, .7fr) minmax(0, 1.3fr); gap: clamp(2rem, 6vw, 5rem); padding-block: 6rem; border-top: 1px solid #d6d3d1; }
.home-about__portrait { align-self: start; max-width: 300px; padding: .75rem; background: #f5f0e5; }
.home-about__portrait img { display: block; width: 100%; aspect-ratio: 4 / 5; object-fit: cover; }
.home-about__text { min-width: 0; }
.home-about__name { margin: 2rem 0 .25rem; font-size: 1.5rem; font-weight: 400; letter-spacing: .06em; }
.home-about__medium { margin: 0 0 1.5rem; color: #57534e; font-size: .875rem; }
.home-about__description { max-width: 65ch; margin: 0 0 1rem; color: #44403c; font-size: 1rem; line-height: 1.9; }
.home-about__social { margin-top: 1.5rem; }
.home-about__links { display: flex; flex-wrap: wrap; gap: 1rem 2rem; margin-top: 1.5rem; }
.home-about__links a, .home-signature > a { display: inline-flex; align-items: center; min-height: 44px; color: inherit; font-size: .875rem; text-decoration: underline; text-underline-offset: .4em; text-decoration-thickness: 1px; }
.home-about a:focus-visible, .home-signature a:focus-visible, .home-signature button:focus-visible, .home-journey summary:focus-visible { outline: 2px solid #9d592e; outline-offset: 5px; }
.home-journey { position: relative; padding-block: 0 5rem; }
.home-journey__anchor { position: absolute; top: -6rem; }
.home-journey__intro { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 1.5rem; margin-bottom: 1.5rem; }
.home-journey__intro > p { margin: 0; color: #57534e; font-size: .9375rem; line-height: 1.8; }
.home-journey__details { border-block: 1px solid #d6d3d1; }
.home-journey__details summary { display: flex; min-height: 64px; justify-content: space-between; align-items: center; gap: 1.5rem; padding-block: 1rem; cursor: pointer; color: #44403c; font-size: 1rem; list-style: none; }
.home-journey__details summary::-webkit-details-marker { display: none; }
.home-journey__details summary svg { width: 20px; height: 20px; flex: none; transition: transform .25s ease; }
.home-journey__details[open] summary svg { transform: rotate(180deg); }
.home-journey__details ol { display: grid; gap: 2rem; margin: 0; padding: 1.5rem 0 2.5rem; list-style: none; }
.home-journey__details li { display: grid; grid-template-columns: 5rem minmax(0, 1fr); gap: 1.5rem; }
.home-journey__details time { padding-top: .2rem; color: #78716c; font-size: .9375rem; font-variant-numeric: tabular-nums; }
.home-journey__details h3 { margin: 0 0 .5rem; font-size: 1.125rem; font-weight: 400; }
.home-journey__details li p { margin: 0; color: #57534e; font-size: .9375rem; line-height: 1.8; }
.home-signature { padding: 4rem 1.5rem 5rem; text-align: center; background: #f5f5f4; }
.home-signature__seal { display: inline-flex; align-items: center; justify-content: center; min-width: 56px; min-height: 56px; background: transparent; border: 0; cursor: pointer; }
.home-signature__name { margin: 1.25rem 0 0; font-family: var(--font-jp, 'Noto Serif JP', serif); font-size: 1.5rem; letter-spacing: .2em; }
.home-signature__line { margin: 1.5rem 0 0; font-family: var(--font-jp, 'Noto Serif JP', serif); color: #57534e; font-size: 1rem; line-height: 1.8; letter-spacing: .1em; }
.home-signature__year { margin: 1rem 0; color: #78716c; font-size: .875rem; letter-spacing: .15em; }
.dark .home-section-title > span, .dark .home-journey__details time, .dark .home-signature__year { color: #a8a29e; }
.dark .home-about, .dark .home-journey__details { border-color: #57534e; }
.dark .home-about__portrait { background: #403b35; }
.dark .home-about__medium, .dark .home-about__description, .dark .home-journey__intro > p, .dark .home-journey__details summary, .dark .home-journey__details li p, .dark .home-signature__line { color: #d6d3d1; }
.dark .home-signature { background: #292524; }
.dark .home-about a:focus-visible, .dark .home-signature a:focus-visible, .dark .home-signature button:focus-visible, .dark .home-journey summary:focus-visible { outline-color: #d2ad83; }
@media (max-width: 767px) {
  .home-about, .home-journey { width: min(calc(100% - 3rem), 1024px); }
  .home-about { grid-template-columns: 1fr; gap: 2rem; padding-block: 3rem; }
  .home-about__portrait { width: min(52%, 200px); }
  .home-about__name { margin-top: 1.5rem; }
  .home-journey { padding-bottom: 3rem; }
  .home-journey__details li { grid-template-columns: 3rem minmax(0, 1fr); gap: 1rem; }
  .home-signature { padding-block: 3rem; }
}
@media (prefers-reduced-motion: reduce) { .home-journey__details summary svg { transition: none; } }
</style>
