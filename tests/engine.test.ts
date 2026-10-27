import { describe, expect, it } from 'vitest';
import type { GameState } from '../src/engine/types';
import { createState, dispatch, advance, view } from '../src/engine/simulation';
import { createGame } from '../src/game/definition';
const game = createGame(812);
describe('an expedition that survives closing the browser', () => {
  it('starts with an affordable journey and rejects unknown destinations', () => {
    const s = createState(game, 812);
    expect(view(game, s).location.id).toBe('anchor');
    expect(dispatch(game, s, { type: 'travel', target: 'missing' }).error).toBeTruthy();
    const result = dispatch(game, s, { type: 'travel', target: 'cinder' });
    expect(result.error).toBeUndefined();
    expect(result.state.primary?.kind).toBe('travel');
    expect(result.state.inventory.fuel).toBeLessThan(s.inventory.fuel);
  });
  it('arrives identically in a single catch-up or many small advances', () => {
    const s = dispatch(game, createState(game, 812), { type: 'travel', target: 'cinder' }).state;
    const whole = advance(game, s, 400);
    let split = s;
    for (let i = 0; i < 400; i++) split = advance(game, split, 1);
    expect(whole).toEqual(split);
    expect(whole.location).toBe('cinder');
  });
  it('does not go backward or loop for invalid elapsed times', () => {
    const s = createState(game, 812);
    for (const dt of [-1, NaN, Infinity]) expect(advance(game, s, dt)).toEqual(s);
  });
  it('does not grant rewards twice after a completed activity', () => {
    let s = createState(game, 812);
    s = dispatch(game, s, { type: 'work' }).state;
    s = advance(game, s, 120);
    const credits = s.inventory.credits;
    expect(advance(game, s, 1000).inventory.credits).toBe(credits);
  });
  it('waits at a consequential encounter and preserves resources while away', () => {
    const s = {
      ...createState(game, 812),
      encounter: { id: 'intercept', source: 'pirates', strength: 1 },
    };
    const after = advance(game, s, 86400);
    expect(after.inventory).toEqual(s.inventory);
    expect(after.elapsed).toBe(s.elapsed);
    expect(after.encounter).toEqual(s.encounter);
  });
  it('allows a recovery tow with no fuel or credits', () => {
    let s: GameState = {
      ...createState(game, 812),
      location: 'cinder',
      inventory: { ...createState(game, 812).inventory, fuel: 0, credits: 0 },
    };
    s = dispatch(game, s, { type: 'rescue' }).state;
    s = advance(game, s, 300);
    expect(s.location).toBe('anchor');
    expect(s.integrity).toBeGreaterThan(0);
    expect(s.debt).toBeGreaterThan(0);
  });
});
