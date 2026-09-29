<script setup lang="ts">
useSeoMeta({
  title: 'Clicker'
})

const count = ref(0)
</script>

<template>
  <button
    type="button"
    class="flex flex-col flex-1 items-center justify-center w-full cursor-pointer select-none focus-visible:outline-3 outline-primary/25"
    :aria-label="`Click count ${count}. Activate to increment.`"
    @click="count++"
  >
    <span class="text-default text-8xl font-semibold tabular-nums sm:text-9xl">
      {{ count }}
    </span>
  </button>
</template>
