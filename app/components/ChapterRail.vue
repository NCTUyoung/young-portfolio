<template>
  <!--
    縦書「目次」chapter rail — lg+ only（fixed 右側 sticky）
    把首頁敘事的六個主要章節攤成書冊目次，editorial 隱性骨架。
    對齊「印」章「回開卷」、対話 hairline-v、Featured「対」navigation：
    全站「対」motif 從裝飾升級為導航。

    a11y：role=navigation + aria-label；目前 active 章節 aria-current="true"
    視覺：縦書き kanji + 短朱色 hairline + active 時加 accent dot
    動畫：用 transition-all + IntersectionObserver；prefers-reduced-motion 全 disable
  -->
  <nav
    v-if="enabled"
    class="hidden lg:flex fixed top-1/2 -translate-y-1/2 right-6 z-30 flex-col items-center gap-5 pointer-events-auto"
    aria-label="目次 · 章節導覽"
  >
    <span class="text-[0.55rem] tracking-[0.55em] uppercase text-stone-400/80 dark:text-stone-500/80 [writing-mode:vertical-rl] font-jp" aria-hidden="true">目次</span>
    <!-- 短 hairline 把「目次」和章節序連成一氣（Round 16 修：避免兩群組視覺斷裂） -->
    <span class="block w-px h-3 bg-stone-300/60 dark:bg-stone-600/50" aria-hidden="true"/>
    <ul class="flex flex-col items-center gap-4">
      <li v-for="ch in chapters" :key="ch.id">
        <a
          :href="`#${ch.id}`"
          class="group relative flex flex-col items-center gap-1.5 py-1 px-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-500/60 rounded-sm transition-colors duration-300"
          :class="active === ch.id
            ? 'text-stone-800 dark:text-stone-100'
            : 'text-stone-400/70 dark:text-stone-500/80 hover:text-stone-700 dark:hover:text-stone-200'"
          :aria-current="active === ch.id ? 'true' : undefined"
          :aria-label="`跳至章節：${ch.label}（${ch.kanji}）`"
          @click="onClick(ch.id, $event)"
        >
          <span
            class="font-jp text-base font-extralight tracking-[0.2em] leading-none [writing-mode:vertical-rl] transition-all duration-300"
            :class="active === ch.id ? 'opacity-100' : 'opacity-90 group-hover:opacity-100'"
          >{{ ch.kanji }}</span>
          <!-- active marker：朱色短軸線；非 active 為 stone hairline -->
          <span
            class="block w-px transition-all duration-300"
            :class="active === ch.id
              ? 'h-5 bg-accent-500 dark:bg-accent-400'
              : 'h-2 bg-stone-300/70 dark:bg-stone-600/70 group-hover:h-3 group-hover:bg-stone-500/70'"
            aria-hidden="true"
          />
        </a>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

interface Chapter {
  id: string
  kanji: string
  label: string
}

// 章節順序對應書本目次（R32：Domains 已砍 → 5 章節）：序 → 対 → 步 → 選 → 印
// hero 沒有 id（即 top of page），active 偵測單靠 scrollY < 第二章 top 邊界
const chapters: Chapter[] = [
  { id: 'top', kanji: '序', label: 'Hero' },
  { id: 'dialogue', kanji: '対', label: 'Dialogue 対話' },
  { id: 'journey', kanji: '步', label: 'Journey 步履' },
  { id: 'featured', kanji: '選', label: 'Featured 選' },
  { id: 'epilogue', kanji: '印', label: 'Epilogue 印' },
]

const active = ref<string>('top')
const enabled = ref(true)

function recompute () {
  if (typeof window === 'undefined') return
  // R32：Domains 砍除後，hero 邊界改用 dialogue 第一章作 anchor
  const firstSection = document.getElementById('dialogue')
  const heroBound = firstSection ? (firstSection.getBoundingClientRect().top + window.scrollY - 200) : window.innerHeight * 0.8
  if (window.scrollY < heroBound) {
    active.value = 'top'
    return
  }
  // 用每個 section 與 viewport 中線比對：選最接近中線的 section
  let bestId: string | null = null
  let bestDist = Number.POSITIVE_INFINITY
  const viewportMid = window.innerHeight / 2
  for (const ch of chapters) {
    if (ch.id === 'top') continue
    const el = document.getElementById(ch.id)
    if (!el) continue
    const rect = el.getBoundingClientRect()
    if (rect.bottom < 0 || rect.top > window.innerHeight) continue
    // 距離 = 中線到 section 中央
    const mid = (rect.top + rect.bottom) / 2
    const dist = Math.abs(mid - viewportMid)
    if (dist < bestDist) {
      bestDist = dist
      bestId = ch.id
    }
  }
  if (bestId) active.value = bestId
}

function onClick (id: string, e: MouseEvent) {
  if (id === 'top') {
    e.preventDefault()
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
  }
  // 其餘交給瀏覽器原生 #anchor 行為 + scroll-mt 已設
}

onMounted(() => {
  recompute()
  window.addEventListener('scroll', recompute, { passive: true })
  window.addEventListener('resize', recompute)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', recompute)
  window.removeEventListener('resize', recompute)
})
</script>
