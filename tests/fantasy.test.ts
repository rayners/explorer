import { it, expect } from 'vitest';
import { createHollowmere } from '../src/fantasy/definition';
import { createState, dispatch, advance, skillBonus } from '../src/engine/simulation';
import { decodeSave, encodeSave } from '../src/engine/save';
const game = createHollowmere(1701);
it('is an independent seeded game with a connected realm and valid content references', () => {
  expect(createHollowmere(1701)).toEqual(game);
  expect(createHollowmere(1702)).not.toEqual(game);
  const visited = new Set([game.initial.location]);
  for (let i = 0; i < game.locations.length; i++)
    for (const r of game.routes) {
      if (visited.has(r.from)) visited.add(r.to);
      if (visited.has(r.to)) visited.add(r.from);
    }
  expect(visited.size).toBe(9);
  for (const a of game.activities) {
    for (const id of Object.keys({ ...a.cost, ...a.reward }))
      expect(game.resources.some((r) => r.id === id)).toBe(true);
    for (const id of a.locations ?? []) expect(game.locations.some((l) => l.id === id)).toBe(true);
    if (a.threat) expect(game.threats!.some((t) => t.id === a.threat)).toBe(true);
  }
});
it('supports the full introductory oath, journey, mapping, and return using shared commands', () => {
  let state = createState(game, 1701);
  state = dispatch(game, state, { type: 'accept', id: 'first-road' }).state;
  state = dispatch(game, state, { type: 'travel', target: 'old-road' }).state;
  state = advance(game, state, 45);
  if (state.encounter)
    state = dispatch(game, state, { type: 'encounter', choice: 'surrender' }).state;
  state = dispatch(game, state, { type: 'activity', id: 'survey' }).state;
  state = advance(game, state, 45);
  if (state.encounter)
    state = dispatch(game, state, { type: 'encounter', choice: 'surrender' }).state;
  expect(state.known).toContain('ash-camp');
  expect(state.missions[0].progress).toBe(1);
  state = dispatch(game, state, { type: 'travel', target: 'mournwatch' }).state;
  state = advance(game, state, 45);
  if (state.encounter)
    state = dispatch(game, state, { type: 'encounter', choice: 'surrender' }).state;
  const claimed = dispatch(game, state, { type: 'claim', id: 'first-road' });
  expect(claimed.error).toBeUndefined();
  expect(claimed.state.missions[0].claimed).toBe(true);
  expect(decodeSave(encodeSave(claimed.state, 1000), createHollowmere).state).toEqual(
    claimed.state,
  );
});
it('party composition gates expeditions, wards and shrines, and clerics heal without resurrection', () => {
  let state = createState(game, 1701);
  state.location = 'old-road';
  state.discoveries['old-road'].surveyed = true;
  expect(dispatch(game, state, { type: 'activity', id: 'ritual' }).error).toBeUndefined();
  state = dispatch(game, state, { type: 'assign', member: 'ves', assignment: 'rest' }).state;
  expect(dispatch(game, state, { type: 'activity', id: 'ritual' }).error).toContain('mage');
  expect(dispatch(game, state, { type: 'activity', id: 'consecrate' }).error).toContain('cleric');
  state = dispatch(game, state, { type: 'assign', member: 'elin', assignment: 'primary' }).state;
  expect(dispatch(game, state, { type: 'activity', id: 'consecrate' }).error).toBeUndefined();
  state = dispatch(game, state, { type: 'assign', member: 'elin', assignment: 'support' }).state;
  state.crew[0].injury = 1;
  state.crew[1].life = 'dead';
  state = dispatch(game, state, { type: 'activity', id: 'triage' }).state;
  state = advance(game, state, 60);
  expect(state.crew[0].injury).toBe(0);
  expect(state.crew[1].life).toBe('dead');
  expect(skillBonus(game, state, 'mage', 'primary')).toBe(0);
});
it('rejects a different game save instead of converting or overwriting it', () => {
  const state = createState(game, 1701);
  expect(() => decodeSave(encodeSave(state, 1000), () => ({ ...game, id: 'other' }))).toThrow();
});
