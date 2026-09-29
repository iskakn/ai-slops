<script setup lang="ts">
useSeoMeta({
  title: 'Clicker'
})

const count = ref(0)
</script>

<template>
  <button
    type="button"
    class="flex flex-col items-center justify-center w-full min-h-[calc(100dvh-var(--ui-header-height))] cursor-pointer select-none focus-visible:outline-3 outline-primary/25"
    :aria-label="`Click count ${count}. Activate to increment.`"
    @click="count++"
  >
    <span class="text-default text-8xl font-semibold tabular-nums sm:text-9xl">
      {{ count }}
    </span>
  </button>
</template>
