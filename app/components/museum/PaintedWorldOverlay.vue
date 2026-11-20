<template>
  <dialog
    ref="dialog"
    data-painted-world-dialog
    class="painted-world-dialog"
    aria-label="畫界迴廊"
    @close="onClose"
  >
    <div class="world-panel">
      <div class="world-toolbar">
        <button type="button" autofocus @click="dialog?.close()">離開畫界</button>
      </div>
      <iframe v-if="frameURL" :key="frameSession" ref="frame" :src="frameURL" title="畫界展間" />
    </div>
  </dialog>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const frame = useTemplateRef<HTMLIFrameElement>('frame')
const frameURL = ref('')
const frameSession = ref(0)
const baseURL = useRuntimeConfig().app.baseURL.replace(/\/?$/, '/')
const route = useRoute()
let opener: HTMLAnchorElement | null = null

function open(anchor: HTMLAnchorElement) {
  const host = dialog.value
  if (!host?.showModal || host.open) return false

  try {
    const url = new URL(anchor.href)
    if (url.origin !== window.location.origin || url.pathname !== `${baseURL}painted-worlds/index.html`) return false
    url.searchParams.set('embed', '1')
    host.showModal()
    opener = anchor
    frameSession.value++
    frameURL.value = url.href
    return true
  } catch {
    return false
  }
}

function onClose() {
  // A native close event can arrive after the dialog has already reopened.
  if (dialog.value?.open) return
  frameURL.value = ''
  const previous = opener
  opener = null
  if (previous?.isConnected) previous.focus({ preventScroll: true })
}

function onMessage(event: MessageEvent) {
  if (!dialog.value?.open || event.origin !== window.location.origin || event.source !== frame.value?.contentWindow) return
  if (event.data?.type === 'painted-world:close') dialog.value.close()
}

onMounted(() => window.addEventListener('message', onMessage))
onBeforeUnmount(() => window.removeEventListener('message', onMessage))
watch(() => route.path.replace(/\/+$/, ''), () => dialog.value?.close())

defineExpose({ open })
</script>

<style scoped>
:global(html:has(dialog[data-painted-world-dialog][open])) {
  overflow: hidden;
  overscroll-behavior: none;
}

.painted-world-dialog {
  inline-size: min(94vw, 84rem);
  block-size: min(92dvh, 62rem);
  max-inline-size: 100%;
  max-block-size: 100%;
  margin: auto;
  padding: 0;
  overflow: hidden;
  overscroll-behavior: contain;
  border: 1px solid var(--museum-line);
  color: var(--museum-ink);
  background: var(--museum-paper);
}

.painted-world-dialog::backdrop { background: rgb(18 15 12 / 0.76); }

.world-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  block-size: 100%;
}

.world-toolbar {
  display: flex;
  justify-content: flex-end;
  padding: env(safe-area-inset-top, 0px) clamp(12px, 3vw, 32px) 0;
  border-bottom: 1px solid var(--museum-line);
}

.world-toolbar button {
  min-block-size: 44px;
  padding-inline: 8px;
  color: inherit;
  font-size: 0.875rem;
}

.world-toolbar button:hover { text-decoration: underline; text-underline-offset: .24em; }
.world-toolbar button:focus-visible { outline: 2px solid currentColor; outline-offset: -3px; }

iframe {
  display: block;
  inline-size: 100%;
  block-size: 100%;
  min-inline-size: 0;
  border: 0;
}

@media (max-width: 650px) {
  .painted-world-dialog {
    inline-size: 100%;
    block-size: 100dvh;
    border: 0;
  }
}
</style>
