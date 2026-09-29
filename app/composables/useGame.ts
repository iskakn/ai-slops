import { getGame, type GameDefinition, type GameSlug } from '~/games/registry'

/**
 * Resolves a page's entry in the game registry and points the document head at
 * it, so a game's title and description exist in exactly one place.
 */
export function useGame(slug: GameSlug): GameDefinition {
  const game = getGame(slug)

  useSeoMeta({
    title: game.title,
    description: game.description
  })

  return game
}
