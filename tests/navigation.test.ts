import { describe, it, expect } from 'vitest';
import { createGame } from '../src/game/definition';
import { createState } from '../src/engine/simulation';
import { planRoute } from '../src/engine/navigation';
const game = createGame(1701);
describe('planning a journey through charted locations', () => {
  it('identifies the local departure world for an interstellar destination', () => {
    const state = createState(game, 1701);
    state.known.push('pale-0');
    expect(planRoute(game, state, 'pale-0').map((leg) => [leg.from, leg.to])).toEqual([
      ['anchor', 'cinder'],
      ['cinder', 'pale-0'],
    ]);
  });
  it('finds the return route in either direction and chooses the shortest travel time', () => {
    const state = createState(game, 1701);
    state.location = 'pale-0';
    state.known.push('pale-0');
    const route = planRoute(game, state, 'anchor');
    expect(route.map((leg) => leg.to)).toEqual(['cinder', 'anchor']);
    expect(route.reduce((seconds, leg) => seconds + leg.seconds, 0)).toBe(960);
  });
  it('never reveals or travels through an uncharted location', () => {
    const state = createState(game, 1701);
    expect(planRoute(game, state, 'pale-0')).toEqual([]);
    state.known = ['anchor', 'pale-0'];
    expect(planRoute(game, state, 'pale-0')).toEqual([]);
    expect(planRoute(game, state, 'missing')).toEqual([]);
    expect(planRoute(game, state, 'anchor')).toEqual([]);
  });
});
