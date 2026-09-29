<script setup lang="ts">
useSeoMeta({
  title: 'Rock Paper Scissors'
})

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

const player = ref<Hand | null>(null)
const computer = ref<Hand | null>(null)

// Drawn at click time so it never enters the SSR payload.
// Rejection sampling keeps the 1/3 chance of each hand exact:
// 2^32 % 3 !== 0, so values in the incomplete tail are redrawn.
function drawHand(): Hand {
  const buf = new Uint32Array(1)
  const limit = Math.floor(0x100000000 / HANDS.length) * HANDS.length
  let value = 0
  do {
    crypto.getRandomValues(buf)
    value = buf[0] ?? 0
  } while (value >= limit)
  return HANDS[value % HANDS.length] ?? 'rock'
}

function play(hand: Hand) {
  if (player.value !== null) return
  player.value = hand
  computer.value = drawHand()
}

function reset() {
  player.value = null
  computer.value = null
}

const done = computed(() => player.value !== null)

const result = computed(() => {
  if (!player.value || !computer.value) return ''
  if (player.value === computer.value) return 'Draw'
  return BEATS[player.value] === computer.value ? 'You win!' : 'You lose'
})

const resultClass = computed(() => {
  switch (result.value) {
    case 'You win!': return 'text-green-500'
    case 'You lose': return 'text-red-500'
    default: return 'text-muted'
  }
})
</script>

<template>
  <div class="flex flex-col flex-1 items-center justify-center gap-5 w-full px-4 py-6 sm:gap-8">
    <div class="text-center">
      <h1 class="text-3xl font-semibold text-highlighted sm:text-5xl">
        Rock Paper Scissors
      </h1>
      <p class="mt-2 text-base text-muted sm:text-lg">
        One round · you vs. the machine
      </p>
    </div>

    <div class="flex items-center gap-6 sm:gap-12">
      <div class="flex flex-col items-center gap-2">
        <span class="text-6xl leading-none sm:text-8xl">{{ player ? EMOJI[player] : '❔' }}</span>
        <span class="text-sm text-muted">You</span>
      </div>
      <span class="text-2xl font-semibold text-muted">vs</span>
      <div class="flex flex-col items-center gap-2">
        <span class="text-6xl leading-none sm:text-8xl">{{ computer ? EMOJI[computer] : '❔' }}</span>
        <span class="text-sm text-muted">Machine</span>
      </div>
    </div>

    <p
      role="status"
      class="text-2xl font-medium"
      :class="done ? resultClass : 'text-muted'"
    >
      {{ done ? result : 'Pick your hand' }}
    </p>

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

    <UButton
      label="Play again"
      color="neutral"
      variant="subtle"
      size="lg"
      :disabled="!done"
      :class="!done && 'invisible'"
      @click="reset"
    />
  </div>
</template>
