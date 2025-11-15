<template>
  <div class="bg-white rounded-lg shadow-md overflow-hidden">
    <NuxtImg
      :src="getImagePath(image.filename)"
      :alt="image.title"
      class="w-full h-48 object-cover"
      loading="lazy"
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      format="webp,avif,jpeg"
    />
    <div class="p-4">
      <h3 class="text-xl font-semibold mb-2">{{ image.title }}</h3>
      <p class="text-gray-600">{{ image.description }}</p>
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