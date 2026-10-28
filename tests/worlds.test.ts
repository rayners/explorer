import { it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createGame } from '../src/game/definition';
import { createHollowmere } from '../src/fantasy/definition';
import { createState, dispatch, advance } from '../src/engine/simulation';
import { planRoute, routesAt } from '../src/engine/navigation';
import { decodeSave, encodeSave, reconcile } from '../src/engine/save';
import { simulateWorld } from '../scripts/simulate-world';
import { generateWorld } from '../src/engine/world-generation';
import { scienceFictionWorld } from '../src/game/world';

it('preserves complete released generation 1–3 definitions and freezes generation-4 catalogs across seeds and themes', () => {
  const fixtures = ['worlds-legacy.json', 'worlds-v4.json'].flatMap((file) =>
    JSON.parse(readFileSync(`tests/fixtures/${file}`, 'utf8')),
  );
  for (const fixture of fixtures) {
    const game = (fixture.game === 'far-wake' ? createGame : createHollowmere)(
      fixture.seed,
      fixture.generation,
    );
    expect(createHash('sha256').update(JSON.stringify(game)).digest('hex')).toBe(fixture.sha256);
  }
});
it('generates varied, deterministic, connected worlds with local hubs, bounded routes and valid content', () => {
  for (const factory of [createGame, createHollowmere]) {
    const signatures = new Set<string>(),
      counts = new Set<number>();
    for (let seed = 0; seed < 100; seed++) {
      const game = factory(seed);
      expect(game.generationVersion).toBe(4);
      expect(game).toEqual(factory(seed));
      signatures.add(JSON.stringify(game.routes));
      counts.add(game.locations.length);
      expect(game.regions.length).toBeGreaterThanOrEqual(factory(seed, 3).regions.length);
      expect(game.regions.length).toBeLessThanOrEqual(6);
      expect(new Set(game.locations.map((l) => l.id)).size).toBe(game.locations.length);
      const state = createState(game, seed);
      state.known = game.locations.map((l) => l.id);
      for (const region of game.regions) {
        const local = game.locations.filter((l) => l.region === region.id);
        const hub = local.find((l) => l.station)!;
        expect(hub).toBeTruthy();
        const reachable = new Set([hub.id]);
        for (let i = 0; i < local.length; i++)
          for (const route of game.routes.filter((r) => !r.interregional)) {
            if (reachable.has(route.from)) reachable.add(route.to);
            if (reachable.has(route.to)) reachable.add(route.from);
          }
        expect(local.every((l) => reachable.has(l.id))).toBe(true);
        expect(region.x).toBeGreaterThanOrEqual(20);
        expect(region.x).toBeLessThanOrEqual(80);
        expect(region.y).toBeGreaterThanOrEqual(20);
        expect(region.y).toBeLessThanOrEqual(80);
      }
      for (const location of game.locations) {
        if (location.id !== state.location)
          expect(planRoute(game, state, location.id).length).toBeGreaterThan(0);
        expect(location.name.length).toBeGreaterThan(0);
        expect(location.description).not.toMatch(/\{(?:location|region|faction):/);
        if (!location.station) expect(location.sites.length).toBe(3);
      }
      for (const route of game.routes) {
        expect(route.seconds).toBeGreaterThan(0);
        expect(route.seconds).toBeLessThanOrEqual(game.id === 'far-wake' ? 1500 : 240);
        expect(route.days).toBeGreaterThan(0);
        expect(route.risk).toBeGreaterThanOrEqual(0);
        expect(route.risk).toBeLessThanOrEqual(0.15);
        for (const [id, n] of Object.entries(route.cost)) {
          expect(game.resources.some((r) => r.id === id)).toBe(true);
          expect(n).toBeGreaterThanOrEqual(0);
        }
      }
      expect(game.missions.filter((m) => m.sourceSite)).toHaveLength(game.sites!.length);
      for (const location of game.locations.filter(
        (l) => l.id.includes('generated') && !l.station,
      )) {
        const site = game.sites!.find((s) => s.location === location.id)!;
        expect(site).toBeTruthy();
        expect(game.missions.some((m) => m.sourceSite === site.id)).toBe(true);
        for (const event of game.discoveryEvents?.entries ?? [])
          expect(event.locations).toContain(location.id);
      }
    }
    expect(signatures.size).toBe(100);
    expect(counts.size).toBeGreaterThan(4);
  }
});
it('retains the introductory route and outbound connection, plus setting-specific departure policies', () => {
  for (const factory of [createGame, createHollowmere])
    for (const seed of [0, 1, 7, 44, 1701, 4294967295]) {
      const game = factory(seed),
        old = factory(seed, 3);
      const intro = game.id === 'far-wake' ? 'cinder' : 'old-road';
      const outbound = game.id === 'far-wake' ? 'pale-0' : 'ash-camp';
      for (const [from, to] of [
        [game.initial.location, intro],
        [intro, outbound],
      ])
        expect(game.routes.find((r) => r.from === from && r.to === to)).toEqual(
          old.routes.find((r) => r.from === from && r.to === to),
        );
      const state = createState(game, seed);
      const first = dispatch(game, state, { type: 'travel', target: intro });
      expect(first.error).toBeUndefined();
      let arrived = advance(game, first.state, 120);
      if (arrived.encounter)
        arrived = dispatch(game, arrived, { type: 'encounter', choice: 'surrender' }).state;
      arrived = advance(
        game,
        dispatch(game, arrived, { type: 'activity', id: game.rules.surveyActivity }).state,
        120,
      );
      expect(arrived.known).toContain(outbound);
      const homeRoutes = routesAt(game, game.initial.location).map((r) => r.to);
      expect(homeRoutes.includes(outbound)).toBe(game.id === 'far-wake');
    }
});
it('world assembly preserves its inputs and has no shared mutable results', () => {
  const game = createGame(44, 3),
    before = structuredClone(game);
  const world = generateWorld(44, 'test', game, scienceFictionWorld);
  expect(game).toEqual(before);
  world.locations[0].description = 'changed';
  world.routes[0].cost.fuel = 999;
  expect(game).toEqual(before);
});
it('reconstructs optional places and committed journeys through save/import and offline catch-up exactly once', () => {
  for (const factory of [createGame, createHollowmere]) {
    const game = factory(1);
    let state = createState(game, 1);
    const added = game.locations.find((l) => l.id.includes('generated') && !l.station)!;
    const edge = game.routes.find(
      (r) => !r.interregional && (r.from === added.id || r.to === added.id),
    )!;
    state.location = edge.from === added.id ? edge.to : edge.from;
    state.known = game.locations.map((l) => l.id);
    state.discoveries = Object.fromEntries(
      game.locations.map((l) => [l.id, { surveyed: l.station, sites: [], dataSold: false }]),
    );
    state.rng = 1;
    const start = dispatch(game, state, { type: 'travel', target: added.id });
    expect(start.error).toBeUndefined();
    const raw = encodeSave(start.state, 1000),
      loaded = decodeSave(raw, factory);
    const restored = factory(loaded.state.seed, loaded.state.generationVersion);
    expect(restored).toEqual(game);
    const checkpoint = reconcile(restored, loaded, 121000);
    let once = checkpoint.state;
    expect(once.location).toBe(added.id);
    expect(once).toEqual(advance(game, start.state, 120));
    expect(reconcile(restored, checkpoint, 121000).state).toEqual(once);
    if (once.encounter)
      once = dispatch(game, once, { type: 'encounter', choice: 'surrender' }).state;
    const survey = dispatch(restored, once, { type: 'activity', id: game.rules.surveyActivity });
    expect(survey.error).toBeUndefined();
    const ready = advance(restored, survey.state, 120);
    const explore = dispatch(restored, ready, { type: 'activity', id: game.rules.exploreActivity });
    expect(explore.error).toBeUndefined();
    const loadedSite = decodeSave(encodeSave(explore.state, 121000), factory);
    expect(advance(game, loadedSite.state, 200).discoveries[added.id].sites).toEqual([
      explore.state.primary!.site,
    ]);
    const stranded = {
      ...ready,
      inventory: Object.fromEntries(game.resources.map((r) => [r.id, 0])),
    };
    const rescue = dispatch(game, stranded, { type: 'rescue' });
    expect(rescue.error).toBeUndefined();
    expect(game.locations.find((l) => l.id === rescue.state.primary!.target)!.station).toBe(true);
    expect(game.locations.find((l) => l.id === rescue.state.primary!.target)!.region).toBe(
      added.region,
    );
  }
});
it('explores complete generated campaigns with real surveys, supplies and service hubs in both themes', () => {
  for (const factory of [createGame, createHollowmere])
    for (const seed of [1701, 1, 7, 44, 91, 812, 2026, 4294967295]) {
      const result = simulateWorld(seed, factory);
      expect(result.surveyed).toBe(result.fields);
      expect(result.integrity).toBeGreaterThan(0);
      expect(result.minutes).toBeLessThan(result.fields * 18 + 30);
      expect(result.milestoneMinutes).toBeGreaterThan(0);
      expect(result.milestoneMinutes).toBeLessThan(200);
      if (result.fields >= 10) expect(result.firstTenMinutes).toBeLessThan(200);
    }
});
