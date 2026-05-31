<template>
  <article ref="pageRef" class="min-h-screen">
    <!-- 文章 Header — 與 /article 目次同 motif -->
    <section class="relative pt-24 lg:pt-32 pb-10 lg:pb-16">
      <div class="max-w-3xl mx-auto px-6 sm:px-10">
        <!-- breadcrumb -->
        <nav class="flex items-center gap-3 mb-10 text-[0.7rem] tracking-[0.32em] uppercase text-stone-500 dark:text-stone-400" aria-label="breadcrumb">
          <NuxtLink to="/article" class="hover:text-accent-600 dark:hover:text-accent-400 transition-colors">
            目次
          </NuxtLink>
          <span aria-hidden="true" class="text-stone-300 dark:text-stone-600">／</span>
          <span class="text-stone-700 dark:text-stone-200">{{ article.kansuji }} · {{ article.kanji }}</span>
        </nav>

        <!-- 章節 eyebrow + track chip -->
        <div class="flex items-baseline flex-wrap gap-3 mb-2">
          <p class="text-[0.62rem] tracking-[0.4em] uppercase text-accent-600/85 dark:text-accent-400/85 font-light">
            {{ article.kansuji }} · {{ article.trackKana }} {{ article.trackLabel }}
          </p>
        </div>

        <!-- 標題 -->
        <h1 class="font-jp text-4xl sm:text-5xl lg:text-6xl font-extralight tracking-[0.1em] text-stone-900 dark:text-stone-50 leading-[1.15]">
          {{ article.title }}
        </h1>

        <!-- 章首詩 -->
        <p class="article-content-strongest mt-6">「{{ article.strongestLine }}」</p>

        <!-- meta -->
        <p class="mt-6 text-[0.7rem] tracking-[0.32em] uppercase text-stone-400 dark:text-stone-500 jp-kansuji">
          {{ article.date }} · {{ article.readingTime }} min read
        </p>

        <div class="jp-hairline w-full mt-10"/>
      </div>
    </section>

    <!-- 文章主體 -->
    <section class="relative pb-24 lg:pb-32">
      <div class="max-w-3xl mx-auto px-6 sm:px-10 article-prose">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-html="article.htmlBody"/>
      </div>
    </section>

    <!-- 奥付 mini — 與 /article 主頁同 motif -->
    <section class="reveal py-12 lg:py-16">
      <div class="max-w-2xl mx-auto px-6">
        <div class="article-colophon-divider" aria-hidden="true">
          <span class="article-colophon-divider__line"/>
          <span class="article-colophon-divider__dot"/>
          <span class="article-colophon-divider__line"/>
        </div>
        <p class="article-colophon-eyebrow">奥付 · COLOPHON</p>
        <dl class="article-colophon-list">
          <div>
            <dt>初出</dt>
            <dd class="jp-kansuji">{{ article.date }}</dd>
          </div>
          <div>
            <dt>編者</dt>
            <dd>Young / NCTU · 楊</dd>
          </div>
          <div>
            <dt>軌道</dt>
            <dd>{{ article.trackKana }} · {{ article.trackLabel }}</dd>
          </div>
        </dl>

        <!-- 回目次 -->
        <div class="mt-10 text-center">
          <NuxtLink
            to="/article"
            class="group inline-flex items-center gap-3 text-stone-500 dark:text-stone-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
          >
            <svg class="w-4 h-4 rotate-180 transition-transform duration-500 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            <span class="font-jp tracking-[0.25em] text-base">回目次</span>
          </NuxtLink>
        </div>
      </div>
    </section>
  </article>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useScrollReveal } from '~/composables/useScrollReveal'

const route = useRoute()
const { observeAll } = useScrollReveal()
const pageRef = ref<HTMLElement | null>(null)

interface ArticleData {
  slug: string
  kansuji: string
  kanji: string
  title: string
  strongestLine: string
  trackKana: '繪' | '影' | '両'
  trackLabel: string
  date: string
  readingTime: number
  htmlBody: string
}

