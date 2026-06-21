<template>
  <div ref="pageRef">
    <!-- =====================================================================
         Hero — 編集中（書扉式版心，與全站日式排版同步）
         2026-04-28：依 design brief priority 5，移除高飽和橘色 CTA + blob 裝飾，
                     改 jp-section-title / hairline / 縦書き「文」收尾。
                     CTA 採 underline + → 箭頭，與 Home Hero 的「作品を見る」同 family。
         ===================================================================== -->
    <section class="relative py-16 lg:py-24 overflow-hidden">
      <!-- 背景大字「文」（與侘寂段落同手法，淡水印） -->
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span class="font-jp text-[clamp(10rem,24vw,20rem)] font-extralight text-stone-200/25 dark:text-stone-800/22 leading-none tracking-wider">文</span>
      </div>

      <div class="relative max-w-5xl mx-auto px-6 sm:px-10 lg:px-16">
        <header class="reveal mb-10 lg:mb-14 flex items-baseline justify-between flex-wrap gap-4">
          <h1 class="jp-section-title text-4xl sm:text-5xl">文章
            <span class="jp-section-ruby">Writings</span>
          </h1>
          <span class="jp-vertical-caption hidden lg:inline-block">編集中</span>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          <!--
            R38：dual-frame 拼貼取代 jp-frame 縱書（critic R37 ⚠）
            兩格：左上「繪 · 設計心得」縱書 + 右下「影 · 器材評測」橫書 — 兩章對位
            不再寫「文字は思考の足跡」獨白，改為「兩章已刊」視覺證據
          -->
          <div class="reveal-left lg:col-span-5 relative">
            <div class="article-hero-pair">
              <!-- 上格：繪 · 設計心得 縱書（accent rail） -->
              <NuxtLink
                to="/article/design-thinking"
                class="article-hero-pair__cell article-hero-pair__cell--kai group"
                aria-label="繪 · 設計心得 章節"
              >
                <span class="article-hero-pair__index">其の一</span>
                <span class="article-hero-pair__kana writing-vertical">設計心得</span>
                <span class="article-hero-pair__strongest">為什麼這格的色塊比那格重要</span>
                <span class="article-hero-pair__cta">繪 · 4 min · 公開 →</span>
              </NuxtLink>

              <!-- 下格：影 · 器材評測 橫書（slate rail） -->
              <NuxtLink
                to="/article/gear-119mm"
                class="article-hero-pair__cell article-hero-pair__cell--kage group"
                aria-label="影 · 器材評測 章節"
              >
                <span class="article-hero-pair__index">其の四</span>
                <span class="article-hero-pair__kana">器材評測</span>
                <span class="article-hero-pair__strongest">119mm 看小腿和板凳</span>
                <span class="article-hero-pair__cta">影 · 5 min · 公開 →</span>
              </NuxtLink>
            </div>
          </div>

          <!--
            右：新刊 hero（R37 — 取代「編集中」單卡）
            已刊 2 章（設計心得 + 器材評測），不再說謊。
          -->
          <div class="lg:col-span-7 lg:pl-4">
            <p class="reveal jp-eyebrow text-accent-500 dark:text-accent-400"><span>New This Week · 新刊</span></p>
            <p class="reveal reveal-delay-1 mt-4 font-jp text-2xl tracking-[0.3em] text-stone-800 dark:text-stone-100 font-light">
              設計心得 · 器材評測
            </p>
            <p class="reveal reveal-delay-1 mt-2 text-xs tracking-[0.45em] uppercase text-stone-500 dark:text-stone-400 font-light">繪 × 影 — Two chapters live</p>

            <div class="reveal reveal-delay-1 jp-hairline my-8 max-w-xs"/>

            <p class="reveal reveal-delay-2 jp-body text-[0.95rem] max-w-xl">
              文章共四章，目前已刊兩章——繪軌的「設計心得」與影軌的「器材評測」。其餘編纂中。
            </p>

            <div class="reveal reveal-delay-3 mt-10 lg:mt-14 flex flex-wrap items-center gap-x-6 gap-y-4">
              <NuxtLink
                to="/article/design-thinking"
                class="group inline-flex items-center gap-3 text-stone-800 dark:text-stone-100 border-b border-stone-400/70 dark:border-stone-500/70 pb-2 pr-2 hover:border-accent-500 dark:hover:border-accent-400 transition-colors duration-500"
              >
                <span class="font-jp tracking-[0.25em] text-lg">繪 · 設計心得</span>
                <svg class="w-4 h-4 text-stone-500 dark:text-stone-400 transition-transform duration-500 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </NuxtLink>
              <NuxtLink
                to="/article/gear-119mm"
                class="group inline-flex items-center gap-3 text-stone-800 dark:text-stone-100 border-b border-stone-400/70 dark:border-stone-500/70 pb-2 pr-2 hover:border-accent-500 dark:hover:border-accent-400 transition-colors duration-500"
              >
                <span class="font-jp tracking-[0.25em] text-lg">影 · 器材評測</span>
                <svg class="w-4 h-4 text-stone-500 dark:text-stone-400 transition-transform duration-500 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!--
      R30：序 · PROLOGUE — site-wide 三段詞彙系統終於覆蓋 article。
      把 hero/gallery 已有的「序」motif 落到文章頁，串起 home→gallery→article→home 閉環。
      內容簡短而具體：本頁是什麼、要怎麼讀。
    -->
    <section class="reveal relative py-12 lg:py-16">
      <div class="max-w-3xl mx-auto px-6 sm:px-10 article-prologue-wrap">
        <div class="article-prologue-divider" aria-hidden="true">
          <span class="article-prologue-divider__line"/>
          <span class="article-prologue-divider__dot"/>
          <span class="article-prologue-divider__line"/>
        </div>
        <p class="article-prologue-eyebrow">序 · PROLOGUE</p>
        <p class="jp-body article-prologue-body">
          這裡是兩條軌道的反芻：電繪和攝影各自走過的路，會在這頁長成文字。<br>
          目次以「繪／影／両」標記每章的偏重——讀者可以從感興趣的軌道跳入。
        </p>
        <div class="article-prologue-tracks" aria-label="Track legend">
          <span class="article-prologue-chip article-prologue-chip--kai">
            <span class="font-jp">繪</span> Digital lean
          </span>
          <span class="article-prologue-chip article-prologue-chip--kage">
            <span class="font-jp">影</span> Photography lean
          </span>
          <span class="article-prologue-chip article-prologue-chip--mix">
            <span class="font-jp">両</span> Both tracks
          </span>
        </div>
      </div>
    </section>

    <!-- =====================================================================
         目次 — 預告（書頁式 table-of-contents，非 generic feature cards）
         2026-04-28：依 design brief priority 5，preview cards 改成「目次條列」式：
                     章碼（其一／其二）+ 漢字大號 + 標題 + 描述 + hairline。
                     不再用圓角卡片 + 圖示色塊，回歸 stone + hairline + 余白。
         R30：每章帶 track 分類（繪 / 影 / 両），與 hero focus toggle 對位。
         ===================================================================== -->
    <section class="relative py-16 lg:py-24 bg-stone-100/40 dark:bg-stone-800/25">
      <div class="jp-hairline absolute top-0 left-0 right-0"/>
      <div class="max-w-5xl mx-auto px-6 sm:px-10 lg:px-16">
        <header class="reveal mb-10 lg:mb-14 flex items-baseline justify-between flex-wrap gap-4">
          <h2 class="jp-section-title text-3xl sm:text-4xl">目次
            <span class="jp-section-ruby">Index</span>
          </h2>
          <span class="text-[0.7rem] tracking-[0.4em] text-stone-400 dark:text-stone-500 uppercase">{{ previews.length }} Chapters · 予定</span>
        </header>

        <ol class="space-y-0 divide-y divide-stone-200/70 dark:divide-stone-700/40 border-y border-stone-200/70 dark:border-stone-700/40">
          <li
            v-for="(preview, index) in previews"
            :key="preview.title"
            class="reveal py-6 lg:py-8 group article-toc-row"
            :class="[`reveal-delay-${Math.min(index + 1, 5)}`, `article-toc-row--${preview.track}`, { 'article-toc-row--linked': preview.slug }]"
          >
            <component
              :is="preview.slug ? 'NuxtLink' : 'article'"
              :to="preview.slug ? `/article/${preview.slug}` : undefined"
              class="grid grid-cols-12 gap-4 lg:gap-8 items-baseline article-toc-link"
            >
              <!-- 章碼（漢數字）+ 漢字 -->
              <div class="col-span-12 sm:col-span-3 lg:col-span-2 flex sm:flex-col items-baseline sm:items-start gap-3 sm:gap-1 relative">
                <p class="jp-kansuji text-xs tracking-[0.4em] text-stone-400 dark:text-stone-500">{{ preview.kansuji }}</p>
                <p class="font-jp text-3xl sm:text-4xl font-extralight tracking-[0.2em] text-stone-700 dark:text-stone-200 leading-none">{{ preview.kanji }}</p>
              </div>

              <!-- 標題 + track 標 + 章首詩 + 描述 -->
              <div class="col-span-12 sm:col-span-9 lg:col-span-9">
                <div class="flex items-baseline flex-wrap gap-3">
                  <h3 class="font-jp text-lg lg:text-xl font-light tracking-[0.2em] text-stone-800 dark:text-stone-100 group-hover:text-accent-700 dark:group-hover:text-accent-400 transition-colors">
                    {{ preview.title }}
                  </h3>
                  <span class="article-toc-track">
                    <span class="article-toc-track__kana font-jp">{{ preview.trackKana }}</span>
                    <span class="article-toc-track__label">{{ preview.trackLabel }}</span>
                  </span>
                </div>
                <p class="article-toc-strongest font-jp">「{{ preview.strongestLine }}」</p>
                <p class="jp-body text-sm mt-2 text-stone-600 dark:text-stone-400 max-w-2xl">
                  {{ preview.description }}
                </p>
              </div>

              <!-- 狀態：公開 / 予定 -->
              <div class="hidden lg:flex col-span-1 justify-end items-baseline gap-2">
                <span
                  class="text-[0.65rem] tracking-[0.4em] uppercase"
                  :class="preview.slug
                    ? 'text-accent-600 dark:text-accent-400'
                    : 'text-stone-400 dark:text-stone-500'"
                >
                  {{ preview.slug ? '公開' : '予定' }}
                </span>
                <span
                  v-if="preview.slug"
                  class="text-accent-600 dark:text-accent-400 transition-transform duration-500 group-hover:translate-x-1"
                  aria-hidden="true"
                >→</span>
              </div>
            </component>
          </li>
        </ol>

        <p class="reveal mt-10 text-center text-[0.65rem] tracking-[0.5em] uppercase text-stone-400 dark:text-stone-500">
          To Be Continued · 続く
        </p>
      </div>
    </section>

    <!-- =====================================================================
         引言（直書、極簡，與 Home 侘寂段落同 family）
         ===================================================================== -->
    <section class="reveal relative py-16 lg:py-24 overflow-hidden">
      <div class="relative max-w-3xl mx-auto px-6 flex items-center justify-center gap-12">
        <!-- 直書引言（桌機） -->
        <blockquote class="hidden md:flex writing-vertical font-jp text-2xl lg:text-3xl font-extralight tracking-[0.4em] text-stone-700 dark:text-stone-200 leading-[2.2]">
          文字は思考の足跡<span class="mx-4"/>一篇は一度の対話
        </blockquote>

        <!-- 橫書引言（手機） -->
        <blockquote class="md:hidden font-jp text-xl font-extralight tracking-[0.3em] text-stone-700 dark:text-stone-200 leading-[2] text-center">
          「文字は思考の足跡，<br>一篇は一度の対話。」
        </blockquote>

        <!-- 署名（直書） -->
        <div class="hidden md:flex flex-col items-center gap-3 text-stone-400 dark:text-stone-500">
          <div class="w-px h-8 bg-stone-400/60 dark:bg-stone-500/60"/>
          <span class="writing-vertical font-jp text-[0.7rem] tracking-[0.6em]">編集中</span>
          <div class="w-px h-8 bg-stone-400/60 dark:bg-stone-500/60"/>
        </div>
      </div>
    </section>

    <!-- =====================================================================
         奥付 · COLOPHON
         R26 — site-wide 三段詞彙系統（卷頭語 / 對頁註 / 奥付）跨頁延伸到 article。
         書末出版資訊的編輯結尾，配 jp-seal 落款印 + accent 朱印小點。
         ===================================================================== -->
    <section class="reveal py-14 lg:py-20 relative">
      <div class="max-w-2xl mx-auto px-6">
        <!-- 章節記號 — accent ink dot + gradient hairline -->
        <div class="article-colophon-divider" aria-hidden="true">
          <span class="article-colophon-divider__line"/>
          <span class="article-colophon-divider__dot"/>
          <span class="article-colophon-divider__line"/>
        </div>

        <p class="article-colophon-eyebrow">奥付 · COLOPHON</p>

        <dl class="article-colophon-list">
          <div>
            <dt>版次</dt>
            <dd class="jp-kansuji">第二六刷 · 26TH PRINT</dd>
          </div>
          <div>
            <dt>編者</dt>
            <dd>Young / NCTU · 楊</dd>
          </div>
          <div>
            <dt>所在</dt>
            <dd class="jp-kansuji">Taipei · 台北</dd>
          </div>
          <div>
            <dt>初出</dt>
            <dd class="jp-kansuji">2018·02·13 · FIRST COMMIT</dd>
          </div>
          <div>
            <dt>版型</dt>
            <dd>Nuxt 4 · SSG · 和紙の余白</dd>
          </div>
        </dl>

        <!-- 落款印 — jp-seal「文」與 hero 對稱呼應 -->
        <div class="article-colophon-seal-row">
          <span class="article-colophon-hairline" aria-hidden="true"/>
          <span class="jp-seal jp-seal--c" aria-hidden="true">文</span>
          <span class="article-colophon-hairline" aria-hidden="true"/>
        </div>

        <p class="article-colophon-tail">
          影と繪を、同じ墨で。<br>
          <span class="article-colophon-tail__roman">SHADOWS AND STROKES · ONE INK</span>
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useScrollReveal } from '~/composables/useScrollReveal'

