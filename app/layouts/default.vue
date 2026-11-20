<template>
  <div class="museum-shell">
    <nav class="site-nav" aria-label="網站導覽" :data-hydrated="layoutHydrated">
      <div class="site-nav-inner">
        <NuxtLink to="/" class="site-signature" aria-label="NCTU Young — 首頁">
          <strong>NCTU</strong><span>Young</span>
        </NuxtLink>

        <div class="site-nav-desktop">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="site-nav-link"
            :class="{ 'site-nav-current': currentSection === link.section }"
            :aria-current="currentSection === link.section ? 'location' : undefined"
          >
            {{ link.label }}
          </NuxtLink>
          <button type="button" class="site-menu-toggle" :title="themeLabel" :aria-label="themeLabel" @click="toggleDark()">
            <Icon v-if="layoutHydrated && isDark" name="lucide:sun" aria-hidden="true" />
            <Icon v-else name="lucide:moon" aria-hidden="true" />
          </button>
        </div>

        <div class="site-nav-mobile">
          <HeadlessMenu as="div" class="relative">
            <HeadlessMenuButton type="button" class="site-menu-toggle" aria-label="開啟選單">
              <Icon name="lucide:menu" aria-hidden="true" />
            </HeadlessMenuButton>
            <HeadlessMenuItems class="site-menu">
              <HeadlessMenuItem v-for="link in navLinks" :key="link.to" v-slot="{ active }">
                <NuxtLink :to="link.to" class="site-menu-item" :class="{ 'site-menu-active': active }">
                  {{ link.label }}
                </NuxtLink>
              </HeadlessMenuItem>
              <HeadlessMenuItem v-slot="{ active }">
                <button
                  type="button"
                  class="site-menu-item site-menu-theme"
                  :class="{ 'site-menu-active': active }"
                  @click="toggleDark()"
                >
                  <span>{{ themeLabel }}</span>
                  <Icon v-if="isDark" name="lucide:sun" aria-hidden="true" />
                  <Icon v-else name="lucide:moon" aria-hidden="true" />
                </button>
              </HeadlessMenuItem>
            </HeadlessMenuItems>
          </HeadlessMenu>
        </div>
      </div>
    </nav>

    <main class="site-main max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <slot />
    </main>

    <footer class="site-footer">
      <div class="site-footer-inner">
        <div>
          <NuxtLink to="/" class="site-signature site-footer-signature" aria-label="NCTU Young — 回首頁">
            <strong>NCTU</strong><span>Young</span>
          </NuxtLink>
          <p class="site-copyright">© {{ currentYear }} NCTU Young</p>
        </div>
        <div class="site-footer-actions">
          <SocialMediaLinks variant="bare" />
          <NuxtLink to="/admin" class="site-admin" aria-label="後台管理入口">
            管理入口
          </NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useDark, useToggle } from '@vueuse/core'
import { sitePageUrl } from '~~/shared/utils/sitePageUrl'

const route = useRoute()
const canonical = computed(() => sitePageUrl(route.path))
useHead(() => ({ link: [{ rel: 'canonical', href: canonical.value }] }))
useSeoMeta({ ogUrl: canonical })

const isDark = useDark({ storageKey: 'vueuse-color-scheme', initialValue: 'light' })
const toggleDark = useToggle(isDark)
const layoutHydrated = ref(false)
const themeLabel = computed(() => layoutHydrated.value && isDark.value ? '切換到淺色模式' : '切換到深色模式')
const currentYear = new Date().getFullYear()

const navLinks = [
  { to: '/', label: '首頁', section: 'home' },
  { to: '/gallery/photography', label: '圖片庫', section: 'works' },
  { to: '/article', label: '文章', section: 'article' },
] as const

const currentSection = computed(() => {
  if (route.path.startsWith('/gallery') || route.path.startsWith('/exhibition')) return 'works'
  if (route.path.startsWith('/article')) return 'article'
  return route.path === '/' ? 'home' : undefined
})

onMounted(() => { layoutHydrated.value = true })
</script>

<style scoped>
.site-nav {
  position: sticky;
  top: 0;
  z-index: 1100;
  padding-top: env(safe-area-inset-top, 0px);
  border-bottom: 1px solid var(--museum-line);
  background: var(--museum-paper);
}

.site-nav-inner, .site-footer-inner {
  width: min(100%, 80rem);
  margin-inline: auto;
  padding-inline: clamp(1rem, 3.2vw, 2.5rem);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem 2rem;
}

.site-nav-inner { height: 4rem; }

.site-signature {
  display: inline-flex;
  align-items: baseline;
  gap: .45rem;
  padding-left: .65rem;
  border-left: 2px solid var(--museum-mark);
  color: var(--museum-ink);
  text-decoration: none;
  line-height: 1;
}

.site-signature strong { font-size: 1.26rem; letter-spacing: .06em; }
.site-signature span { font-size: .68rem; font-weight: 400; letter-spacing: .24em; text-transform: uppercase; }
.site-nav-desktop, .site-footer-actions { display: flex; align-items: center; gap: clamp(.8rem, 2vw, 2rem); }

.site-nav-link {
  display: grid;
  place-items: center;
  min-height: 44px;
  padding-inline: .4rem;
  border-block: 1px solid transparent;
  color: var(--museum-muted);
  font-size: .88rem;
  text-decoration: none;
}

.site-nav-current, .site-nav-link:hover { border-bottom-color: var(--museum-mark); color: var(--museum-ink); }
.site-nav-mobile { display: none; }

.site-menu-toggle {
  display: grid;
  min-width: 44px;
  min-height: 44px;
  place-items: center;
  color: var(--museum-ink);
}

.site-menu {
  position: absolute;
  inset: calc(100% + 7px) 0 auto auto;
  min-width: min(15rem, 77vw);
  padding: .5rem .75rem;
  border: 1px solid var(--museum-line);
  background: var(--museum-paper);
  box-shadow: 0 12px 24px #17110b14;
}

.site-menu-item {
  display: flex;
  align-items: center;
  min-height: 44px;
  width: 100%;
  padding-inline: .65rem;
  border-bottom: 1px solid var(--museum-line);
  color: var(--museum-ink);
  text-decoration: none;
}

.site-menu-active { background: var(--museum-light); }
.site-menu-theme { justify-content: space-between; border: none; }
.site-main { min-height: min(28rem, 70svh); }

.site-footer {
  background: var(--museum-light);
  border-top: 1px solid var(--museum-line);
}

.site-footer-inner {
  flex-wrap: wrap;
  padding-block: clamp(2rem, 5vw, 4rem) max(2rem, env(safe-area-inset-bottom, 0px));
}

.site-footer-signature { margin-bottom: .7rem; }
.site-copyright { color: var(--museum-muted); font-size: .75rem; }
.site-admin { display: flex; align-items: center; min-height: 44px; color: var(--museum-muted); font-size: .75rem; }
.site-admin:hover { color: var(--museum-mark); text-decoration: underline; text-underline-offset: .22em; }

@media (max-width: 767px) {
  .site-nav-desktop { display: none; }
  .site-nav-mobile { display: block; }
  .site-footer-actions { flex-wrap: wrap; }
}
</style>
