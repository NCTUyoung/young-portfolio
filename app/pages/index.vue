<template>
  <div class="home">
    <MuseumEntrance :works="heroCollage" />

    <div v-if="photoError || digitalError" role="alert" data-testid="home-gallery-error" class="mx-auto max-w-5xl px-6 py-16 text-stone-700 dark:text-stone-200">
      <p>作品資料暫時無法載入，請重新載入。</p>
      <button type="button" class="mt-3 inline-flex min-h-11 items-center underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-500 disabled:cursor-wait disabled:opacity-60" :disabled="galleryPending" @click="reloadGallery">
        {{ galleryPending ? '載入中…' : '重新載入作品' }}
      </button>
    </div>

    <section id="about" class="home-about" aria-labelledby="home-about-heading">
      <h2 id="home-about-heading" class="home-section-title">關於作者<span lang="ja">作者について</span></h2>
      <div class="home-about__portrait">
        <img :src="avatarPath" alt="Young 的插畫肖像" loading="lazy" decoding="async">
      </div>
      <div class="home-about__text">
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
import MuseumEntrance from '~/components/museum/MuseumEntrance.vue'
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
    art: getThumbPath(artSource, 400),
    artTitle: artwork?.title || '數位繪畫作品',
    main: getThumbPath(heroSource.value, 400),
    mainTitle: photoWorks.find(work => work.filename === heroSource.value)?.title || '攝影作品',
    sub: getThumbPath(subSource, 400),
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
// 與攝影館門旁的主作品同源，依 photographyList.json 的 series=hero 選取。
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
.home { color: var(--museum-ink, var(--fg-1)); }
.home-section-title { margin: 0; font-family: var(--font-jp, 'Noto Serif JP', serif); font-size: clamp(1.5rem, 2.5vw, 2rem); font-weight: 400; line-height: 1.4; letter-spacing: .08em; }
.home-section-title > span { display: block; margin-top: .5rem; color: var(--museum-muted, var(--fg-3)); font-size: .875rem; letter-spacing: .12em; }
.home-about, .home-journey { width: min(calc(100% - 3rem), 1024px); margin-inline: auto; scroll-margin-top: 6rem; }
.home-about {
  display: grid;
  grid-template-columns: minmax(0, .7fr) minmax(0, 1.3fr);
  grid-template-areas: "portrait heading" "portrait bio";
  grid-template-rows: auto 1fr;
  gap: 1.5rem clamp(2rem, 6vw, 5rem);
  padding-block: 6rem;
  border-top: 1px solid var(--museum-line, var(--border));
}
.home-about .home-section-title { grid-area: heading; }
.home-about__portrait { grid-area: portrait; align-self: start; max-width: 300px; padding: .75rem; background: var(--museum-light, var(--bg)); }
.home-about__portrait img { display: block; width: 100%; aspect-ratio: 4 / 5; object-fit: cover; }
.home-about__text { grid-area: bio; min-width: 0; }
.home-about__name { margin: 0 0 .25rem; font-size: 1.5rem; font-weight: 400; letter-spacing: .06em; }
.home-about__medium { margin: 0 0 1.5rem; color: var(--museum-muted, var(--fg-3)); font-size: .875rem; }
.home-about__description { max-width: 65ch; margin: 0 0 1rem; font-size: 1rem; line-height: 1.9; }
.home-about__social { margin-top: 1.5rem; }
.home-about__links { display: flex; flex-wrap: wrap; gap: 1rem 2rem; margin-top: 1.5rem; }
.home-about__links a, .home-signature > a { display: inline-flex; align-items: center; min-height: 44px; color: inherit; font-size: .875rem; text-decoration: underline; text-underline-offset: .4em; text-decoration-thickness: 1px; }
.home-about a:focus-visible, .home-signature a:focus-visible, .home-signature button:focus-visible, .home-journey summary:focus-visible { outline: 2px solid var(--museum-ink, var(--fg-1)); outline-offset: 5px; }
.home-journey { position: relative; padding-block: 0 5rem; }
.home-journey__anchor { position: absolute; top: -6rem; }
.home-journey__intro { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 1.5rem; margin-bottom: 1.5rem; }
.home-journey__intro > p { margin: 0; color: var(--museum-muted, var(--fg-3)); font-size: .9375rem; line-height: 1.8; }
.home-journey__details { border-block: 1px solid var(--museum-line, var(--border)); }
.home-journey__details summary { display: flex; min-height: 64px; justify-content: space-between; align-items: center; gap: 1.5rem; padding-block: 1rem; cursor: pointer; font-size: 1rem; list-style: none; }
.home-journey__details summary::-webkit-details-marker { display: none; }
.home-journey__details summary svg { width: 20px; height: 20px; flex: none; transition: transform .25s ease; }
.home-journey__details[open] summary svg { transform: rotate(180deg); }
.home-journey__details ol { display: grid; gap: 2rem; margin: 0; padding: 1.5rem 0 2.5rem; list-style: none; }
.home-journey__details li { display: grid; grid-template-columns: 5rem minmax(0, 1fr); gap: 1.5rem; }
.home-journey__details time { padding-top: .2rem; color: var(--museum-muted, var(--fg-3)); font-size: .9375rem; font-variant-numeric: tabular-nums; }
.home-journey__details h3 { margin: 0 0 .5rem; font-size: 1.125rem; font-weight: 400; }
.home-journey__details li p { margin: 0; color: var(--museum-muted, var(--fg-3)); font-size: .9375rem; line-height: 1.8; }
.home-signature { padding: 4rem 1.5rem 5rem; text-align: center; background: var(--museum-warm, var(--bg-sub)); }
.home-signature__seal { display: inline-flex; align-items: center; justify-content: center; min-width: 56px; min-height: 56px; background: transparent; border: 0; cursor: pointer; }
.home-signature__name { margin: 1.25rem 0 0; font-family: var(--font-jp, 'Noto Serif JP', serif); font-size: 1.5rem; letter-spacing: .2em; }
.home-signature__line { margin: 1.5rem 0 0; font-family: var(--font-jp, 'Noto Serif JP', serif); color: var(--museum-muted, var(--fg-3)); font-size: 1rem; line-height: 1.8; letter-spacing: .1em; }
.home-signature__year { margin: 1rem 0; color: var(--museum-muted, var(--fg-3)); font-size: .875rem; letter-spacing: .15em; }
@media (max-width: 767px) {
  .home-about {
    grid-template-columns: minmax(0, 1fr) minmax(4rem, 28%);
    grid-template-areas: "heading portrait" "bio bio";
    gap: 1.25rem;
    padding-block: 3rem;
  }
  .home-about__portrait { padding: .35rem; }
  .home-journey { padding-bottom: 3rem; }
  .home-journey__details li { grid-template-columns: 3rem minmax(0, 1fr); gap: 1rem; }
  .home-signature { padding-block: 3rem; }
}
@media (prefers-reduced-motion: reduce) { .home-journey__details summary svg { transition: none; } }
</style>
