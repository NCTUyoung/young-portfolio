<template>
  <div />
</template>

<script setup lang="ts">
// Keep old /gallery links usable without adding a stop before the exhibition.
definePageMeta({ alias: ['/gallery/all'] })
useSeoMeta({ robots: 'noindex, follow' })
const router = useRouter()

// Read the full browser URL after Nuxt restores the query and fragment of the
// prerendered bridge. An HTTP redirect would discard that context on Pages.
onNuxtReady(() => {
  const path = router.currentRoute.value.path
  if (!/^\/gallery(?:\/all)?\/?$/.test(path)) return
  const { query, hash } = router.resolve(path + window.location.search + window.location.hash)
  const image = Array.isArray(query.image) ? query.image[0] : query.image
  const category = typeof image === 'string' && image.startsWith('digital-') ? 'digital' : 'photography'
  void router.replace({ path: `/gallery/${category}`, query, hash })
})
</script>