const { observeAll } = useScrollReveal()
const pageRef = ref<HTMLElement | null>(null)

/**
 * 目次預告 — R30 起每章帶 track 分類（繪 / 影 / 両），把 dual-track motif
 * 從 hero / gallery 跨頁延伸到 article，完成 site-wide 敘事閉環。
 * track 對應 hero focus toggle 三態，UI 上以 kana + accent rail 標識。
 */
type ChapterTrack = 'kai' | 'kage' | 'mix'
interface ChapterPreview {
  kansuji: string
  kanji: string
  title: string
  strongestLine: string
  description: string
  track: ChapterTrack
  trackKana: '繪' | '影' | '両'
  trackLabel: string
  /** R36：第一章上線後接動態路由 /article/[slug]；空 = 予定 */
  slug?: string
}

const previews: ChapterPreview[] = [
  {
    kansuji: '其の一',
    kanji: '思',
    title: '設計心得',
    strongestLine: '為什麼這格的色塊比那格重要',
    description: '從一張白紙到一張畫的思考路徑：構圖、留白、為什麼這格的色塊比那格重要。電繪思維為主，攝影構圖為輔。',
    track: 'kai',
    trackKana: '繪',
    trackLabel: 'Digital lean',
    slug: 'design-thinking'
  },
  {
    kansuji: '其の二',
    kanji: '築',
    title: '技術筆記',
    strongestLine: '這個站本身就是教材',
    description: 'Vue / Nuxt / Tailwind 工程筆記。SSG、Pinia store、payload 拆分都會寫進來。',
    track: 'mix',
    trackKana: '両',
    trackLabel: 'Dual-track tooling'
  },
  {
    kansuji: '其の三',
    kanji: '語',
    title: '創作故事',
    strongestLine: '對頁註的長版',
    description: '每張圖背後的時間與場合：電繪某一筆為什麼下、攝影某一張為什麼按。',
    track: 'mix',
    trackKana: '両',
    trackLabel: 'Both tracks'
  },
  {
    kansuji: '其の四',
    kanji: '具',
    title: '器材評測',
    strongestLine: '119mm 看小腿和板凳',
    description: 'Nikon Z f + 119mm 鏡頭場邊現場、Procreate / Photoshop 工作流。',
    track: 'kage',
    trackKana: '影',
    trackLabel: 'Photography lean',
    slug: 'gear-119mm'
  }
]

