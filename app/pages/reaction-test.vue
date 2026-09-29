<script setup lang="ts">
useSeoMeta({
  title: 'Reaction Test'
})

type Phase = 'idle' | 'waiting' | 'ready' | 'result' | 'too-soon'

const phase = ref<Phase>('idle')
const time = ref(0)

let timeout: ReturnType<typeof setTimeout> | undefined
let startedAt = 0

function onClick() {
  switch (phase.value) {
    case 'idle':
    case 'result':
    case 'too-soon':
      phase.value = 'waiting'
      timeout = setTimeout(() => {
        startedAt = performance.now()
        phase.value = 'ready'
      }, 1000 + Math.random() * 3000)
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
  <button
    type="button"
    class="flex flex-col items-center justify-center gap-4 w-full min-h-[calc(100dvh-var(--ui-header-height))] cursor-pointer select-none focus-visible:outline-3 outline-primary/25"
    :class="bgClass"
    :aria-label="`${heading}. ${hint}`"
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
  </button>
</template>
