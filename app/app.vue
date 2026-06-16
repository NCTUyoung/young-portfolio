<template>
  <NuxtLayout>
    <NuxtPage />
    <ToastContainer />
  </NuxtLayout>

  <!--
    j2（act-critic / 翻面：書頁を繰る本物の過場）：gallery 軌道切換「翻頁」過場 overlay。
    取代 R9『起算尺 overlay』(GalleryTrackTransition) —— 那把切軌抽象成「尺上移動讀數」，
    critic BOLD NEXT STEP 要的是「看得見的翻面動作」：離場世界整頁繞中央書脊摺起、
    背面進場世界由書口展開，一次過場同時呈現兩世界正反面。桌機與手機同一過場。
    掛在 app.vue 而非 gallery 頁內，確保切 tab（route param 變更可能卸載 page）時
    overlay 仍常駐。元件自身只在 store trackTransitionTick bump 時才 render（user-initiated：
    點 tab / 點對向書口 / 點翻面帶 → setSelectedCategory → bump tick），非 gallery 頁不觸發。
  -->
  <GalleryPageFlip />

  <!--
    Round 19：全站 SVG defs — 印章 ink-bleed 濾鏡（用於 .jp-seal 字身）
    feTurbulence + feDisplacementMap：模擬朱泥印章因紙吸墨而邊緣參差
    位於 #__nuxt 外、固定隱藏 svg，所有 .jp-seal 透過 filter:url(#seal-ink) 引用
    a11y：aria-hidden + width/height 0 確保不佔位、不干擾螢幕閱讀器
  -->
  <svg aria-hidden="true" focusable="false" style="position:absolute;width:0;height:0;overflow:hidden" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="seal-ink" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="3" result="noise"/>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.4"/>
      </filter>
    </defs>
  </svg>
</template>

<script setup lang="ts">
// 应用入口组件的逻辑
</script>
