<script setup lang="ts">
import { joinURL } from 'ufo'

defineProps<{
  works: {
    art: string
    artTitle: string
    main: string
    mainTitle: string
    sub: string
    subTitle: string
  }
}>()

const baseURL = useRuntimeConfig().app.baseURL
const worldURL = joinURL(baseURL, 'painted-worlds/index.html?from=home')
const hallImage = joinURL(baseURL, 'museum/skylight-hall.webp')
const mobileHallImage = joinURL(baseURL, 'museum/skylight-hall-mobile.webp')
</script>

<template>
  <section class="museum-entrance" aria-labelledby="museum-entrance-title">
    <header class="museum-entrance__heading">
      <h1 id="museum-entrance-title" class="font-jp">日光迴廊</h1>
      <p>NCTU Young 的繪畫與攝影</p>
    </header>

    <div class="museum-entrance__floor">
      <picture class="museum-entrance__hall">
        <source media="(max-width: 599px)" :srcset="mobileHallImage" width="720" height="896">
        <img
          :src="hallImage"
          alt="《唯一真神》的雕像與台座立在迴廊的斜光下"
          width="1300"
          height="720"
          fetchpriority="high"
          loading="eager"
          decoding="async"
        >
      </picture>

      <NuxtLink
        to="/gallery/digital"
        no-prefetch
        class="museum-door hero-page--kai"
        aria-label="進入繪世界：繪畫館"
      >
        <span class="museum-door__frame">
          <img :src="works.art" :alt="`電繪作品代表 — ${works.artTitle}`" decoding="async">
        </span>
        <span class="museum-door__sign">
          <span class="museum-door__name font-jp">
            繪畫館
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.25" aria-hidden="true"><path d="M4 10h11m-4-4 4 4-4 4" /></svg>
          </span>
          <span class="museum-door__destination">數位繪畫</span>
        </span>
      </NuxtLink>

      <NuxtLink
        to="/gallery/photography"
        no-prefetch
        class="museum-door hero-page--kage"
        aria-label="開啟影世界攝影地圖：攝影館"
      >
        <span class="museum-door__prints">
          <span class="museum-door__print museum-door__print--sub">
            <img :src="works.sub" :alt="works.subTitle" decoding="async">
          </span>
          <span class="museum-door__print hero-page__print--main">
            <img :src="works.main" :alt="works.mainTitle" decoding="async">
          </span>
        </span>
        <span class="museum-door__sign">
          <span class="museum-door__name font-jp">
            攝影館
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.25" aria-hidden="true"><path d="M4 10h11m-4-4 4 4-4 4" /></svg>
          </span>
          <span class="museum-door__destination">踏跡地圖</span>
        </span>
      </NuxtLink>
    </div>

    <div class="museum-entrance__routes">
      <a :href="worldURL" class="museum-entrance__route">
        <span>畫界迴廊 3D</span>
        <span class="museum-entrance__route-detail">唯一真神</span>
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.25" aria-hidden="true"><path d="M4 10h11m-4-4 4 4-4 4" /></svg>
      </a>
      <NuxtLink to="/exhibition/light#painting" no-prefetch class="museum-entrance__route">
        <span>主題展《光落之處》</span>
        <span class="museum-entrance__route-detail">從繪作開始</span>
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.25" aria-hidden="true"><path d="M4 10h11m-4-4 4 4-4 4" /></svg>
      </NuxtLink>
    </div>
  </section>
</template>

<style scoped>
.museum-entrance {
  --entrance-paper: var(--museum-paper, var(--bg));
  --entrance-ink: var(--museum-ink, var(--fg-1));
  --entrance-muted: var(--museum-muted, var(--fg-3));
  --entrance-line: var(--museum-line, var(--border));
  color: var(--entrance-ink);
  background:
    radial-gradient(ellipse at 54% 0%, var(--museum-light, var(--bg)) 0%, transparent 62%),
    var(--entrance-paper);
}

.museum-entrance__heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: .4rem 2rem;
  padding: clamp(1.2rem, 3vw, 2.75rem) clamp(1rem, 4vw, 3.5rem) clamp(.85rem, 2vw, 1.75rem);
}

.museum-entrance__heading h1 {
  margin: 0;
  font-size: clamp(2rem, 5vw, 4.25rem);
  line-height: 1.18;
  font-weight: 400;
  letter-spacing: .09em;
}

.museum-entrance__heading p {
  margin: 0;
  color: var(--entrance-muted);
  font-size: .875rem;
  letter-spacing: .06em;
}

.museum-entrance__floor {
  display: grid;
  grid-template-columns: minmax(9.75rem, 1fr) minmax(0, 5.8fr) minmax(10.5rem, 1.08fr);
  grid-template-areas: "kai hall kage";
  border-block: 1px solid var(--entrance-line);
  background:
    radial-gradient(ellipse at 58% 0%, var(--museum-light, var(--entrance-paper)), transparent 70%),
    linear-gradient(90deg, var(--museum-warm, var(--entrance-paper)), var(--entrance-paper) 48%, var(--museum-cool, var(--entrance-paper)));
}

