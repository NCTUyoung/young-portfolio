<template>
  <div v-if="paintedRoom" class="work-links">
    <PaintedWorldLink
      :href="`${baseURL}painted-worlds/index.html?from=work#${paintedRoom.id}`"
      :data-painted-room="paintedRoom.id"
      data-testid="gallery-work-painted-room"
      class="work-links__link"
    >
      <span>進入畫界 · {{ paintedRoom.title }}</span>
      <Icon name="lucide:arrow-up-right" aria-hidden="true" />
    </PaintedWorldLink>
  </div>
</template>

<script lang="ts">
import { computed } from 'vue'
import PaintedWorldLink from '~/components/museum/PaintedWorldLink.vue'
import registry from '../../../public/painted-worlds/work-registry.json'

const paintedRooms = new Map(registry.map(({ workId, id, title }) => [workId, { id, title }]))
</script>

<script setup lang="ts">
const props = defineProps<{ workId: string }>()
const baseURL = useRuntimeConfig().app.baseURL.replace(/\/?$/, '/')
const paintedRoom = computed(() => paintedRooms.get(props.workId))
</script>

<style scoped>
.work-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0 clamp(0.85rem, 2vw, 1.5rem);
}
.work-links__link {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 44px;
  color: var(--work-link-ink, var(--museum-ink, var(--fg-2)));
  font-size: 0.8rem;
  text-decoration: underline;
  text-decoration-color: var(--work-link-rule, var(--museum-line, var(--border)));
  text-underline-offset: 0.3em;
}
.work-links__link:hover { text-decoration-color: currentColor; }
.work-links__link:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
</style>