/**
 * R36 — Article 第一章「思 · 設計心得」真內容
 * 後續 add 其他章節時，在這個 articles map 加 slug 即可。
 */
const articles: Record<string, ArticleData> = {
  'gear-119mm': {
    slug: 'gear-119mm',
    kansuji: '其の四',
    kanji: '具',
    title: '器材評測 — 119mm 的場邊',
    strongestLine: '119mm 看小腿和板凳',
    trackKana: '影',
    trackLabel: 'Photography lean',
    date: '2026·05·27',
    readingTime: 5,
    htmlBody: `
<p class="article-lead">場邊那些長到像砲管的鏡頭，是另一種職業。我只有 119mm。</p>

<h2>一、120mm 以下的世界</h2>
<p>WBC 第三屆，東京巨蛋場邊。職業攝記人手一支 600mm f/4 砲管，按下去能凍住投手指尖的<em>球縫線</em>。我背的是 NIKKOR Z 70-180 f/2.8，最遠端 180mm，常用 119mm——介於「人像鏡」與「中望遠」之間。</p>
<p>砲管的好處是「看不見的東西看見」——120 公尺外的揮棒瞬間。但 119mm 看得到的，是另一些：</p>
<ul>
  <li>選手繃緊的小腿（場邊 5 公尺）</li>
  <li>教練手指的方向（板凳席 8 公尺）</li>
  <li>第八局的板凳席（座位區 12 公尺）</li>
  <li>替補席邊角的紅色頭巾（綁鞋帶，沒看球）</li>
</ul>

<h2>二、為什麼是 119mm 不是 180mm</h2>
<p>180mm 的視野太緊，能裝下的訊息少。119mm 剛好包進兩個人 + 半個物件 + 一格背景，<strong>故事密度</strong>夠。</p>
<p>而且 119mm 在 Z f 上重 795g + 鏡頭 795g = 1.6 公斤，連續八局還能舉。180mm + 機身約 2 公斤上限，肩膀撐不到第三局。</p>
<p>器材的「夠用就好」是真議題。多帶一公斤焦段，少 20 張可拍。</p>

<h2>三、Nikon Z f 機身：復古感與 dial 觸感</h2>
<p>Z f 的雙轉盤（ISO 上 + 快門上）讓眼睛不離取景器就能調參數。場邊光線變化快——一片雲過去、暖到冷，2 秒內要把 ISO 從 400 提到 1600。<em>盲操</em>的成本在此可見：</p>
<ul>
  <li>取景器右眼盯選手，左手轉 ISO dial、右手轉光圈環</li>
  <li>不像 Z6 III 要進選單翻菜單</li>
  <li>機械感 = 速度</li>
</ul>
<p>缺點：Z f 沒有縱拍手把、握把淺，連續四小時拇指會酸。職業會選 Z9，我選 Z f 因為<em>業餘的詩</em>比效率重要。</p>

<h2>四、後製：DxO DeepPRIMEXD 對焦面雜訊</h2>
<p>巨蛋光是均勻人造光，ISO 800-1600 是常態。Z f 的 RAW 在 ISO 1600 仍乾淨，但拉到 3200 開始有彩噪。</p>
<p>用 DxO DeepPRIMEXD 跑一次 → 雜訊消失但<strong>細節保留</strong>。場邊照片 70% 經這道工序，檔名後綴「_DxO_DeepPRIMEXD」是 colophon。</p>

<h2>後記</h2>
<p>器材評測通常寫成「規格表 + 樣張」。但真實的器材選擇是<em>跟身體妥協</em>——你會不會背、能不能舉、舉到第幾局才開始發抖。</p>
<p>119mm 是身體選的，不是規格表選的。</p>
    `.trim()
  },

  'design-thinking': {
    slug: 'design-thinking',
    kansuji: '其の一',
    kanji: '思',
    title: '設計心得',
    strongestLine: '為什麼這格的色塊比那格重要',
    trackKana: '繪',
    trackLabel: 'Digital lean',
    date: '2026·05·27',
    readingTime: 4,
    htmlBody: `
<p class="article-lead">畫面的重量不在像素，在色塊的分配。</p>

<h2>一、色塊先於線條</h2>
<p>剛開始學電繪的時候，我以為畫得「準」就是好。線稿一遍又一遍修，五官對位、骨架打稿、衣摺壓線——直到 2021 年，我才意識到自己一直在<em>畫一張線稿</em>，而不是<em>畫一張畫</em>。</p>
<p>真正驅動視覺的，是色塊的分布。畫面被切成四五塊：暗部、亮部、過渡、留白、強調色。這五塊的比例決定了「畫面說什麼」。線條只是把這五塊圍出來的工具。</p>

<h2>二、為什麼這格的色塊比那格重要</h2>
<p>看 The Great Wave off Kanagawa（神奈川衝浪圖）。畫面分三塊：藍灰浪、白浪沫、米黃天空。葛飾北齋把<strong>白色佔比壓到 15%</strong>，但這 15% 是整張畫的眼睛。</p>
<p>如果白色佔 50%，這張畫會變成「白浪」；佔 5%，會變成「藍海」。15% 是「白浪打進藍海」——是<em>事件</em>而非<em>狀態</em>。</p>
<p>畫面的重量不是平均，是失衡。每一格色塊都在和其他格競爭視覺權重，誰勝出、勝多少，決定觀者看到的故事。</p>

<h2>三、留白也是色塊</h2>
<p>從攝影軌道學來最重要的一件事：<strong>沒畫的地方也是畫</strong>。</p>
<p>2024 年起，我開始把畫面留白佔比拉到 35%-40%。不是偷懶，是讓眼睛有<em>呼吸的空隙</em>。畫面太滿會疲勞，太空會空洞——35%-40% 是當代浮世繪的黃金比。</p>
<p>留白不只是「不畫」，是<em>故意不畫</em>。是說「這裡不是重點，去看那裡」。是視覺的指揮棒。</p>

<h2>四、構圖是色塊的舞台調度</h2>
<p>三分法、黃金比、對角線——這些都是色塊分配的工具。重要的不是規則，是<em>規則背後的意圖</em>。</p>
<p>我自己常用的構圖手法：</p>
<ul>
  <li><strong>失衡三分</strong>：主體放在三分點偏移，留白放在對角，視覺從主體跳向留白再回來</li>
  <li><strong>軸線斷裂</strong>：把主軸線故意打斷，讓觀者在斷裂處停留</li>
  <li><strong>色塊鏈</strong>：用同色相把不相關的元素串起來，形成視覺路徑</li>
</ul>

<h2>後記</h2>
<p>這篇是寫給<em>過去的自己</em>。如果 2018 年的我能讀到，可能會少走兩三年彎路。</p>
<p>但畫畫的好玩之處，就在這些<em>彎路</em>本身。少走不一定是好事。</p>
    `.trim()
  }
}

