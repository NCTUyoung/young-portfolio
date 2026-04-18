<template>
  <div class="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-stone-200/30">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
      <!-- 總圖片數 -->
      <div class="group">
        <div class="text-3xl font-extralight text-stone-700 mb-1">
          {{ adminStore.currentManageData.length }}
        </div>
        <div class="text-xs text-stone-500 font-light tracking-wider uppercase">
          總圖片數
        </div>
      </div>

      <!-- 事件數量 -->
      <div class="group">
        <div class="text-3xl font-extralight text-amber-600 mb-1">
          {{ adminStore.groupedManageData.length }}
        </div>
        <div class="text-xs text-stone-500 font-light tracking-wider uppercase">
          事件數量
        </div>
      </div>

      <!-- 分類統計 -->
      <div v-if="adminStore.manageCategory === 'photography'" class="group">
        <div class="text-3xl font-extralight text-emerald-600 mb-1">
          {{ adminStore.manageCategory === 'photography'
              ? Array.from(new Set(adminStore.currentManageData.map(item => (item as any).camera).filter(c => c && c !== 'Unknown'))).length
              : 0 }}
        </div>
        <div class="text-xs text-stone-500 font-light tracking-wider uppercase">
          相機型號
        </div>
      </div>
      <div v-else class="group">
        <div class="text-3xl font-extralight text-rose-500 mb-1">
          {{ adminStore.manageCategory === 'gallery'
              ? Array.from(new Set(adminStore.currentManageData.map(item => (item as any).color).filter(c => c))).length
              : 0 }}
        </div>
        <div class="text-xs text-stone-500 font-light tracking-wider uppercase">
          顏色類型
        </div>
      </div>

      <!-- 本月新增 -->
      <div class="group">
        <div class="text-3xl font-extralight text-indigo-500 mb-1">
          {{ (() => {
            const now = new Date()
            const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
            return adminStore.currentManageData.filter(item => {
              const itemDate = new Date(item.time)
              return itemDate >= thisMonth
            }).length
          })() }}
        </div>
        <div class="text-xs text-stone-500 font-light tracking-wider uppercase">
          本月新增
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const adminStore = useAdminStore()
</script>