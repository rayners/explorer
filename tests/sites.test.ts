import { legacyState } from './legacy-state';
import { it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createGame } from '../src/game/definition';
import { createHollowmere } from '../src/fantasy/definition';
import { advance, createState, dispatch, cargo, activityDuration } from '../src/engine/simulation';
import { decodeSave, encodeSave, reconcile } from '../src/engine/save';
import { explorationPlan } from '../src/engine/sites';
import { generateSites } from '../src/engine/site-generation';
import { scienceFictionSites } from '../src/game/sites';
import type { GameDefinition, SiteDef } from '../src/engine/types';
function ready(game = createGame(7), location = 'morrow') {
  const state = createState(game, 7);
  state.location = location;
  if (!state.known.includes(location)) state.known.push(location);
  state.discoveries[location] = { surveyed: true, sites: [], dataSold: false };
  state.inventory = Object.fromEntries(
    game.resources.map((resource) => [resource.id, resource.mass === 0 ? 1000 : 8]),
  );
  return state;
}
function order(
  game: GameDefinition,
  state: ReturnType<typeof ready>,
  site: SiteDef,
  approach = 'direct',
) {
  return dispatch(game, state, {
    type: 'activity',
    id: game.rules.exploreActivity,
    site: site.id,
    approach,
  });
}
it('generates meaningful, deterministic, bounded site catalogs in both themes without altering old names or geography', () => {
  for (const factory of [createGame, createHollowmere])
    for (const seed of [1, 7, 44, 1701, 4294967295]) {
      const game = factory(seed, 3),
        old = factory(seed, 2);
      expect(game.generationVersion).toBe(3);
      expect(game).toEqual(factory(seed, 3));
      expect(game.sites).not.toEqual(factory(seed + (seed < 4294967295 ? 1 : -1), 3).sites);
      expect(game.locations.map((location) => location.name)).toEqual(
        old.locations.map((location) => location.name),
      );
      expect(game.routes).toEqual(old.routes);
      expect(game.sites!.length).toBe(
        game.locations.reduce((n, location) => n + location.sites.length, 0),
      );
      expect(new Set(game.sites!.map((site) => site.id)).size).toBe(game.sites!.length);
      const skills = new Set([
        ...game.initial.crew.map((member) => member.skill),
        ...game.recruitment!.offers.map((offer) => offer.skill),
      ]);
      for (const site of game.sites!) {
        const location = game.locations.find((location) => location.id === site.location)!;
        expect(location.sites).toContain(site.id);
        expect(site.approaches.map((entry) => entry.id)).toContain('direct');
        expect(site.approaches.map((entry) => entry.id)).toContain('cautious');
        expect(
          site.origin.id && site.condition.id && site.opportunity.id && site.complication.id,
        ).toBeTruthy();
        for (const approach of site.approaches) {
          expect(approach.seconds).toBeGreaterThan(0);
          expect(approach.seconds).toBeLessThanOrEqual(200);
          expect(approach.risk).toBeGreaterThanOrEqual(0);
          expect(approach.risk).toBeLessThanOrEqual(0.45);
          for (const [id, value] of Object.entries({ ...approach.cost, ...approach.reward })) {
            expect(game.resources.some((resource) => resource.id === id)).toBe(true);
            expect(Number.isInteger(value) && value >= 0).toBe(true);
          }
          for (const requirement of approach.requirements ?? [])
            expect(skills.has(requirement.skill)).toBe(true);
        }
        for (const [id, weight] of Object.entries(site.eventWeights ?? {})) {
          expect(game.discoveryEvents?.entries.some((event) => event.id === id)).toBe(true);
          expect(Number.isFinite(weight) && weight >= 0).toBe(true);
        }
      }
    }
});
it('site generation is independent of location ordering and protects introductory direct approaches', () => {
  const game = createGame(7, 2);
  const a = generateSites(7, 'test', game.locations, scienceFictionSites);
  const b = generateSites(7, 'test', [...game.locations].reverse(), scienceFictionSites);
  expect([...a].sort((a, b) => a.id.localeCompare(b.id))).toEqual(
    [...b].sort((a, b) => a.id.localeCompare(b.id)),
  );
  for (const site of a.filter((site) => site.location === 'cinder')) {
    expect(site.approaches[0].risk).toBe(0);
    expect(site.approaches[0].requirements).toBeUndefined();
    expect(site.approaches[0].cost).toEqual({ provisions: 2 });
  }
});
it('commits a selected site out of order, pays exact costs and grants its return once', () => {
  const game = createGame(7);
  game.discoveryEvents = undefined;
  const state = ready(game);
  const site = game.sites!.filter((site) => site.location === state.location)[2];
  const approach = site.approaches.find((entry) => entry.id === 'cautious')!;
  const original = structuredClone(state);
  const started = order(game, state, site, 'cautious');
  expect(started.error).toBeUndefined();
  expect(state).toEqual(original);
  expect(started.state.primary).toMatchObject({
    site: site.id,
    reward: approach.reward,
    risk: approach.risk,
    total: activityDuration(game, state, 'explore', site.id, 'cautious'),
  });
  for (const [id, n] of Object.entries(approach.cost))
    expect(started.state.inventory[id]).toBe(state.inventory[id] - n);
  const complete = advance(game, started.state, started.state.primary!.remaining);
  expect(complete.discoveries.morrow.sites).toEqual([site.id]);
  for (const [id, n] of Object.entries(approach.reward))
    expect(complete.inventory[id]).toBe(started.state.inventory[id] + n);
  expect(advance(game, complete, 100).inventory).toEqual(complete.inventory);
  const resolved = complete.encounter
    ? dispatch(game, complete, { type: 'encounter', choice: 'surrender' }).state
    : complete;
  expect(order(game, resolved, site).error).toContain('already');
});
it('provides cautious tradeoffs and useful specialist requirements while keeping direct exploration available', () => {
  for (const factory of [createGame, createHollowmere]) {
    const game = factory(7);
    const site = game.sites!.find((site) =>
      site.approaches.some((approach) => approach.id === 'specialist'),
    )!;
    const state = ready(game, site.location);
    const specialist = site.approaches.find((approach) => approach.id === 'specialist')!;
    const skill = specialist.requirements![0].skill;
    const blocked = structuredClone(state);
    blocked.crew
      .filter((member) => member.skill === skill)
      .forEach((member) => (member.assignment = 'rest'));
    expect(order(game, blocked, site, 'specialist').error).toContain(skill);
    // Direct exploration remains possible with a sufficient ordinary party.
    expect(order(game, state, site).error).toBeUndefined();
    const candidate = structuredClone(state);
    const member = candidate.crew.find((member) => member.skill === skill);
    if (member) member.assignment = 'primary';
    else {
      const offer = game.recruitment!.offers.find((offer) => offer.skill === skill)!;
      const hired = dispatch(game, candidate, { type: 'hire', id: offer.id });
      // Recruitment is hub-only: the failure must not change the field party.
      expect(hired.error).toContain('hub');
      candidate.crew.push({
        id: 'fixture',
        name: 'Specialist',
        skill,
        assignment: 'primary',
        injury: 0,
        life: 'alive',
      });
    }
    expect(order(game, candidate, site, 'specialist').error).toBeUndefined();
    const [direct, cautious] = site.approaches;
    expect(cautious.seconds).toBeGreaterThan(direct.seconds);
    expect(cautious.risk).toBeLessThanOrEqual(direct.risk);
    expect(specialist.seconds).toBeLessThan(direct.seconds);
  }
});
it('rejects foreign sites, invalid approaches, missing supplies and unavailable surveys without advancing RNG', () => {
  const game = createGame(7),
    state = ready(game);
  const site = game.sites!.find((site) => site.location === state.location)!;
  for (const command of [
    { type: 'activity' as const, id: 'explore', site: 'site:missing:0' },
    { type: 'activity' as const, id: 'explore', site: site.id, approach: 'missing' },
    { type: 'activity' as const, id: 'gather', site: site.id },
  ]) {
    const result = dispatch(game, state, command);
    expect(result.error).toBeTruthy();
    expect(result.state).toBe(state);
  }
  const noSurvey = structuredClone(state);
  noSurvey.discoveries.morrow.surveyed = false;
  expect(order(game, noSurvey, site).error).toContain('survey');
  const noSupplies = structuredClone(state);
  noSupplies.inventory.provisions = 0;
  expect(order(game, noSupplies, site).error).toContain('supplies');
  expect(explorationPlan(game, state)).toMatchObject({ site: { id: site.id } });
});
it('preserves the committed site choice across saves, staffing changes and offline completion', () => {
  const game = createGame(7);
  game.discoveryEvents = undefined;
  const site = game.sites!.find((site) => site.location === 'morrow')!;
  const state = ready(game);
  let started = order(game, state, site, 'cautious').state;
  started = advance(game, started, 10);
  const loaded = decodeSave(encodeSave(started, 1000), () => game);
  expect(loaded.state).toEqual(started);
  const changed = structuredClone(loaded.state);
  changed.crew[0].life = 'dead';
  const committed = structuredClone(changed.primary);
  const result = reconcile(game, { state: changed, savedAt: 1000 }, 201000).state;
  expect(result.discoveries.morrow.sites).toContain(committed!.site);
  expect(result.crew[0].life).toBe('dead');
  let frames = started;
  for (let i = 0; i < 200; i++) frames = advance(game, frames, 1);
  expect(reconcile(game, loaded, 201000).state).toEqual(frames);
  expect(cargo(game, result)).toBeLessThanOrEqual(result.capacity);
});
it('keeps released generation-two site lists and committed exploration outcomes byte-for-byte compatible', () => {
  const fixtures = JSON.parse(readFileSync('tests/fixtures/generation2-exploration.json', 'utf8'));
  for (const [id, factory] of [
    ['far-wake', createGame],
    ['hollowmere', createHollowmere],
  ] as const) {
    const fixture = fixtures[id];
    const loaded = decodeSave(JSON.stringify(fixture.save), factory);
    expect(legacyState(loaded.state)).toEqual(fixture.save.state);
    const game = factory(loaded.state.seed, loaded.state.generationVersion);
    expect(game.sites).toBeUndefined();
    expect(legacyState(advance(game, loaded.state, loaded.state.primary!.remaining))).toEqual(
      fixture.completed,
    );
    expect(factory(7, 1).sites).toBeUndefined();
  }
});
it('rejects invalid, unrelated and already-completed committed site references on import', () => {
  const game = createGame(7),
    state = ready(game);
  const site = game.sites!.find((site) => site.location === state.location)!;
  const started = order(game, state, site).state;
  for (const id of [undefined, 'missing', 'site:cinder:0']) {
    const invalid = structuredClone(started);
    invalid.primary!.site = id;
    expect(() => decodeSave(encodeSave(invalid, 1000), createGame)).toThrow('invalid');
  }
  const completed = structuredClone(started);
  completed.discoveries.morrow.sites.push(site.id);
  expect(() => decodeSave(encodeSave(completed, 1000), createGame)).toThrow('invalid');
});

