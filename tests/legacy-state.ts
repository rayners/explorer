import type { GameState } from '../src/engine/types';
/** Compare every released schema-3 field; exclude only the two documented schema-4 additions. */
export function legacyState(state: GameState): GameState {
  const legacy = structuredClone(state);
  legacy.version = 3;
  for (const member of legacy.crew) delete member.experience;
  for (const job of [legacy.primary, legacy.support]) if (job) delete job.participants;
  return legacy;
}