const article = computed<ArticleData>(() => {
  const slug = String(route.params.slug || '')
  const found = articles[slug]
  if (!found) {
    throw createError({ statusCode: 404, statusMessage: `Article not found: ${slug}`, fatal: true })
  }
  return found
})

onMounted(() => {
  observeAll(pageRef.value)
})

useSeoMeta({
  title: () => `${article.value.title} · 文章`,
  description: () => article.value.strongestLine,
  ogTitle: () => `${article.value.title} — NCTU Young`,
  ogDescription: () => article.value.strongestLine,
  ogType: 'article'
})
</script>

<style scoped>
.article-content-strongest {
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  font-size: 1.3rem;
  letter-spacing: 0.06em;
  line-height: 1.7;
  color: rgb(120 113 108);
  font-weight: 300;
  margin: 0;
}
:global(.dark) .article-content-strongest { color: rgb(168 162 158); }

/* ===== article body prose (manual; no markdown engine yet) ===== */
.article-prose :deep(.article-lead) {
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  font-size: 1.18rem;
  letter-spacing: 0.04em;
  line-height: 2;
  color: rgb(68 64 60);
  font-weight: 300;
  margin: 0 0 2.4rem;
  padding-left: 1rem;
  border-left: 2px solid rgb(217 123 46 / 0.6);
}
:global(.dark) .article-prose :deep(.article-lead) { color: rgb(231 229 228); }

