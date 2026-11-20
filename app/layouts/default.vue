<template>
  <div class="museum-shell">
    <nav class="site-nav" aria-label="網站導覽" :data-hydrated="layoutHydrated">
      <div class="site-nav-inner">
        <NuxtLink to="/" class="site-signature" aria-label="NCTU Young — 首頁">
          <strong>NCTU</strong><span>Young</span>
        </NuxtLink>

        <div class="site-nav-links">
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
  { to: '/exhibition/light#painting', label: '當期展', section: 'exhibition' },
  { to: '/gallery', label: '館藏', section: 'collection' },
  { to: '/article', label: '手記', section: 'journal' },
] as const

const currentSection = computed(() => {
  if (route.path === '/' || route.path.startsWith('/exhibition')) return 'exhibition'
  if (route.path.startsWith('/gallery')) return 'collection'
  if (route.path.startsWith('/article')) return 'journal'
  return undefined
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
.site-nav-links, .site-footer-actions { display: flex; align-items: center; gap: clamp(.8rem, 2vw, 2rem); }

.site-nav-link {
  display: grid;
  place-items: center;
  min-width: 44px;
  min-height: 44px;
  padding-inline: .4rem;
  border-block: 1px solid transparent;
  color: var(--museum-muted);
  font-size: .88rem;
  text-decoration: none;
  white-space: nowrap;
}

.site-nav-current, .site-nav-link:hover { border-bottom-color: var(--museum-mark); color: var(--museum-ink); }

.site-menu-toggle {
  display: grid;
  min-width: 44px;
  min-height: 44px;
  place-items: center;
  color: var(--museum-ink);
}

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
  .site-nav-inner { gap: .45rem; }
  .site-nav-links { gap: clamp(0rem, calc((100vw - 320px) / 12), .65rem); }
  .site-nav-link { padding-inline: .2rem; font-size: .8rem; }
  .site-nav .site-signature { gap: .25rem; padding-left: .35rem; }
  .site-nav .site-signature strong { font-size: .95rem; }
  .site-nav .site-signature span { font-size: .55rem; letter-spacing: .13em; }
  .site-footer-actions { flex-wrap: wrap; }
}
</style>
