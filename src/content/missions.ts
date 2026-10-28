import { generateFollowUps, type FollowUpRecipe } from '../engine/mission-generation';
import type { GameDefinition } from '../engine/types';
/** Add discovery follow-ups without changing existing site catalogs, names or saved jobs. */
export function finishFollowUps(game: GameDefinition, recipe: FollowUpRecipe): GameDefinition {
  if (game.generationVersion < 3) return game;
  const generated = generateFollowUps(game, recipe);
  return {
    ...game,
    missions: [...game.missions, ...generated.missions],
    activities: [...game.activities, ...generated.activities],
  };
}
