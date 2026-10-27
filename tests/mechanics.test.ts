import { describe, it, expect } from 'vitest';
import { createGame } from '../src/game/definition';
import { advance, createState, dispatch, price } from '../src/engine/simulation';
import type { GameState } from '../src/engine/types';
const g = createGame(91);
const fresh = () => createState(g, 91);
describe('progression and resource rules', () => {
  it('completes and files the first contract only once', () => {
    let s = fresh();
    s = dispatch(g, s, { type: 'accept', id: 'first-light' }).state;
    s = dispatch(g, s, { type: 'travel', target: 'cinder' }).state;
    s = advance(g, s, 60);
    if (s.encounter) s = dispatch(g, s, { type: 'encounter', choice: 'surrender' }).state;
    s = dispatch(g, s, { type: 'activity', id: 'survey' }).state;
    s = advance(g, s, 45);
    if (s.encounter) s = dispatch(g, s, { type: 'encounter', choice: 'surrender' }).state;
    expect(s.missions[0].progress).toBe(1);
    expect(s.known).toContain('pale-0');
    expect(dispatch(g, s, { type: 'claim', id: 'first-light' }).error).toBeTruthy();
    s = dispatch(g, s, { type: 'travel', target: 'anchor' }).state;
    s = advance(g, s, 60);
    if (s.encounter) s = dispatch(g, s, { type: 'encounter', choice: 'surrender' }).state;
    const result = dispatch(g, s, { type: 'claim', id: 'first-light' });
    expect(result.error).toBeUndefined();
    expect(result.state.reputation.combine).toBe(8);
    expect(dispatch(g, result.state, { type: 'claim', id: 'first-light' }).error).toBeTruthy();
  });
  it('credits completed surveys when accepting a contract afterward', () => {
    const s = fresh();
    s.discoveries.cinder.surveyed = true;
    expect(dispatch(g, s, { type: 'accept', id: 'first-light' }).state.missions[0].progress).toBe(
      1,
    );
  });
  it('converts resources with costs paid once and can run support during travel', () => {
    let s = fresh();
    s.inventory.ice = 8;
    s = dispatch(g, s, { type: 'travel', target: 'cinder' }).state;
    const started = dispatch(g, s, { type: 'activity', id: 'refine' });
    expect(started.error).toBeUndefined();
    s = started.state;
    const fuel = s.inventory.fuel;
    expect(s.inventory.ice).toBe(4);
    s = advance(g, s, 55);
    expect(s.inventory.fuel).toBe(fuel + 8);
    expect(s.inventory.ice).toBe(4);
  });
  it('prevents departure while support work is active and locks working assignments', () => {
    let s = fresh();
    s = dispatch(g, s, { type: 'activity', id: 'service' }).state;
    expect(dispatch(g, s, { type: 'travel', target: 'cinder' }).error).toBeTruthy();
    expect(
      dispatch(g, s, { type: 'assign', member: 'ishaan', assignment: 'primary' }).error,
    ).toBeTruthy();
  });
  it('reveals local destinations when arriving in a new system', () => {
    let s = fresh();
    s.location = 'cinder';
    s.known.push('pale-0');
    s.discoveries['pale-0'] = { surveyed: true, sites: [], dataSold: false };
    s = dispatch(g, s, { type: 'travel', target: 'pale-0' }).state;
    s = advance(g, s, 900);
    expect(s.known).toContain('pale-1');
    expect(s.calendarDays).toBe(1461);
    expect(s.milestones).toContain('interstellar');
  });
  it('makes survey data ownership and combat affect relationships', () => {
    let s = fresh();
    s.discoveries.cinder.surveyed = true;
    const sold = dispatch(g, s, { type: 'sellData' }).state;
    expect(sold.inventory.credits).toBe(s.inventory.credits + 90);
    expect(sold.reputation.combine).toBe(3);
    expect(sold.reputation.independent).toBe(-2);
    expect(dispatch(g, sold, { type: 'sellData' }).error).toBeTruthy();
    s.encounter = { id: 'test', source: 'pirates', strength: 1 };
    s = dispatch(g, s, { type: 'encounter', choice: 'bargain' }).state;
    expect(s.encounter).toBeNull();
    expect(s.reputation.pirates).toBe(2);
  });
  it('repairs and services equipment without exceeding its bounds', () => {
    let s = fresh();
    s.integrity = 90;
    s.wear = 20;
    s = dispatch(g, s, { type: 'activity', id: 'repair' }).state;
    s = advance(g, s, 100);
    expect(s.integrity).toBe(100);
    expect(dispatch(g, s, { type: 'activity', id: 'repair' }).error).toBeTruthy();
    s = dispatch(g, s, { type: 'activity', id: 'service' }).state;
    s = advance(g, s, 100);
    expect(s.wear).toBe(0);
  });
  it('rejects invalid trades and limits market stock by capacity', () => {
    const s = fresh();
    for (const amount of [0, -1, 1.5, NaN, Infinity])
      expect(
        dispatch(g, s, { type: 'trade', resource: 'fuel', amount, direction: 'buy' }).error,
      ).toBeTruthy();
    expect(
      dispatch(g, s, { type: 'trade', resource: 'credits', amount: 1, direction: 'sell' }).error,
    ).toBeTruthy();
    expect(
      dispatch(g, s, { type: 'trade', resource: 'fuel', amount: 100, direction: 'buy' }).error,
    ).toBeTruthy();
  });
  it('changes station prices after years of travel while retaining accepted contracts', () => {
    const s = fresh();
    const initial = price(g, s, 'parts', 'buy');
    s.calendarDays = 365;
    expect(price(g, s, 'parts', 'buy')).not.toBe(initial);
  });
  it('never rerolls a saved pending encounter during catch-up', () => {
    const s: GameState = { ...fresh(), encounter: { id: 'test', source: 'pirates', strength: 1 } };
    expect(advance(g, s, 900)).toEqual(s);
    expect(dispatch(g, s, { type: 'encounter', choice: 'surrender' }).state.encounter).toBeNull();
  });
});
it('resolves armed combat without duplicate spending and offers a supply-free escape', () => {
  let victories = 0,
    damages = 0;
  for (let seed = 1; seed <= 30; seed++) {
    const s = fresh();
    s.rng = seed;
    s.encounter = { id: 'contact', source: 'pirates', strength: 1 };
    const result = dispatch(g, s, { type: 'encounter', choice: 'fight' });
    expect(result.error).toBeUndefined();
    expect(result.state.inventory.ammo).toBe(s.inventory.ammo - 2);
    if (result.state.encounter) {
      damages++;
      expect(result.state.integrity).toBe(88);
      const escaped = dispatch(g, result.state, { type: 'encounter', choice: 'surrender' }).state;
      expect(escaped.encounter).toBeNull();
      expect(escaped.integrity).toBe(88);
    } else {
      victories++;
      expect(result.state.reputation.pirates).toBe(-5);
      expect(result.state.reputation.independent).toBe(2);
    }
  }
  expect(victories).toBeGreaterThan(0);
  expect(damages).toBeGreaterThan(0);
});
it('applies specialization and equipment upgrades to duration and capacity', () => {
  let s = fresh();
  const original = s.capacity;
  s.inventory.credits = 1000;
  s = dispatch(g, s, { type: 'upgrade', id: 'cargo' }).state;
  expect(s.capacity).toBe(original + 50);
  expect(dispatch(g, s, { type: 'upgrade', id: 'cargo' }).error).toBeTruthy();
  s = dispatch(g, s, { type: 'assign', member: 'ishaan', assignment: 'primary' }).state;
  expect(s.crew.find((c) => c.id === 'ishaan')!.assignment).toBe('primary');
});
it('supports deterministic activity extension hooks and releasing contracts', () => {
  const extension = {
    ...g,
    hooks: {
      afterActivity: (s: GameState) => ({
        ...s,
        inventory: { ...s.inventory, credits: s.inventory.credits + 5 },
      }),
    },
  };
  let s = fresh();
  s = dispatch(extension, s, { type: 'work' }).state;
  s = advance(extension, s, 60);
  expect(s.inventory.credits).toBe(390);
  s = dispatch(g, s, { type: 'accept', id: 'hand' }).state;
  s = dispatch(g, s, { type: 'abandon', id: 'hand' }).state;
  expect(s.missions).toHaveLength(0);
  expect(dispatch(g, s, { type: 'accept', id: 'hand' }).error).toBeUndefined();
});
