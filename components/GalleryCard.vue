<template>
  <div class="bg-white/80 dark:bg-stone-800/60 backdrop-blur-sm rounded-xl border border-stone-200/60 dark:border-stone-700/60 overflow-hidden hover:border-accent-200/60 dark:hover:border-accent-700/40 transition-all duration-500 group">
    <div class="relative overflow-hidden">
      <img
        :src="getImagePath(image.filename)"
        :alt="image.title"
        class="w-full h-48 object-cover transition-transform duration-700 group-hover:scale-105"
        loading="lazy"
      >
      <!-- 漸層遮罩 -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>
    </div>
    <div class="p-4">
      <h3 class="text-base font-extralight text-stone-800 dark:text-stone-200 tracking-wider mb-1.5 truncate">{{ image.title }}</h3>
      <p class="text-sm text-stone-500 dark:text-stone-400 font-light leading-relaxed tracking-wide line-clamp-2">{{ image.description }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const { getImagePath } = useImagePath()

defineProps<{
  image: {
    filename: string
    title: string
    description: string
  }
}>()
</script>
