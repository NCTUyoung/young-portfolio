<template>
  <div class="min-h-screen bg-stone-50/30 dark:bg-stone-900 transition-colors duration-300">
    <!-- 導航欄 — 滾動感知 -->
    <nav
      :class="[
        'fixed top-0 left-0 right-0 z-[1100] pt-[env(safe-area-inset-top,0px)] transition-all duration-500',
        isScrolled
          ? 'bg-white/92 dark:bg-stone-900/92 nav-scrolled border-b border-stone-200/40 dark:border-stone-700/40 shadow-sm'
          : 'bg-white/55 dark:bg-stone-900/50 backdrop-blur-md border-b border-stone-200/20 dark:border-stone-700/20'
      ]"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <!-- 主標：極粗黑體感，平面單色；hover 才帶入琥珀（呼應字體裝飾拼貼的強對比） -->
                <span
                  class="font-black tracking-[-0.04em] text-stone-900 transition-all duration-300 group-hover:text-accent-700 group-hover:drop-shadow-[0_1px_0_rgba(196,96,35,0.25)] dark:text-stone-50 dark:group-hover:text-accent-400 dark:group-hover:drop-shadow-[0_0_12px_rgba(228,150,74,0.2)]"
                  :class="isScrolled ? 'text-xl sm:text-xl' : 'text-2xl sm:text-[1.65rem]'"
                >
                  NCTU
                </span>
                <span
                  class="font-extralight uppercase tracking-[0.38em] text-stone-500 transition-colors duration-300 group-hover:text-stone-700 dark:text-stone-500 dark:group-hover:text-stone-300"
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

            <!-- Dark Mode Toggle (ClientOnly: avoids SSR vs client theme mismatch hydration warnings) -->
            <ClientOnly>
              <button
                type="button"
                class="p-2.5 rounded-xl hover:bg-stone-100/50 dark:hover:bg-stone-700/50 transition-all duration-300 border border-stone-200/60 dark:border-stone-600/60 hover:border-accent-300/60 dark:hover:border-accent-600/60 group"
                :title="isDark ? '切換到淺色模式' : '切換到深色模式'"
                @click="toggleDark()"
              >
                <svg v-if="isDark" class="w-4.5 h-4.5 text-stone-400 group-hover:text-accent-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"/>
                </svg>
                <svg v-else class="w-4.5 h-4.5 text-stone-600 group-hover:text-accent-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
                </svg>
              </button>
              <template #fallback>
                <button
                  type="button"
                  class="p-2.5 rounded-xl border border-stone-200/60 dark:border-stone-600/60 opacity-70 pointer-events-none"
                  aria-hidden="true"
                  tabindex="-1"
                >
                  <svg class="w-4.5 h-4.5 text-stone-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
                  </svg>
                </button>
              </template>
            </ClientOnly>
          </div>

          <!-- 手機版漢堡選單 -->
          <div class="md:hidden flex items-center">
            <HeadlessMenu as="div" class="relative">
              <HeadlessMenuButton class="p-3 rounded-xl hover:bg-stone-100/50 dark:hover:bg-stone-700/50 transition-all duration-300 border border-stone-200/60 dark:border-stone-600/60 hover:border-stone-300/80 dark:hover:border-stone-500/80">
                <svg class="w-6 h-6 text-stone-600 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
              </HeadlessMenuButton>

              <transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="transform scale-95 opacity-0"
                enter-to-class="transform scale-100 opacity-100"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="transform scale-100 opacity-100"
                leave-to-class="transform scale-95 opacity-0"
              >
                <HeadlessMenuItems class="absolute right-0 mt-3 w-64 origin-top-right bg-white/90 dark:bg-stone-800/90 backdrop-blur-md rounded-xl border border-stone-200/60 dark:border-stone-700/60 ring-1 ring-stone-100/40 dark:ring-stone-700/40 focus:outline-none z-[1200]">
                  <div class="p-2">
                    <HeadlessMenuItem v-for="link in navLinks" :key="link.to" v-slot="{ active }">
                      <NuxtLink
                        :to="link.to"
                        :class="[
                          active ? 'bg-stone-50/60 dark:bg-stone-700/60 text-stone-800 dark:text-stone-200' : 'text-stone-600 dark:text-stone-400',
                          'block px-4 py-3 text-sm font-light tracking-wide rounded-lg transition-all duration-200'
                        ]"
                      >
                        {{ link.label }}
                      </NuxtLink>
                    </HeadlessMenuItem>
                    <div class="border-t border-stone-200/40 dark:border-stone-700/40 my-2"/>
                    <HeadlessMenuItem v-slot="{ active }">
                      <ClientOnly>
                        <button
                          type="button"
                          :class="[
                            active ? 'bg-stone-50/60 dark:bg-stone-700/60 text-stone-800 dark:text-stone-200' : 'text-stone-600 dark:text-stone-400',
                            'w-full text-left px-4 py-3 text-sm font-light tracking-wide rounded-lg flex items-center transition-all duration-200'
                          ]"
                          @click="toggleDark()"
                        >
                          <svg v-if="isDark" class="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"/>
                          </svg>
                          <svg v-else class="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
                          </svg>
                          {{ isDark ? '淺色模式' : '深色模式' }}
                        </button>
                        <template #fallback>
                          <button
                            type="button"
                            class="w-full text-left px-4 py-3 text-sm font-light tracking-wide rounded-lg flex items-center text-stone-600 dark:text-stone-400 opacity-70 pointer-events-none"
                            aria-hidden="true"
                            tabindex="-1"
                          >
                            <svg class="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
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

          <!-- 左側：品牌 + 豎排日文裝飾 -->
          <div class="flex items-center gap-5">
            <!-- 豎排裝飾字 -->
            <span class="writing-vertical font-jp text-xs tracking-[0.4em] text-stone-300 dark:text-stone-700 select-none hidden sm:block">余白</span>
            <div class="w-px h-8 bg-gradient-to-b from-transparent via-stone-300/60 dark:via-stone-600/40 to-transparent hidden sm:block"/>
            <div>
              <p class="text-stone-600 dark:text-stone-400 font-light tracking-widest text-sm">NCTU Young</p>
              <p class="text-stone-400 dark:text-stone-600 font-light tracking-wider text-xs mt-0.5">© {{ currentYear }}</p>
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

// Dark mode — 預設走 dark，尊重使用者已儲存的偏好（storageKey 須與 nuxt.config theme-boot 腳本一致）
const isDark = useDark({
  storageKey: 'vueuse-color-scheme',
  initialValue: 'dark'
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
