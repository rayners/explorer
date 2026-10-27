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
