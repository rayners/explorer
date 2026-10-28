import { legacyState } from './legacy-state';
import { it, expect } from 'vitest';
import { createGame } from '../src/game/definition';
import { createHollowmere } from '../src/fantasy/definition';
import { advance, createState, dispatch, price } from '../src/engine/simulation';
import { decodeSave, encodeSave, reconcile } from '../src/engine/save';
import { pendingDiscovery } from '../src/engine/discoveries';
import type { GameDefinition, GameState } from '../src/engine/types';

function setup(kind?: 'exposure' | 'choice') {
  const game = createGame(7, 2);
  // Selection is isolated from ordinary encounter RNG; real catalogs are tested below too.
  game.locations.forEach((location) => (location.danger = 0));
  game.discoveryEvents!.chance = 1;
  if (kind)
    game.discoveryEvents!.entries = game.discoveryEvents!.entries.filter((e) => e.kind === kind);
  const state = createState(game, 7);
  state.location = 'morrow';
  state.known.push('morrow', 'rubble');
  state.discoveries.morrow = { surveyed: true, sites: [], dataSold: false };
  state.discoveries.rubble = { surveyed: true, sites: [], dataSold: false };
  state.discoveries.cinder.surveyed = true;
  state.discoveries.cinder.sites = [...game.locations.find((l) => l.id === 'cinder')!.sites];
  return { game, state };
}
function explore(game: GameDefinition, state: GameState) {
  const order = dispatch(game, state, { type: 'activity', id: game.rules.exploreActivity });
  expect(order.error).toBeUndefined();
  return advance(game, order.state, 100);
}
function settle(game: GameDefinition, state: GameState, choice = 'commons') {
  const docked = { ...state, location: 'anchor' };
  const result = dispatch(game, docked, {
    type: 'discovery',
    id: pendingDiscovery(game, state)!.id,
    choice,
  });
  expect(result.error).toBeUndefined();
  return result.state;
}