it('site context changes discovery eligibility without spending additional gameplay randomness', () => {
  const game = createGame(7, 3),
    state = ready(game);
  const site = game.sites!.find((site) => site.location === 'morrow')!;
  site.approaches[0].risk = 0;
  site.eventWeights = { 'unseen-passenger': 0, 'settlement-claim': 2 };
  state.discoveries.cinder.sites = [
    ...game.locations.find((location) => location.id === 'cinder')!.sites,
  ];
  state.discoveries.cinder.surveyed = true;
  game.discoveryEvents!.chance = 1;
  const completed = advance(game, order(game, state, site).state, 200);
  expect(completed.incidents[0].id).toBe('settlement-claim');
  expect(completed.threat).toBeNull();
  site.eventWeights = { 'unseen-passenger': 0, 'settlement-claim': 0 };
  const quiet = advance(game, order(game, state, site).state, 200);
  expect(quiet.incidents).toEqual([]);
  expect(quiet.rng).toBe(state.rng);
});

it('freezes generation-three site identities, traits and approaches for existing saves', () => {
  const fixtures = JSON.parse(readFileSync('tests/fixtures/sites-v3.json', 'utf8'));
  for (const factory of [createGame, createHollowmere]) {
    const game = factory(1701, 3),
      fixture = fixtures[game.id];
    expect(game.sites!.length).toBe(fixture.count);
    expect(createHash('sha256').update(JSON.stringify(game.sites)).digest('hex')).toBe(
      fixture.sha256,
    );
  }
});