onMounted(() => {
  observeAll(pageRef.value)
})

// 頁面 meta
useSeoMeta({
  title: '文章專區',
  description: '分享設計心得、技術筆記與創作故事。',
  ogTitle: '文章專區 - 設計心得與技術筆記',
  ogDescription: '分享設計過程、技術筆記與創作背後的故事，文章功能即將推出。',
  ogType: 'website',
  ogUrl: 'https://nctuyoung.github.io/young-portfolio/article',
  ogImage: 'https://nctuyoung.github.io/young-portfolio/images/gallery/2024年電繪作品/23.jpg',
  twitterCard: 'summary_large_image'
})
</script>

<style scoped>
/* ===== 序 · PROLOGUE (R30) ===== */
.article-prologue-wrap { position: relative; }
.article-prologue-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.85rem;
  margin-bottom: 1.6rem;
}
.article-prologue-divider__line {
  flex: 1;
  max-width: 120px;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    rgb(168 162 158 / 0.4),
    transparent
  );
}
.article-prologue-divider__dot {
  width: 5px;
  height: 5px;
  border-radius: 9999px;
  background: rgb(217 123 46 / 0.85);
  box-shadow: 0 0 0 4px rgb(217 123 46 / 0.08);
}
.article-prologue-eyebrow {
  text-align: center;
  font-size: 0.62rem;
  letter-spacing: 0.4em;
  color: rgb(217 123 46 / 0.9);
  text-transform: uppercase;
  font-weight: 300;
  margin: 0 0 1.2rem;
}
.article-prologue-body {
  text-align: left;
  max-width: 38rem;
  margin: 0 auto;
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  font-size: 0.95rem;
  line-height: 2.05;
  color: rgb(68 64 60);
  font-weight: 300;
}
:global(.dark) .article-prologue-body { color: rgb(214 211 209 / 0.92); }

