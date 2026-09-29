<script setup lang="ts">
useSeoMeta({
  title: 'Guess the Number'
})

const NUMBERS = Array.from({ length: 11 }, (_, i) => i)

const secret = ref<number | null>(null)
const guess = ref<number | null>(null)

// Drawn at click time so the secret never enters the SSR payload.
// Rejection sampling on crypto.getRandomValues keeps it unbiased:
// 2^32 % 11 !== 0, so values in the incomplete tail are redrawn.
function drawSecret(): number {
  const buf = new Uint32Array(1)
  const limit = Math.floor(0x100000000 / NUMBERS.length) * NUMBERS.length
  let value = 0
  do {
    crypto.getRandomValues(buf)
    value = buf[0] ?? 0
  } while (value >= limit)
  return value % NUMBERS.length
}

function onGuess(n: number) {
  if (guess.value !== null) return
  secret.value = drawSecret()
  guess.value = n
}

function reset() {
  secret.value = null
  guess.value = null
}

const done = computed(() => guess.value !== null)
const won = computed(() => done.value && guess.value === secret.value)

function buttonColor(n: number) {
  if (!done.value) return 'neutral'
  if (n === secret.value) return 'success'
  if (n === guess.value) return 'error'
  return 'neutral'
}

function buttonVariant(n: number) {
  if (!done.value) return 'outline'
  return n === secret.value || n === guess.value ? 'solid' : 'ghost'
}
</script>

<template>
  <div class="flex flex-col flex-1 items-center justify-center gap-6 w-full px-4 py-6 sm:gap-8">
    <div class="text-center">
      <h1 class="text-3xl font-semibold text-highlighted sm:text-5xl">
        Guess the Number
      </h1>
      <p class="mt-2 text-base text-muted sm:text-lg">
        0–10 · one try
      </p>
    </div>

    <p
      v-if="done"
      role="status"
      class="text-2xl font-medium"
      :class="won ? 'text-green-500' : 'text-red-500'"
    >
      {{ won ? 'You got it!' : `Wrong — it was ${secret}` }}
    </p>
    <p
      v-else
      class="text-2xl font-medium text-muted"
    >
      Pick a number
    </p>

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
