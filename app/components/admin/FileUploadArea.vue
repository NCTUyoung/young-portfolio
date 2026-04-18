<template>
  <div>
    <label class="mb-3 block text-xs font-light uppercase tracking-wider text-stone-500 dark:text-stone-400">選擇圖片</label>
    <div
      :class="[
        'cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors duration-200',
        isDragging
          ? 'border-accent-400 bg-accent-50/50 dark:border-accent-500 dark:bg-accent-950/30'
          : 'border-stone-200 bg-stone-50/50 hover:border-stone-300 dark:border-stone-600 dark:bg-stone-800/40 dark:hover:border-stone-500'
      ]"
      @drop="handleDrop"
      @dragover.prevent
      @dragenter.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @click="fileInput?.click()"
    >
      <input
        ref="fileInput"
        type="file"
        multiple
        accept="image/*"
        class="hidden"
        @change="handleFileSelect"
      >
      <div class="space-y-3">
        <svg class="mx-auto h-10 w-10 text-stone-300 dark:text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <div class="text-sm font-light text-stone-500 dark:text-stone-400">
          <span class="cursor-pointer font-medium text-accent-600 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300">點擊選擇檔案</span>
          <span class="mx-1">或拖拽到此處</span>
        </div>
        <p class="text-xs font-light text-stone-400 dark:text-stone-500">
          支援 PNG、JPG、GIF，單檔最大 50MB，總計最大 200MB
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const adminStore = useAdminStore()
const fileInput = ref<HTMLInputElement>()
const isDragging = ref(false)

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    adminStore.processFiles(Array.from(target.files))
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false
  if (event.dataTransfer?.files) {
    adminStore.processFiles(Array.from(event.dataTransfer.files))
  }
}
</script>
