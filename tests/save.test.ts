import { it, expect } from 'vitest';
import { createState, dispatch, advance } from '../src/engine/simulation';
import { createGame } from '../src/game/definition';
import { encodeSave, decodeSave, reconcile } from '../src/engine/save';
const g = createGame(7),
  s = createState(g, 7);
it('round trips a versioned save without changing state', () => {
  expect(decodeSave(encodeSave(s, 1000), createGame).state).toEqual(s);
});
it('rejects corruption, unsupported versions, invalid references and negative inventory', () => {
  expect(() => decodeSave('not a save', createGame)).toThrow();
  for (const changed of [
    { ...s, version: 999 },
    { ...s, location: 'missing' },
    { ...s, inventory: { ...s.inventory, fuel: -1 } },
    { ...s, known: ['missing'] },
    { ...s, primary: { kind: 'travel' } },
  ])
    expect(() => decodeSave(encodeSave(changed as typeof s, 1000), createGame)).toThrow();
  const edited = encodeSave(s, 1000).replace('320', '999');
  expect(() => decodeSave(edited, createGame)).toThrow();
});
it('reconciles once, caps absence, and never rewinds a wall timestamp', () => {
  const started = dispatch(g, s, { type: 'work' }).state;
  const loaded = decodeSave(encodeSave(started, 1000), createGame);
  const result = reconcile(g, loaded, 121000);
  expect(result.state).toEqual(advance(g, started, 120));
  expect(reconcile(g, result, 121000).state).toEqual(result.state);
  expect(reconcile(g, result, 1).savedAt).toBe(121000);
  expect(reconcile(g, loaded, 999999999).state.elapsed).toBe(86400);
});
it('keeps an existing interstellar voyage intact when region-wide travel is enabled', () => {
  const game = createGame(7);
  const previous = { ...game, rules: { ...game.rules, interregionalTravel: 'location' as const } };
  let state = createState(previous, 7);
  state.location = 'cinder';
  state.known.push('pale-0');
  state.discoveries['pale-0'] = { surveyed: true, sites: [], dataSold: false };
  state = dispatch(previous, state, { type: 'travel', target: 'pale-0' }).state;
  state = advance(previous, state, 200);
  const loaded = decodeSave(encodeSave(state, 1000), createGame);
  expect(loaded.state).toEqual(state);
  expect(loaded.state.primary?.remaining).toBe(700);
  const after = advance(game, loaded.state, 700);
  expect(after.location).toBe('pale-0');
  expect(after.inventory.fuel).toBe(state.inventory.fuel);
});
