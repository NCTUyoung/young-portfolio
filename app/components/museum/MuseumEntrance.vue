<script setup lang="ts">
import { joinURL } from 'ufo'

const { cover } = defineProps<{
  cover: { desktop: string, mobile: string, alt: string }
}>()

const baseURL = useRuntimeConfig().app.baseURL
const corridorUrl = joinURL(baseURL, 'painted-worlds/index.html?from=home')
</script>

<template>
  <section class="museum-entrance" aria-labelledby="museum-entrance-title">
    <figure class="museum-entrance__work">
      <picture class="museum-entrance__picture">
        <source media="(max-width: 599px)" :srcset="joinURL(baseURL, cover.mobile)" width="720" height="896">
        <img
          :src="joinURL(baseURL, cover.desktop)"
          :alt="cover.alt"
          width="1300"
          height="720"
          fetchpriority="high"
          loading="eager"
          decoding="async"
        >
      </picture>
      <figcaption class="museum-entrance__plaque">
        <strong class="font-jp">唯一真神</strong>
        <span>雕像</span>
      </figcaption>
    </figure>

    <div class="museum-entrance__intro">
      <h1 id="museum-entrance-title" class="museum-heading">光落之處</h1>
      <p class="museum-entrance__byline">序廳<span aria-hidden="true" />NCTU Young</p>
      <div class="museum-entrance__links">
        <NuxtLink to="/exhibition/light#painting" class="museum-entrance__start">
          開始看展
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.25" aria-hidden="true"><path d="M4 10h11m-4-4 4 4-4 4" /></svg>
        </NuxtLink>
        <a :href="corridorUrl" class="museum-entrance__corridor">逛 3D 迴廊</a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.museum-entrance {
  display: grid;
  grid-template-columns: minmax(17rem, .85fr) minmax(0, 1.85fr);
  grid-template-areas: "intro work";
  align-items: center;
  column-gap: clamp(1.5rem, 4vw, 4rem);
  padding: clamp(2.5rem, 6vw, 5rem) clamp(1.5rem, 4vw, 3.5rem) clamp(3.25rem, 7vw, 6rem);
  color: var(--museum-ink);
  background: radial-gradient(ellipse at 65% 0%, var(--museum-light), transparent 66%);
}

.museum-entrance__work {
  grid-area: work;
  min-width: 0;
  margin: 0;
}

.museum-entrance__picture {
  display: block;
  aspect-ratio: 1300 / 720;
  overflow: hidden;
  background: var(--museum-warm);
}

.museum-entrance__picture img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

:global(.dark) .museum-entrance__picture img {
  filter: brightness(.82);
}

.museum-entrance__plaque {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: .125rem .8rem;
  padding-top: .75rem;
  color: var(--museum-muted);
  font-size: .8125rem;
  line-height: 1.35;
}

.museum-entrance__plaque strong {
  color: var(--museum-ink);
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: .05em;
}

.museum-entrance__intro {
  grid-area: intro;
  padding-bottom: 2rem;
}

.museum-entrance__intro h1 {
  margin: 0;
  font-size: clamp(2.75rem, 4.7vw, 4.5rem);
  letter-spacing: .075em;
}

.museum-entrance__byline {
  display: flex;
  align-items: center;
  gap: .7rem;
  margin: .8rem 0 0;
  color: var(--museum-muted);
  font-size: .9rem;
  letter-spacing: .07em;
}

.museum-entrance__byline span {
  width: 1px;
  height: .9em;
  background: var(--museum-line);
}

.museum-entrance__links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: .375rem clamp(.9rem, 2vw, 1.5rem);
  margin-top: clamp(1.5rem, 3vw, 2.75rem);
}

.museum-entrance__links a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  font-size: .9375rem;
}

.museum-entrance__start {
  gap: .65rem;
  padding-inline: .85rem;
  border: 1px solid var(--museum-mark);
  background: var(--museum-light);
  font-weight: 600;
}

.museum-entrance__start svg {
  flex: none;
  width: 1rem;
  height: 1rem;
}

.museum-entrance__corridor {
  color: var(--museum-muted);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: .3em;
}

.museum-entrance__links a:hover {
  color: var(--museum-mark);
}

@media (max-width: 767px) {
  .museum-entrance {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas: "work" "intro";
    padding: 1.25rem 0 2.25rem;
  }

  .museum-entrance__intro {
    padding: 1.25rem .75rem 0;
  }

  .museum-entrance__intro h1 {
    font-size: clamp(2.125rem, 9vw, 3rem);
  }

  .museum-entrance__byline {
    margin-top: .5rem;
  }

  .museum-entrance__links {
    margin-top: 1.1rem;
  }

  .museum-entrance__plaque {
    padding: .625rem .75rem 0;
  }
}

@media (max-width: 599px) {
  .museum-entrance__picture {
    height: clamp(12rem, 38svh, 20rem);
    aspect-ratio: auto;
  }

  .museum-entrance__picture img {
    object-position: center 65%;
  }
}
</style>
