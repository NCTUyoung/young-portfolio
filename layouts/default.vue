<template>
  <div class="min-h-screen bg-stone-50/30 dark:bg-stone-900 transition-colors duration-300">
    <!-- 導航欄 — 滾動感知 -->
    <nav
      :class="[
        'fixed top-0 left-0 right-0 z-40 transition-all duration-500',
        isScrolled
          ? 'bg-white/92 dark:bg-stone-900/92 nav-scrolled border-b border-stone-200/40 dark:border-stone-700/40 shadow-sm'
          : 'bg-transparent border-b border-transparent'
      ]"
    >
      <div class="max-w-7xl mx-auto px-6 lg:px-8">
        <div class="flex justify-between transition-all duration-500" :class="isScrolled ? 'h-16' : 'h-20'">
          <div class="flex">
            <NuxtLink to="/" class="flex items-center group">
              <span
                class="font-extralight text-stone-800 dark:text-stone-200 tracking-wider group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-all duration-300"
                :class="isScrolled ? 'text-xl' : 'text-2xl'"
              >
                NCTU Young
              </span>
              <!-- Accent dot -->
              <div class="w-1.5 h-1.5 rounded-full bg-accent-400 ml-1 mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </NuxtLink>
          </div>

          <!-- 桌面版導航 -->
          <div class="hidden md:flex items-center space-x-8">
            <NuxtLink
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              class="text-stone-600 dark:text-stone-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors duration-300 font-light tracking-wide relative group"
            >
              {{ link.label }}
              <span class="absolute -bottom-2 left-0 w-0 h-px bg-accent-400 dark:bg-accent-500 transition-all duration-300 group-hover:w-full"></span>
            </NuxtLink>

            <!-- Dark Mode Toggle -->
            <button
              @click="toggleDark()"
              class="p-2.5 rounded-xl hover:bg-stone-100/50 dark:hover:bg-stone-700/50 transition-all duration-300 border border-stone-200/60 dark:border-stone-600/60 hover:border-accent-300/60 dark:hover:border-accent-600/60 group"
              :title="isDark ? '切換到淺色模式' : '切換到深色模式'"
            >
              <svg v-if="isDark" class="w-4.5 h-4.5 text-stone-400 group-hover:text-accent-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"></path>
              </svg>
              <svg v-else class="w-4.5 h-4.5 text-stone-600 group-hover:text-accent-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
              </svg>
            </button>
          </div>

          <!-- 手機版漢堡選單 -->
          <div class="md:hidden flex items-center">
            <HeadlessMenu as="div" class="relative">
              <HeadlessMenuButton class="p-3 rounded-xl hover:bg-stone-100/50 dark:hover:bg-stone-700/50 transition-all duration-300 border border-stone-200/60 dark:border-stone-600/60 hover:border-stone-300/80 dark:hover:border-stone-500/80">
                <svg class="w-6 h-6 text-stone-600 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 12h16M4 18h16"></path>
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
                <HeadlessMenuItems class="absolute right-0 mt-3 w-64 origin-top-right bg-white/90 dark:bg-stone-800/90 backdrop-blur-md rounded-xl border border-stone-200/60 dark:border-stone-700/60 ring-1 ring-stone-100/40 dark:ring-stone-700/40 focus:outline-none z-50">
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
                    <div class="border-t border-stone-200/40 dark:border-stone-700/40 my-2"></div>
                    <HeadlessMenuItem v-slot="{ active }">
                      <button
                        @click="toggleDark()"
                        :class="[
                          active ? 'bg-stone-50/60 dark:bg-stone-700/60 text-stone-800 dark:text-stone-200' : 'text-stone-600 dark:text-stone-400',
                          'w-full text-left px-4 py-3 text-sm font-light tracking-wide rounded-lg flex items-center transition-all duration-200'
                        ]"
                      >
                        <svg v-if="isDark" class="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"></path>
                        </svg>
                        <svg v-else class="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
                        </svg>
                        {{ isDark ? '淺色模式' : '深色模式' }}
                      </button>
                    </HeadlessMenuItem>
                  </div>
                </HeadlessMenuItems>
              </transition>
            </HeadlessMenu>
          </div>
        </div>
      </div>
    </nav>

    <!-- Navbar spacer -->
    <div :class="isScrolled ? 'h-16' : 'h-20'" class="transition-all duration-500"></div>

    <!-- 主要內容（帶頁面轉場） -->
    <main class="max-w-7xl mx-auto sm:px-6 lg:px-8">
      <slot />
    </main>

    <!-- 頁腳 -->
    <footer class="relative bg-white/60 dark:bg-stone-800/60 backdrop-blur-sm border-t border-stone-200/40 dark:border-stone-700/40">
      <div class="max-w-7xl mx-auto py-10 px-6 sm:px-6 lg:px-8">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p class="text-stone-500 dark:text-stone-400 font-light tracking-wide text-sm">
            © {{ currentYear }} NCTU Young
          </p>
          <div class="flex items-center gap-6">
            <a
              href="https://github.com/NCTUyoung"
              target="_blank"
              rel="noopener noreferrer"
              class="text-stone-400 dark:text-stone-500 hover:text-accent-500 dark:hover:text-accent-400 transition-colors duration-300"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
            <span class="text-stone-300 dark:text-stone-700 text-xs">|</span>
            <p class="text-stone-400 dark:text-stone-500 font-light tracking-wider text-xs italic">
              built with nuxt & tailwind
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

// Dark mode
const isDark = useDark()
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
