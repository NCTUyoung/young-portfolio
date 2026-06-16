<template>
  <!--
    g1（圖片庫策展 UX 大改 / 影暗室）：暗室「綜覽 → 深入」目次（contact-sheet index）。

    ── 為什麼存在 ──
    baseline 暗室 = 單欄全幅膠卷 30.5 屏，無綜覽、無跳轉，使用者只能線性滑完 80 張。
    本元件建立「先一覽全局，再選擇深入」的策展層：
      一張「整卷接觸印樣」(contact sheet)：12 個 event 各一格小縮圖 + 章名 + 枚數，
      像攝影師在暗房先看一整捲的印樣，挑出要放大的格。
      點任一格 → 平滑捲到下方該 event 章節並展開（emit jump）。
    冷調膠卷 identity 保留（齒孔、序號、明體、冷銀刻度），但把「無窮長柱」換成
    「一屏可掃描的目次」。守 prefers-reduced-motion（無平滑捲動由父層處理）。
  -->
  <section class="darkroom-index" aria-labelledby="darkroom-index-heading">
    <header class="darkroom-index__head">
      <p class="darkroom-index__eyebrow">其の一 · Contact Sheet</p>
      <h2 id="darkroom-index-heading" class="darkroom-index__title font-jp">
        綜覽 <span class="darkroom-index__title-en">Index</span>
      </h2>
      <p class="darkroom-index__lede font-jp">
        全 {{ totalImages }} 枚・{{ events.length }} 巻。先挑一捲，再進暗房放大。
      </p>
    </header>

    <ol class="darkroom-index__grid">
      <li
        v-for="(ev, i) in events"
        :key="ev.key"
        class="darkroom-index__cell"
      >
        <button
          type="button"
          class="darkroom-index__btn group"
          :aria-label="`跳至 ${ev.eventName} 章節（${ev.count} 枚）`"
          @click="$emit('jump', ev.eventName)"
        >
          <span class="darkroom-index__thumb">
            <span class="darkroom-index__sprockets" aria-hidden="true"/>
            <img
              v-if="ev.cover"
              :src="getThumbPath(ev.cover, 400)"
              :alt="`${ev.eventName} 章封`"
              loading="lazy"
              decoding="async"
              class="darkroom-index__img"
            >
            <span class="darkroom-index__no" aria-hidden="true">{{ formatKansuji(i + 1) }}</span>
            <span class="darkroom-index__count" aria-hidden="true">{{ ev.count }}</span>
          </span>
          <span class="darkroom-index__label">
            <span class="darkroom-index__name font-jp">{{ ev.eventName }}</span>
            <span v-if="ev.loc" class="darkroom-index__loc">／{{ ev.loc }}</span>
          </span>
        </button>
      </li>
    </ol>

    <p class="darkroom-index__hint">
      <span class="darkroom-index__hint-rule" aria-hidden="true"/>
      <span>クリックで現像 — 点擊任一巻在下方暗房展開</span>
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MixedPhotoItem } from '~~/shared/types/gallery'
import { useImagePath } from '~/composables/useImagePath'

const props = defineProps<{ items: MixedPhotoItem[] }>()
defineEmits<{ jump: [eventName: string] }>()

const { getThumbPath } = useImagePath()

const events = computed(() =>
  props.items
    .filter(it => it.eventName)
    .map(it => ({
      key: it.key,
      eventName: it.eventName as string,
      count: it.images?.length || 0,
      cover: it.images?.[0]?.filename || null,
      loc: it.eventInfo?.location || it.images?.[0]?.event?.location || null
    }))
)

const totalImages = computed(() =>
  props.items.reduce((s, it) => s + (it.images?.length || 0), 0)
)

const KANSUJI = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五']
function formatKansuji (n: number): string {
  return KANSUJI[n] || String(n)
}
</script>

<style scoped>
/* =========================================================
   g1：暗室綜覽接觸印樣（contact-sheet index）
   冷銀暗房調，齒孔 + 序號 + 明體；把長柱換成一屏可掃描目次。
   ========================================================= */
.darkroom-index {
  max-width: 80rem;
  margin: 0 auto 3.5rem;
  padding: 0 1.5rem;
}

