<script setup lang="ts">
import { summarize } from '~/utils/reaction'

const props = defineProps<{
  /** One entry per slot in run order; `null` is a try that has not landed yet. */
  tries: readonly (number | null)[]
}>()

/** Rough mean for a simple visual reaction, used as the reader's yardstick. */
const HUMAN_AVERAGE = 250
/** Bars grow from a zero baseline; the ceiling only lifts when a try needs it. */
const BASE_SCALE = 500
/** Below these gaps the number is noise, so the chip says so in words instead. */
const TREND_THRESHOLD = 20
const TIGHT_SPREAD = 20
const LOOSE_SPREAD = 60

interface Chip {
  readonly icon: string
  readonly label: string
  readonly color: 'success' | 'warning' | 'neutral'
  readonly variant: 'soft' | 'outline'
}

const recorded = computed(() => props.tries.filter((ms): ms is number => ms !== null))
const stats = computed(() => summarize(recorded.value))
const done = computed(() => props.tries.length > 0 && stats.value.count === props.tries.length)

// Lifting the ceiling keeps a slow try from being clipped; zero-based bars with
// a label on every mark mean the scale never has to be spelled out.
const scaleMax = computed(() =>
  Math.max(BASE_SCALE, Math.ceil((stats.value.worst ?? 0) / 100) * 100)
)

/** Share of the plot height, to 2 decimals — anything finer is sub-pixel noise. */
function percentOf(ms: number): number {
  return Math.round(Math.min(ms / scaleMax.value, 1) * 10000) / 100
}

const columns = computed(() =>
  props.tries.map((ms, index) => ({
    index: index + 1,
    ms,
    percent: ms === null ? 0 : percentOf(ms),
    isBest: ms !== null && ms === stats.value.best
  }))
)

const chartLabel = computed(() =>
  stats.value.count
    ? `Reaction time in milliseconds for ${stats.value.count} of ${props.tries.length} tries: ${recorded.value.join(', ')}.`
    : 'No tries recorded yet.'
)

const trendChip = computed<Chip | null>(() => {
  const { count, first, last } = stats.value
  if (count < 2 || first === null || last === null) return null
  const delta = last - first
  if (delta <= -TREND_THRESHOLD) {
    return { icon: 'i-lucide-trending-down', label: `${-delta} ms faster`, color: 'success', variant: 'soft' }
  }
  if (delta >= TREND_THRESHOLD) {
    return { icon: 'i-lucide-trending-up', label: `${delta} ms slower`, color: 'warning', variant: 'soft' }
  }
  return { icon: 'i-lucide-minus', label: 'steady pace', color: 'neutral', variant: 'soft' }
})

const consistencyChip = computed<Chip | null>(() => {
  const range = stats.value.spread
  if (range === null) return null
  if (range <= TIGHT_SPREAD) return { icon: 'i-lucide-equal', label: 'consistent', color: 'success', variant: 'outline' }
  if (range <= LOOSE_SPREAD) return { icon: 'i-lucide-activity', label: 'steady', color: 'neutral', variant: 'outline' }
  return { icon: 'i-lucide-activity', label: 'erratic', color: 'warning', variant: 'outline' }
})

// Doubles as the pre-completion prompt, so the line always holds its height.
const verdict = computed(() => {
  const avg = stats.value.average
  if (!done.value || avg === null) {
    const left = props.tries.length - stats.value.count
    return `${left} ${left === 1 ? 'try' : 'tries'} to go`
  }
  if (avg < 170) return 'Fighter-pilot reflexes — under 170 ms'
  if (avg < HUMAN_AVERAGE - 30) return `Faster than the ~${HUMAN_AVERAGE} ms human average`
  if (avg <= HUMAN_AVERAGE + 30) return `Bang on the ~${HUMAN_AVERAGE} ms human average`
  if (avg < 400) return 'Over the human average, still quick'
  return `Well off the ~${HUMAN_AVERAGE} ms human average`
})
</script>

<template>
  <section
    class="flex shrink-0 flex-col w-full border-t border-default px-4 py-2.5 sm:px-6 lg:w-80 lg:justify-center lg:border-t-0 lg:border-s xl:w-96"
  >
    <div class="flex items-end justify-between gap-3">
      <p class="text-2xl font-semibold text-highlighted tabular-nums">
        {{ stats.average ?? '—' }}
        <span class="text-sm font-normal text-muted">ms average</span>
      </p>
      <p class="text-xs text-dimmed tabular-nums">
        {{ stats.count }} / {{ tries.length }} tries
      </p>
    </div>

    <figure class="mt-1">
      <!-- pt-5 is headroom for a full-height bar's value label (16px of text
           plus its 2px offset), so no mark can push into the headline. -->
      <div class="relative pt-5">
        <div
          role="img"
          :aria-label="chartLabel"
          class="relative flex items-end gap-1.5 h-9 sm:h-14"
        >
          <div
            v-for="column in columns"
            :key="column.index"
            class="relative flex-1 h-full"
          >
            <div
              class="absolute inset-x-0 bottom-0 rounded-t-sm bg-green-600 transition-[height] duration-300 ease-out"
              :class="column.isBest && 'bg-green-800 dark:bg-green-400'"
              :style="{ height: `${column.percent}%` }"
            />
            <span
              class="absolute inset-x-0 text-center text-xs tabular-nums transition-[bottom] duration-300 ease-out"
              :class="column.isBest ? 'font-semibold text-highlighted' : 'text-muted'"
              :style="{ bottom: `calc(${column.percent}% + 0.125rem)` }"
            >
              {{ column.ms ?? '—' }}
            </span>
          </div>
        </div>
      </div>

      <div
        class="flex gap-1.5 mt-1"
        aria-hidden="true"
      >
        <span
          v-for="column in columns"
          :key="column.index"
          class="flex-1 text-center text-xs text-dimmed tabular-nums"
        >
          {{ column.index }}
        </span>
      </div>
    </figure>

    <dl class="grid grid-cols-3 gap-2 mt-3">
      <div>
        <dt class="text-xs text-dimmed">
          Best
        </dt>
        <dd class="text-sm font-medium text-default tabular-nums">
          {{ stats.best ?? '—' }}
        </dd>
      </div>
      <div>
        <dt class="text-xs text-dimmed">
          Median
        </dt>
        <dd class="text-sm font-medium text-default tabular-nums">
          {{ stats.median ?? '—' }}
        </dd>
      </div>
      <div>
        <dt class="text-xs text-dimmed">
          Spread
        </dt>
        <dd class="text-sm font-medium text-default tabular-nums">
          {{ stats.spread ?? '—' }}
        </dd>
      </div>
    </dl>

    <div class="flex flex-nowrap items-center gap-1.5 mt-2 min-h-6">
      <UBadge
        v-if="trendChip"
        :label="trendChip.label"
        :leading-icon="trendChip.icon"
        :color="trendChip.color"
        :variant="trendChip.variant"
        size="md"
      />
      <UBadge
        v-if="consistencyChip"
        :label="consistencyChip.label"
        :leading-icon="consistencyChip.icon"
        :color="consistencyChip.color"
        :variant="consistencyChip.variant"
        size="md"
      />
    </div>

    <p class="mt-2 text-xs text-muted min-h-5 sm:text-sm">
      {{ verdict }}
    </p>
  </section>
</template>