.article-prose :deep(h2) {
  font-family: 'Noto Serif JP', serif;
  font-size: 1.4rem;
  font-weight: 300;
  letter-spacing: 0.12em;
  margin: 3rem 0 1.2rem;
  color: rgb(68 64 60);
  position: relative;
  padding-left: 1rem;
}
:global(.dark) .article-prose :deep(h2) { color: rgb(231 229 228); }
.article-prose :deep(h2)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.4rem;
  bottom: 0.4rem;
  width: 2px;
  background: rgb(217 123 46 / 0.55);
}

.article-prose :deep(p) {
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  font-size: 1rem;
  line-height: 2;
  letter-spacing: 0.04em;
  color: rgb(68 64 60);
  font-weight: 300;
  margin: 0 0 1.2rem;
}
:global(.dark) .article-prose :deep(p) { color: rgb(214 211 209); }

.article-prose :deep(em) {
  font-style: italic;
  color: rgb(120 113 108);
}
:global(.dark) .article-prose :deep(em) { color: rgb(168 162 158); }

.article-prose :deep(strong) {
  font-weight: 400;
  color: rgb(217 123 46);
}
:global(.dark) .article-prose :deep(strong) { color: rgb(231 184 125); }

.article-prose :deep(ul) {
  margin: 1.2rem 0 1.6rem;
  padding-left: 1.4rem;
  list-style: none;
}
.article-prose :deep(ul li) {
  position: relative;
  padding-left: 1.4rem;
  margin-bottom: 0.6rem;
  font-family: 'Noto Serif JP', serif;
  line-height: 1.85;
  color: rgb(68 64 60);
}
:global(.dark) .article-prose :deep(ul li) { color: rgb(214 211 209); }
.article-prose :deep(ul li)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.7em;
  width: 5px;
  height: 5px;
  background: rgb(217 123 46 / 0.85);
  border-radius: 9999px;
}

/* Reuse article.vue colophon styles via plain classes — duplicated lightly */
.article-colophon-divider { display: flex; align-items: center; justify-content: center; gap: 0.85rem; margin-bottom: 2rem; }
.article-colophon-divider__line { flex: 1; max-width: 100px; height: 1px; background: linear-gradient(to right, transparent, rgb(168 162 158 / 0.4), transparent); }
.article-colophon-divider__dot { width: 5px; height: 5px; border-radius: 9999px; background: rgb(217 123 46 / 0.85); box-shadow: 0 0 0 4px rgb(217 123 46 / 0.08); }
.article-colophon-eyebrow { text-align: center; font-size: 0.62rem; letter-spacing: 0.4em; color: rgb(217 123 46 / 0.9); text-transform: uppercase; font-weight: 300; margin: 0 0 1.6rem; }
.article-colophon-list { display: grid; grid-template-columns: 1fr; gap: 0.6rem; margin: 0; }
@media (min-width: 640px) { .article-colophon-list { grid-template-columns: 1fr 1fr; column-gap: 2.2rem; } }
.article-colophon-list > div { display: flex; justify-content: space-between; gap: 1.2rem; font-size: 0.78rem; padding: 0.55rem 0; border-bottom: 1px solid rgb(168 162 158 / 0.15); }
.article-colophon-list dt { flex-shrink: 0; font-size: 0.66rem; letter-spacing: 0.32em; color: rgb(120 113 108 / 0.85); text-transform: uppercase; }
:global(.dark) .article-colophon-list dt { color: rgb(168 162 158 / 0.7); }
.article-colophon-list dd { margin: 0; text-align: right; color: rgb(68 64 60); font-weight: 300; letter-spacing: 0.05em; }
:global(.dark) .article-colophon-list dd { color: rgb(214 211 209 / 0.92); }
</style>
