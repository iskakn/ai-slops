<script setup lang="ts">
defineProps<{ label: string }>()
</script>

<template>
  <button
    type="button"
    class="flex flex-col flex-1 items-center justify-center gap-4 w-full cursor-pointer select-none focus-visible:outline-3 outline-primary/25"
    :aria-label="label"
  >
    <slot />
  </button>
</template>
