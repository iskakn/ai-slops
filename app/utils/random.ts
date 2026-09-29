const UINT32_SPACE = 0x100000000

/**
 * A uniform integer in `[0, length)` backed by `crypto.getRandomValues`.
 *
 * Rejection sampling keeps it exactly uniform: `2^32` is not a multiple of most
 * lengths, so values landing in the incomplete tail are redrawn rather than
 * being folded onto the low outcomes by `%`.
 *
 * Call this at interaction time (inside a click handler), never during
 * `setup`/SSR — a secret drawn on the server is serialised into the Nuxt
 * payload, where a player can view-source it, and it would diverge from the
 * client value during hydration.
 */
export function randomIndex(length: number): number {
  if (!Number.isInteger(length) || length <= 0) {
    throw new RangeError(`randomIndex expects a positive integer, got ${length}`)
  }

  const buffer = new Uint32Array(1)
  const limit = Math.floor(UINT32_SPACE / length) * length

  for (;;) {
    crypto.getRandomValues(buffer)
    const value = buffer[0] ?? 0
    if (value < limit) return value % length
  }
}

/** A uniform pick from a non-empty list. */
export function randomElement<T>(items: readonly T[]): T {
  // randomIndex throws on an empty list and otherwise returns an in-range
  // index, so the `undefined` that noUncheckedIndexedAccess adds is unreachable.
  return items[randomIndex(items.length)] as T
}
