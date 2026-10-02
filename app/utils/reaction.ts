export const TRIES_PER_RUN = 5

export interface ReactionStats {
  /** Landed tries, in run order. */
  readonly count: number
  readonly average: number | null
  readonly best: number | null
  readonly worst: number | null
  readonly median: number | null
  /** Worst minus best, or `null` until a second try makes a spread meaningful. */
  readonly spread: number | null
  readonly first: number | null
  readonly last: number | null
}

/**
 * Central tendency and dispersion for one run of reaction times, in ms.
 *
 * The median and the spread sit next to the mean on purpose: one distracted try
 * drags a five-try mean a long way, and those two are what let a player see
 * that it happened instead of reading the mean as their real speed.
 */
export function summarize(tries: readonly number[]): ReactionStats {
  if (!tries.length) {
    return {
      count: 0,
      average: null,
      best: null,
      worst: null,
      median: null,
      spread: null,
      first: null,
      last: null
    }
  }

  const sorted = [...tries].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  // `tries` is non-empty here, so both ends of the sorted copy exist.
  const best = sorted[0] as number
  const worst = sorted[sorted.length - 1] as number
  const upper = sorted[middle] as number
  const total = tries.reduce((sum, ms) => sum + ms, 0)

  return {
    count: tries.length,
    average: Math.round(total / tries.length),
    best,
    worst,
    median: sorted.length % 2
      ? upper
      : Math.round(((sorted[middle - 1] as number) + upper) / 2),
    spread: tries.length > 1 ? worst - best : null,
    first: tries[0] as number,
    last: tries[tries.length - 1] as number
  }
}
