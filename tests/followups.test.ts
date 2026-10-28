import { legacyState } from './legacy-state';
import { it, expect } from 'vitest';
import { createGame } from '../src/game/definition';
import { createHollowmere } from '../src/fantasy/definition';
import { advance, createState, dispatch } from '../src/engine/simulation';
import { decodeSave, encodeSave, reconcile } from '../src/engine/save';
import { missionDiscovered } from '../src/engine/missions';
import type { GameDefinition } from '../src/engine/types';
function setup(factory = createGame) {
  const game = factory(7),
    state = createState(game, 7);
  game.locations.forEach((location) => (location.danger = 0));
  const location = game.id === 'far-wake' ? 'cinder' : 'old-road';
  state.location = location;
  state.discoveries[location].surveyed = true;
  const site = game.sites!.find((site) => site.location === location)!;
  const mission = game.missions.find((mission) => mission.sourceSite === site.id)!;
  const work = game.activities.find((activity) => activity.mission === mission.id)!;
  const explored = advance(
    game,
    dispatch(game, state, { type: 'activity', id: 'explore', site: site.id }).state,
    200,
  );
  explored.location = game.initial.location;
  return { game, state, explored, site, mission, work, location };
}
function accepted(factory = createGame) {
  const data = setup(factory);
  const result = dispatch(data.game, data.explored, { type: 'accept', id: data.mission.id });
  expect(result.error).toBeUndefined();
  return { ...data, started: result.state };
}
it('derives valid, contextual follow-ups and work definitions for both site catalogs without changing old generations', () => {
  for (const factory of [createGame, createHollowmere]) {
    const game = factory(7),
      another = factory(7);
    expect(game).toEqual(another);
    expect(game.missions.filter((mission) => mission.sourceSite)).toHaveLength(game.sites!.length);
    expect(new Set(game.missions.map((mission) => mission.id)).size).toBe(game.missions.length);
    expect(new Set(game.activities.map((activity) => activity.id)).size).toBe(
      game.activities.length,
    );
    const kinds = new Set<string>();
    for (const site of game.sites!) {
      const mission = game.missions.find((mission) => mission.sourceSite === site.id)!;
      const work = game.activities.find((activity) => activity.mission === mission.id)!;
      const source = game.locations.find((location) => location.id === site.location)!;
      kinds.add(mission.id.split(':').at(-1)!);
      expect(mission.description).toContain(site.name);
      expect(mission.description).toContain(source.name);
      expect(mission.description).toContain(
        game.factions.find((faction) => faction.id === mission.faction)!.name,
      );
      expect(mission.objective).toEqual({ kind: work.id, target: source.id, count: 1 });
      expect(work.locations).toEqual([source.id]);
      expect(work.reward).toEqual({});
      for (const [id, amount] of Object.entries({ ...work.cost, ...mission.reward })) {
        expect(game.resources.some((resource) => resource.id === id)).toBe(true);
        expect(Number.isInteger(amount) && amount >= 0).toBe(true);
      }
      for (const requirement of work.requirements ?? [])
        expect([
          ...game.initial.crew.map((member) => member.skill),
          ...game.recruitment!.offers.map((offer) => offer.skill),
        ]).toContain(requirement.skill);
    }
    expect(kinds.size).toBeGreaterThan(2);
    for (const generation of [1, 2]) {
      expect(factory(7, generation).missions.some((mission) => mission.sourceSite)).toBe(false);
      expect(factory(7, generation).activities.some((activity) => activity.mission)).toBe(false);
    }
  }
});
it('hides undiscovered follow-ups and requires actual exploration, not just a survey', () => {
  for (const factory of [createGame, createHollowmere]) {
    const { game, state, explored, mission } = setup(factory);
    expect(missionDiscovered(game, state, mission)).toBe(false);
    state.location = game.initial.location;
    const rejected = dispatch(game, state, { type: 'accept', id: mission.id });
    expect(rejected.error).toContain('source site');
    expect(rejected.state).toBe(state);
    expect(missionDiscovered(game, explored, mission)).toBe(true);
  }
});
it('requires hub acceptance, correct destination and role, and never lets field work start without its contract', () => {
  const { game, state, work, mission, explored } = setup();
  expect(dispatch(game, state, { type: 'activity', id: work.id }).error).toContain('Accept');
  const atSite = { ...explored, location: state.location };
  expect(dispatch(game, atSite, { type: 'accept', id: mission.id }).error).toContain('hub');
  const taken = dispatch(game, explored, { type: 'accept', id: mission.id }).state;
  expect(dispatch(game, taken, { type: 'activity', id: work.id }).error).toContain('destination');
  taken.location = state.location;
  expect(dispatch(game, taken, { type: 'activity', id: work.id }).error).toBeUndefined();
  const specialtyMission = game.missions.find(
    (mission) =>
      mission.sourceSite &&
      game.activities.find((activity) => activity.mission === mission.id)?.requirements?.length,
  )!;
  const specialtyWork = game.activities.find(
    (activity) => activity.mission === specialtyMission.id,
  )!;
  const site = game.sites!.find((site) => site.id === specialtyMission.sourceSite)!;
  taken.known.push(site.location);
  taken.discoveries[site.location] = { surveyed: true, sites: [site.id], dataSold: false };
  taken.location = game.initial.location;
  const specialistTaken = dispatch(game, taken, { type: 'accept', id: specialtyMission.id }).state;
  specialistTaken.location = site.location;
  specialistTaken.crew.forEach((member) => {
    if (member.skill === specialtyWork.requirements![0].skill) member.assignment = 'rest';
  });
  expect(
    dispatch(game, specialistTaken, { type: 'activity', id: specialtyWork.id }).error,
  ).toContain('specialist');
});
it('retains active-contract and faction restrictions for generated work', () => {
  const { game, explored, mission } = setup();
  for (const def of game.missions.filter((mission) => !mission.sourceSite).slice(0, 3))
    explored.missions.push({ id: def.id, progress: 0, claimed: false });
  expect(dispatch(game, explored, { type: 'accept', id: mission.id }).error).toContain('three');
  explored.missions = [];
  explored.reputation[mission.faction] = -41;
  expect(dispatch(game, explored, { type: 'accept', id: mission.id }).error).toContain('standing');
});
it('pays work costs on dispatch and pays the mission only once after hub filing in both themes', () => {
  for (const factory of [createGame, createHollowmere]) {
    const { game, started, mission, work, location } = accepted(factory);
    started.location = location;
    const begin = dispatch(game, started, { type: 'activity', id: work.id });
    expect(begin.error).toBeUndefined();
    for (const [id, amount] of Object.entries(work.cost))
      expect(begin.state.inventory[id]).toBe(started.inventory[id] - amount);
    expect(begin.state.missions.find((state) => state.id === mission.id)!.progress).toBe(0);
    const done = advance(game, begin.state, 200);
    expect(done.inventory).toEqual(begin.state.inventory);
    expect(done.missions.find((state) => state.id === mission.id)!.progress).toBe(1);
    expect(dispatch(game, done, { type: 'claim', id: mission.id }).error).toContain('hub');
    expect(dispatch(game, done, { type: 'activity', id: work.id }).error).toContain('complete');
    done.location = game.initial.location;
    const filed = dispatch(game, done, { type: 'claim', id: mission.id });
    expect(filed.error).toBeUndefined();
    for (const [id, amount] of Object.entries(mission.reward))
      expect(filed.state.inventory[id]).toBe(done.inventory[id] + amount);
    expect(filed.state.reputation[mission.faction]).toBe(mission.reputation);
    expect(dispatch(game, filed.state, { type: 'claim', id: mission.id }).error).toBeTruthy();
    expect(dispatch(game, filed.state, { type: 'accept', id: mission.id }).error).toBeTruthy();
    expect(dispatch(game, filed.state, { type: 'activity', id: work.id }).error).toContain(
      'complete',
    );
    expect(decodeSave(encodeSave(filed.state, 1000), () => game).state).toEqual(filed.state);
  }
});
it('does not allow abandonment to erase committed or completed work and farm its reward', () => {
  const { game, started, mission, work, location } = accepted();
  const abandoned = dispatch(game, started, { type: 'abandon', id: mission.id });
  expect(abandoned.error).toBeUndefined();
  expect(dispatch(game, abandoned.state, { type: 'activity', id: work.id }).error).toContain(
    'Accept',
  );
  const retaken = dispatch(game, abandoned.state, { type: 'accept', id: mission.id }).state;
  retaken.location = location;
  const begin = dispatch(game, retaken, { type: 'activity', id: work.id }).state;
  expect(dispatch(game, begin, { type: 'abandon', id: mission.id }).error).toContain('committed');
  const done = advance(game, begin, 200);
  expect(dispatch(game, done, { type: 'abandon', id: mission.id }).error).toContain('retained');
  expect(dispatch(game, done, { type: 'activity', id: work.id }).error).toContain('complete');
});
it('saves committed work and completes it once through offline reconciliation without victory credit', () => {
  const { game, started, mission, work, location } = accepted();
  started.location = location;
  started.missions.push({ id: 'security', progress: 0, claimed: false });
  const begin = dispatch(game, started, { type: 'activity', id: work.id }).state;
  const loaded = decodeSave(encodeSave(begin, 1000), () => game);
  expect(loaded.state).toEqual(begin);
  const result = reconcile(game, loaded, 201000);
  expect(result.state.missions.find((entry) => entry.id === mission.id)!.progress).toBe(1);
  expect(result.state.missions.find((entry) => entry.id === 'security')!.progress).toBe(0);
  expect(reconcile(game, result, 401000).state.inventory).toEqual(result.state.inventory);
  expect(result.state.discoveries[location].sites).toEqual(started.discoveries[location].sites);
});
it('rejects pending work with missing contracts and contracts with undiscovered source sites on import', () => {
  const { game, started, mission, work, location } = accepted();
  started.location = location;
  const begin = dispatch(game, started, { type: 'activity', id: work.id }).state;
  for (const change of [
    { missions: [] },
    { missions: null },
    { primary: { ...begin.primary, target: game.initial.location } },
    { missions: [{ id: mission.id, progress: 1, claimed: false }] },
    { missions: [{ id: mission.id, progress: 0, claimed: true }] },
    {
      discoveries: {
        ...begin.discoveries,
        [location]: { surveyed: true, sites: [], dataSold: false },
      },
    },
  ])
    expect(() => decodeSave(encodeSave({ ...begin, ...change } as any, 1000), () => game)).toThrow(
      'invalid',
    );
});

