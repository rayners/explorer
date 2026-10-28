import type { GameDefinition, GameState, Member, RecruitDef } from './types';
import { generateName } from './names';
/** Living members supply skills and occupy accommodation. Casualties stay in the roster. */
export function living(state: GameState): Member[] {
  return state.crew.filter((member) => member.life !== 'dead');
}
/** Capacity comes from the setting and installed accommodation upgrades. */
export function crewCapacity(game: GameDefinition, state: GameState): number {
  return (
    (game.recruitment?.capacity ?? game.initial.crew.length) +
    game.upgrades
      .filter((upgrade) => state.upgrades.includes(upgrade.id))
      .reduce((n, upgrade) => n + (upgrade.crewCapacity ?? 0), 0)
  );
}
/** A reproducible name from a setting's cast, independent of outcome randomness. */
export function recruitName(offer: RecruitDef, seed: number, serial: number): string {
  if (offer.nameSource) {
    const source = offer.nameSource;
    return (
      (source.prefix ?? '') +
      generateName(seed, source.namespace, source.pattern, source.offset + serial)
    );
  }
  return offer.names[(seed + serial) % offer.names.length] ?? offer.name;
}