.museum-entrance__hall {
  grid-area: hall;
  display: block;
  height: clamp(20rem, 47svh, 32rem);
  min-width: 0;
  overflow: hidden;
  background: var(--entrance-paper);
}

.museum-entrance__hall img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

:global(.dark) .museum-entrance__hall img {
  filter: brightness(.79);
}

.museum-door {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-width: 0;
  gap: 1.5rem;
  padding: 1.25rem clamp(.85rem, 1.8vw, 1.6rem);
  color: var(--entrance-ink);
  text-decoration: none;
}

.hero-page--kai {
  grid-area: kai;
}

.hero-page--kage {
  grid-area: kage;
}

.museum-door__frame {
  display: grid;
  place-items: center;
  width: clamp(4rem, 8vw, 7.25rem);
  aspect-ratio: 4 / 5;
  padding: .35rem;
  background: color-mix(in srgb, var(--museum-warm, var(--bg)) 41%, var(--entrance-ink));
  box-shadow: 3px 7px 12px -5px rgb(23 18 12 / 36%);
}

.museum-door__frame img {
  width: 100%;
  height: 100%;
  min-height: 0;
  object-fit: contain;
  background: var(--entrance-paper);
}

.museum-door__prints {
  position: relative;
  width: min(100%, 9rem);
  aspect-ratio: 1.25;
}

.museum-door__print {
  position: absolute;
  display: grid;
  place-items: center;
  inset: 20% 14% 4% 1%;
  padding: .2rem .2rem .45rem;
  background: #eae7df;
  box-shadow: 3px 6px 10px -5px rgb(19 25 29 / 36%);
  transform: rotate(-4deg);
}

.museum-door__print--sub {
  inset: 2% 1% 27% 28%;
  transform: rotate(8deg);
}

.museum-door__print img {
  width: 100%;
  height: 100%;
  min-height: 0;
  object-fit: contain;
}

.museum-door__sign {
  display: grid;
  gap: .25rem;
  width: 100%;
  padding-top: .65rem;
  border-top: 1px solid var(--entrance-line);
}

.museum-door__name {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .25rem;
  font-size: clamp(1.15rem, 1.7vw, 1.55rem);
  line-height: 1.4;
}

.museum-door__destination {
  color: var(--entrance-muted);
  font-size: .8125rem;
  line-height: 1.35;
}

.museum-entrance svg {
  width: 1rem;
  height: 1rem;
  flex: none;
}

.museum-door:hover .museum-door__name,
.museum-entrance__route:hover > span:first-child {
  text-decoration: underline;
  text-underline-offset: .25em;
}

.museum-entrance a:focus-visible {
  z-index: 1;
  outline: 2px solid var(--entrance-ink);
  outline-offset: -4px;
}

.museum-entrance__routes {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0 1rem;
  padding-inline: clamp(1rem, 4vw, 3.5rem);
}

.museum-entrance__route {
  display: inline-flex;
  align-items: center;
  gap: .55rem;
  min-height: 50px;
  font-size: .875rem;
  text-decoration: none;
}

.museum-entrance__route-detail {
  padding-inline-start: .55rem;
  border-inline-start: 1px solid var(--entrance-line);
  color: var(--entrance-muted);
  font-size: .75rem;
}

@media (min-width: 900px) {
  .museum-entrance__hall {
    mask-image: linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent);
  }
}

@media (min-width: 1000px) {
  .museum-entrance__hall {
    height: clamp(26rem, 58svh, 36rem);
  }

}

@media (max-width: 899px) {
  .museum-entrance__floor {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    grid-template-areas: "hall hall" "kai kage";
  }

  .museum-entrance__hall {
    height: clamp(13.75rem, 39svh, 23rem);
  }

  .museum-door {
    flex-direction: row;
    justify-content: flex-start;
    gap: .55rem;
    padding: .625rem .7rem;
    border-top: 1px solid var(--entrance-line);
  }

  .hero-page--kage {
    border-inline-start: 1px solid var(--entrance-line);
  }

  .museum-door__frame,
  .museum-door__prints {
    flex: 0 0 clamp(2.35rem, 11vw, 3.75rem);
    width: auto;
  }

  .museum-door__frame {
    padding: .15rem;
  }

  .museum-door__print {
    padding: .08rem .08rem .18rem;
  }

  .museum-door__sign {
    padding-top: 0;
    border: 0;
  }

  .museum-door__name {
    font-size: clamp(1rem, 4.65vw, 1.25rem);
  }
}

@media (max-width: 599px) {
  .museum-entrance__heading {
    flex-direction: column;
    align-items: flex-start;
  }

  .museum-entrance__hall img {
    object-position: center 65%;
  }

  .museum-entrance__route {
    gap: .25rem;
    min-height: 44px;
    font-size: .75rem;
  }

  .museum-entrance__route-detail {
    display: none;
  }
}
</style>
