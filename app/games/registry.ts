export interface GameDefinition {
  readonly slug: string
  readonly title: string
  readonly description: string
  readonly icon: string
  readonly tagline?: string
}

/**
 * Single source of truth for every game: the homepage tiles, each page's
 * <h1>/subtitle and its SEO meta all read from here, in this order.
 *
 * `slug` doubles as the route name, so it must match `app/pages/<slug>.vue`.
 * Keep `description` at roughly 34 characters or less so a tile still fits in
 * two lines at half width on a phone.
 */
export const GAMES = [
  {
    slug: 'clicker',
    title: 'Clicker',
    description: 'Tap and watch the number climb.',
    icon: 'i-lucide-mouse-pointer-click'
  },
  {
    slug: 'reaction-test',
    title: 'Reaction Test',
    description: 'Wait for green, then release fast.',
    icon: 'i-lucide-zap'
  },
  {
    slug: 'guess-the-number',
    title: 'Guess the Number',
    description: 'Higher/lower hints, one try.',
    icon: 'i-lucide-hash',
    tagline: '0–10 · one try'
  },
  {
    slug: 'rock-paper-scissors',
    title: 'Rock Paper Scissors',
    description: 'Classic hand game vs. the machine.',
    icon: 'i-lucide-hand',
    tagline: 'One round · you vs. the machine'
  }
] as const satisfies readonly GameDefinition[]

export type GameSlug = (typeof GAMES)[number]['slug']

export function getGame(slug: GameSlug): GameDefinition {
  const game = GAMES.find(candidate => candidate.slug === slug)
  if (!game) throw new Error(`[ai-slops] no game registered for slug "${slug}"`)
  return game
}

export function gameRoute(slug: GameSlug): string {
  return `/${slug}`
}