.darkroom-index__head { margin-bottom: 1.5rem; }
.darkroom-index__eyebrow {
  margin: 0 0 0.5rem;
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  font-size: 0.62rem;
  letter-spacing: 0.42em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--accent) 70%, var(--fg-muted));
}
.darkroom-index__title {
  margin: 0;
  font-family: var(--world-display, 'Noto Serif JP', 'Source Han Serif TC', serif);
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  font-weight: var(--world-display-weight, 400);
  letter-spacing: 0.2em;
  color: rgb(41 37 36);
}
:global(.dark) .darkroom-index__title { color: rgb(245 245 244); }
.darkroom-index__title-en {
  font-family: ui-monospace, monospace;
  font-size: 0.7rem;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: rgb(168 162 158);
  margin-left: 0.6rem;
  vertical-align: middle;
}
.darkroom-index__lede {
  margin: 0.7rem 0 0;
  font-family: 'Noto Serif JP', serif;
  font-size: 0.84rem;
  font-weight: 300;
  letter-spacing: 0.08em;
  line-height: 1.8;
  color: rgb(120 113 108);
}
:global(.dark) .darkroom-index__lede { color: rgb(168 162 158); }

/* 印樣格牆：桌機 4 欄、tablet 3、手機 2 — 一屏可覽 12 巻 */
.darkroom-index__grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1.1rem 1.2rem;
}
@media (max-width: 1023px) {
  .darkroom-index__grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 639px) {
  .darkroom-index__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.85rem; }
  .darkroom-index { padding: 0 1rem; }
}

.darkroom-index__btn {
  display: block;
  width: 100%;
  text-align: left;
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
}
.darkroom-index__btn:focus-visible { outline: none; }
.darkroom-index__btn:focus-visible .darkroom-index__thumb {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.darkroom-index__thumb {
  position: relative;
  display: block;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: linear-gradient(165deg, #20262c 0%, #14181c 100%);
  outline: 1px solid color-mix(in srgb, var(--accent) 16%, transparent);
}
.darkroom-index__sprockets {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 7px;
  z-index: 2;
  pointer-events: none;
  background-image: repeating-linear-gradient(
    to bottom,
    transparent 0, transparent 5px,
    rgba(238, 241, 243, 0.5) 5px, rgba(238, 241, 243, 0.5) 11px,
    transparent 11px, transparent 16px
  );
  opacity: 0.5;
}
.darkroom-index__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(0.82) contrast(1.02) brightness(0.96);
  transition: transform 0.6s cubic-bezier(0.22, 0.61, 0.36, 1), filter 0.5s ease;
}
.darkroom-index__btn:hover .darkroom-index__img {
  transform: scale(1.04);
  filter: saturate(1.02) contrast(1.05) brightness(1);
}
.darkroom-index__no {
  position: absolute;
  top: 0.4rem;
  left: 0.7rem;
  z-index: 3;
  font-family: 'Noto Serif JP', serif;
  font-size: 0.92rem;
  letter-spacing: 0.04em;
  color: rgba(238, 241, 243, 0.92);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
}
.darkroom-index__count {
  position: absolute;
  right: 0;
  bottom: 0;
  z-index: 3;
  background: rgb(217 123 46 / 0.9);
  color: rgb(250 250 249);
  font-family: 'Noto Serif JP', serif;
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  padding: 0.12rem 0.5rem;
  line-height: 1.4;
}

.darkroom-index__label {
  display: block;
  margin-top: 0.5rem;
}
.darkroom-index__name {
  display: block;
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  font-size: 0.84rem;
  font-weight: 400;
  letter-spacing: 0.08em;
  line-height: 1.45;
  color: rgb(68 64 60);
  transition: color 0.25s ease;
}
:global(.dark) .darkroom-index__name { color: rgb(214 211 209); }
.darkroom-index__btn:hover .darkroom-index__name {
  color: color-mix(in srgb, var(--accent) 80%, rgb(68 64 60));
}
.darkroom-index__loc {
  display: block;
  margin-top: 0.15rem;
  font-family: 'Noto Serif JP', serif;
  font-size: 0.62rem;
  letter-spacing: 0.1em;
  color: rgb(168 162 158);
}

.darkroom-index__hint {
  margin: 1.6rem 0 0;
  display: flex;
  align-items: center;
  gap: 0.9rem;
  font-family: ui-monospace, monospace;
  font-size: 0.58rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgb(168 162 158);
}
.darkroom-index__hint-rule {
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, color-mix(in srgb, var(--accent) 30%, transparent), transparent);
}

@media (prefers-reduced-motion: reduce) {
  .darkroom-index__img { transition: none; }
}
</style>
