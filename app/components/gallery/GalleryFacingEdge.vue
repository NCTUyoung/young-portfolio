<template>
  <!--
    j1（act-critic / 双面綴じ・裏地の書口）：持續性「對向世界書口」縱向書脊。
    回應前輪 critic 與五項標準 #4（雙主線世界）：舊結構在 GalleryWorldGate（門）之後
    兩世界並存就消失——繪頁只剩製図台、影頁只剩膠卷，捲下去秒回單世界部落格地層。
    本元件把「對向世界」做成一條【釘在主欄外緣、貫穿整頁的縱向書口】(fore-edge)：
      在繪(kai) → 右緣浮現 影 暗銀書口（縱書「影」+ 幾枚負片頁口 + 枚數）
      在影(kage)→ 左緣浮現 繪 cream 書口（縱書「繪」+ 幾葉藍圖頁口 + 葉數）
    讀作「另一本書的書口從旁露出」——兩世界整頁皆可感知、單擊即翻面切換世界。
    這是一條優雅克制的單一控制（非塞滿按鈕）：hover 微張、單擊翻面，user-initiated。
    full-bleed 主欄之上的 fixed 縱條，桌機 (lg+) 才出現；手機改頁尾橫向「翻面」帶。
    純導航 + 裝飾：縱書漢字與頁口縮圖 aria-hidden / pointer-events-none，
    可達性靠單一具名連結承擔。SSR 安全（prerender 即含此連結，無 client-only mount）。
  -->
  <aside
    v-if="other"
    class="fe"
    :data-world="otherWorld"
    :class="`fe--${otherWorld}`"
    aria-label="對向世界へ"
  >
    <NuxtLink :to="`/gallery/${otherTrack}`" class="fe__link" :aria-label="otherAriaLabel">
      <!-- 縱書世界名（書口脊上的字） -->
      <span class="fe__kana font-jp" aria-hidden="true">{{ otherKana }}</span>

      <!-- 頁口：幾枚對向世界縮圖，疊成「書側露出的頁緣」 -->
      <span class="fe__leaves" aria-hidden="true">
        <span
          v-for="(item, i) in leaves"
          :key="item.filename"
          class="fe__leaf"
          :style="{ '--i': i }"
        >
          <img
            :src="getThumbPath(item.filename, 400)"
            alt=""
            class="fe__leaf-img"
            loading="lazy"
            decoding="async"
            draggable="false"
          >
        </span>
      </span>

      <!-- 書口標牌：roman track + 枚/葉數 + 翻面提示 -->
      <span class="fe__plate" aria-hidden="true">
        <span class="fe__plate-roman">{{ otherRoman }}</span>
        <span class="fe__plate-count jp-kansuji">{{ otherCount }} {{ otherUnit }}</span>
        <span class="fe__plate-flip">翻 →</span>
      </span>
    </NuxtLink>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import type { GalleryItem } from '~~/shared/types/gallery'
import { useGalleryStore } from '~/stores/gallery'
import { useImagePath } from '~/composables/useImagePath'

/**
 * current = 訪客現在所在世界。書口顯示的是「對向世界」。
 * 'kai'  = 繪 (digital)，'kage' = 影 (photography)
 */
const props = defineProps<{ current: 'kai' | 'kage' }>()

const { getThumbPath } = useImagePath()
const galleryStore = useGalleryStore()
const { photographyWorks, digitalWorks } = storeToRefs(galleryStore)

const otherWorld = computed<'kai' | 'kage'>(() => (props.current === 'kai' ? 'kage' : 'kai'))
const otherTrack = computed(() => (otherWorld.value === 'kai' ? 'digital' : 'photography'))

function yearOf (item: GalleryItem): number {
  const t = item.time || item.event?.name || ''
  const m = String(t).match(/(\d{4})/)
  return m ? Number(m[1]) : 0
}

// 對向世界作品（最新領頭），頁口取前 5 枚作書緣
const otherWorks = computed<GalleryItem[]>(() =>
  (otherWorld.value === 'kai' ? digitalWorks.value : photographyWorks.value)
    .slice()
    .sort((a, b) => yearOf(b) - yearOf(a))
)
const other = computed<GalleryItem | null>(() => otherWorks.value[0] ?? null)
const leaves = computed<GalleryItem[]>(() => otherWorks.value.slice(0, 5))
const otherCount = computed(() => otherWorks.value.length)

const otherKana = computed(() => (otherWorld.value === 'kai' ? '繪' : '影'))
const otherRoman = computed(() => (otherWorld.value === 'kai' ? 'DIGITAL' : 'PHOTOGRAPHY'))
const otherUnit = computed(() => (otherWorld.value === 'kai' ? '葉' : '枚'))
const otherAriaLabel = computed(() =>
  otherWorld.value === 'kai'
    ? `繪の世界（製図室）へ翻る — ${otherCount.value} 葉`
    : `影の世界（暗室）へ翻る — ${otherCount.value} 枚`
)
</script>

<style scoped>
/*
  j1：對向世界書口 fore-edge —— 釘在主欄外緣的縱向書脊。
  桌機 (lg+) 才出現（手機改用頁尾橫帶，見頁面）。
  fixed 縱條貼視窗側緣，貫穿整頁 → 兩世界整頁皆可感知。
*/
.fe {
  position: fixed;
  top: 0;
  bottom: 0;
  z-index: 1040;
  display: none;
  pointer-events: none;
}
@media (min-width: 1024px) {
  .fe { display: block; }
}

