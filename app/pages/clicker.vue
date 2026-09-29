<script setup lang="ts">
import { useGame } from '~/composables/useGame'

useGame('clicker')

const count = ref(0)
</script>

<template>
  <GameStage
    :label="`Click count ${count}. Activate to increment.`"
    @click="count++"
  >
    <span class="text-default text-8xl font-semibold tabular-nums sm:text-9xl">
      {{ count }}
    </span>
  </GameStage>
</template>
