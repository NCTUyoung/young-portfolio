<template>
  <div>
    <label class="block text-xs font-light text-stone-500 mb-3 tracking-wider uppercase">選擇圖片</label>
    <div
      @drop="handleDrop"
      @dragover.prevent
      @dragenter.prevent="isDragging = true"
      @dragleave="isDragging = false"
      :class="[
        'border-2 border-dashed rounded-xl p-10 text-center transition-colors duration-200 cursor-pointer',
        isDragging
          ? 'border-amber-400 bg-amber-50/50'
          : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'
      ]"
      @click="fileInput?.click()"
    >
      <input
        ref="fileInput"
        type="file"
        multiple
        accept="image/*"
        @change="handleFileSelect"
        class="hidden"
      />
      <div class="space-y-3">
        <svg class="mx-auto h-10 w-10 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <div class="text-sm text-stone-500 font-light">
          <span class="text-amber-600 hover:text-amber-700 font-medium cursor-pointer">點擊選擇檔案</span>
          <span class="mx-1">或拖拽到此處</span>
        </div>
        <p class="text-xs text-stone-400 font-light">
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
