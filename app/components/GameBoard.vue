<script setup lang="ts">
import type { GameDefinition } from '~/games/registry'

defineProps<{ game: GameDefinition }>()
</script>

<template>
  <div class="flex flex-col flex-1 items-center justify-center gap-5 w-full px-4 py-6 sm:gap-8">
    <header class="text-center">
      <h1 class="text-3xl font-semibold text-highlighted sm:text-5xl">
        {{ game.title }}
      </h1>
      <p
        v-if="game.tagline"
        class="mt-2 text-base text-muted sm:text-lg"
      >
        {{ game.tagline }}
      </p>
    </header>

    <slot />
  </div>
</template>
