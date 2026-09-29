<script setup lang="ts">
useSeoMeta({
  title: 'Mini-games'
})

const games = [
  {
    to: '/clicker',
    title: 'Clicker',
    description: 'Tap and watch the number climb.',
    icon: 'i-lucide-mouse-pointer-click'
  },
  {
    to: '/reaction-test',
    title: 'Reaction Test',
    description: 'Wait for green, then tap fast.',
    icon: 'i-lucide-zap'
  },
  {
    to: '/guess-the-number',
    title: 'Guess the Number',
    description: 'Higher/lower hints, one try.',
    icon: 'i-lucide-hash'
  },
  {
    to: '/rock-paper-scissors',
    title: 'Rock Paper Scissors',
    description: 'Classic hand game vs. the machine.',
    icon: 'i-lucide-hand'
  }
]
</script>

<template>
  <div class="flex flex-col flex-1 items-center justify-center gap-8 sm:gap-12 w-full px-4 py-6 text-center">
    <div>
      <h1 class="text-4xl font-bold tracking-tight text-highlighted sm:text-6xl">
        AI Slops
      </h1>
      <p class="mt-2 text-base text-muted sm:mt-4 sm:text-xl/8">
        A collection of bite-sized mini-games. Pick a tile and play.
      </p>
    </div>

    <div class="grid grid-cols-2 gap-3 w-full max-w-5xl text-start sm:gap-4 lg:grid-cols-4">
      <UPageCard
        v-for="game in games"
        :key="game.to"
        :to="game.to"
        :title="game.title"
        :description="game.description"
        :icon="game.icon"
        :ui="{ container: 'p-3 sm:p-6' }"
      />
    </div>
  </div>
</template>
