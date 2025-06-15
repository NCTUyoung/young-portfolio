<template>
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
      選擇圖片
    </label>
    <div
      @drop="handleDrop"
      @dragover.prevent
      @dragenter.prevent
      class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
    >
      <input
        ref="fileInput"
        type="file"
        multiple
        accept="image/*"
        @change="handleFileSelect"
        class="hidden"
      />
      <div class="space-y-2">
        <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <div class="text-sm text-gray-600">
          <button
            @click="fileInput?.click()"
            class="font-medium text-blue-600 hover:text-blue-500"
          >
            點擊選擇檔案
          </button>
          或拖拽檔案到這裡
        </div>
        <p class="text-xs text-gray-500">
          支援 PNG, JPG, GIF 格式，單檔最大50MB，總計最大200MB
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const adminStore = useAdminStore()

// Template ref
const fileInput = ref<HTMLInputElement>()

// 檔案選擇處理
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    adminStore.processFiles(Array.from(target.files))
  }
}

// 拖拽處理
const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer?.files) {
    adminStore.processFiles(Array.from(event.dataTransfer.files))
  }
}
</script>