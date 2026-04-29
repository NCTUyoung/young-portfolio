<template>
  <div class="min-h-screen bg-stone-50/30 dark:bg-stone-900 transition-colors duration-300">
    <!--
      導航欄 — 滾動感知（2026-04-28：改 editorial 處理）
      原 border-b 實線 + shadow-sm 的工具列感 → 改為 hairline 漸層底線（design rule §3）。
      scroll 後背景仍維持 backdrop-blur 但 shadow 撤掉，由 hairline 與微亮 bg 區分滾動狀態。
    -->
    <nav
      :class="[
        'fixed top-0 left-0 right-0 z-[1100] pt-[env(safe-area-inset-top,0px)] transition-all duration-500',
        isScrolled
          ? 'bg-white/92 dark:bg-stone-900/92 nav-scrolled'
          : 'bg-white/55 dark:bg-stone-900/50 backdrop-blur-md'
      ]"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- 底部 hairline：scroll 後加深；取代原本實線 border -->
        <span
          aria-hidden="true"
          class="absolute left-0 right-0 bottom-0 jp-hairline transition-opacity duration-500"
          :class="isScrolled ? 'opacity-100' : 'opacity-50'"
        />
        <div class="flex justify-between transition-all duration-500" :class="isScrolled ? 'h-16' : 'h-20'">
          <div class="flex">
            <NuxtLink
              to="/"
              class="group relative flex items-center gap-2 sm:gap-2.5"
              aria-label="NCTU Young — 首頁"
            >
              <!-- 單色直條：標題字左緣／漫畫標題卡常見豎線 -->
              <span
                class="hidden h-[1.2em] w-[2px] shrink-0 rounded-[1px] bg-stone-900 sm:block dark:bg-stone-100"
                aria-hidden="true"
              />
              <span class="flex items-baseline gap-1.5 sm:gap-2">
                <!-- 主標：editorial bold + 正字距（對齊 ui_kits/portfolio_site/Header.jsx：weight 700, .06em tracking）-->
                <span
                  class="font-bold tracking-[0.06em] text-stone-900 transition-colors duration-300 group-hover:text-accent-700 dark:text-stone-50 dark:group-hover:text-accent-400"
                  :class="isScrolled ? 'text-xl sm:text-xl' : 'text-2xl sm:text-[1.65rem]'"
                >
                  NCTU
                </span>
                <span
                  class="font-light uppercase tracking-[0.36em] text-stone-500 transition-colors duration-300 group-hover:text-stone-700 dark:text-stone-500 dark:group-hover:text-stone-300"
                  :class="isScrolled ? 'text-[0.6rem]' : 'text-[0.65rem] sm:text-xs'"
                >
                  Young
                </span>
              </span>
              <span
                class="absolute -right-0.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-accent-500 opacity-0 ring-1 ring-stone-900/10 transition-opacity duration-300 group-hover:opacity-100 dark:bg-accent-400 dark:ring-white/10"
                aria-hidden="true"
              />
            </NuxtLink>
          </div>

          <!-- 桌面版導航 -->
          <div class="hidden md:flex items-center space-x-8">
            <NuxtLink
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              class="text-stone-700 dark:text-stone-200 hover:text-accent-600 dark:hover:text-accent-400 transition-colors duration-300 font-light tracking-wide relative group"
            >
              {{ link.label }}
              <span class="absolute -bottom-2 left-0 w-0 h-px bg-accent-400 dark:bg-accent-500 transition-all duration-300 group-hover:w-full"/>
            </NuxtLink>

            <!--
              直立 hairline + 縦書き「栞」（書籤），承擔 editorial header 的小裝飾
              不複雜化（依 brief「但不要變複雜」）：純 dom，無互動
            -->
            <span class="hidden lg:flex items-center gap-2 select-none pointer-events-none" aria-hidden="true">
              <span class="block w-px h-4 bg-stone-300/60 dark:bg-stone-600/60"/>
              <span class="font-jp text-[0.65rem] tracking-[0.4em] text-stone-400 dark:text-stone-500 font-extralight">栞</span>
            </span>

            <!--
              Dark Mode Toggle — editorial 化（撤 rounded-xl + border 工具列感）
              改為 bare 圖示，hover 才出現 hairline underline，與 nav 連結同 family。
              ClientOnly：避免 SSR/client 主題不一致造成 hydration warning。
            -->
            <ClientOnly>
              <button
                type="button"
                class="group relative p-1.5 transition-colors duration-300"
                :title="isDark ? '切換到淺色模式' : '切換到深色模式'"
                :aria-label="isDark ? '切換到淺色模式' : '切換到深色模式'"
                @click="toggleDark()"
              >
                <svg v-if="isDark" class="w-4 h-4 text-stone-500 group-hover:text-accent-500 dark:text-stone-400 dark:group-hover:text-accent-400 transition-colors" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="4"/>
                  <path stroke-linecap="round" d="M12 3v1.5M12 19.5V21M3 12h1.5M19.5 12H21M5.6 5.6l1.06 1.06M17.34 17.34l1.06 1.06M5.6 18.4l1.06-1.06M17.34 6.66l1.06-1.06"/>
                </svg>
                <svg v-else class="w-4 h-4 text-stone-500 group-hover:text-accent-600 dark:text-stone-400 dark:group-hover:text-accent-400 transition-colors" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
                </svg>
                <span class="absolute -bottom-1 left-1/2 -translate-x-1/2 h-px w-0 bg-accent-400 dark:bg-accent-500 transition-all duration-300 group-hover:w-4"/>
              </button>
              <template #fallback>
                <button
                  type="button"
                  class="p-1.5 opacity-70 pointer-events-none"
                  aria-hidden="true"
                  tabindex="-1"
                >
                  <svg class="w-4 h-4 text-stone-500" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
                  </svg>
                </button>
              </template>
            </ClientOnly>
          </div>

          <!--
            手機版漢堡選單（editorial 化）
            原 rounded-xl + border + bg hover 工具列感 → 改 bare 1px stroke 圖示。
            menu 面板用直角 + jp-hairline，移除 ring 與 rounded-xl。
          -->
          <div class="md:hidden flex items-center">
            <HeadlessMenu as="div" class="relative">
              <HeadlessMenuButton class="group p-2 transition-colors duration-300">
                <svg class="w-6 h-6 text-stone-600 group-hover:text-accent-600 dark:text-stone-300 dark:group-hover:text-accent-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 7h16M4 12h16M4 17h16"/>
                </svg>
                <span class="sr-only">開啟選單</span>
              </HeadlessMenuButton>

              <transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="transform scale-95 opacity-0"
                enter-to-class="transform scale-100 opacity-100"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="transform scale-100 opacity-100"
                leave-to-class="transform scale-95 opacity-0"
              >
                <HeadlessMenuItems class="absolute right-0 mt-3 w-60 origin-top-right bg-stone-50/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-200/70 dark:border-stone-700/60 focus:outline-none z-[1200] shadow-japanese">
                  <!-- 書扉 eyebrow：menu 也讓 design language 延續 -->
                  <div class="px-4 pt-4 pb-2 flex items-baseline justify-between">
                    <p class="jp-section-label">Index · 目次</p>
                    <span class="font-jp text-[0.7rem] tracking-[0.4em] text-stone-400 dark:text-stone-500">栞</span>
                  </div>
                  <div class="jp-hairline mx-4"/>
                  <div class="p-2">
                    <HeadlessMenuItem v-for="(link, idx) in navLinks" :key="link.to" v-slot="{ active }">
                      <NuxtLink
                        :to="link.to"
                        :class="[
                          active ? 'bg-stone-100/70 dark:bg-stone-800/70 text-stone-900 dark:text-stone-50' : 'text-stone-600 dark:text-stone-300',
                          'group flex items-baseline justify-between gap-3 px-3 py-3 text-sm font-light tracking-wide transition-colors duration-200'
                        ]"
                      >
                        <span>
                          <span class="jp-kansuji text-[0.65rem] tracking-[0.35em] text-stone-400 dark:text-stone-500 mr-2">{{ kanjiIndex(idx) }}</span>
                          {{ link.label }}
                        </span>
                        <span class="text-[0.6rem] tracking-[0.35em] uppercase text-stone-300 dark:text-stone-600 group-hover:text-accent-500 dark:group-hover:text-accent-400 transition-colors">→</span>
                      </NuxtLink>
                    </HeadlessMenuItem>
                    <div class="jp-hairline my-2"/>
                    <HeadlessMenuItem v-slot="{ active }">
                      <ClientOnly>
                        <button
                          type="button"
                          :class="[
                            active ? 'bg-stone-100/70 dark:bg-stone-800/70 text-stone-900 dark:text-stone-50' : 'text-stone-600 dark:text-stone-300',
                            'w-full text-left px-3 py-3 text-sm font-light tracking-wide flex items-center justify-between transition-colors duration-200'
                          ]"
                          @click="toggleDark()"
                        >
                          <span class="flex items-center gap-3">
                            <svg v-if="isDark" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24" aria-hidden="true">
                              <circle cx="12" cy="12" r="4"/>
                              <path stroke-linecap="round" d="M12 3v1.5M12 19.5V21M3 12h1.5M19.5 12H21M5.6 5.6l1.06 1.06M17.34 17.34l1.06 1.06M5.6 18.4l1.06-1.06M17.34 6.66l1.06-1.06"/>
                            </svg>
                            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24" aria-hidden="true">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
                            </svg>
                            {{ isDark ? '淺色模式' : '深色模式' }}
                          </span>
                          <span class="text-[0.6rem] tracking-[0.35em] uppercase text-stone-400 dark:text-stone-500">{{ isDark ? 'Light' : 'Dark' }}</span>
                        </button>
                        <template #fallback>
                          <button
                            type="button"
                            class="w-full text-left px-3 py-3 text-sm font-light tracking-wide flex items-center text-stone-600 dark:text-stone-300 opacity-70 pointer-events-none"
                            aria-hidden="true"
                            tabindex="-1"
                          >
                            <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
                            </svg>
                            深色模式
                          </button>
                        </template>
                      </ClientOnly>
                    </HeadlessMenuItem>
                  </div>
                </HeadlessMenuItems>
              </transition>
            </HeadlessMenu>
          </div>
        </div>
      </div>
    </nav>

    <!-- Navbar spacer（含瀏海安全區，避免主內容被固定列遮住） -->
    <div
      class="transition-all duration-500 shrink-0"
      :style="{
        minHeight: `calc(env(safe-area-inset-top, 0px) + ${isScrolled ? '4rem' : '5rem'})`
      }"
    />

    <!-- 主要內容（帶頁面轉場） -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <slot />
    </main>

    <!-- 頁腳 -->
    <footer class="relative bg-white/60 dark:bg-stone-800/60 backdrop-blur-sm border-t border-stone-200/40 dark:border-stone-700/40">
      <!-- 上方裝飾線 -->
      <div class="deco-line-h w-full top-0 left-0 absolute"/>

      <div class="max-w-7xl mx-auto py-10 px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-8">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-6">

          <!-- 左側：品牌 + 豎排日文裝飾（對齊 ui_kits/portfolio_site/Footer.jsx 同 lockup）-->
          <div class="flex items-center gap-5">
            <!-- 豎排裝飾字 -->
            <span class="writing-vertical font-jp text-xs tracking-[0.4em] text-stone-300 dark:text-stone-700 select-none hidden sm:block">余白</span>
            <div class="w-px h-8 bg-gradient-to-b from-transparent via-stone-300/60 dark:via-stone-600/40 to-transparent hidden sm:block"/>
            <div>
              <span class="flex items-baseline gap-2">
                <!-- 與 Header lockup 對稱：豎線 + bold NCTU + extralight YOUNG -->
                <span class="block w-[2px] h-[1.05em] shrink-0 rounded-[1px] bg-stone-700 dark:bg-stone-300" aria-hidden="true"/>
                <span class="font-bold tracking-[0.06em] text-stone-700 dark:text-stone-300 text-base">NCTU</span>
                <span class="font-light uppercase tracking-[0.36em] text-stone-400 dark:text-stone-500 text-[0.65rem]">Young</span>
              </span>
              <p class="text-stone-400 dark:text-stone-600 font-light tracking-wider text-xs mt-1">© {{ currentYear }}</p>
            </div>
          </div>

          <!-- 右側：社群 + 技術說明 -->
          <div class="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <SocialMediaLinks variant="bare" />
            <div class="hidden sm:block w-px h-4 bg-stone-200 dark:bg-stone-700"/>
            <p class="text-stone-400 dark:text-stone-600 font-light tracking-wider text-xs italic">
              nuxt · tailwind · 手作
            </p>
          </div>
        </div>
      </div>
    </footer>

    <!-- Toast 通知 -->
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useDark, useToggle } from '@vueuse/core'

// Dark mode — 預設走 light，尊重使用者已儲存的偏好（storageKey 須與 nuxt.config theme-boot 腳本一致）
const isDark = useDark({
  storageKey: 'vueuse-color-scheme',
  initialValue: 'light'
})
const toggleDark = useToggle(isDark)

// 動態年份
const currentYear = new Date().getFullYear()

// 導航連結
const navLinks = [
  { to: '/', label: '首頁' },
  { to: '/gallery', label: '圖片庫' },
  { to: '/article', label: '文章' },
  { to: '/admin', label: '後台管理' },
]

// 漢數字章碼（手機版選單編號用）— 與 article 目次同 family
const KANJI_INDEX = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
const kanjiIndex = (i: number) => KANJI_INDEX[i] ?? `${i + 1}`

// 滾動感知
const isScrolled = ref(false)

const handleScroll = () => {
  isScrolled.value = window.scrollY > 40
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll() // init
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>
