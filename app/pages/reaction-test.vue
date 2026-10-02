<script setup lang="ts">
import { useGame } from '~/composables/useGame'
import { randomIndex } from '~/utils/random'
import { summarize, TRIES_PER_RUN } from '~/utils/reaction'

useGame('reaction-test')

type Phase = 'idle' | 'waiting' | 'ready' | 'result' | 'too-soon' | 'done'

const MIN_DELAY = 1000
const DELAY_SPREAD = 3000
const HOLD_KEYS = [' ', 'Enter']

const phase = ref<Phase>('idle')
const time = ref(0)
const tries = ref<number[]>([])

/** Padded to the run length so the panel's empty slots hold their space. */
const trySlots = computed<(number | null)[]>(() =>
  Array.from({ length: TRIES_PER_RUN }, (_, index) => tries.value[index] ?? null)
)

const average = computed(() => summarize(tries.value).average)

let timeout: ReturnType<typeof setTimeout> | undefined
let startedAt = 0

function formatMs(ms: number | null): string {
  return ms === null ? '—' : `${ms} ms`
}

function startWaiting() {
  clearTimeout(timeout)
  phase.value = 'waiting'
  timeout = setTimeout(() => {
    startedAt = performance.now()
    phase.value = 'ready'
  }, MIN_DELAY + randomIndex(DELAY_SPREAD))
}

/** Pressing only arms the round — the player must still be holding when green lands. */
function onPress() {
  switch (phase.value) {
    case 'idle':
    case 'result':
    case 'too-soon':
      startWaiting()
      break
    case 'done':
      tries.value = []
      startWaiting()
      break
  }
}

/** Letting go is the measured action: before green is a miss, after green is the time. */
function onRelease() {
  switch (phase.value) {
    case 'waiting':
      clearTimeout(timeout)
      phase.value = 'too-soon'
      break
    case 'ready':
      time.value = Math.round(performance.now() - startedAt)
      tries.value = [...tries.value, time.value]
      phase.value = tries.value.length >= TRIES_PER_RUN ? 'done' : 'result'
      break
  }
}

function onPointerDown(event: PointerEvent) {
  if (event.button !== 0) return
  // Capturing keeps pointerup pointed at this button even when the pointer
  // drifts off it, so a round can never be left hanging mid-hold.
  const target = event.currentTarget
  if (target instanceof Element) target.setPointerCapture(event.pointerId)
  onPress()
}

function onKeyDown(event: KeyboardEvent) {
  if (!HOLD_KEYS.includes(event.key)) return
  // Without this, Space scrolls the page and both keys fire a click nobody reads.
  event.preventDefault()
  onPress()
}

function onKeyUp(event: KeyboardEvent) {
  if (!HOLD_KEYS.includes(event.key)) return
  event.preventDefault()
  onRelease()
}

onBeforeUnmount(() => clearTimeout(timeout))

const heading = computed(() => {
  switch (phase.value) {
    case 'idle': return 'Reaction Test'
    case 'waiting': return 'Wait for green…'
    case 'ready': return 'Release!'
    case 'too-soon': return 'Too soon!'
    case 'done': return formatMs(average.value)
    default: return formatMs(time.value)
  }
})

const hint = computed(() => {
  switch (phase.value) {
    case 'idle': return 'Hold to start'
    case 'done': return 'Your average · hold again'
    case 'result':
    case 'too-soon': return 'Hold to try again'
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
  <div class="flex flex-col flex-1 w-full lg:flex-row">
    <GameStage
      :label="announcement"
      :class="bgClass"
      class="touch-none"
      @pointerdown="onPointerDown"
      @pointerup="onRelease"
      @pointercancel="onRelease"
      @keydown="onKeyDown"
      @keyup="onKeyUp"
    >
      <span class="text-5xl font-semibold tabular-nums sm:text-7xl">
        {{ heading }}
      </span>
      <span
        v-if="hint"
        class="text-lg opacity-70"
      >
        {{ hint }}
      </span>
    </GameStage>

    <ReactionSummary :tries="trySlots" />

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
