import { generateWorld, type WorldRecipe } from '../engine/world-generation';
import type { GameDefinition } from '../engine/types';
/** Layouts precede names/sites/contracts; older generation factories remain exact. */
export function finishWorld(
  game: GameDefinition,
  seed: number,
  version: number,
  recipe: WorldRecipe,
): GameDefinition {
  if (version < 4) return game;
  const world = generateWorld(
    seed,
    `${game.id}:world:v4`,
    {
      regions: game.regions,
      locations: game.locations,
      routes: game.routes,
    },
    recipe,
  );
  const added = world.locations
    .filter((l) => !l.station && !game.locations.some((old) => old.id === l.id))
    .map((l) => l.id);
  const result = { ...game, ...world };
  if (game.discoveryEvents) result.discoveryEvents = structuredClone(game.discoveryEvents);
  for (const event of result.discoveryEvents?.entries ?? [])
    if (event.locations) event.locations = [...event.locations, ...added];
  return result;
}
