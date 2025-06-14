<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 导航栏 -->
    <nav class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <NuxtLink to="/" class="flex items-center">
              <span class="text-xl font-bold text-gray-900">NCTU Young</span>
            </NuxtLink>
          </div>

          <!-- 桌面版導航 -->
          <div class="hidden md:flex items-center space-x-4">
            <NuxtLink to="/" class="text-gray-600 hover:text-gray-900 transition-colors">首页</NuxtLink>
            <NuxtLink to="/about" class="text-gray-600 hover:text-gray-900 transition-colors">关于</NuxtLink>
            <NuxtLink to="/gallery" class="text-gray-600 hover:text-gray-900 transition-colors">图片库</NuxtLink>
            <NuxtLink to="/article" class="text-gray-600 hover:text-gray-900 transition-colors">文章</NuxtLink>
            <NuxtLink to="/admin" class="text-gray-600 hover:text-gray-900 transition-colors">後台管理</NuxtLink>

            <!-- Dark Mode Toggle -->
            <button
              @click="toggleDark()"
              class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              :title="isDark ? '切換到淺色模式' : '切換到深色模式'"
            >
              <svg v-if="isDark" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"></path>
              </svg>
              <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
              </svg>
            </button>
          </div>

          <!-- 手機版漢堡選單 -->
          <div class="md:hidden">
            <HeadlessMenu as="div" class="relative">
              <HeadlessMenuButton class="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
              </HeadlessMenuButton>

              <transition
                enter-active-class="transition duration-100 ease-out"
                enter-from-class="transform scale-95 opacity-0"
                enter-to-class="transform scale-100 opacity-100"
                leave-active-class="transition duration-75 ease-in"
                leave-from-class="transform scale-100 opacity-100"
                leave-to-class="transform scale-95 opacity-0"
              >
                <HeadlessMenuItems class="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div class="p-1">
                    <HeadlessMenuItem v-slot="{ active }">
                      <NuxtLink
                        to="/"
                        :class="[
                          active ? 'bg-gray-100' : '',
                          'block px-4 py-2 text-sm text-gray-700 rounded-md'
                        ]"
                      >
                        首页
                      </NuxtLink>
                    </HeadlessMenuItem>
                    <HeadlessMenuItem v-slot="{ active }">
                      <NuxtLink
                        to="/about"
                        :class="[
                          active ? 'bg-gray-100' : '',
                          'block px-4 py-2 text-sm text-gray-700 rounded-md'
                        ]"
                      >
                        关于
                      </NuxtLink>
                    </HeadlessMenuItem>
                    <HeadlessMenuItem v-slot="{ active }">
                      <NuxtLink
                        to="/gallery"
                        :class="[
                          active ? 'bg-gray-100' : '',
                          'block px-4 py-2 text-sm text-gray-700 rounded-md'
                        ]"
                      >
                        图片库
                      </NuxtLink>
                    </HeadlessMenuItem>
                    <HeadlessMenuItem v-slot="{ active }">
                      <NuxtLink
                        to="/article"
                        :class="[
                          active ? 'bg-gray-100' : '',
                          'block px-4 py-2 text-sm text-gray-700 rounded-md'
                        ]"
                      >
                        文章
                      </NuxtLink>
                    </HeadlessMenuItem>
                    <HeadlessMenuItem v-slot="{ active }">
                      <NuxtLink
                        to="/admin"
                        :class="[
                          active ? 'bg-gray-100' : '',
                          'block px-4 py-2 text-sm text-gray-700 rounded-md'
                        ]"
                      >
                        後台管理
                      </NuxtLink>
                    </HeadlessMenuItem>
                    <div class="border-t border-gray-100 my-1"></div>
                    <HeadlessMenuItem v-slot="{ active }">
                      <button
                        @click="toggleDark()"
                        :class="[
                          active ? 'bg-gray-100' : '',
                          'w-full text-left px-4 py-2 text-sm text-gray-700 rounded-md flex items-center'
                        ]"
                      >
                        <svg v-if="isDark" class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"></path>
                        </svg>
                        <svg v-else class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
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

    <!-- 主要内容 -->
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <slot />
    </main>

    <!-- 页脚 -->
    <footer class="bg-white border-t">
      <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <p class="text-center text-gray-500">© 2025 NCTU Young. All rights reserved.</p>
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