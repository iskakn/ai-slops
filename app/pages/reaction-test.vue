<script setup lang="ts">
import { useGame } from '~/composables/useGame'
import { randomIndex } from '~/utils/random'

useGame('reaction-test')

type Phase = 'idle' | 'waiting' | 'ready' | 'result' | 'too-soon'

const MIN_DELAY = 1000
const DELAY_SPREAD = 3000

const phase = ref<Phase>('idle')
const time = ref(0)

let timeout: ReturnType<typeof setTimeout> | undefined
let startedAt = 0

function startWaiting() {
  clearTimeout(timeout)
  phase.value = 'waiting'
  timeout = setTimeout(() => {
    startedAt = performance.now()
    phase.value = 'ready'
  }, MIN_DELAY + randomIndex(DELAY_SPREAD))
}

function onClick() {
  switch (phase.value) {
    case 'idle':
    case 'result':
    case 'too-soon':
      startWaiting()
      break
    case 'waiting':
      clearTimeout(timeout)
      phase.value = 'too-soon'
      break
    case 'ready':
      time.value = Math.round(performance.now() - startedAt)
      phase.value = 'result'
      break
  }
}

onBeforeUnmount(() => clearTimeout(timeout))

const heading = computed(() => {
  switch (phase.value) {
    case 'idle': return 'Reaction Test'
    case 'waiting': return 'Wait for green…'
    case 'ready': return 'Tap!'
    case 'too-soon': return 'Too soon!'
    default: return `${time.value} ms`
  }
})

const hint = computed(() => {
  switch (phase.value) {
    case 'idle': return 'Tap to start'
    case 'result':
    case 'too-soon': return 'Tap to try again'
    default: return ''
  }
})

const announcement = computed(() => hint.value ? `${heading.value}. ${hint.value}` : heading.value)

const bgClass = computed(() => {
  switch (phase.value) {
    case 'waiting':
    case 'too-soon': return 'bg-red-500 text-white'
    case 'ready': return 'bg-green-500 text-white'
    default: return ''
  }
})
</script>

<template>
  <div class="flex flex-col flex-1 w-full">
    <GameStage
      :label="announcement"
      :class="bgClass"
      @click="onClick"
    >
      <span class="text-6xl font-semibold tabular-nums sm:text-8xl">
        {{ heading }}
      </span>
      <span
        v-if="hint"
        class="text-lg opacity-70"
      >
        {{ hint }}
      </span>
    </GameStage>

    <!-- The green transition happens without any user action, and a button's
         subtree is presentational once aria-label is set, so the state change
         is announced from a live region outside the button instead. -->
    <p
      role="status"
      aria-live="polite"
      class="sr-only"
    >
      {{ announcement }}
    </p>
  </div>
</template>
