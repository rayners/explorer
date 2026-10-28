import { it, expect } from 'vitest';
import { createGame } from '../src/game/definition';
import { createState, dispatch, advance } from '../src/engine/simulation';
import { decodeSave, encodeSave } from '../src/engine/save';
const game = createGame(1701);
function alerted() {
  const state = createState(game, 1701);
  state.threat = { id: 'stowaway', stage: 'suspected' as const, pressure: 0, signs: 2 };
  state.threatHistory = ['stowaway'];
  return state;
}
it('never resolves a threat response or kills crew through offline catch-up', () => {
  const state = alerted();
  expect(advance(game, state, 86400)).toEqual(state);
  expect(dispatch(game, state, { type: 'travel', target: 'cinder' }).error).toContain('threat');
});
it('offers a guaranteed purge even with no supplies or surviving crew', () => {
  const state = alerted();
  state.crew.forEach((m) => (m.life = 'dead'));
  Object.keys(state.inventory).forEach((id) => (state.inventory[id] = 0));
  const result = dispatch(game, state, { type: 'threat', action: 'purge' });
  expect(result.error).toBeUndefined();
  expect(result.state.threat).toBeNull();
});
it('a hidden exposure becomes an alert through activities, not unattended attacks', () => {
  let state = createState(game, 1701);
  state.location = 'morrow';
  state.known.push('morrow');
  state.discoveries.morrow = { surveyed: true, sites: [], dataSold: false };
  state = dispatch(game, state, { type: 'activity', id: 'specimen' }).state;
  state = advance(game, state, 100);
  expect(state.threat?.stage).toBe('hidden');
  if (state.encounter)
    state = dispatch(game, state, { type: 'encounter', choice: 'surrender' }).state;
  for (let i = 0; i < 2; i++) {
    state = dispatch(game, state, { type: 'activity', id: 'gather' }).state;
    state = advance(game, state, 100);
    if (state.encounter)
      state = dispatch(game, state, { type: 'encounter', choice: 'surrender' }).state;
  }
  expect(state.threat?.stage).toBe('suspected');
  expect(state.crew.every((m) => m.life === 'alive')).toBe(true);
  expect(decodeSave(encodeSave(state, 1000), createGame).state).toEqual(state);
});
it('explicit failed responses can cause a permanent loss, while medical support can save lives', () => {
  let deaths = 0,
    saved = 0;
  for (let seed = 1; seed <= 100; seed++) {
    const state = alerted();
    state.rng = seed;
    state.threat!.pressure = 1;
    const result = dispatch(game, state, { type: 'threat', action: 'search' }).state;
    if (result.crew.some((m) => m.life === 'dead')) deaths++;
    const medic = {
      ...state,
      crew: [
        ...state.crew,
        {
          id: 'test',
          name: 'Medic',
          skill: 'medical',
          assignment: 'support' as const,
          injury: 0,
          life: 'alive' as const,
        },
      ],
    };
    const treated = dispatch(game, medic, { type: 'threat', action: 'search' }).state;
    if (treated.events.some((e) => e.key === 'threatRescued')) saved++;
  }
  expect(deaths).toBeGreaterThan(0);
  expect(saved).toBeGreaterThan(0);
});
it('migrates a real version-one envelope without losing progress or crew', () => {
  const state = createState(game, 1701);
  const legacy = structuredClone(state) as any;
  legacy.version = 1;
  delete legacy.incidents;
  delete legacy.discoveryCooldown;
  delete legacy.recruitSerial;
  delete legacy.threat;
  delete legacy.threatHistory;
  legacy.crew.forEach((m: any) => delete m.life);
  const loaded = decodeSave(encodeSave(legacy, 1000), createGame);
  expect(loaded.state.version).toBe(5);
  expect(loaded.state.inventory).toEqual(state.inventory);
  expect(loaded.state.crew).toEqual(state.crew);
});
it('containment permits normal operations, and locating is required for confrontation', () => {
  const state = alerted();
  expect(dispatch(game, state, { type: 'threat', action: 'confront' }).error).toContain('Locate');
  let contained = false;
  for (let seed = 1; seed <= 30; seed++) {
    const candidate = { ...state, rng: seed };
    const result = dispatch(game, candidate, { type: 'threat', action: 'contain' }).state;
    if (result.threat?.stage === 'contained') {
      contained = true;
      expect(dispatch(game, result, { type: 'work' }).error).toBeUndefined();
      expect(dispatch(game, result, { type: 'threat', action: 'search' }).error).toContain(
        'already located',
      );
      break;
    }
  }
  expect(contained).toBe(true);
});
it('can resolve an external encounter when an internal alert is also pending', () => {
  const state = alerted();
  state.encounter = { id: 'external', source: 'pirates', strength: 1 };
  const result = dispatch(game, state, { type: 'encounter', choice: 'surrender' });
  expect(result.error).toBeUndefined();
  expect(result.state.encounter).toBeNull();
  expect(result.state.threat?.stage).toBe('suspected');
  expect(dispatch(game, result.state, { type: 'threat', action: 'purge' }).error).toBeUndefined();
});
it('lets a resolved one-time incident satisfy a contract accepted afterward', () => {
  let state = alerted();
  state = dispatch(game, state, { type: 'threat', action: 'purge' }).state;
  const result = dispatch(game, state, { type: 'accept', id: 'unmanifested' });
  expect(result.error).toBeUndefined();
  expect(result.state.missions.find((m) => m.id === 'unmanifested')?.progress).toBe(1);
  const unresolved = dispatch(game, alerted(), { type: 'accept', id: 'unmanifested' });
  expect(unresolved.error).toContain('threat');
  const hidden = alerted();
  hidden.threat!.stage = 'hidden';
  expect(
    dispatch(game, hidden, { type: 'accept', id: 'unmanifested' }).state.missions.find(
      (m) => m.id === 'unmanifested',
    )?.progress,
  ).toBe(0);
});
it('preserves a committed journey after the last companion is lost instead of teleporting home', () => {
  let state = createState(game, 1701);
  state = dispatch(game, state, { type: 'travel', target: 'cinder' }).state;
  state.crew.slice(1).forEach((m) => (m.life = 'dead'));
  state.threat = { id: 'stowaway', stage: 'suspected', pressure: 1, signs: 2 };
  state.threatHistory = ['stowaway'];
  state.rng = 1;
  state = dispatch(game, state, { type: 'threat', action: 'search' }).state;
  expect(state.crew.every((m) => m.life === 'dead')).toBe(true);
  expect(state.primary?.kind).toBe('travel');
  expect(state.primary?.target).toBe('cinder');
  state = dispatch(game, state, { type: 'threat', action: 'purge' }).state;
  state = advance(game, state, 60);
  expect(state.location).toBe('cinder');
});
