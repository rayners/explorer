import { it, expect } from 'vitest';
import { createHollowmere } from '../src/fantasy/definition';
import { fantasyGuidance } from '../src/fantasy/guidance';
import { createState, dispatch, advance } from '../src/engine/simulation';

it('guides the first oath through explicit acceptance, journey, survey and filing without changing state', () => {
  const game = createHollowmere(1701);
  let state = createState(game, 1701);
  const before = structuredClone(state);
  expect(fantasyGuidance(game, state).accept).toBe(true);
  expect(state).toEqual(before);
  state = dispatch(game, state, { type: 'accept', id: 'first-road' }).state;
  expect(fantasyGuidance(game, state).tab).toBe('journey');
  const trip = dispatch(game, state, { type: 'travel', target: 'old-road' });
  expect(trip.error).toBeUndefined();
  expect(fantasyGuidance(game, trip.state).title).toBe('The road is taken.');
  state = advance(game, trip.state, 200);
  if (state.encounter)
    state = dispatch(game, state, { type: 'encounter', choice: 'surrender' }).state;
  expect(fantasyGuidance(game, state).title).toBe('Read the signs.');
  state = advance(game, dispatch(game, state, { type: 'activity', id: 'survey' }).state, 100);
  expect(fantasyGuidance(game, state).tab).toBe('refuge');
  state.location = game.initial.location;
  state = dispatch(game, state, { type: 'claim', id: 'first-road' }).state;
  expect(fantasyGuidance(game, state).title).toBe('Keep the lanterns lit.');
});

it('keeps hidden threats out of guidance and prioritizes actual decisions over onboarding', () => {
  const game = createHollowmere(1701),
    state = createState(game, 1701);
  state.threat = { id: 'white-guest', stage: 'hidden', pressure: 0, signs: 0 };
  expect(fantasyGuidance(game, state).accept).toBe(true);
  state.threat.stage = 'suspected';
  expect(fantasyGuidance(game, state).accept).toBeUndefined();
  expect(fantasyGuidance(game, state).text).toContain('revealed threat');
});
