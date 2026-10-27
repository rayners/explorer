import { it, expect } from 'vitest';
import { createGame } from '../src/game/definition';
import { createState, dispatch, skillBonus } from '../src/engine/simulation';
import { living, crewCapacity } from '../src/engine/personnel';
it('recruits a specialist at a hub, respects berths, and expands capacity with upgrades', () => {
  const game = createGame(1701);
  let state = createState(game, 1701);
  state.inventory.credits = 2000;
  expect(crewCapacity(game, state)).toBe(4);
  const hired = dispatch(game, state, { type: 'hire', id: 'medic' });
  expect(hired.error).toBeUndefined();
  state = hired.state;
  expect(living(state)).toHaveLength(4);
  expect(state.crew.at(-1)?.skill).toBe('medical');
  expect(state.crew.at(-1)?.assignment).toBe('rest');
  expect(dispatch(game, state, { type: 'hire', id: 'engineer' }).error).toContain('accommodation');
  state = dispatch(game, state, { type: 'upgrade', id: 'berths' }).state;
  expect(crewCapacity(game, state)).toBe(6);
  expect(dispatch(game, state, { type: 'hire', id: 'engineer' }).error).toBeUndefined();
});
it('excludes casualties from skills and berths and prevents assigning them to work', () => {
  const game = createGame(1701),
    state = createState(game, 1701);
  const before = skillBonus(game, state, 'security', 'primary');
  state.crew.find((c) => c.skill === 'security')!.life = 'dead';
  expect(skillBonus(game, state, 'security', 'primary')).toBeLessThan(before);
  expect(living(state)).toHaveLength(2);
  expect(
    dispatch(game, state, { type: 'assign', member: 'ada', assignment: 'support' }).error,
  ).toBeTruthy();
});
it('offers an emergency hand when nobody survives, even without funds', () => {
  const game = createGame(1701);
  let state = createState(game, 1701);
  state.crew.forEach((m) => (m.life = 'dead'));
  state.inventory.credits = 0;
  const result = dispatch(game, state, { type: 'hire', id: 'relief-hand' });
  expect(result.error).toBeUndefined();
  state = result.state;
  expect(living(state)).toHaveLength(1);
  expect(dispatch(game, state, { type: 'hire', id: 'relief-hand' }).error).toBeTruthy();
});
