import { generateSites, type SiteRecipe } from '../engine/site-generation';
import type { GameDefinition } from '../engine/types';
/** Fresh generation 3 adds site profiles; released generations retain authored site IDs. */
export function finishSites(
  game: GameDefinition,
  seed: number,
  recipe: SiteRecipe,
): GameDefinition {
  if (game.generationVersion < 3) return game;
  game.sites = generateSites(seed, `${game.id}:sites:v3`, game.locations, recipe);
  for (const location of game.locations)
    location.sites = game.sites
      .filter((site) => site.location === location.id)
      .map((site) => site.id);
  return game;
}