.article-prologue-tracks {
  display: flex;
  justify-content: center;
  gap: 0.6rem 1.1rem;
  flex-wrap: wrap;
  margin-top: 1.6rem;
}
.article-prologue-chip {
  display: inline-flex;
  align-items: baseline;
  gap: 0.5rem;
  padding: 0.32rem 0.8rem;
  font-size: 0.66rem;
  letter-spacing: 0.28em;
  color: rgb(120 113 108);
  background: rgb(245 244 240 / 0.65);
  border: 1px solid rgb(168 162 158 / 0.28);
  border-radius: 9999px;
  font-weight: 300;
}
:global(.dark) .article-prologue-chip {
  color: rgb(168 162 158);
  background: rgb(41 37 36 / 0.45);
  border-color: rgb(120 113 108 / 0.32);
}
.article-prologue-chip span:first-child {
  font-size: 0.95rem;
  color: rgb(68 64 60);
}
:global(.dark) .article-prologue-chip span:first-child {
  color: rgb(231 229 228 / 0.92);
}
.article-prologue-chip--kai span:first-child { color: rgb(217 123 46); }
.article-prologue-chip--kage span:first-child { color: rgb(82 100 122); }
.article-prologue-chip--mix span:first-child { color: rgb(120 113 108); }
:global(.dark) .article-prologue-chip--kai span:first-child { color: rgb(231 184 125); }
:global(.dark) .article-prologue-chip--kage span:first-child { color: rgb(154 173 197); }

