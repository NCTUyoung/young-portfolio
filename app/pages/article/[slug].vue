<template>
  <article class="article-reading" aria-labelledby="article-title">
    <div class="article-reading__column">
      <MuseumReadingHeader :title="article.title" title-id="article-title">
        <template #navigation>
          <nav class="article-reading__wayfinding" aria-label="breadcrumb">
            <NuxtLink to="/article" class="article-reading__link">
              <Icon name="lucide:arrow-left" aria-hidden="true" />
              目次
            </NuxtLink>
          </nav>
        </template>

        <p class="article-reading__quote font-jp">「{{ article.strongestLine }}」</p>

        <template #details>
          <p class="article-reading__details">
            {{ article.trackLabel }}
            <span aria-hidden="true">·</span>
            <time :datetime="article.date.replaceAll('·', '-')">{{ article.date }}</time>
            <span aria-hidden="true">·</span>
            {{ article.readingTime }} 分鐘閱讀
          </p>
        </template>
      </MuseumReadingHeader>

      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="article-prose" v-html="article.htmlBody" />

      <footer class="article-reading__footer">
        <p>Young / NCTU · 楊</p>
        <nav class="article-reading__exits" aria-label="讀完這篇文章">
          <NuxtLink to="/article" class="article-reading__link">
            <Icon name="lucide:arrow-left" aria-hidden="true" />
            返回目次
          </NuxtLink>
          <NuxtLink
            v-if="article.relatedCollection"
            :to="article.relatedCollection.to"
            class="article-reading__link"
          >
            看「{{ article.relatedCollection.title }}」活動照片
            <Icon name="lucide:arrow-right" aria-hidden="true" />
          </NuxtLink>
        </nav>
      </footer>
    </div>
  </article>
</template>

<script setup lang="ts">
import MuseumReadingHeader from '~/components/museum/MuseumReadingHeader.vue'

const route = useRoute()

interface ArticleData {
  title: string
  strongestLine: string

  trackLabel: string
  date: string
  readingTime: number
  relatedCollection?: { title: string, to: string }
  htmlBody: string
}

const articles: Record<string, ArticleData> = {
  'gear-119mm': {
    title: '器材評測 — 119mm 的場邊',
    strongestLine: '119mm 看小腿和板凳',

    trackLabel: '攝影',
    date: '2026·05·27',
    readingTime: 5,
    relatedCollection: { title: 'WBC 2026', to: '/gallery/photography/WBC%202026' },
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
    title: '設計心得',
    strongestLine: '為什麼這格的色塊比那格重要',

    trackLabel: '繪畫',
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
  const found = Object.hasOwn(articles, slug) ? articles[slug] : undefined
  if (!found) {
    throw createError({ statusCode: 404, statusMessage: 'Article not found', fatal: true })
  }
  return found
})

useSeoMeta({
  title: () => `${article.value.title} · 手記`,
  description: () => article.value.strongestLine,
  ogTitle: () => `${article.value.title} — NCTU Young`,
  ogDescription: () => article.value.strongestLine,
  ogType: 'article'
})
</script>

<style scoped>
.article-reading {
  color: var(--museum-ink);
  background:
    radial-gradient(ellipse 65% 36rem at 46% 0%, var(--museum-light), transparent 88%),
    linear-gradient(108deg, transparent 66%, color-mix(in srgb, var(--museum-line) 15%, transparent)),
    var(--museum-paper);
}

.article-reading__column {
  box-sizing: content-box;
  max-inline-size: 39rem;
  margin-inline: auto;
  padding: clamp(1.25rem, 4vw, 3.1rem) clamp(1rem, 6vw, 4.75rem) clamp(3rem, 7vw, 6rem);
}

.article-reading__wayfinding {
  margin-block-end: clamp(1.5rem, 4vw, 3rem);
}

.article-reading__link {
  display: inline-flex;
  min-inline-size: 2.75rem;
  min-block-size: 2.75rem;
  align-items: center;
  gap: 0.55rem;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.32em;
}

.article-reading__link:hover {
  text-decoration-thickness: 2px;
}

.article-reading__link:focus-visible {
  outline: 2px solid var(--museum-ink);
  outline-offset: 3px;
}

.article-reading__quote {
  font-size: clamp(1rem, 2.2vw, 1.25rem);
  line-height: 1.8;
  letter-spacing: 0.04em;
}

.article-reading__details {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.6rem;
  margin-block-start: 1.15rem;
  color: var(--museum-muted);
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
}

.article-prose {
  margin-block-start: clamp(1.65rem, 4.4vw, 2.65rem);
  padding-block-start: clamp(1.6rem, 3.8vw, 2.5rem);
  border-block-start: 1px solid var(--museum-line);
  font-size: 1.0625rem;
  line-height: 1.95;
  letter-spacing: 0.025em;
  overflow-wrap: break-word;
}

.article-prose :deep(.article-lead) {
  font-size: 1.15em;
  font-weight: 500;
}

.article-prose :deep(h2) {
  margin-block: clamp(2.5rem, 5.5vw, 4.15rem) 0.85rem;
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  font-size: clamp(1.25rem, 3vw, 1.65rem);
  font-weight: 500;
  line-height: 1.55;
  letter-spacing: 0.065em;
}

.article-prose :deep(p) {
  margin-block-end: 1.1rem;
}

.article-prose :deep(strong) {
  font-weight: 600;
}

.article-prose :deep(ul) {
  margin-block: 1rem 1.4rem;
  padding-inline-start: 1.35em;
  list-style: disc;
}

.article-prose :deep(li + li) {
  margin-block-start: 0.35em;
}

.article-reading__footer {
  margin-block-start: clamp(3rem, 6.5vw, 5.5rem);
  padding-block-start: 1.35rem;
  border-block-start: 1px solid var(--museum-line);
}

.article-reading__footer p {
  color: var(--museum-muted);
  font-size: 0.875rem;
  letter-spacing: 0.06em;
}

.article-reading__exits {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 2rem;
  margin-block-start: 0.55rem;
}
</style>
