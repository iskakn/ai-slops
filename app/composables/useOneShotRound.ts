/**
 * State for a game that plays exactly one round before it must be reset.
 *
 * `commit` takes a factory rather than a value so the round is only created —
 * and any randomness only drawn — when the round is actually still open. A
 * second click on a locked round is a no-op and burns no entropy.
 */
export function useOneShotRound<T>() {
  const round = shallowRef<T | null>(null)
  const locked = computed(() => round.value !== null)

  function commit(create: () => T) {
    if (!locked.value) round.value = create()
  }

  function reset() {
    round.value = null
  }

  return { round, locked, commit, reset }
}
