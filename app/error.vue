<template>
  <!--
    R39 — 編輯式 404 / 500 簽名頁
    取代預設 Nuxt error page，延續站內 jp-seal 矩陣 + 卷頭語 motif。
    狀態碼決定主漢字：404 = 「迷」、500 = 「亂」、其他 = 「失」
  -->
  <div class="error-page">
    <div class="error-page__bg" aria-hidden="true">
      <span class="error-page__bg-kana">{{ bgKana }}</span>
    </div>

    <div class="error-page__inner">
      <div class="error-page__divider" aria-hidden="true">
        <span class="error-page__divider-line"/>
        <span class="error-page__divider-dot"/>
        <span class="error-page__divider-line"/>
      </div>

      <p class="error-page__eyebrow">{{ eyebrow }}</p>
      <h1 class="error-page__code">{{ statusCode }}</h1>
      <p class="error-page__title">{{ title }}</p>
      <p class="error-page__body">{{ body }}</p>

      <!-- 朱印 — 跨站 jp-seal 矩陣延伸 (楊/集/終/文/迷) -->
      <div class="error-page__seal-row">
        <span class="error-page__hairline"/>
        <span class="jp-seal jp-seal--b" aria-hidden="true">
          <span class="jp-seal-ink">{{ bgKana }}</span>
        </span>
        <span class="error-page__hairline"/>
      </div>

      <!-- 雙軌 CTA -->
      <div class="error-page__ctas">
        <NuxtLink to="/" class="error-page__cta">
          <span class="font-jp">回表紙</span>
          <span class="error-page__cta-en">HOME</span>
          <span class="error-page__cta-arrow" aria-hidden="true">←</span>
        </NuxtLink>
        <span class="error-page__cta-sep" aria-hidden="true"/>
        <NuxtLink to="/gallery" class="error-page__cta">
          <span class="font-jp">繪 · 影</span>
          <span class="error-page__cta-en">GALLERY</span>
          <span class="error-page__cta-arrow" aria-hidden="true">→</span>
        </NuxtLink>
      </div>

      <p class="error-page__tail">迷う者にも、道はある。<br>
        <span class="error-page__tail-roman">A WAYFARER STILL HAS A WAY.</span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  error: { statusCode?: number; statusMessage?: string; message?: string }
}>()

const statusCode = computed(() => String(props.error?.statusCode ?? 500))

const bgKana = computed(() => {
  if (statusCode.value === '404') return '迷'
  if (statusCode.value.startsWith('5')) return '亂'
  return '失'
})

const eyebrow = computed(() => {
  if (statusCode.value === '404') return '迷い · NOT FOUND'
  return '故障 · ERROR'
})

const title = computed(() => {
  if (statusCode.value === '404') return '此頁尚未編入目次'
  return '一道未預期的墨痕'
})

const body = computed(() => {
  if (statusCode.value === '404') {
    return '你想找的章節，可能還在編纂中，或不在本書的目次裡。'
  }
  return props.error?.statusMessage || props.error?.message || '伺服器側出現了未預期的錯誤，請稍後再試。'
})

useSeoMeta({
  title: () => `${statusCode.value} · 迷い`,
  description: () => title.value
})
</script>

<style scoped>
.error-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 1.5rem;
  background: rgb(245 244 240);
  overflow: hidden;
}
:global(.dark) .error-page {
  background: rgb(28 25 23);
}

/* 背景大字 */
.error-page__bg {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  user-select: none;
}
.error-page__bg-kana {
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  font-size: clamp(18rem, 38vw, 32rem);
  font-weight: 200;
  color: rgb(214 211 209 / 0.5);
  line-height: 1;
}
:global(.dark) .error-page__bg-kana {
  color: rgb(68 64 60 / 0.45);
}

.error-page__inner {
  position: relative;
  max-width: 30rem;
  text-align: center;
}

.error-page__divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.85rem;
  margin-bottom: 1.6rem;
}
.error-page__divider-line {
  flex: 1;
  max-width: 110px;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    rgb(168 162 158 / 0.45),
    transparent
  );
}
.error-page__divider-dot {
  width: 5px;
  height: 5px;
  border-radius: 9999px;
  background: rgb(217 123 46 / 0.85);
  box-shadow: 0 0 0 4px rgb(217 123 46 / 0.08);
}

.error-page__eyebrow {
  font-size: 0.62rem;
  letter-spacing: 0.4em;
  color: rgb(217 123 46 / 0.9);
  text-transform: uppercase;
  font-weight: 300;
  margin: 0 0 1rem;
}

.error-page__code {
  margin: 0;
  font-family: 'Noto Serif JP', serif;
  font-size: 4.2rem;
  font-weight: 200;
  letter-spacing: 0.05em;
  color: rgb(68 64 60);
  line-height: 1;
}
:global(.dark) .error-page__code {
  color: rgb(231 229 228);
}

.error-page__title {
  margin: 0.85rem 0 0;
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  font-size: 1.35rem;
  font-weight: 300;
  letter-spacing: 0.12em;
  color: rgb(68 64 60);
}
:global(.dark) .error-page__title {
  color: rgb(231 229 228);
}

.error-page__body {
  margin: 1rem 0 2rem;
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  font-size: 0.92rem;
  line-height: 2;
  letter-spacing: 0.04em;
  color: rgb(120 113 108);
  font-weight: 300;
}
:global(.dark) .error-page__body {
  color: rgb(168 162 158);
}

.error-page__seal-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin: 1.5rem 0 2.2rem;
}
.error-page__hairline {
  flex: 1;
  max-width: 70px;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    rgb(168 162 158 / 0.4),
    transparent
  );
}

.error-page__ctas {
  display: inline-flex;
  align-items: center;
  gap: 1rem;
  margin: 0 auto;
}
.error-page__cta {
  display: inline-flex;
  align-items: baseline;
  gap: 0.55rem;
  padding: 0.5rem 0.75rem;
  color: rgb(68 64 60);
  border-bottom: 1px solid rgb(168 162 158 / 0.45);
  transition: color 0.3s ease, border-color 0.3s ease;
  text-decoration: none;
}
:global(.dark) .error-page__cta {
  color: rgb(231 229 228);
  border-bottom-color: rgb(120 113 108 / 0.55);
}
.error-page__cta:hover {
  color: rgb(217 123 46);
  border-bottom-color: rgb(217 123 46 / 0.85);
}
.error-page__cta .font-jp {
  font-size: 1rem;
  letter-spacing: 0.18em;
}
.error-page__cta-en {
  font-size: 0.62rem;
  letter-spacing: 0.34em;
  color: rgb(120 113 108);
  text-transform: uppercase;
}
.error-page__cta-arrow {
  transition: transform 0.3s ease;
}
.error-page__cta:hover .error-page__cta-arrow {
  transform: translateX(2px);
}
.error-page__cta-sep {
  display: inline-block;
  width: 1px;
  height: 1rem;
  background: rgb(168 162 158 / 0.45);
}

.error-page__tail {
  margin-top: 2.8rem;
  font-family: 'Noto Serif JP', serif;
  font-size: 0.9rem;
  letter-spacing: 0.18em;
  line-height: 2;
  color: rgb(120 113 108);
  font-weight: 300;
}
:global(.dark) .error-page__tail {
  color: rgb(168 162 158);
}
.error-page__tail-roman {
  display: inline-block;
  margin-top: 0.3rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.6rem;
  letter-spacing: 0.42em;
  color: rgb(217 123 46 / 0.75);
}
</style>
