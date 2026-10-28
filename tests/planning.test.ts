import { it, expect } from 'vitest';
import { opportunityFixture } from '../e2e/opportunity-fixture';
import { expeditionPlan, knownHubRoute, routeCost } from '../src/ui/expedition-planning';
import { preparationPanel, planningSummary, routePlanPanel } from '../src/ui/planning-panels';
import { createGame } from '../src/game/definition';
import { createHollowmere } from '../src/fantasy/definition';
import { createState, dispatch, advance } from '../src/engine/simulation';
import { planRoute } from '../src/engine/navigation';
import { decodeSave, encodeSave } from '../src/engine/save';
function fixture(fantasy = false) {
  const {
    game,
    state: found,
    source,
  } = opportunityFixture(fantasy, 'stranded-specialist', true, 6);
  const state = dispatch(game, found, {
    type: 'discovery',
    id: 'stranded-specialist',
    choice: 'resettle',
  }).state;
  const mission = game.missions.find(
    (mission) =>
      mission.discoveryChoice?.incident === 'stranded-specialist' &&
      mission.discoveryChoice.choice === 'resettle' &&
      mission.sourceSite === found.incidents[0].site,
  )!;
  const work = game.activities.find((activity) => activity.mission === mission.id)!;
  return { game, state, source, mission, work };
}
it('derives exact outbound, work and reachable return estimates without changing state or RNG', () => {
  for (const fantasy of [false, true]) {
    const { game, state, source, mission, work } = fixture(fantasy),
      before = structuredClone(state);
    const preview = expeditionPlan(game, state, mission.id)!;
    expect(preview.phase).toBe('accept');
    expect(preview.outbound).toEqual(planRoute(game, state, source.id));
    const back = knownHubRoute(game, { ...state, location: source.id })!;
    const costs = { ...work.cost };
    for (const legs of [preview.outbound!, back.legs])
      for (const [id, amount] of Object.entries(routeCost(legs)))
        costs[id] = (costs[id] ?? 0) + amount;
    expect(preview.totalCost).toEqual(costs);
    expect(preview.returnRoute).toEqual(back);
    expect(preparationPanel(game, state, mission.id)).toContain('Estimated supplies needed');
    expect(planningSummary(game, state)).toContain('1 unlocked faction project');
    expect(state).toEqual(before);
    const accepted = dispatch(game, state, { type: 'accept', id: mission.id }).state;
    expect(expeditionPlan(game, accepted, mission.id)!.phase).toBe('travel');
  }
});
it('reports supply and assignment gaps together, distinguishes missing and dead specialists, and respects injuries', () => {
  for (const fantasy of [false, true]) {
    const { game, state, mission, work } = fixture(fantasy);
    const accepted = dispatch(game, state, { type: 'accept', id: mission.id }).state;
    const member = accepted.crew.find((member) => member.skill === work.skill)!;
    member.assignment = 'rest';
    accepted.inventory = Object.fromEntries(game.resources.map((resource) => [resource.id, 0]));
    const plan = expeditionPlan(game, accepted, mission.id)!;
    expect(plan.phase).toBe('prepare');
    expect(plan.shortages).toEqual(plan.totalCost);
    expect(plan.staffing.join(' ')).toContain(`Assign 1 ${work.skill}`);
    expect(preparationPanel(game, accepted, mission.id)).toContain('Missing supplies:');
    member.life = 'dead';
    expect(expeditionPlan(game, accepted, mission.id)!.staffing.join(' ')).toContain(
      `Recruit 1 ${work.skill}`,
    );
    member.life = 'alive';
    member.assignment = 'primary';
    member.injury = 2;
    expect(expeditionPlan(game, accepted, mission.id)!.staffing).toEqual([]);
  }
});
it('does not reprice or restaff committed work, and guides completed receipts to filing without work costs', () => {
  for (const fantasy of [false, true]) {
    const { game, state, source, mission, work } = fixture(fantasy);
    let accepted = dispatch(game, state, { type: 'accept', id: mission.id }).state;
    accepted.location = source.id;
    accepted.rng = 1;
    expect(expeditionPlan(game, accepted, mission.id)!.phase).toBe('work');
    const start = dispatch(game, accepted, { type: 'activity', id: work.id });
    expect(start.error).toBeUndefined();
    const casualty = structuredClone(start.state);
    casualty.crew.forEach((member) => (member.life = 'dead'));
    casualty.inventory = {};
    const paid = expeditionPlan(game, casualty, mission.id)!;
    expect(paid.phase).toBe('waiting');
    expect(paid.totalCost).toEqual({});
    expect(paid.staffing).toEqual([]);
    let completed = advance(game, start.state, 200);
    if (completed.encounter)
      completed = dispatch(game, completed, { type: 'encounter', choice: 'surrender' }).state;
    const receipt = expeditionPlan(game, completed, mission.id)!;
    expect(receipt.phase).toBe('return');
    expect(receipt.workCost).toEqual({});
    expect(receipt.staffing).toEqual([]);
    expect(receipt.totalCost).toEqual(routeCost(receipt.outbound!));
    expect(planningSummary(game, completed)).toContain('1 ready to file');
    completed.location = receipt.target!;
    expect(expeditionPlan(game, completed, mission.id)!.phase).toBe('file');
    const claimed = dispatch(game, completed, { type: 'claim', id: mission.id }).state;
    expect(expeditionPlan(game, claimed, mission.id)!.phase).toBe('filed');
  }
});
it('keeps unknown routes unpriced and never reveals unknown hubs or plans from an in-transit origin', () => {
  const { game, state, source, mission } = fixture();
  let accepted = dispatch(game, state, { type: 'accept', id: mission.id }).state;
  game.routes = [];
  const missing = expeditionPlan(game, accepted, mission.id)!;
  expect(missing.phase).toBe('prepare');
  expect(missing.routeMissing).toBe(true);
  expect(missing.returnRoute).toBeUndefined();
  expect(missing.next).toContain('estimate is incomplete');
  accepted.location = source.id;
  accepted.known = [source.id];
  expect(knownHubRoute(game, accepted)).toBeUndefined();
  const button = () => '';
  expect(routePlanPanel(game, accepted, game.initial.location, button)).toBe('');
  accepted.primary = {
    kind: 'travel',
    id: 'test',
    definition: 'travel',
    target: game.initial.location,
    total: 30,
    remaining: 30,
    days: 1,
    reward: {},
    risk: 0,
  };
  const waiting = expeditionPlan(game, accepted, mission.id)!;
  expect(waiting.phase).toBe('waiting');
  expect(waiting.target).toBeUndefined();
  expect(waiting.totalCost).toEqual({});
});
it('uses authoritative current-order blockers and supports old follow-up saves without catalog changes', () => {
  for (const factory of [createGame, createHollowmere])
    for (const generation of [3, 4, 5, 6]) {
      const game = factory(1701, generation),
        state = createState(game, 1701);
      const source = game.locations.find(
        (location) => !location.station && location.initiallyKnown,
      )!;
      const mission = game.missions.find(
        (mission) => mission.sourceSite === source.sites[0] && !mission.discoveryChoice,
      )!;
      state.discoveries[source.id] = { surveyed: true, sites: [source.sites[0]], dataSold: false };
      const accepted = dispatch(game, state, { type: 'accept', id: mission.id }).state;
      accepted.integrity = 24;
      const plan = expeditionPlan(game, accepted, mission.id)!;
      expect(plan.orderError).toContain('Repair');
      const loaded = decodeSave(encodeSave(accepted, 1000), factory).state;
      expect(expeditionPlan(game, loaded, mission.id)).toEqual(plan);
      const before = structuredClone(loaded);
      routePlanPanel(game, loaded, source.id, () => '<button>Travel</button>');
      planningSummary(game, loaded);
      expect(loaded).toEqual(before);
    }
});