/* 繪書口貼左緣（在影世界時）；影書口貼右緣（在繪世界時） */
.fe--kai { left: 0; }
.fe--kage { right: 0; }

.fe__link {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.9rem;
  width: clamp(54px, 4.4vw, 74px);
  padding: 1.4rem 0;
  pointer-events: auto;
  text-decoration: none;
  /* j2（critic：affordance 偏弱）：書口由側緣探出加大到 ~40px，首訪即明顯可見可點，
     hover/focus 再全張開。配合書口常駐「翻 →」提示（見 .fe__plate-flip）。 */
  transition: transform 0.55s cubic-bezier(0.22, 0.61, 0.36, 1);
  cursor: pointer;
}
.fe--kai .fe__link {
  left: 0;
  transform: translateY(-50%) translateX(calc(-100% + 40px));
  background: linear-gradient(100deg, #f3ede2 0%, #e8dfd0 100%);
  border-right: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
  box-shadow: 6px 0 22px rgba(28, 25, 23, 0.16);
  /* 製図網格薄底（繪世界語彙） */
  background-image:
    linear-gradient(to right, rgba(120,113,108,0.10) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(120,113,108,0.10) 1px, transparent 1px),
    linear-gradient(100deg, #f3ede2 0%, #e8dfd0 100%);
  background-size: 16px 16px, 16px 16px, 100% 100%;
}
.fe--kage .fe__link {
  right: 0;
  transform: translateY(-50%) translateX(calc(100% - 40px));
  background: linear-gradient(260deg, #20262c 0%, #14181c 100%);
  border-left: 1px solid color-mix(in srgb, var(--accent) 32%, transparent);
  box-shadow: -6px 0 22px rgba(0, 0, 0, 0.4);
}
.fe--kai .fe__link:hover,
.fe--kai .fe__link:focus-visible { transform: translateY(-50%) translateX(0); }
.fe--kage .fe__link:hover,
.fe--kage .fe__link:focus-visible { transform: translateY(-50%) translateX(0); }
.fe__link:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }

/* 縱書世界名（書口脊字） */
.fe__kana {
  writing-mode: vertical-rl;
  font-family: var(--world-display, 'Noto Serif JP', serif);
  font-size: clamp(1.7rem, 2.6vw, 2.4rem);
  font-weight: 200;
  line-height: 1;
  letter-spacing: 0.1em;
}
.fe--kai .fe__kana { color: color-mix(in srgb, var(--accent) 70%, rgb(68 64 60)); }
.fe--kage .fe__kana { color: color-mix(in srgb, var(--accent) 50%, #e2e8ee); }

/* 頁口：縮圖疊成書側露出的頁緣 */
.fe__leaves {
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 100%;
  padding: 0 6px;
}
.fe__leaf {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  opacity: 0.62;
  transition: opacity 0.4s ease, transform 0.5s cubic-bezier(0.22, 0.61, 0.36, 1);
  transition-delay: calc(var(--i) * 0.03s);
}
.fe--kai .fe__leaf { border: 1px solid rgba(120,113,108,0.28); }
.fe--kage .fe__leaf { border: 1px solid rgba(154,173,197,0.22); }
.fe__link:hover .fe__leaf,
.fe__link:focus-visible .fe__leaf { opacity: 1; }
.fe__leaf-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.fe--kai .fe__leaf-img { filter: saturate(0.9) contrast(1.02); }
.fe--kage .fe__leaf-img { filter: saturate(0.85) contrast(1.04) brightness(0.92); }

/* 書口標牌 */
.fe__plate {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  text-align: center;
}
.fe__plate-roman {
  writing-mode: vertical-rl;
  font-family: var(--world-mono, ui-monospace, monospace);
  font-size: 0.5rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
}
.fe--kai .fe__plate-roman { color: var(--accent-700, #a3491f); }
.fe--kage .fe__plate-roman { color: color-mix(in srgb, var(--accent) 70%, #9aadc5); }
.fe__plate-count {
  font-family: 'Noto Serif JP', serif;
  font-size: 0.6rem;
  letter-spacing: 0.12em;
}
.fe--kai .fe__plate-count { color: rgb(87 83 78); }
.fe--kage .fe__plate-count { color: rgba(206, 214, 224, 0.85); }
.fe__plate-flip {
  font-family: var(--world-mono, ui-monospace, monospace);
  font-size: 0.46rem;
  letter-spacing: 0.18em;
  /* j2（critic：可點性默認不可見）：翻面提示常駐半亮，hover/focus 全亮。 */
  opacity: 0.62;
  transition: opacity 0.3s ease;
}
.fe--kai .fe__plate-flip { color: var(--accent-700, #a3491f); }
.fe--kage .fe__plate-flip { color: color-mix(in srgb, var(--accent) 78%, #cbd5e1); }
.fe__link:hover .fe__plate-flip,
.fe__link:focus-visible .fe__plate-flip { opacity: 1; }

@media (prefers-reduced-motion: reduce) {
  .fe__link, .fe__leaf, .fe__plate-flip { transition: none; }
  /* 減動：書口固定半張（不靠 hover 滑入），仍可點 */
  .fe--kai .fe__link { transform: translateY(-50%) translateX(0); }
  .fe--kage .fe__link { transform: translateY(-50%) translateX(0); }
}
</style>
