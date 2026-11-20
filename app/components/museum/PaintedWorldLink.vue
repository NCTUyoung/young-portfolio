<template>
  <a :href="href" aria-haspopup="dialog" @click="openWorld"><slot /></a>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { paintedWorldOpenKey } from '~/composables/usePaintedWorld'

defineProps<{ href: string }>()

const open = inject(paintedWorldOpenKey, undefined)

function openWorld(event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
  const anchor = event.currentTarget as HTMLAnchorElement
  if ((anchor.target && anchor.target.toLowerCase() !== '_self') || anchor.hasAttribute('download')) return
  if (open?.(anchor)) event.preventDefault()
}
</script>
