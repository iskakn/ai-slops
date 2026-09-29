<script setup lang="ts">
import { useGame } from '~/composables/useGame'
import { useOneShotRound } from '~/composables/useOneShotRound'
import { randomElement } from '~/utils/random'
import type { StatusMessage } from '~/utils/status'

const game = useGame('rock-paper-scissors')

const HANDS = ['rock', 'paper', 'scissors'] as const
type Hand = (typeof HANDS)[number]

const EMOJI: Record<Hand, string> = {
  rock: '✊',
  paper: '✋',
  scissors: '✌️'
}

const BEATS: Record<Hand, Hand> = {
  rock: 'scissors',
  paper: 'rock',
  scissors: 'paper'
}

const { round, locked: done, commit, reset } = useOneShotRound<{ player: Hand, computer: Hand }>()

function play(player: Hand) {
  // The machine's hand is drawn inside the factory, so it is decided at click
  // time only and never appears in the server-rendered payload.
  commit(() => ({ player, computer: randomElement(HANDS) }))
}

const status = computed<StatusMessage>(() => {
  const played = round.value
  if (!played) return { text: 'Pick your hand', tone: 'muted' }
  if (played.player === played.computer) return { text: 'Draw', tone: 'muted' }
  return BEATS[played.player] === played.computer
    ? { text: 'You win!', tone: 'positive' }
    : { text: 'You lose', tone: 'negative' }
})
</script>

<template>
  <GameBoard :game="game">
    <div class="flex items-center gap-6 sm:gap-12">
      <div class="flex flex-col items-center gap-2">
        <span class="text-6xl leading-none sm:text-8xl">
          {{ round ? EMOJI[round.player] : '❔' }}
        </span>
        <span class="text-sm text-muted">You</span>
      </div>

      <span class="text-2xl font-semibold text-muted">vs</span>

      <div class="flex flex-col items-center gap-2">
        <span class="text-6xl leading-none sm:text-8xl">
          {{ round ? EMOJI[round.computer] : '❔' }}
        </span>
        <span class="text-sm text-muted">Machine</span>
      </div>
    </div>

    <GameStatus :status="status" />

    <div class="flex gap-3">
      <UButton
        v-for="hand in HANDS"
        :key="hand"
        size="xl"
        color="neutral"
        variant="outline"
        :disabled="done"
        class="flex-col gap-1 px-6 py-4 capitalize"
        @click="play(hand)"
      >
        <span class="text-3xl leading-none">{{ EMOJI[hand] }}</span>
        <span>{{ hand }}</span>
      </UButton>
    </div>

    <PlayAgainButton
      :disabled="!done"
      @replay="reset"
    />
  </GameBoard>
</template>
