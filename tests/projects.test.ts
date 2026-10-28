import { it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createGame } from '../src/game/definition';
import { createHollowmere } from '../src/fantasy/definition';
import { dispatch, advance } from '../src/engine/simulation';
import { decodeSave, encodeSave, validateState, reconcile } from '../src/engine/save';
import { missionDiscovered } from '../src/engine/missions';
import { generateProjects } from '../src/engine/project-generation';
import { scienceFictionProjects } from '../src/game/projects';
import { followUpBrief } from '../src/ui/mission-panels';
import type { GameState } from '../src/engine/types';
const fixtures = JSON.parse(
  readFileSync('tests/fixtures/generation5-before-projects.json', 'utf8'),
).fixtures;
// Released real incident records, reinterpreted only in a deliberately new generation for testing.
function setup(fixture: (typeof fixtures)[number]) {
  const factory = fixture.game === 'far-wake' ? createGame : createHollowmere;
  const game = factory(1701, 6);
  const state: GameState = decodeSave(fixture.raw, factory).state;
  state.generationVersion = 6;
  state.primary = null;
  const mission = game.missions.find(
    (mission) =>
      mission.discoveryChoice?.incident === fixture.incident &&
      mission.discoveryChoice?.choice === fixture.choice &&
      mission.sourceSite === state.incidents[0].site,
  )!;
  const work = game.activities.find((activity) => activity.mission === mission.id)!;
  return { game, state, mission, work, factory };
}
it('exposes exactly one project per actual settled incident, gated by exact response and source', () => {
  for (const fixture of fixtures) {
    const { game, state, mission, factory } = setup(fixture);
    expect(game).toEqual(factory(1701, 6));
    expect(validateState(state, game)).toBe(true);
    expect(
      game.missions.filter(
        (mission) => mission.discoveryChoice && missionDiscovered(game, state, mission),
      ),
    ).toEqual([mission]);
    for (const change of [
      'pending',
      'different-choice',
      'different-site',
      'different-location',
      'survey-only',
      'no-incident',
    ]) {
      const invalid = structuredClone(state);
      if (change === 'pending') invalid.incidents[0].choice = null;
      if (change === 'different-choice') invalid.incidents[0].choice = 'other';
      if (change === 'different-site')
        invalid.incidents[0].site = game.sites!.find((site) => site.id !== mission.sourceSite)!.id;
      if (change === 'different-location') invalid.incidents[0].location = game.initial.location;
      if (change === 'survey-only') invalid.discoveries[invalid.incidents[0].location].sites = [];
      if (change === 'no-incident') invalid.incidents = [];
      expect(missionDiscovered(game, invalid, mission)).toBe(false);
      const refused = dispatch(game, invalid, { type: 'accept', id: mission.id });
      expect(refused.error).toContain('matching discovery');
      expect(refused.state).toBe(invalid);
      invalid.missions.push({ id: mission.id, progress: 0, claimed: false });
      expect(validateState(invalid, game)).toBe(false);
    }
  }
});
it('runs every branch through paid specialist work, offline receipts and single hub filing', () => {
  for (const fixture of fixtures) {
    const { game, state, mission, work, factory } = setup(fixture);
    const inventory = structuredClone(state.inventory);
    expect(dispatch(game, state, { type: 'activity', id: work.id }).error).toBeTruthy();
    const accepted = dispatch(game, state, { type: 'accept', id: mission.id });
    expect(accepted.error).toBeUndefined();
    expect(accepted.state.inventory).toEqual(inventory);
    const field = accepted.state;
    field.location = mission.objective.target!;
    field.inventory = Object.fromEntries(
      game.resources.map((resource) => [resource.id, resource.mass ? 12 : 1000]),
    );
    // Prepare existing specialists, or an ordinary new recruit, for each optional branch.
    if (!field.crew.some((member) => member.skill === work.skill && member.life !== 'dead')) {
      field.location = game.initial.location;
      const offer = game.recruitment!.offers.find((offer) => offer.skill === work.skill)!;
      const hired = dispatch(game, field, { type: 'hire', id: offer.id });
      expect(hired.error).toBeUndefined();
      Object.assign(field, hired.state);
      field.location = mission.objective.target!;
    }
    for (const member of field.crew) if (member.skill === work.skill) member.assignment = 'primary';
    const absent = structuredClone(field);
    for (const member of absent.crew) if (member.skill === work.skill) member.assignment = 'rest';
    expect(dispatch(game, absent, { type: 'activity', id: work.id }).error).toContain(work.skill);
    const supplies = structuredClone(field.inventory);
    const start = dispatch(game, field, { type: 'activity', id: work.id });
    expect(start.error).toBeUndefined();
    for (const [resource, amount] of Object.entries(work.cost))
      expect(start.state.inventory[resource]).toBe(supplies[resource] - amount);
    expect(dispatch(game, start.state, { type: 'abandon', id: mission.id }).error).toContain(
      'committed',
    );
    const loaded = decodeSave(encodeSave(start.state, 1000), factory);
    const done = reconcile(game, loaded, 1000 + 200000).state;
    expect(done.missions.find((entry) => entry.id === mission.id)!.progress).toBe(1);
    expect(done.inventory).toEqual(start.state.inventory);
    expect(dispatch(game, done, { type: 'activity', id: work.id }).error).toContain('complete');
    expect(dispatch(game, done, { type: 'abandon', id: mission.id }).error).toContain('retained');
    expect(dispatch(game, done, { type: 'claim', id: mission.id }).error).toContain('hub');
    done.location = game.initial.location;
    const claimed = dispatch(game, done, { type: 'claim', id: mission.id });
    expect(claimed.error).toBeUndefined();
    for (const [resource, amount] of Object.entries(mission.reward))
      expect(claimed.state.inventory[resource]).toBe(done.inventory[resource] + amount);
    expect(claimed.state.reputation[mission.faction]).toBe(
      done.reputation[mission.faction] + mission.reputation,
    );
    expect(dispatch(game, claimed.state, { type: 'claim', id: mission.id }).error).toBeTruthy();
    expect(decodeSave(encodeSave(claimed.state, 2000), factory).state).toEqual(claimed.state);
    expect(followUpBrief(game, state, mission.id)).toContain('Patron standing on filing');
    expect(advance(game, claimed.state, 86400).inventory).toEqual(claimed.state.inventory);
  }
});
it('validates portable project references and different branch work without changing old catalogs', () => {
  for (const factory of [createGame, createHollowmere]) {
    const game = factory(7, 6),
      old = factory(7, 5);
    expect(game.locations).toEqual(old.locations);
    expect(game.routes).toEqual(old.routes);
    expect(game.sites).toEqual(old.sites);
    expect(game.missions.filter((mission) => !mission.discoveryChoice)).toEqual(old.missions);
    expect(new Set(game.missions.map((mission) => mission.id)).size).toBe(game.missions.length);
    for (const mission of game.missions.filter((mission) => mission.discoveryChoice)) {
      const work = game.activities.find((activity) => activity.mission === mission.id)!;
      expect(work.reward).toEqual({});
      expect(game.factions.some((faction) => faction.id === mission.faction)).toBe(true);
      expect(work.requirements).toEqual([{ skill: work.skill, count: 1 }]);
      for (const id of Object.keys({ ...work.cost, ...mission.reward }))
        expect(game.resources.some((resource) => resource.id === id)).toBe(true);
      expect(work.locations).toEqual([mission.objective.target]);
    }
  }
  const portable = createGame(7, 5);
  portable.id = 'unrelated-theme';
  expect(generateProjects(portable, scienceFictionProjects).missions.length).toBeGreaterThan(0);
  expect(() =>
    generateProjects(portable, [{ ...scienceFictionProjects[0], choice: 'missing' }]),
  ).toThrow();
});
it('retains contract limits, standing refusal and unstarted release for projects', () => {
  const { game, state, mission } = setup(fixtures[0]);
  const full = structuredClone(state);
  full.missions = game.missions
    .filter((entry) => !entry.sourceSite && !entry.requires)
    .slice(0, 3)
    .map((entry) => ({ id: entry.id, progress: 0, claimed: false }));
  expect(dispatch(game, full, { type: 'accept', id: mission.id }).error).toContain('three');
  const hostile = structuredClone(state);
  hostile.reputation[mission.faction] = -41;
  expect(dispatch(game, hostile, { type: 'accept', id: mission.id }).error).toContain('standing');
  const accepted = dispatch(game, state, { type: 'accept', id: mission.id }).state;
  expect(dispatch(game, accepted, { type: 'abandon', id: mission.id }).error).toBeUndefined();
});