/* ===== ToC row track 變化 (R30) ===== */
.article-toc-row {
  position: relative;
  transition: background-color 0.4s ease;
}
.article-toc-row::before {
  content: '';
  position: absolute;
  left: -0.6rem;
  top: 1.2rem;
  bottom: 1.2rem;
  width: 2px;
  border-radius: 1px;
  background: transparent;
  transition: background 0.4s ease;
}
.article-toc-row--kai::before { background: rgb(217 123 46 / 0.4); }
.article-toc-row--kage::before { background: rgb(82 100 122 / 0.4); }
.article-toc-row--mix::before {
  background: linear-gradient(
    to bottom,
    rgb(217 123 46 / 0.4) 0%,
    rgb(82 100 122 / 0.4) 100%
  );
}
.article-toc-row:hover::before { width: 3px; }

/* R37/38：未公開章節 (沒有 slug) — 淡化 + a11y 邊界 (0.72 而非 0.62) */
.article-toc-row:not(.article-toc-row--linked) {
  opacity: 0.72;
}
.article-toc-row:not(.article-toc-row--linked) .article-toc-link {
  cursor: default;
}
.article-toc-row:not(.article-toc-row--linked):hover {
  opacity: 0.85;
}
.article-toc-link {
  text-decoration: none;
  color: inherit;
  display: grid;
}

