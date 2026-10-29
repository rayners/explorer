import type { GameDefinition, GameState, Member, RecruitDef } from './types';
import { generateName, nameCapacity } from './names';
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

function usedRecruitSerials(state: GameState): Set<number> {
  return new Set([
    ...state.crew
      .filter((member) => member.recruit)
      .map((member) => Number(member.id.slice(member.recruit!.length + 1))),
    ...state.incidents.flatMap((record) =>
      record.recruitSerial === undefined ? [] : [record.recruitSerial],
    ),
  ]);
}
/** The counter is a high-water mark; unselected previews never consume archive space. */
export function nextRecruitSerial(state: GameState): number | undefined {
  const used = usedRecruitSerials(state);
  for (let serial = 0; serial < 1000; serial++) if (!used.has(serial)) return serial;
}
/** Stable simultaneous candidates, sharing the existing indexed name pool and saved IDs. */
export function recruitmentCandidates(game: GameDefinition, state: GameState) {
  const used = usedRecruitSerials(state),
    boardNames = new Set<string>();
  const archiveNames = new Set(state.crew.map((member) => member.name));
  for (const record of state.incidents) {
    if (record.recruitSerial === undefined) continue;
    const discovery = game.discoveryEvents?.entries.find((entry) => entry.id === record.id);
    if (discovery?.kind !== 'choice') continue;
    for (const choice of discovery.choices) {
      const offer = game.recruitment?.offers.find((offer) => offer.id === choice.recruit);
      if (offer) archiveNames.add(recruitName(offer, state.seed, record.recruitSerial));
    }
  }
  const candidates = new Map<string, { serial: number; name: string }>();
  const offers = [...(game.recruitment?.offers ?? [])];
  // Preserve the free recovery option even when only one name slot remains.
  if (!living(state).length) offers.sort((a, b) => Number(!!b.emergency) - Number(!!a.emergency));
  for (const offer of offers) {
    if (offer.emergency && living(state).length) continue;
    const limit = offer.nameSource
      ? Math.min(1000, nameCapacity(offer.nameSource.pattern) - offer.nameSource.offset)
      : 1000;
    let fresh: { serial: number; name: string } | undefined,
      distinct: typeof fresh,
      fallback: typeof fresh;
    for (let serial = 0; serial < limit; serial++) {
      if (used.has(serial)) continue;
      const candidate = { serial, name: recruitName(offer, state.seed, serial) };
      fallback ??= candidate;
      if (boardNames.has(candidate.name)) continue;
      distinct ??= candidate;
      if (!archiveNames.has(candidate.name)) {
        fresh = candidate;
        break;
      }
    }
    const candidate = fresh ?? distinct ?? fallback;
    if (!candidate) continue;
    candidates.set(offer.id, candidate);
    used.add(candidate.serial);
    boardNames.add(candidate.name);
  }
  return candidates;
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
  if (
    state.crew.length >= 1000 ||
    (reservedSerial === undefined && !recruitmentCandidates(game, state).has(offer.id))
  )
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
