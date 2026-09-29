<script setup lang="ts">
import { useGame } from '~/composables/useGame'
import { useOneShotRound } from '~/composables/useOneShotRound'
import { randomIndex } from '~/utils/random'
import type { StatusMessage } from '~/utils/status'

const game = useGame('guess-the-number')

const NUMBERS = Array.from({ length: 11 }, (_, i) => i)

const { round, locked: done, commit, reset } = useOneShotRound<{ secret: number, guess: number }>()

function onGuess(guess: number) {
  // The secret is drawn inside the factory, so it comes into existence at click
  // time only and never appears in the server-rendered payload.
  commit(() => ({ secret: randomIndex(NUMBERS.length), guess }))
}

const status = computed<StatusMessage>(() => {
  const played = round.value
  if (!played) return { text: 'Pick a number', tone: 'muted' }
  return played.guess === played.secret
    ? { text: 'You got it!', tone: 'positive' }
    : { text: `Wrong — it was ${played.secret}`, tone: 'negative' }
})

function buttonColor(n: number) {
  const played = round.value
  if (!played) return 'neutral'
  if (n === played.secret) return 'success'
  if (n === played.guess) return 'error'
  return 'neutral'
}

function buttonVariant(n: number) {
  const played = round.value
  if (!played) return 'outline'
  return n === played.secret || n === played.guess ? 'solid' : 'ghost'
}
</script>

<template>
  <GameBoard :game="game">
    <GameStatus :status="status" />

    <div class="grid grid-cols-4 gap-3 sm:grid-cols-6">
      <UButton
        v-for="n in NUMBERS"
        :key="n"
        :label="String(n)"
        size="xl"
        :color="buttonColor(n)"
        :variant="buttonVariant(n)"
        :disabled="done"
        class="w-16 justify-center tabular-nums"
        @click="onGuess(n)"
      />
    </div>

    <PlayAgainButton
      :disabled="!done"
      @replay="reset"
    />
  </GameBoard>
</template>