it('protects Cinder and the first three explored sites without consuming event randomness', () => {
  const { game, state } = setup('exposure');
  state.discoveries.cinder.sites = [];
  let next = state;
  for (let i = 0; i < 3; i++) next = explore(game, next);
  expect(next.incidents).toEqual([]);
  expect(next.rng).toBe(state.rng);
  const cinder = { ...next, location: 'cinder' };
  expect(explore(game, cinder).incidents).toEqual([]);
});
it('a normal expedition can silently start a saved stowaway without a specimen mission', () => {
  const { game, state } = setup('exposure');
  const next = explore(game, state);
  expect(state.incidents).toEqual([]); // Public transitions preserve inputs.
  expect(next.threat).toEqual({ id: 'stowaway', stage: 'hidden', pressure: 0, signs: 0 });
  expect(next.incidents[0]).toMatchObject({
    id: 'unseen-passenger',
    location: 'morrow',
    site: 'Pressure ridge',
  });
  expect(pendingDiscovery(game, next)).toBeUndefined();
  expect(next.events.some((e) => e.key.startsWith('threat') || e.key.startsWith('discovery'))).toBe(
    false,
  );
  const loaded = decodeSave(encodeSave(next, 1000), () => game);
  expect(loaded.state).toEqual(next);
  const idle = advance(game, loaded.state, 1000);
  expect(idle.rng).toBe(next.rng);
  expect(idle.incidents).toEqual(next.incidents);
});
it('surprise exposure reveals only after later completions and never kills during catch-up', () => {
  const { game, state } = setup('exposure');
  let next = explore(game, state);
  for (let i = 0; i < 2; i++) {
    next = dispatch(game, next, { type: 'activity', id: 'gather' }).state;
    next = reconcile(game, { state: next, savedAt: 0 }, 86400000).state;
  }
  expect(next.threat?.stage).toBe('suspected');
  expect(legacyState(next).crew).toEqual(legacyState(state).crew);
  expect(advance(game, next, 86400)).toEqual(next);
  const cleared = dispatch(game, next, { type: 'threat', action: 'purge' });
  expect(cleared.error).toBeUndefined();
  expect(cleared.state.threat).toBeNull();
  expect(dispatch(game, cleared.state, { type: 'activity', id: 'specimen' }).error).toContain(
    'already',
  );
});
it('respects the no-event outcome, and failed commands do not reroll a discovered site', () => {
  const { game, state } = setup();
  game.discoveryEvents!.chance = 0;
  const next = explore(game, state);
  expect(next.incidents).toEqual([]);
  expect(next.rng).not.toBe(state.rng);
  expect(advance(game, next, 100).rng).toBe(next.rng);
  next.inventory.provisions = 0;
  const failed = dispatch(game, next, { type: 'activity', id: 'explore' });
  expect(failed.error).toContain('supplies');
  expect(failed.state).toBe(next);
});
it('unsettled claims allow travel, require docking, then apply a permanent political choice exactly once', () => {
  const { game, state } = setup('choice');
  const found = explore(game, state);
  const command = { type: 'discovery' as const, id: 'settlement-claim', choice: 'commons' };
  expect(pendingDiscovery(game, found)?.id).toBe(command.id);
  expect(dispatch(game, found, command).error).toContain('service hub');
  const traveling = dispatch(game, found, { type: 'travel', target: 'anchor' });
  expect(traveling.error).toBeUndefined();
  expect(dispatch(game, traveling.state, command).error).toContain('service hub');
  const docked = advance(game, traveling.state, 100);
  const credits = docked.inventory.credits;
  const beforePrice = price(game, docked, 'parts', 'buy');
  const settled = dispatch(game, docked, command);
  expect(settled.error).toBeUndefined();
  expect(settled.state.inventory.credits).toBe(credits + 90);
  expect(settled.state.reputation).toMatchObject({ independent: 14, combine: -8 });
  expect(price(game, settled.state, 'parts', 'buy')).toBeGreaterThan(beforePrice);
  expect(pendingDiscovery(game, settled.state)).toBeUndefined();
  expect(dispatch(game, settled.state, command).error).toContain('no unsettled');
  // History and standing outlive the bounded narrative log.
  settled.state.events = [];
  expect(decodeSave(encodeSave(settled.state, 1000), () => game).state).toEqual(settled.state);
  expect(settled.state.incidents[0].choice).toBe('commons');
});
it('archives a discovery without payment or political penalties and rejects unknown responses', () => {
  const { game, state } = setup('choice');
  const found = { ...explore(game, state), location: 'anchor' };
  expect(
    dispatch(game, found, { type: 'discovery', id: 'settlement-claim', choice: 'invented' }).error,
  ).toContain('Unknown');
  const archived = settle(game, found, 'archive');
  expect(archived.inventory).toEqual(found.inventory);
  expect(archived.reputation).toEqual(found.reputation);
});
it('suppresses additional events during a follow-up or threat, and skips two sites after selection', () => {
  const { game, state } = setup('choice');
  const second = { ...game.discoveryEvents!.entries[0], id: 'second-claim' };
  game.discoveryEvents!.entries.push(second);
  let next = explore(game, state);
  next = { ...next, location: 'rubble' };
  next = explore(game, next);
  expect(next.discoveryCooldown).toBe(1);
  next = explore(game, next);
  expect(next.discoveryCooldown).toBe(0);
  const rng = next.rng;
  next = explore(game, next); // A pending follow-up still prevents another selection.
  expect(next.incidents).toHaveLength(1);
  expect(next.rng).toBe(rng);
  next = settle(game, next);
  next.location = 'morrow';
  const blocked = {
    ...next,
    threat: { id: 'stowaway', stage: 'contained' as const, pressure: 0, signs: 2 },
    threatHistory: ['stowaway'],
  };
  expect(explore(game, blocked).incidents).toHaveLength(1);
  next = explore(game, next);
  expect(next.incidents).toHaveLength(2);
  expect(new Set(next.incidents.map((record) => record.id)).size).toBe(2);
});
it('never duplicates the creature if the authored specimen incident has already happened', () => {
  const { game, state } = setup('exposure');
  state.threatHistory = ['stowaway'];
  const next = explore(game, state);
  expect(next.threat).toBeNull();
  expect(next.incidents).toEqual([]);
  expect(next.rng).toBe(state.rng);
});
it('produces identical outcomes for frame-sized advancement and offline reconciliation', () => {
  const { game, state } = setup();
  const started = dispatch(game, state, { type: 'activity', id: 'explore' }).state;
  let frames = started;
  for (let i = 0; i < 100; i++) frames = advance(game, frames, 1);
  expect(reconcile(game, { state: started, savedAt: 1000 }, 101000).state).toEqual(frames);
});
it('shipped event odds produce surprises, claims, and quiet returns across saved seeds', () => {
  const outcomes = new Set<string>();
  for (let rng = 1; rng <= 80; rng++) {
    const { game, state } = setup();
    game.discoveryEvents!.chance = 0.35;
    state.rng = rng;
    outcomes.add(explore(game, state).incidents[0]?.id ?? 'quiet');
  }
  expect([...outcomes].sort()).toEqual(['quiet', 'settlement-claim', 'unseen-passenger']);
});
it('weights make a common discovery more likely than a rare passenger', () => {
  const counts: Record<string, number> = {};
  for (let rng = 1; rng <= 400; rng++) {
    const { game, state } = setup();
    game.discoveryEvents!.entries.find((entry) => entry.kind === 'choice')!.weight = 9;
    state.rng = rng;
    const id = explore(game, state).incidents[0].id;
    counts[id] = (counts[id] ?? 0) + 1;
  }
  expect(counts['unseen-passenger']).toBeGreaterThan(0);
  expect(counts['settlement-claim']).toBeGreaterThan(counts['unseen-passenger'] * 4);
});
it('runs the same discovery mechanism with fantasy resources and factions', () => {
  const game = createHollowmere(7);
  const faction = game.factions[0].id;
  game.locations.forEach((location) => (location.danger = 0));
  game.discoveryEvents = {
    chance: 1,
    cooldown: 0,
    entries: [
      {
        id: 'lost-oath',
        title: 'Lost oath',
        description: 'A forgotten pledge.',
        minimumSites: 1,
        weight: 1,
        kind: 'choice',
        at: 'any',
        choices: [
          {
            id: 'honor',
            name: 'Honor it',
            description: 'Remember.',
            reward: { [game.rules.currency]: 10 },
            reputation: { [faction]: 4 },
          },
        ],
      },
    ],
  };
  const state = createState(game, 7);
  state.location = 'old-road';
  state.discoveries['old-road'].surveyed = true;
  const found = explore(game, state);
  const result = dispatch(game, found, { type: 'discovery', id: 'lost-oath', choice: 'honor' });
  expect(result.error).toBeUndefined();
  expect(result.state.reputation[faction]).toBe(4);
  expect(decodeSave(encodeSave(result.state, 1000), () => game).state).toEqual(result.state);
});
it('migrates schema-two saves without rerolling past sites or changing threats and committed jobs', () => {
  for (const stage of [null, 'hidden', 'suspected', 'contained', 'resolved']) {
    const { game, state } = setup();
    state.threatHistory = stage ? ['stowaway'] : [];
    if (stage && stage !== 'resolved')
      state.threat = { id: 'stowaway', stage: stage as 'hidden', pressure: 1, signs: 1 };
    const started =
      stage === null || stage === 'resolved' || stage === 'hidden' || stage === 'contained'
        ? dispatch(game, state, { type: 'travel', target: 'anchor' }).state
        : state;
    const legacy: any = structuredClone(started);
    legacy.version = 2;
    delete legacy.incidents;
    delete legacy.discoveryCooldown;
    const restored = decodeSave(encodeSave(legacy, 1000), () => game).state;
    expect(restored).toEqual({ ...started, version: 5, incidents: [], discoveryCooldown: 0 });
    expect(restored.rng).toBe(started.rng);
    expect(restored.discoveries).toEqual(started.discoveries);
  }
  const fantasy = createState(createHollowmere(7), 7) as any;
  fantasy.version = 2;
  delete fantasy.incidents;
  delete fantasy.discoveryCooldown;
  expect(decodeSave(encodeSave(fantasy, 1000), createHollowmere).state.version).toBe(5);
});
it('rejects malformed or contradictory incident history before loading a save', () => {
  const { game, state } = setup('choice');
  const found = explore(game, state);
  for (const changes of [
    { incidents: null },
    { incidents: [null] },
    { incidents: [...found.incidents, found.incidents[0]] },
    { incidents: [{ ...found.incidents[0], id: 'missing' }] },
    { incidents: [{ ...found.incidents[0], choice: 'invented' }] },
    { incidents: [{ ...found.incidents[0], site: 'invented' }] },
    { incidents: [{ ...found.incidents[0], location: 'missing' }] },
    { incidents: [{ ...found.incidents[0], location: 'constructor' }] },
    { incidents: [{ ...found.incidents[0], at: found.elapsed + 1 }] },
    { discoveryCooldown: -1 },
    { discoveryCooldown: 1.5 },
    { discoveryCooldown: 3 },
  ])
    expect(() => decodeSave(encodeSave({ ...found, ...changes } as any, 1000), () => game)).toThrow(
      'invalid',
    );
});
