<template>
  <NuxtLayout>
    <NuxtPage />
    <ToastContainer />
  </NuxtLayout>

  <!--
    R9：gallery 軌道切換「起算尺」轉場 overlay。
    掛在 app.vue 而非 gallery 頁內，確保切 tab（route param 變更可能卸載 page）時
    overlay 仍常駐。元件自身只在 store trackTransitionTick bump 時才 render，
    非 gallery 頁不會觸發（setSelectedCategory 只在 gallery 路由被呼叫）。
  -->
  <GalleryTrackTransition />

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
