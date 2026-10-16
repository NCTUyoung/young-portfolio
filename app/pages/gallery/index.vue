<template>
  <div />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

// Keep old /gallery links usable without adding a stop before the exhibition.
const route = useRoute()
// A prerendered HTTP redirect would discard the visitor's image query on GitHub Pages.
onMounted(() => {
  const image = Array.isArray(route.query.image) ? route.query.image[0] : route.query.image
  const category = typeof image === 'string' && image.startsWith('digital-') ? 'digital' : 'photography'
  void navigateTo({ path: `/gallery/${category}`, query: route.query, hash: route.hash }, { replace: true })
})
</script>
