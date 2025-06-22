<template>
  <div class="min-h-screen bg-stone-50/30">
    <!-- 導航欄 -->
    <nav class="bg-white/80 backdrop-blur-md border-b border-stone-200/40">
      <div class="max-w-7xl mx-auto px-6 lg:px-8">
        <div class="flex justify-between h-20">
          <div class="flex">
            <NuxtLink to="/" class="flex items-center group">
              <span class="text-2xl font-extralight text-stone-800 tracking-wider group-hover:text-stone-600 transition-colors duration-300">NCTU Young</span>
            </NuxtLink>
          </div>

          <!-- 桌面版導航 -->
          <div class="hidden md:flex items-center space-x-8">
            <NuxtLink to="/" class="text-stone-600 hover:text-stone-800 transition-colors duration-300 font-light tracking-wide relative group">
              首頁
              <span class="absolute -bottom-2 left-0 w-0 h-px bg-stone-400 transition-all duration-300 group-hover:w-full"></span>
            </NuxtLink>
            <NuxtLink to="/about" class="text-stone-600 hover:text-stone-800 transition-colors duration-300 font-light tracking-wide relative group">
              關於
              <span class="absolute -bottom-2 left-0 w-0 h-px bg-stone-400 transition-all duration-300 group-hover:w-full"></span>
            </NuxtLink>
            <NuxtLink to="/gallery" class="text-stone-600 hover:text-stone-800 transition-colors duration-300 font-light tracking-wide relative group">
              圖片庫
              <span class="absolute -bottom-2 left-0 w-0 h-px bg-stone-400 transition-all duration-300 group-hover:w-full"></span>
            </NuxtLink>
            <NuxtLink to="/article" class="text-stone-600 hover:text-stone-800 transition-colors duration-300 font-light tracking-wide relative group">
              文章
              <span class="absolute -bottom-2 left-0 w-0 h-px bg-stone-400 transition-all duration-300 group-hover:w-full"></span>
            </NuxtLink>
            <NuxtLink to="/admin" class="text-stone-600 hover:text-stone-800 transition-colors duration-300 font-light tracking-wide relative group">
              後台管理
              <span class="absolute -bottom-2 left-0 w-0 h-px bg-stone-400 transition-all duration-300 group-hover:w-full"></span>
            </NuxtLink>

            <!-- Dark Mode Toggle -->
            <button
              @click="toggleDark()"
              class="p-3 rounded-xl hover:bg-stone-100/50 transition-all duration-300 border border-stone-200/60 hover:border-stone-300/80 group"
              :title="isDark ? '切換到淺色模式' : '切換到深色模式'"
            >
              <svg v-if="isDark" class="w-5 h-5 text-stone-600 group-hover:text-stone-800" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"></path>
              </svg>
              <svg v-else class="w-5 h-5 text-stone-600 group-hover:text-stone-800" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
              </svg>
            </button>
          </div>

          <!-- 手機版漢堡選單 -->
          <div class="md:hidden">
            <HeadlessMenu as="div" class="relative">
              <HeadlessMenuButton class="p-3 rounded-xl hover:bg-stone-100/50 transition-all duration-300 border border-stone-200/60 hover:border-stone-300/80">
                <svg class="w-6 h-6 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <HeadlessMenuItems class="absolute right-0 mt-3 w-64 origin-top-right bg-white/90 backdrop-blur-md rounded-xl border border-stone-200/60 ring-1 ring-stone-100/40 focus:outline-none z-50">
                  <div class="p-2">
                    <HeadlessMenuItem v-slot="{ active }">
                      <NuxtLink
                        to="/"
                        :class="[
                          active ? 'bg-stone-50/60 text-stone-800' : 'text-stone-600',
                          'block px-4 py-3 text-sm font-light tracking-wide rounded-lg transition-all duration-200'
                        ]"
                      >
                        首頁
                      </NuxtLink>
                    </HeadlessMenuItem>
                    <HeadlessMenuItem v-slot="{ active }">
                      <NuxtLink
                        to="/about"
                        :class="[
                          active ? 'bg-stone-50/60 text-stone-800' : 'text-stone-600',
                          'block px-4 py-3 text-sm font-light tracking-wide rounded-lg transition-all duration-200'
                        ]"
                      >
                        關於
                      </NuxtLink>
                    </HeadlessMenuItem>
                    <HeadlessMenuItem v-slot="{ active }">
                      <NuxtLink
                        to="/gallery"
                        :class="[
                          active ? 'bg-stone-50/60 text-stone-800' : 'text-stone-600',
                          'block px-4 py-3 text-sm font-light tracking-wide rounded-lg transition-all duration-200'
                        ]"
                      >
                        圖片庫
                      </NuxtLink>
                    </HeadlessMenuItem>
                    <HeadlessMenuItem v-slot="{ active }">
                      <NuxtLink
                        to="/article"
                        :class="[
                          active ? 'bg-stone-50/60 text-stone-800' : 'text-stone-600',
                          'block px-4 py-3 text-sm font-light tracking-wide rounded-lg transition-all duration-200'
                        ]"
                      >
                        文章
                      </NuxtLink>
                    </HeadlessMenuItem>
                    <HeadlessMenuItem v-slot="{ active }">
                      <NuxtLink
                        to="/admin"
                        :class="[
                          active ? 'bg-stone-50/60 text-stone-800' : 'text-stone-600',
                          'block px-4 py-3 text-sm font-light tracking-wide rounded-lg transition-all duration-200'
                        ]"
                      >
                        後台管理
                      </NuxtLink>
                    </HeadlessMenuItem>
                    <div class="border-t border-stone-200/40 my-2"></div>
                    <HeadlessMenuItem v-slot="{ active }">
                      <button
                        @click="toggleDark()"
                        :class="[
                          active ? 'bg-stone-50/60 text-stone-800' : 'text-stone-600',
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

    <!-- 主要內容 -->
    <main class="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
      <slot />
    </main>

    <!-- 頁腳 -->
    <footer class="bg-white/60 backdrop-blur-sm border-t border-stone-200/40">
      <div class="max-w-7xl mx-auto py-8 px-6 sm:px-6 lg:px-8">
        <p class="text-center text-stone-500 font-light tracking-wide">© 2025 NCTU Young. All rights reserved.</p>
      </div>
    </footer>

    <!-- Toast 通知 -->
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { ref, provide } from 'vue'
import { useDark, useToggle } from '@vueuse/core'

// Dark mode functionality using VueUse
const isDark = useDark()
const toggleDark = useToggle(isDark)

// 不再需要 toast ref 和 provide，因為現在使用全域 composable
</script>