/* ===== R38 article hero dual-frame ===== */
.article-hero-pair {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  width: 100%;
  max-width: 26rem;
}
.article-hero-pair__cell {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding: 1.25rem 1.4rem;
  background: rgb(245 244 240);
  border: 1px solid rgb(168 162 158 / 0.22);
  text-decoration: none;
  color: inherit;
  transition: background-color 0.4s ease, border-color 0.4s ease, transform 0.4s ease;
  min-height: 9.5rem;
}
:global(.dark) .article-hero-pair__cell {
  background: rgb(28 25 23 / 0.5);
  border-color: rgb(120 113 108 / 0.32);
}
.article-hero-pair__cell::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.6rem;
  bottom: 0.6rem;
  width: 2px;
  border-radius: 1px;
}
.article-hero-pair__cell--kai::before { background: rgb(217 123 46 / 0.6); }
.article-hero-pair__cell--kage::before { background: rgb(82 100 122 / 0.6); }
.article-hero-pair__cell:hover {
  background: rgb(250 250 249);
  border-color: rgb(217 123 46 / 0.45);
  transform: translateY(-2px);
}
:global(.dark) .article-hero-pair__cell:hover {
  background: rgb(41 37 36 / 0.6);
}

.article-hero-pair__index {
  font-size: 0.6rem;
  letter-spacing: 0.4em;
  color: rgb(120 113 108);
  text-transform: uppercase;
  font-family: 'Noto Serif JP', serif;
}
:global(.dark) .article-hero-pair__index { color: rgb(168 162 158); }

.article-hero-pair__kana {
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  font-size: 1.5rem;
  letter-spacing: 0.12em;
  font-weight: 300;
  color: rgb(68 64 60);
  line-height: 1.3;
}
:global(.dark) .article-hero-pair__kana { color: rgb(231 229 228); }
/* writing-vertical 限縮高度避免單格被擠掉 */
.article-hero-pair__cell--kai .article-hero-pair__kana.writing-vertical {
  max-height: 6.5rem;
}

.article-hero-pair__strongest {
  font-family: 'Noto Serif JP', serif;
  font-size: 0.9rem;
  line-height: 1.7;
  letter-spacing: 0.04em;
  color: rgb(120 113 108);
  font-weight: 300;
}
:global(.dark) .article-hero-pair__strongest { color: rgb(168 162 158); }

