<template>
  <div class="space-y-3">
    <h4 class="text-white font-medium border-b border-gray-600 pb-2">色彩分佈</h4>

    <div class="bg-gray-800 border border-gray-600 rounded-lg p-3">
      <canvas
        ref="histogramCanvas"
        :width="canvasWidth"
        height="120"
        class="w-full h-full rounded"
      ></canvas>
    </div>

    <div class="flex justify-center space-x-4 text-xs">
      <div class="flex items-center">
        <div class="w-3 h-3 bg-red-500 rounded mr-1 opacity-80"></div>
        <span class="text-gray-300">紅</span>
      </div>
      <div class="flex items-center">
        <div class="w-3 h-3 bg-green-500 rounded mr-1 opacity-80"></div>
        <span class="text-gray-300">綠</span>
      </div>
      <div class="flex items-center">
        <div class="w-3 h-3 bg-blue-500 rounded mr-1 opacity-80"></div>
        <span class="text-gray-300">藍</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, reactive, nextTick, onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useImageViewerStore } from '~/stores/imageViewer'

const imageViewerStore = useImageViewerStore()
const { getImagePath } = useImagePath()
const { currentViewerImage, showInfoPanel, infoPanelWidth } = storeToRefs(imageViewerStore)

const histogramCanvas = ref<HTMLCanvasElement>()
const histogramData = reactive({
  red: new Array(256).fill(0),
  green: new Array(256).fill(0),
  blue: new Array(256).fill(0)
})

// 動態計算畫布寬度
const canvasWidth = computed(() => {
  // 根據面板寬度調整畫布寬度，扣除 padding 和邊框
  const baseWidth = Math.max(200, infoPanelWidth.value - 80)
  return Math.min(baseWidth, 400) // 限制最大寬度
})

// 生成直方圖
const generateHistogram = async () => {
  if (!currentViewerImage.value || !histogramCanvas.value) return

  try {
    // 創建隱藏的圖片元素來分析顏色
    const img = new Image()
    img.crossOrigin = 'anonymous'

    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = getImagePath(currentViewerImage.value!.filename)
    })

    // 創建 canvas 來分析圖片
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    // 縮小圖片以提高性能
    const scale = Math.min(200 / img.width, 200 / img.height)
    canvas.width = img.width * scale
    canvas.height = img.height * scale

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    // 重置直方圖數據
    histogramData.red.fill(0)
    histogramData.green.fill(0)
    histogramData.blue.fill(0)

    // 計算直方圖
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      histogramData.red[r]++
      histogramData.green[g]++
      histogramData.blue[b]++
    }

    // 繪製直方圖
    drawHistogram()
  } catch (error) {
    console.warn('無法生成直方圖:', error)
  }
}

// 繪製直方圖
const drawHistogram = () => {
  const canvas = histogramCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const width = canvas.width
  const height = canvas.height

  // 清空畫布，設置為深色背景
  ctx.fillStyle = '#1f2937'
  ctx.fillRect(0, 0, width, height)

  // 找出最大值用於標準化
  const maxR = Math.max(...histogramData.red)
  const maxG = Math.max(...histogramData.green)
  const maxB = Math.max(...histogramData.blue)
  const maxValue = Math.max(maxR, maxG, maxB)

  if (maxValue === 0) return

  // 繪製直方圖
  const barWidth = width / 256

  for (let i = 0; i < 256; i++) {
    const x = i * barWidth

    // 紅色
    const redHeight = (histogramData.red[i] / maxValue) * height * 0.8
    ctx.fillStyle = `rgba(255, 0, 0, 0.7)`
    ctx.fillRect(x, height - redHeight, barWidth, redHeight)

    // 綠色
    const greenHeight = (histogramData.green[i] / maxValue) * height * 0.8
    ctx.globalCompositeOperation = 'screen'
    ctx.fillStyle = `rgba(0, 255, 0, 0.7)`
    ctx.fillRect(x, height - greenHeight, barWidth, greenHeight)

    // 藍色
    const blueHeight = (histogramData.blue[i] / maxValue) * height * 0.8
    ctx.fillStyle = `rgba(0, 0, 255, 0.7)`
    ctx.fillRect(x, height - blueHeight, barWidth, blueHeight)

    ctx.globalCompositeOperation = 'source-over'
  }

  // 繪製網格線
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.lineWidth = 1

  // 垂直線
  for (let i = 0; i <= 4; i++) {
    const x = (i * width) / 4
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }

  // 水平線
  for (let i = 0; i <= 4; i++) {
    const y = (i * height) / 4
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
}

// 監聽圖片變化
watch(currentViewerImage, () => {
  if (showInfoPanel.value) {
    nextTick(() => {
      generateHistogram()
    })
  }
})

// 監聽面板顯示狀態
watch(showInfoPanel, (visible) => {
  if (visible && currentViewerImage.value) {
    nextTick(() => {
      generateHistogram()
    })
  }
})

// 監聽面板寬度變化
watch(infoPanelWidth, () => {
  if (showInfoPanel.value && currentViewerImage.value) {
    nextTick(() => {
      generateHistogram()
    })
  }
})

// 首次掛載時計算直方圖
onMounted(() => {
  if (showInfoPanel.value && currentViewerImage.value) {
    nextTick(() => {
      generateHistogram()
    })
  }
})

defineExpose({
  generateHistogram
})
</script>