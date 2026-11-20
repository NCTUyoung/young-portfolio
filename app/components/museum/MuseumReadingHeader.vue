<script setup lang="ts">
defineProps<{
  title: string
  titleId?: string
}>()
</script>

<template>
  <header class="museum-reading-header">
    <slot name="navigation" />
    <h1 :id="titleId" class="font-jp">{{ title }}</h1>
    <div v-if="$slots.default" class="museum-reading-header__intro">
      <slot />
    </div>
    <slot name="details" />
  </header>
</template>

<style scoped>
.museum-reading-header h1 {
  color: var(--museum-ink);
  font-size: clamp(2.1rem, 5.2vw, 4.6rem);
  font-weight: 300;
  line-height: 1.22;
  letter-spacing: 0.055em;
  text-wrap: balance;
}

.museum-reading-header__intro {
  max-inline-size: 33em;
  margin-block-start: clamp(0.9rem, 2.5vw, 1.65rem);
  color: var(--museum-muted);
  line-height: 1.85;
}
</style>
