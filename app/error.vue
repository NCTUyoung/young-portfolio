<script setup lang="ts">
import { joinURL } from 'ufo'
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const statusCode = computed(() => props.error.statusCode ?? 500)
const notFound = computed(() => statusCode.value === 404)
const title = computed(() => notFound.value ? '找不到這個頁面' : '這個頁面暫時無法開啟')
const description = computed(() => notFound.value
  ? '連結可能已經變更。你可以回到日光迴廊，或直接前往攝影館。'
  : '請稍後重新整理，或由日光迴廊重新入館。')

const { app: { baseURL } } = useRuntimeConfig()
const galleryHref = joinURL(baseURL, 'gallery/photography')

useSeoMeta({
  title: () => `${statusCode.value} · ${title.value}`,
  description,
  robots: 'noindex'
})
</script>

<template>
  <main class="museum-error" aria-labelledby="error-title">
    <div class="museum-error__content">
      <p class="museum-error__code">{{ statusCode }}</p>
      <h1 id="error-title" class="font-jp">{{ title }}</h1>
      <p class="museum-error__description">{{ description }}</p>
      <nav class="museum-error__routes" aria-label="返回展館">
        <a :href="baseURL">
          <Icon name="lucide:arrow-left" aria-hidden="true" />
          回首頁
        </a>
        <a :href="galleryHref">
          前往攝影館
          <Icon name="lucide:arrow-right" aria-hidden="true" />
        </a>
      </nav>
    </div>
  </main>
</template>

<style scoped>
.museum-error {
  display: grid;
  align-items: center;
  min-block-size: 100svh;
  padding: 3rem clamp(1.5rem, 8vw, 8rem);
  color: var(--museum-ink);
  background:
    radial-gradient(ellipse 65% 95% at 37% 0%, var(--museum-light), transparent 90%),
    linear-gradient(105deg, transparent 62%, color-mix(in srgb, var(--museum-line) 27%, transparent)),
    var(--museum-paper);
}

.museum-error__content {
  inline-size: min(100%, 42rem);
  margin-inline: auto;
  padding-block-start: clamp(1.2rem, 3vw, 2.15rem);
  border-block-start: 1px solid var(--museum-line);
}

.museum-error__code {
  margin-block-end: 0.65rem;
  color: var(--museum-muted);
  font-size: 1rem;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.12em;
}

.museum-error h1 {
  font-size: clamp(2rem, 5.4vw, 4rem);
  font-weight: 300;
  line-height: 1.3;
  text-wrap: balance;
}

.museum-error__description {
  margin-block-start: 1rem;
  color: var(--museum-muted);
  line-height: 1.8;
}

.museum-error__routes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem clamp(1.4rem, 4vw, 3rem);
  margin-block-start: 1.75rem;
}

.museum-error__routes a {
  display: inline-flex;
  min-block-size: 2.75rem;
  align-items: center;
  gap: 0.45rem;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.32em;
}

.museum-error__routes a:hover {
  text-decoration-thickness: 2px;
}

.museum-error__routes a:focus-visible {
  outline: 2px solid var(--museum-ink);
  outline-offset: 3px;
}
</style>
