import { describe, it, expect } from 'vitest';
import { createGame } from '../src/game/definition';
import { createState, dispatch, routesFrom } from '../src/engine/simulation';
import { planRoute } from '../src/engine/navigation';
const game = createGame(1701, 3);
describe('planning journeys between systems', () => {
  it('allows departure from every location in a system without a planetary stopover', () => {
    for (const origin of game.locations.filter((l) => l.region === 'vesper')) {
      const state = createState(game, 1701);
      state.location = origin.id;
      if (!state.known.includes(origin.id)) state.known.push(origin.id);
      state.known.push('pale-0');
      const itinerary = planRoute(game, state, 'pale-0');
      expect(itinerary.map((leg) => [leg.from, leg.to])).toEqual([[origin.id, 'pale-0']]);
      const result = dispatch(game, state, { type: 'travel', target: 'pale-0' });
      expect(result.error).toBeUndefined();
      expect(result.state.primary?.remaining).toBe(900);
      expect(result.state.primary?.days).toBe(1461);
      expect(result.state.inventory.fuel).toBe(state.inventory.fuel - 24);
      expect(result.state.inventory.provisions).toBe(state.inventory.provisions - 3);
    }
  });
  it('allows return travel from any location to a known destination in the neighboring system', () => {
    for (const origin of game.locations.filter((l) => l.region === 'pale')) {
      const state = createState(game, 1701);
      state.location = origin.id;
      state.known.push(origin.id, 'morrow');
      expect(planRoute(game, state, 'anchor').map((leg) => leg.to)).toEqual(['anchor']);
      expect(planRoute(game, state, 'morrow').map((leg) => leg.to)).toEqual(['morrow']);
      expect(dispatch(game, state, { type: 'travel', target: 'anchor' }).error).toBeUndefined();
    }
  });
  it('preserves local transfer costs and prevents travel to an uncharted destination', () => {
    const state = createState(game, 1701);
    expect(planRoute(game, state, 'cinder')[0]).toMatchObject({
      seconds: 60,
      cost: { fuel: 4, provisions: 1 },
    });
    expect(planRoute(game, state, 'pale-0')).toEqual([]);
    expect(dispatch(game, state, { type: 'travel', target: 'pale-0' }).error).toBeTruthy();
    expect(planRoute(game, state, 'missing')).toEqual([]);
    expect(planRoute(game, state, 'anchor')).toEqual([]);
  });
  it('still requires intermediate systems when there is no connection between two regions', () => {
    const state = createState(game, 1701);
    state.known.push('hollow-0');
    expect(planRoute(game, state, 'hollow-0')).toEqual([]);
    state.known.push('pale-0');
    expect(planRoute(game, state, 'hollow-0').map((leg) => leg.to)).toEqual(['pale-0', 'hollow-0']);
  });
  it('keeps location-specific gateways available to other game settings', () => {
    const localized = {
      ...game,
      rules: { ...game.rules, interregionalTravel: 'location' as const },
    };
    const state = createState(localized, 1701);
    state.known.push('pale-0');
    expect(planRoute(localized, state, 'pale-0').map((leg) => leg.to)).toEqual([
      'cinder',
      'pale-0',
    ]);
    expect(routesFrom(localized, state).some((leg) => leg.target === 'pale-0')).toBe(false);
    expect(dispatch(localized, state, { type: 'travel', target: 'pale-0' }).error).toBeTruthy();
  });
});
