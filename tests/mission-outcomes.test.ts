import { describe, it, expect } from 'vitest';
import { createGame } from '../src/game/definition';
import { createState, dispatch, advance } from '../src/engine/simulation';
import type { Command, GameState } from '../src/engine/types';
const game = createGame(1701);
function order(state: GameState, command: Command) {
  const result = dispatch(game, state, command);
  expect(result.error).toBeUndefined();
  return result.state;
}
function ready() {
  let state = order(createState(game, 1701), { type: 'accept', id: 'security' });
  state = order(state, { type: 'travel', target: 'cinder' });
  state = advance(game, state, 60);
  if (state.encounter) state = order(state, { type: 'encounter', choice: 'surrender' });
  state = order(state, { type: 'activity', id: 'survey' });
  state = advance(game, state, 45);
  if (state.encounter) state = order(state, { type: 'encounter', choice: 'surrender' });
  return state;
}
const progress = (state: GameState, id: string) =>
  state.missions.find((m) => m.id === id)!.progress;
describe('mission outcomes are counted once after the stated objective is satisfied', () => {
  for (const choice of ['surrender', 'evade', 'bargain'] as const)
    it(`does not count a raid approach or ${choice} as a victory`, () => {
      let state = ready();
      for (let attempt = 0; attempt < 2; attempt++) {
        state = order(state, { type: 'activity', id: 'raid' });
        state = advance(game, state, 60);
        expect(state.encounter).not.toBeNull();
        expect(progress(state, 'security')).toBe(0);
        state = order(state, { type: 'encounter', choice });
        expect(progress(state, 'security')).toBe(0);
      }
    });
  it('counts each actual victory once and never counts a failed firing round', () => {
    let victories = 0,
      failures = 0,
      defeats = 0;
    for (let seed = 1; seed <= 30; seed++) {
      let state = ready();
      state = order(state, { type: 'activity', id: 'raid' });
      state = advance(game, state, 60);
      state.rng = seed;
      const before = state.events.filter((e) => e.key === 'combatWon').length;
      state = order(state, { type: 'encounter', choice: 'fight' });
      const won = state.events.filter((e) => e.key === 'combatWon').length - before;
      expect(progress(state, 'security')).toBe(won);
      if (won) victories++;
      else failures++;
      if (state.encounter) {
        state = order(state, { type: 'encounter', choice: 'fight' });
        const totalWins = state.events.filter((event) => event.key === 'combatWon').length - before;
        expect(progress(state, 'security')).toBe(totalWins);
        if (!totalWins) {
          defeats++;
          expect(state.encounter).toBeNull();
        }
      }
    }
    expect(victories).toBeGreaterThan(0);
    expect(failures).toBeGreaterThan(0);
    expect(defeats).toBeGreaterThan(0);
  });
  it('requires two separate relief deliveries to finish the relief contract', () => {
    let state = order(createState(game, 1701), { type: 'accept', id: 'relief' });
    for (let delivery = 1; delivery <= 2; delivery++) {
      state = order(state, { type: 'aid' });
      state = advance(game, state, 50);
      expect(progress(state, 'relief')).toBe(delivery);
      if (delivery === 1)
        expect(dispatch(game, state, { type: 'claim', id: 'relief' }).error).toBeTruthy();
    }
    state = order(state, { type: 'claim', id: 'relief' });
    expect(state.missions[0].claimed).toBe(true);
  });
});
