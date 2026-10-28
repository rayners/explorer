import { legacyState } from './legacy-state';
import { it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { allocateNames, generateName, nameCapacity } from '../src/engine/names';
import { recruitName } from '../src/engine/personnel';
import { createGame } from '../src/game/definition';
import { createHollowmere } from '../src/fantasy/definition';
import { createState, dispatch } from '../src/engine/simulation';
import { decodeSave, encodeSave } from '../src/engine/save';
import { guidance } from '../src/game/text';
import { nameReferences } from '../src/content/names';

it('generates reproducible indexed names independently of call order and naming domains', () => {
  const pattern = {
    parts: [
      ['Ash', 'Grey', 'Pale'],
      ['Watch', 'Haven', 'Grove'],
    ],
  };
  const names = Array.from({ length: 9 }, (_, index) => generateName(44, 'places', pattern, index));
  expect(new Set(names).size).toBe(9);
  expect(names).toContain(generateName(44, 'places', pattern, 4));
  generateName(44, 'unrelated', pattern);
  expect(generateName(44, 'places', pattern, 4)).toBe(names[4]);
  expect(() => generateName(44, 'places', pattern, 9)).toThrow('exhausted');
  const entries = [
    { id: 'one', pattern },
    { id: 'two', pattern },
    { id: 'three', pattern },
  ];
  expect(allocateNames(44, 'places', entries)).toEqual(
    allocateNames(44, 'places', entries.reverse()),
  );
  expect(new Set(Object.values(allocateNames(44, 'places', entries))).size).toBe(3);
});
it('rejects unusable vocabularies and reports catalog exhaustion instead of looping', () => {
  expect(() => nameCapacity({ parts: [] })).toThrow();
  expect(() => nameCapacity({ parts: [[]] })).toThrow();
  expect(() => nameCapacity({ parts: [[' ']] })).toThrow();
  expect(() => nameCapacity({ parts: [['Echo', 'Echo']] })).toThrow();
  expect(() => generateName(1, 'x', { parts: [['Name']] }, -1)).toThrow();
  expect(() =>
    allocateNames(1, 'x', [
      { id: 'a', pattern: { parts: [['Only']] } },
      { id: 'b', pattern: { parts: [['Only']] } },
    ]),
  ).toThrow('distinct');
});
it('varies crew, faction, region and location names across seeds in both settings', () => {
  for (const factory of [createGame, createHollowmere]) {
    const a = factory(44, 2),
      b = factory(91, 2);
    expect(a.generationVersion).toBe(2);
    expect(a).toEqual(factory(44, 2));
    expect(a.initial.crew.map((member) => member.name)).not.toEqual(
      b.initial.crew.map((member) => member.name),
    );
    for (const kind of ['factions', 'regions', 'locations'] as const) {
      expect(a[kind].map((entry) => entry.name)).not.toEqual(b[kind].map((entry) => entry.name));
      expect(new Set(a[kind].map((entry) => entry.name)).size).toBe(a[kind].length);
      expect(
        a[kind].every(
          (entry) =>
            entry.name.trim() === entry.name && entry.name.length > 2 && entry.name.length < 80,
        ),
      ).toBe(true);
      expect(a[kind].map((entry) => entry.id)).toEqual(b[kind].map((entry) => entry.id));
    }
    expect(a.routes).toEqual(factory(44, 1).routes);
    const legacy = factory(44, 1);
    expect(
      a.locations.map(({ id, sites, yields, danger }) => ({ id, sites, yields, danger })),
    ).toEqual(
      legacy.locations.map(({ id, sites, yields, danger }) => ({ id, sites, yields, danger })),
    );
  }
});
it('has distinct names for the whole supported roster and matches recruitment previews without outcome RNG', () => {
  for (const factory of [createGame, createHollowmere]) {
    const game = factory(44);
    const names = new Set(game.initial.crew.map((member) => member.name));
    for (let serial = 0; serial < 997; serial++) {
      const offer = game.recruitment!.offers[serial % game.recruitment!.offers.length];
      const name = recruitName(offer, 44, serial);
      expect(names.has(name)).toBe(false);
      names.add(name);
    }
    let state = createState(game, 44);
    const offer = game.recruitment!.offers[0];
    const preview = recruitName(offer, state.seed, state.recruitSerial);
    const result = dispatch(game, state, { type: 'hire', id: offer.id });
    expect(result.error).toBeUndefined();
    expect(result.state.crew.at(-1)!.name).toBe(preview);
    expect(result.state.rng).toBe(state.rng);
    expect(decodeSave(encodeSave(result.state, 1000), factory).state).toEqual(result.state);
  }
});
it('restores original released saves with their original cast, future recruits, worlds and committed jobs', () => {
  for (const [id, factory] of [
    ['far-wake', createGame],
    ['hollowmere', createHollowmere],
  ] as const) {
    const raw = readFileSync(`tests/fixtures/${id}-generation1.json`, 'utf8');
    const original = JSON.parse(raw).state;
    const restored = decodeSave(raw, factory).state;
    expect(legacyState(restored)).toEqual(original);
    const game = factory(restored.seed, restored.generationVersion);
    expect(game.generationVersion).toBe(1);
    expect(game.locations[0].name).toBe(id === 'far-wake' ? 'Anchor Station' : 'Mournwatch');
    expect(game.factions[0].name).toBe(
      id === 'far-wake' ? 'Orison Combine' : 'The Lantern Wardens',
    );
    expect(restored.crew[0].name).toBe(id === 'far-wake' ? 'Mara Venn' : 'Bran Ash');
    const offer = game.recruitment!.offers[0];
    expect(recruitName(offer, restored.seed, restored.recruitSerial)).toBe(
      offer.names[(restored.seed + restored.recruitSerial) % offer.names.length],
    );
    expect(legacyState(restored).primary).toEqual(original.primary);
  }
});
it('refuses unknown generation versions without replacing them with the newest factory', () => {
  for (const factory of [createGame, createHollowmere]) {
    expect(() => factory(44, 999)).toThrow('Unsupported');
    const state = createState(factory(44), 44);
    state.generationVersion = 999;
    expect(() => decodeSave(encodeSave(state, 1000), factory)).toThrow('Unsupported');
  }
});
it('resolves authored directions and political options against generated names rather than old labels', () => {
  for (const factory of [createGame, createHollowmere]) {
    const game = factory(44);
    const first = game.missions[0];
    const target = game.locations.find((location) => location.id === first.objective.target)!;
    expect(first.description).toContain(target.name);
    expect(JSON.stringify(game)).not.toMatch(/\{(?:location|region|faction):/);
    expect(nameReferences(game, `{location:${target.id}}`)).toBe(target.name);
    expect(() => nameReferences(game, '{location:missing}')).toThrow('Unknown');
  }
  const game = createGame(44);
  const target = game.locations.find((location) => location.id === 'cinder')!;
  expect(guidance(game, createState(game, 44)).text).toContain(target.name);
  const claim = game.discoveryEvents!.entries.find((entry) => entry.kind === 'choice')!;
  if (claim.kind === 'choice') {
    expect(claim.choices[0].name).toContain(game.factions.find((f) => f.id === 'combine')!.name);
    expect(claim.choices[1].name).toContain(
      game.factions.find((f) => f.id === 'independent')!.name,
    );
  }
});

it('freezes the released generation-two vocabulary and algorithm for saved seeds', () => {
  const snapshots = JSON.parse(readFileSync('tests/fixtures/generated-names-v2.json', 'utf8'));
  for (const factory of [createGame, createHollowmere]) {
    const game = factory(1701, 2);
    const expected = snapshots[game.id];
    for (const key of ['regions', 'factions', 'locations'] as const)
      expect(game[key].map(({ id, name }) => ({ id, name }))).toEqual(expected[key]);
    expect(game.initial.crew.map(({ id, name }) => ({ id, name }))).toEqual(expected.crew);
    expect(
      game.recruitment!.offers.map((offer) => ({
        id: offer.id,
        names: Array.from({ length: 4 }, (_, i) => recruitName(offer, 1701, i)),
      })),
    ).toEqual(expected.recruits);
  }
});