it('adds follow-ups to released generation-three expeditions without replacing their sites or paid orders', async () => {
  const { readFileSync } = await import('node:fs');
  const fixtures = JSON.parse(
    readFileSync('tests/fixtures/generation3-before-followups.json', 'utf8'),
  );
  for (const factory of [createGame, createHollowmere]) {
    const sample = factory(7),
      fixture = fixtures[sample.id];
    const restored = decodeSave(JSON.stringify(fixture.save), factory);
    expect(legacyState(restored.state)).toEqual(fixture.save.state);
    const result = advance(sample, restored.state, 200);
    expect(legacyState(result)).toEqual(fixture.completed);
    const offer = sample.missions.find(
      (mission) => mission.sourceSite === restored.state.primary!.site,
    )!;
    expect(missionDiscovered(sample, result, offer)).toBe(true);
  }
});

it('freezes the additive generation-three follow-up identities and paid work contracts', async () => {
  const { readFileSync } = await import('node:fs');
  const { createHash } = await import('node:crypto');
  const fixtures = JSON.parse(readFileSync('tests/fixtures/followups-v1.json', 'utf8'));
  for (const factory of [createGame, createHollowmere]) {
    const game = factory(1701, 3),
      fixture = fixtures[game.id];
    const catalog = {
      missions: game.missions.filter((mission) => mission.sourceSite),
      activities: game.activities.filter((activity) => activity.mission),
    };
    expect(catalog.missions.length).toBe(fixture.count);
    expect(createHash('sha256').update(JSON.stringify(catalog)).digest('hex')).toBe(fixture.sha256);
  }
});
