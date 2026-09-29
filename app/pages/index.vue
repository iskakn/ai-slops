<script setup lang="ts">
import { SITE } from '~/config/site'
import { GAMES, gameRoute } from '~/games/registry'

useSeoMeta({
  title: 'Mini-games'
})
</script>

<template>
  <div class="flex flex-col flex-1 items-center justify-center gap-8 sm:gap-12 w-full px-4 py-6 text-center">
    <div>
      <h1 class="text-4xl font-bold tracking-tight text-highlighted sm:text-6xl">
        {{ SITE.name }}
      </h1>
      <p class="mt-2 text-base text-muted sm:mt-4 sm:text-xl/8">
        {{ SITE.tagline }}
      </p>
    </div>

    <div class="grid grid-cols-2 gap-3 w-full max-w-5xl text-start sm:gap-4 lg:grid-cols-4">
      <UPageCard
        v-for="game in GAMES"
        :key="game.slug"
        :to="gameRoute(game.slug)"
        :title="game.title"
        :description="game.description"
        :icon="game.icon"
        :ui="{ container: 'p-3 sm:p-6' }"
      />
    </div>
  </div>
</template>
