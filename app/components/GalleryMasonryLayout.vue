<template>
  <div ref="rootEl" class="row-gallery-container">
    <!-- Desktop Row Layout -->
    <div class="hidden md:block space-y-4">
      <div
        v-for="(row, rowIndex) in imageRows"
        :key="row.key"
        class="gallery-row flex gap-4 relative"
        :class="{ 'justify-center': row.items.length === 1 }"
        :style="{ transitionDelay: `${rowIndex * 80}ms` }"
      >
        <!-- Skeleton overlay — 靜素：單色墨色方塊 -->
        <div
          v-if="!rowsLoaded[row.key]"
          class="absolute inset-0 bg-stone-100 dark:bg-stone-800 animate-pulse pointer-events-none z-10"
        />

        <div
          v-for="(item, itemIndex) in row.items"
          :key="item.filename"
          :class="[
            'gallery-item relative cursor-pointer group transition-opacity duration-500 ease-out overflow-hidden z-20',
            rowsLoaded[row.key] ? 'opacity-100' : 'opacity-0 pointer-events-none'
          ]"
          :style="{
            flex: row.items.length === 1 ? '0 0 auto' : `${item.flex} 1 0`,
            maxWidth: row.items.length === 1 ? getSingleItemMaxWidth(item.aspectRatio) : undefined,
            transitionDelay: `${(rowIndex * row.items.length + itemIndex) * 50}ms`
          }"
          @click="$emit('imageClick', item, sortedItems)"
        >
          <img
            :src="getThumbPath(item.filename, 800)"
            :srcset="getGridImageSrcset(item.filename)"
            :sizes="gridImageSizes"
            :alt="item.title"
            class="w-full h-auto block group-hover:brightness-110 transition-[filter] duration-500 ease-out"
            :loading="rowIndex < 3 ? 'eager' : 'lazy'"
            decoding="async"
            :data-row-key="row.key"
            :data-item-index="itemIndex"
            @load="(e) => onImageLoad(e, row.key, itemIndex)"
            @error="() => onImageError(row.key, itemIndex)"
          >
          <!-- Hover caption — 和紙低調 -->
          <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-900/85 via-stone-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out flex items-end p-4 motion-reduce:transition-none">
            <div class="text-stone-100 font-light">
              <h3 class="font-jp text-base tracking-wider mb-0.5">{{ item.title }}</h3>
              <p v-if="item.time" class="text-xs text-stone-300 tracking-[0.2em] jp-kansuji">{{ item.time }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Grid Layout -->
    <div class="md:hidden">
      <div class="grid grid-cols-2 gap-3">
        <div
          v-for="item in sortedItems"
          :key="item.filename"
          class="cursor-pointer active:opacity-80 transition-opacity duration-200"
          @click="$emit('imageClick', item, sortedItems)"
        >
          <img
            :src="getThumbPath(item.filename, 800)"
            :srcset="getGridImageSrcset(item.filename)"
            :sizes="gridImageSizes"
            :alt="item.title"
            class="w-full h-auto"
            loading="lazy"
            decoding="async"
          >
          <div class="mt-2">
            <h4 class="text-sm font-light text-stone-700 dark:text-stone-300 line-clamp-1 font-jp tracking-wide">{{ item.title }}</h4>
            <p class="text-xs text-stone-400 dark:text-stone-500 jp-kansuji">{{ item.time }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, onMounted, watch } from 'vue'
import { useImagePath } from '~/composables/useImagePath'
import type { GalleryItem } from '~~/shared/types/gallery'

const props = defineProps<{
  items: GalleryItem[]
  gap?: number
  maxRowAspectRatio?: number
}>()

// 使用傳入的 items（應該已經按時間排序）
const sortedItems = computed(() => props.items)

defineEmits<{
  imageClick: [item: GalleryItem, items: GalleryItem[]]
}>()

const { getThumbPath, getGridImageSrcset, gridImageSizes } = useImagePath()

const rootEl = ref<HTMLElement | null>(null)

// 狀態
const rowsLoaded = ref<Record<string, boolean>>({})
const loadedImages = ref<Record<string, boolean>>({})
const maxRowAspectRatio = computed(() => props.maxRowAspectRatio || 6) // 一行的最大寬高比總和

// 圖片數據接口
interface ImageWithAspectRatio extends GalleryItem {
  aspectRatio: number
  flex: number
  loaded: boolean
}

interface ImageRow {
  key: string
  items: ImageWithAspectRatio[]
}

// 存儲實際的圖片長寬比
const imageAspectRatios = ref<Record<string, number>>({})

// 單張圖片獨佔一行時，根據比例限制最大寬度，避免直式照片撐滿整行
const getSingleItemMaxWidth = (aspectRatio: number): string => {
  if (aspectRatio < 0.8) return '40%'   // 直式 → 最多佔 40%
  if (aspectRatio < 1.2) return '55%'   // 方形 → 最多佔 55%
  if (aspectRatio < 1.8) return '70%'   // 一般橫式 → 最多佔 70%
  return '85%'                           // 超寬 → 最多佔 85%
}

// 預設長寬比（當圖片還沒載入時）
const getAspectRatio = (item: GalleryItem) => {
  // 優先使用已載入的真實長寬比
  const storedRatio = imageAspectRatios.value[item.filename]
  if (storedRatio) {
    return storedRatio
  }

  // 根據檔案名稱猜測長寬比
  const filename = item.filename.toLowerCase()
  if (filename.includes('portrait') || filename.includes('vertical')) {
    return 0.75 // 豎圖
  } else if (filename.includes('panorama') || filename.includes('wide')) {
    return 2.5 // 超寬圖
  } else {
    return 1.5 // 一般橫圖
  }
}

// 將一組圖片按順序填入行
const buildRowsFromBucket = (images: ImageWithAspectRatio[], maxAR: number): ImageRow[] => {
  const rows: ImageRow[] = []
  let currentRow: ImageWithAspectRatio[] = []
  let currentRowAR = 0

  for (const img of images) {
    const newAR = currentRowAR + img.aspectRatio
    const shouldStartNewRow =
      currentRow.length >= 3 ||
      (currentRow.length >= 1 && newAR > maxAR)

    if (shouldStartNewRow && currentRow.length > 0) {
      rows.push({
        key: currentRow.map(i => i.filename).join('|') || `row-${rows.length}`,
        items: [...currentRow]
      })
      currentRow = [img]
      currentRowAR = img.aspectRatio
    } else {
      currentRow.push(img)
      currentRowAR = newAR
    }
  }

  // 最後一行：如果只剩 1 張，嘗試併入前一行
  if (currentRow.length === 1 && rows.length > 0) {
    const lastRow = rows[rows.length - 1]
    if (lastRow.items.length < 4) {
      lastRow.items.push(currentRow[0])
      lastRow.key = lastRow.items.map(i => i.filename).join('|')
    } else {
      rows.push({
        key: currentRow.map(i => i.filename).join('|') || `row-${rows.length}`,
        items: currentRow
      })
    }
  } else if (currentRow.length > 0) {
    rows.push({
      key: currentRow.map(i => i.filename).join('|') || `row-${rows.length}`,
      items: currentRow
    })
  }

  return rows
}

// 計算圖片行佈局 — 按比例分組，避免直式和橫式混排造成尺寸差異過大
const imageRows = computed(() => {
  if (!sortedItems.value.length) return []

  // 1. 計算所有圖片的比例
  const allImages: ImageWithAspectRatio[] = sortedItems.value.map(item => {
    const aspectRatio = getAspectRatio(item)
    return {
      ...item,
      aspectRatio,
      flex: aspectRatio,
      loaded: !!imageAspectRatios.value[item.filename]
    }
  })

  // 2. 分成直式（AR < 1.0）和橫式（AR >= 1.0）兩組
  const portraits = allImages.filter(img => img.aspectRatio < 1.0)
  const landscapes = allImages.filter(img => img.aspectRatio >= 1.0)

  // 3. 分別建行 — 直式用較低的 maxAR（因為直式圖比較窄，一行可以放更多）
  const landscapeRows = buildRowsFromBucket(landscapes, maxRowAspectRatio.value)
  const portraitRows = buildRowsFromBucket(portraits, maxRowAspectRatio.value)

  // 4. 交錯合併：橫式行和直式行交替出現
  const merged: ImageRow[] = []
  let li = 0, pi = 0
  while (li < landscapeRows.length || pi < portraitRows.length) {
    // 每次先放 2 行橫式，再放 1 行直式，保持視覺節奏
    for (let n = 0; n < 2 && li < landscapeRows.length; n++) {
      merged.push(landscapeRows[li++])
    }
    if (pi < portraitRows.length) {
      merged.push(portraitRows[pi++])
    }
  }

  return merged
})

// 圖片載入完成
// 注意：這裡不再根據實際長寬比重新計算佈局，避免載入過程中整個瀑布流重新排版造成閃爍
const onImageLoad = (event: Event, rowKey: string, itemIndex: number) => {
  const img = event.target as HTMLImageElement
  const row = imageRows.value.find(row => row.key === rowKey)

  if (!row) return

  // 獲取真實的長寬比
  if (img.naturalWidth && img.naturalHeight) {
    const realAspectRatio = img.naturalWidth / img.naturalHeight
    const item = row.items[itemIndex]

    if (item) {
      const previousRatio = imageAspectRatios.value[item.filename]
      if (!previousRatio || Math.abs(previousRatio - realAspectRatio) > 0.05) {
        imageAspectRatios.value = {
          ...imageAspectRatios.value,
          [item.filename]: realAspectRatio
        }
      }

      markImageLoaded(item.filename)
      maybeMarkRowReady(row.key)
    }
  }

  // 載入後的浮現由 row-level 的 opacity-0 → opacity-100 控制，避免逐張 scale 造成碎動
}

const onImageError = (rowKey: string, itemIndex: number) => {
  const row = imageRows.value.find(row => row.key === rowKey)
  if (!row) return
  const item = row.items[itemIndex]
  if (item) {
    markImageLoaded(item.filename)
    maybeMarkRowReady(row.key)
  }
}

const markImageLoaded = (filename: string) => {
  if (loadedImages.value[filename]) return
  loadedImages.value = {
    ...loadedImages.value,
    [filename]: true
  }
}

const maybeMarkRowReady = (rowKey: string) => {
  if (rowsLoaded.value[rowKey]) return
  const row = imageRows.value.find(row => row.key === rowKey)
  if (!row) return
  const ready = row.items.every(item => loadedImages.value[item.filename])
  if (ready) {
    rowsLoaded.value = {
      ...rowsLoaded.value,
      [row.key]: true
    }
  }
}

/**
 * 瀏覽器快取已載入的圖片可能不會再觸發 load，導致 rowsLoaded 永遠 false、桌面版維持 opacity-0。
 */
const flushCompleteImages = async () => {
  await nextTick()
  const root = rootEl.value
  if (!root) return
  root.querySelectorAll<HTMLImageElement>('img[data-row-key]').forEach((img) => {
    if (!img.complete || !img.naturalWidth) return
    const rowKey = img.dataset.rowKey
    const itemIndex = Number(img.dataset.itemIndex)
    if (!rowKey || Number.isNaN(itemIndex)) return
    const row = imageRows.value.find(r => r.key === rowKey)
    const item = row?.items[itemIndex]
    if (!item) return
    markImageLoaded(item.filename)
    maybeMarkRowReady(rowKey)
  })
}

// 強制重新計算佈局（用於篩選器變化時）
const forceRelayout = async () => {
  resetLayout()
  await nextTick()
  await nextTick()
  await flushCompleteImages()
}

// 重置佈局狀態
const resetLayout = () => {
  rowsLoaded.value = {}
  loadedImages.value = {}
}

// 監聽數據變化
watch(() => sortedItems.value, (newItems, oldItems) => {
  if (newItems.length !== oldItems?.length ||
      newItems.some((item, index) => item.filename !== oldItems[index]?.filename)) {
    // 清除舊的長寬比數據
    imageAspectRatios.value = {}
    forceRelayout()
  }
}, { immediate: false })

watch(() => props.items, () => {
  imageAspectRatios.value = {}
  forceRelayout()
}, { deep: true })

watch(imageRows, () => {
  void flushCompleteImages()
}, { flush: 'post' })

onMounted(() => {
  resetLayout()
  void flushCompleteImages()
})
</script>

<style scoped>
.row-gallery-container {
  width: 100%;
}

.gallery-row {
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
  transform: translateY(0);
}

.gallery-item {
  min-width: 0; /* 允許 flex 項目縮小 */
}

.gallery-item img {
  display: block;
  width: 100%;
  height: auto;
}
</style>