.article-hero-pair__cta {
  margin-top: auto;
  font-size: 0.65rem;
  letter-spacing: 0.34em;
  text-transform: uppercase;
  color: rgb(217 123 46);
  transition: transform 0.3s ease;
}
.article-hero-pair__cell--kage .article-hero-pair__cta {
  color: rgb(82 100 122);
}
:global(.dark) .article-hero-pair__cell--kai .article-hero-pair__cta { color: rgb(231 184 125); }
:global(.dark) .article-hero-pair__cell--kage .article-hero-pair__cta { color: rgb(154 173 197); }
.article-hero-pair__cell:hover .article-hero-pair__cta { transform: translateX(3px); }
.article-toc-row--linked .article-toc-link {
  cursor: pointer;
}
.article-toc-track {
  display: inline-flex;
  align-items: baseline;
  gap: 0.4rem;
  padding: 0.15rem 0.55rem;
  font-size: 0.62rem;
  letter-spacing: 0.28em;
  color: rgb(120 113 108 / 0.85);
  border: 1px solid rgb(168 162 158 / 0.28);
  border-radius: 9999px;
  font-weight: 300;
  white-space: nowrap;
}
:global(.dark) .article-toc-track {
  color: rgb(168 162 158);
  border-color: rgb(120 113 108 / 0.4);
}
.article-toc-track__kana {
  font-size: 0.85rem;
  letter-spacing: 0.05em;
  color: rgb(68 64 60);
}
:global(.dark) .article-toc-track__kana { color: rgb(231 229 228); }
.article-toc-row--kai .article-toc-track__kana { color: rgb(217 123 46); }
.article-toc-row--kage .article-toc-track__kana { color: rgb(82 100 122); }
:global(.dark) .article-toc-row--kai .article-toc-track__kana { color: rgb(231 184 125); }
:global(.dark) .article-toc-row--kage .article-toc-track__kana { color: rgb(154 173 197); }
.article-toc-track__label { letter-spacing: 0.28em; text-transform: uppercase; }

/* R35：章首詩 strongest_line 顯示 */
.article-toc-strongest {
  margin: 0.7rem 0 0;
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  font-size: 1.02rem;
  letter-spacing: 0.06em;
  line-height: 1.7;
  color: rgb(120 113 108);
  font-weight: 300;
}
:global(.dark) .article-toc-strongest {
  color: rgb(168 162 158);
}

/* ===== 奥付 · COLOPHON (R26) ===== */
.article-colophon-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.85rem;
  margin-bottom: 2rem;
}
.article-colophon-divider__line {
  flex: 1;
  max-width: 100px;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    rgb(168 162 158 / 0.4),
    transparent
  );
}
.article-colophon-divider__dot {
  width: 5px;
  height: 5px;
  border-radius: 9999px;
  background: rgb(217 123 46 / 0.85);
  box-shadow: 0 0 0 4px rgb(217 123 46 / 0.08);
}
.article-colophon-eyebrow {
  text-align: center;
  font-size: 0.62rem;
  letter-spacing: 0.4em;
  color: rgb(217 123 46 / 0.9);
  text-transform: uppercase;
  font-weight: 300;
  margin: 0 0 1.6rem;
}
.article-colophon-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.6rem;
  margin: 0;
}
.article-colophon-list > div {
  display: flex;
  justify-content: space-between;
  gap: 1.2rem;
  font-size: 0.78rem;
  padding: 0.55rem 0;
  border-bottom: 1px solid rgb(168 162 158 / 0.15);
}
.article-colophon-list dt {
  flex-shrink: 0;
  font-size: 0.66rem;
  letter-spacing: 0.32em;
  color: rgb(120 113 108 / 0.85);
  text-transform: uppercase;
}
:global(.dark) .article-colophon-list dt {
  color: rgb(168 162 158 / 0.7);
}
.article-colophon-list dd {
  margin: 0;
  text-align: right;
  color: rgb(68 64 60);
  font-weight: 300;
  letter-spacing: 0.05em;
}
:global(.dark) .article-colophon-list dd {
  color: rgb(214 211 209 / 0.92);
}

.article-colophon-seal-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.2rem;
  margin: 2.5rem 0 1.4rem;
}
.article-colophon-hairline {
  flex: 1;
  max-width: 80px;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    rgb(168 162 158 / 0.4),
    transparent
  );
}
.article-colophon-tail {
  text-align: center;
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  font-size: 1.05rem;
  letter-spacing: 0.32em;
  color: rgb(120 113 108);
  font-weight: 300;
  line-height: 2;
  margin: 0;
}
:global(.dark) .article-colophon-tail {
  color: rgb(168 162 158);
}
.article-colophon-tail__roman {
  display: inline-block;
  margin-top: 0.4rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.62rem;
  letter-spacing: 0.5em;
  color: rgb(217 123 46 / 0.75);
}

@media (min-width: 640px) {
  .article-colophon-list {
    grid-template-columns: 1fr 1fr;
    column-gap: 2.2rem;
  }
}
</style>
