import { it, expect } from 'vitest';
import { createGame } from '../src/game/definition';
import { createHollowmere } from '../src/fantasy/definition';
import { createState, dispatch, advance, activityDuration } from '../src/engine/simulation';
import { discoverAtSite } from '../src/engine/discoveries';
import { recruitName } from '../src/engine/personnel';
import { decodeSave, encodeSave, validateState } from '../src/engine/save';
import { discoveryPanel } from '../src/ui/expedition-panels';
import type { DefinitionFactory } from '../src/engine/types';
function found(factory: DefinitionFactory = createGame, id = 'stranded-specialist') {
  const game = factory(7, 5),
    state = createState(game, 7);
  const source = game.locations.find((l) => !l.station && !l.initiallyKnown)!;
  state.location = source.id;
  state.known = game.locations.map((l) => l.id);
  state.discoveries = Object.fromEntries(
    game.locations.map((l) => [l.id, { surveyed: true, sites: [], dataSold: false }]),
  );
  const intro = game.locations.find((l) => !l.station && l.initiallyKnown)!;
  state.discoveries[intro.id].sites = [...intro.sites];
  state.discoveries[source.id].sites = [source.sites[0]];
  // Exercise the real selector with one eligible catalog entry, without unrelated event RNG.
  const selected = game.discoveryEvents!.entries.find((event) => event.id === id)!;
  const catalog = game.discoveryEvents!;
  game.discoveryEvents = { ...catalog, chance: 1, entries: [selected] };
  discoverAtSite(game, state, source.id, source.sites[0], {
    roll: () => 0,
    event: (s, key, params) => s.events.push({ id: s.nextEvent++, at: s.elapsed, key, params }),
  });
  game.discoveryEvents = catalog;
  return { game, state, source };
}
it('adds valid themed opportunities only in generation 5 while preserving generation-4 layouts, names and site profiles', () => {
  for (const factory of [createGame, createHollowmere]) {
    const game = factory(7, 5),
      old = factory(7, 4);
    expect(game.locations).toEqual(old.locations);
    expect(game.regions).toEqual(old.regions);
    expect(game.routes).toEqual(old.routes);
    expect(game.sites).toEqual(old.sites);
    expect(game.missions).toEqual(old.missions);
    expect(game.activities).toEqual(old.activities);
    const events = game.discoveryEvents!.entries.filter(
      (event) => !old.discoveryEvents?.entries.some((prior) => prior.id === event.id),
    );
    expect(events).toHaveLength(2);
    for (const event of events) {
      expect(event.minimumSites).toBe(4);
      expect(event.locations).not.toContain(
        game.locations.find((l) => !l.station && l.initiallyKnown)!.id,
      );
      expect(event.description).not.toMatch(/\{faction:/);
      if (event.kind === 'choice')
        for (const choice of event.choices) {
          if (choice.recruit)
            expect(game.recruitment!.offers.some((offer) => offer.id === choice.recruit)).toBe(
              true,
            );
          if (choice.training) expect(choice.training.points).toBe(4);
        }
    }
  }
});
it('reserves a survivor identity at onset, keeps it through other hiring/reload, and joins once resting for no fee', () => {
  for (const factory of [createGame, createHollowmere]) {
    const { game, state } = found(factory);
    const record = state.incidents[0];
    expect(record.recruitSerial).toBe(0);
    expect(state.recruitSerial).toBe(1);
    expect(
      dispatch(game, state, { type: 'discovery', id: record.id, choice: 'join' }).error,
    ).toContain('service hub');
    state.location = game.initial.location;
    const def = game.discoveryEvents!.entries.find((event) => event.id === record.id)!;
    if (def.kind !== 'choice') throw Error('Expected choice');
    const offer = game.recruitment!.offers.find(
      (offer) => offer.id === def.choices.find((choice) => choice.id === 'join')!.recruit,
    )!;
    const name = recruitName(offer, state.seed, record.recruitSerial!);
    const filled = dispatch(game, state, { type: 'hire', id: offer.id });
    expect(filled.error).toBeUndefined();
    expect(filled.state.crew.at(-1)!.name).not.toBe(name);
    expect(
      dispatch(game, filled.state, { type: 'discovery', id: record.id, choice: 'join' }).error,
    ).toContain('accommodation');
    const upgrade = game.upgrades.find((upgrade) => upgrade.crewCapacity)!;
    filled.state.inventory[game.rules.currency] = 2000;
    let ready = dispatch(game, filled.state, { type: 'upgrade', id: upgrade.id }).state;
    ready = decodeSave(encodeSave(ready, 1000), factory).state;
    expect(discoveryPanel(game, ready, () => '<button>Respond</button>')).toContain(name);
    const serial = ready.recruitSerial,
      inventory = structuredClone(ready.inventory);
    const joined = dispatch(game, ready, { type: 'discovery', id: record.id, choice: 'join' });
    expect(joined.error).toBeUndefined();
    expect(joined.state.crew.at(-1)).toMatchObject({
      name,
      assignment: 'rest',
      experience: 0,
      recruit: offer.id,
    });
    expect(joined.state.inventory).toEqual(inventory);
    expect(joined.state.recruitSerial).toBe(serial);
    expect(validateState(joined.state, game)).toBe(true);
    expect(decodeSave(encodeSave(joined.state, 1000), factory).state).toEqual(joined.state);
    expect(
      dispatch(game, joined.state, { type: 'discovery', id: record.id, choice: 'join' }).error,
    ).toContain('unsettled');
  }
});
it('allows resettlement at full accommodation and retains the receipt beyond capped logs', () => {
  const { game, state } = found();
  state.location = game.initial.location;
  const filled = dispatch(game, state, { type: 'hire', id: 'engineer' }).state;
  const settled = dispatch(game, filled, {
    type: 'discovery',
    id: 'stranded-specialist',
    choice: 'resettle',
  });
  expect(settled.error).toBeUndefined();
  expect(settled.state.crew.length).toBe(filled.crew.length);
  expect(settled.state.inventory.credits).toBe(filled.inventory.credits + 70);
  settled.state.events = [];
  settled.state.nextEvent = 999;
  const restored = decodeSave(encodeSave(settled.state, 1000), createGame).state;
  expect(restored.incidents[0].choice).toBe('resettle');
  expect(
    dispatch(game, restored, { type: 'discovery', id: 'stranded-specialist', choice: 'join' })
      .error,
  ).toBeTruthy();
});
it('trains living matching specialists with visible capped gains without changing paid jobs, and offers a useful alternative', () => {
  for (const factory of [createGame, createHollowmere]) {
    const { game, state } = found(factory, 'recovered-methods');
    state.location = game.initial.location;
    const skill = game.id === 'far-wake' ? 'engineering' : 'mage';
    const member = state.crew.find((member) => member.skill === skill)!;
    member.experience = 3;
    const activity =
      game.activities.find(
        (activity) =>
          activity.skill === skill && activity.slot === 'support' && activity.at === 'any',
      ) ?? game.activities.find((activity) => activity.id === game.rules.workActivity)!;
    member.assignment = activity.slot;
    state.integrity = 50;
    state.wear = 40;
    const begun = dispatch(game, state, { type: 'activity', id: activity.id }).state;
    const job = structuredClone(begun[activity.slot]!);
    const trained = dispatch(game, begun, {
      type: 'discovery',
      id: 'recovered-methods',
      choice: 'study',
    });
    expect(trained.error).toBeUndefined();
    expect(trained.state.crew.find((m) => m.id === member.id)!.experience).toBe(7);
    expect(trained.state[activity.slot]).toEqual(job);
    expect(activityDuration(game, trained.state, activity.id)).toBeLessThan(job.total);
    expect(
      dispatch(game, trained.state, { type: 'discovery', id: 'recovered-methods', choice: 'study' })
        .error,
    ).toBeTruthy();
    const capped = structuredClone(state);
    capped.crew.find((m) => m.id === member.id)!.experience = 29;
    expect(
      dispatch(game, capped, {
        type: 'discovery',
        id: 'recovered-methods',
        choice: 'study',
      }).state.crew.find((m) => m.id === member.id)!.experience,
    ).toBe(30);
    capped.crew.find((m) => m.id === member.id)!.life = 'dead';
    expect(
      dispatch(game, capped, { type: 'discovery', id: 'recovered-methods', choice: 'study' }).error,
    ).toContain('No living specialist');
    expect(
      dispatch(game, capped, { type: 'discovery', id: 'recovered-methods', choice: 'release' })
        .error,
    ).toBeUndefined();
  }
});
it('rejects invalid reserved identities and does not reroll settled or pending opportunities', () => {
  const { game, state, source } = found();
  for (const serial of [undefined, -1, 1, 1.5]) {
    const changed = structuredClone(state);
    changed.incidents[0].recruitSerial = serial;
    expect(() => decodeSave(encodeSave(changed, 1000), createGame)).toThrow('invalid');
  }
  let rolls = 0;
  discoverAtSite(game, state, source.id, source.sites[1], {
    roll: () => {
      rolls++;
      return 0;
    },
    event: () => {},
  });
  expect(rolls).toBe(0);
  expect(state.incidents).toHaveLength(1);
  const intro = createState(game, 7);
  intro.location = 'cinder';
  intro.discoveries.cinder = {
    surveyed: true,
    sites: [...game.locations.find((l) => l.id === 'cinder')!.sites],
    dataSold: false,
  };
  discoverAtSite(game, intro, 'cinder', intro.discoveries.cinder.sites[0], {
    roll: () => {
      rolls++;
      return 0;
    },
    event: () => {},
  });
  expect(intro.incidents).toEqual([]);
});
