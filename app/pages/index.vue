<script setup lang="ts">
useSeoMeta({
  title: 'Mini-games'
})

const games = [
  {
    to: '/clicker',
    title: 'Clicker',
    description: 'Tap the full-screen counter and watch the number climb.',
    icon: 'i-lucide-mouse-pointer-click'
  },
  {
    to: '/reaction-test',
    title: 'Reaction Test',
    description: 'Wait for green, then click as fast as you can.',
    icon: 'i-lucide-zap'
  },
  {
    to: '/guess-the-number',
    title: 'Guess the Number',
    description: 'Find the hidden number with higher/lower hints.',
    icon: 'i-lucide-hash'
  },
  {
    to: '/rock-paper-scissors',
    title: 'Rock Paper Scissors',
    description: 'Classic hand game against a random opponent.',
    icon: 'i-lucide-hand'
  }
]
</script>

<template>
  <div>
    <UPageHero
      title="AI Slops"
      description="A collection of bite-sized mini-games. Pick a tile and play."
    />

    <UPageSection>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <UPageCard
          v-for="game in games"
          :key="game.to"
          :to="game.to"
          :title="game.title"
          :description="game.description"
          :icon="game.icon"
        />
      </div>
    </UPageSection>
  </div>
</template>
