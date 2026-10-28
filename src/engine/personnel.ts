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

/** Shared recruitment checks for paid hiring and a discovery's reserved, free recruit. */
export function recruitmentError(
  game: GameDefinition,
  state: GameState,
  offer: RecruitDef,
  reservedSerial?: number,
): string | undefined {
  if (
    !game.locations.find((l) => l.id === state.location)?.station ||
    state.primary?.kind === 'travel' ||
    state.primary?.kind === 'rescue'
  )
    return 'Recruitment requires visiting a service hub.';
  if (offer.emergency && living(state).length > 0)
    return 'Emergency relief is reserved for expeditions with no surviving members.';
  if (living(state).length >= crewCapacity(game, state))
    return 'No accommodation available. Install a capacity upgrade first.';
  if (state.crew.length >= 1000 || (reservedSerial === undefined && state.recruitSerial >= 1000))
    return 'The roster archive is full. Export this expedition before starting another.';
  if (
    reservedSerial !== undefined &&
    (!Number.isInteger(reservedSerial) ||
      reservedSerial < 0 ||
      reservedSerial >= state.recruitSerial ||
      state.crew.some((member) => member.id === `${offer.id}-${reservedSerial}`))
  )
    return 'This recruitment opportunity is no longer available.';
}
/** Called only on a copied transition state, after checks and payment. */
export function joinRecruit(state: GameState, offer: RecruitDef, reservedSerial?: number): Member {
  const serial = reservedSerial ?? state.recruitSerial++;
  const member: Member = {
    id: `${offer.id}-${serial}`,
    name: recruitName(offer, state.seed, serial),
    skill: offer.skill,
    assignment: 'rest',
    injury: 0,
    life: 'alive',
    recruit: offer.id,
    experience: 0,
  };
  state.crew.push(member);
  return member;
}
