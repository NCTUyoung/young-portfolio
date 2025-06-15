<template>
  <div class="bg-white rounded-lg shadow-md overflow-hidden">
    <img :src="getImagePath(image.filename)" :alt="image.title" class="w-full h-48 object-cover" />
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