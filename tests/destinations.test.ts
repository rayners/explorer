import { expect, it } from 'vitest';
import { supportVarietyFixture } from '../e2e/variety-fixture';
import { createGame } from '../src/game/definition';
import { createHollowmere } from '../src/fantasy/definition';
import { createState, dispatch, activityDuration } from '../src/engine/simulation';
import { decodeSave, encodeSave } from '../src/engine/save';
import { destinationPlan } from '../src/ui/destination-planning';
import { destinationPanel } from '../src/ui/destination-panels';
import { expeditionPlan, knownHubRoute, routeCost } from '../src/ui/expedition-planning';
function fixture(fantasy: boolean) {
  const f = supportVarietyFixture(fantasy);
  const normal = f.game.missions.find(
    (m) => m.sourceSite === f.mission.sourceSite && !m.discoveryChoice,
  )!;
  const state = { ...f.state, location: f.game.initial.location };
  const accepted = dispatch(f.game, state, { type: 'accept', id: normal.id });
  expect(accepted.error).toBeUndefined();
  return { ...f, normal, state: accepted.state };
}
function sum(...costs: Record<string, number>[]) {
  const result: Record<string, number> = {};
  for (const cost of costs)
    for (const [id, n] of Object.entries(cost)) result[id] = (result[id] ?? 0) + n;
  return result;
}
it('includes only discovered known sources and exact settled branches without mutation or hidden catalog totals', () => {
  for (const fantasy of [false, true]) {
    const { game, state, source, mission } = fixture(fantasy),
      before = structuredClone(state),
      definition = structuredClone(game);
    const plan = destinationPlan(game, state),
      group = plan.groups.find((g) => g.source.id === source.id)!;
    expect(group.entries.some((e) => e.mission.id === mission.id)).toBe(true);
    const unchosen = game.missions.filter(
      (m) =>
        m.sourceSite === mission.sourceSite &&
        m.discoveryChoice &&
        m.discoveryChoice.choice !== mission.discoveryChoice!.choice,
    );
    expect(unchosen.length).toBeGreaterThan(0);
    for (const m of unchosen)
      expect(plan.groups.flatMap((g) => g.entries.map((e) => e.mission.id))).not.toContain(m.id);
    expect(state).toEqual(before);
    expect(game).toEqual(definition);
    expect(
      destinationPlan(game, {
        ...state,
        known: state.known.filter((id) => id !== source.id),
      }).groups.some((g) => g.source.id === source.id),
    ).toBe(false);
    const unseen = structuredClone(state);
    unseen.discoveries[source.id].sites = [];
    expect(destinationPlan(game, unseen).groups.some((g) => g.source.id === source.id)).toBe(false);
    expect(destinationPlan(game, createState(game, 1701)).groups).toEqual([]);
  }
});
it('combines actual accepted primary/support work with one outbound/nearby-hub trip and conservative serial time', () => {
  for (const fantasy of [false, true]) {
    const { game, state, source } = fixture(fantasy);
    const group = destinationPlan(game, state).groups.find((g) => g.source.id === source.id)!;
    const accepted = group.entries.filter((e) => e.status === 'unstarted');
    expect(destinationPlan(game, state).groups[0].source.id).toBe(source.id);
    expect(group.entries.slice(0, 2).map((e) => e.status)).toEqual(['unstarted', 'unstarted']);
    expect(accepted).toHaveLength(2);
    expect(new Set(accepted.map((e) => e.activity.slot))).toEqual(new Set(['primary', 'support']));
    expect(group.workCost).toEqual(sum(...accepted.map((e) => e.activity.cost)));
    expect(group.workSeconds).toBe(
      accepted.reduce((n, e) => n + activityDuration(game, state, e.activity.id), 0),
    );
    const hub = knownHubRoute(game, { ...state, location: source.id })!;
    expect(group.nearbyHub).toEqual(hub);
    expect(group.travelCost).toEqual(routeCost([...group.outbound!, ...hub.legs]));
    expect(group.totalCost).toEqual(sum(group.workCost, group.travelCost!));
    const separate = sum(
      ...accepted.map((e) => expeditionPlan(game, state, e.mission.id)!.totalCost),
    );
    expect(separate).toEqual(sum(group.totalCost!, group.travelCost!));
    const poor = structuredClone(state);
    poor.inventory = {};
    poor.crew.forEach((m) => (m.assignment = 'rest'));
    const missing = destinationPlan(game, poor).groups.find((g) => g.source.id === source.id)!;
    expect(missing.shortages).toEqual(missing.totalCost);
    expect(missing.staffing.length).toBeGreaterThan(0);
  }
});
it('never aggregates offers as accepted work and counts authored contracts and receipts against capacity', () => {
  for (const fantasy of [false, true]) {
    const { game, state, source, normal, mission } = fixture(fantasy);
    const offers = destinationPlan(game, { ...state, missions: [] }).groups.find(
      (g) => g.source.id === source.id,
    )!;
    expect(offers.entries.every((e) => e.status === 'offer')).toBe(true);
    expect(offers.workCost).toEqual({});
    expect(offers.workSeconds).toBe(0);
    expect(offers.totalCost).toBeUndefined();
    state.missions.find((m) => m.id === normal.id)!.progress = normal.objective.count;
    const intro = game.missions.find((m) => !m.sourceSite)!;
    const third = dispatch(game, state, { type: 'accept', id: intro.id });
    expect(third.error).toBeUndefined();
    const full = destinationPlan(game, third.state);
    expect(full).toMatchObject({ active: 3, capacity: 3, available: 0 });
    const group = full.groups.find((g) => g.source.id === source.id)!;
    expect(group.entries.find((e) => e.mission.id === normal.id)!.status).toBe('receipt');
    expect(group.workCost).toEqual(game.activities.find((a) => a.mission === mission.id)!.cost);
    expect(group.filingHub).toEqual(knownHubRoute(game, third.state));
  }
});
it('preserves paid jobs after casualties without charging supplies or requiring replacements', () => {
  for (const fantasy of [false, true]) {
    const { game, paid, source, mission, work } = supportVarietyFixture(fantasy),
      state = structuredClone(paid);
    state.crew.forEach((m) => {
      m.life = 'dead';
    });
    state.inventory = {};
    const before = structuredClone(state),
      group = destinationPlan(game, state).groups.find((g) => g.source.id === source.id)!;
    const entry = group.entries.find((e) => e.mission.id === mission.id)!;
    expect(entry.status).toBe('committed');
    expect(entry.slot).toBe('support');
    expect(entry.job).toEqual(paid.support);
    expect(entry.activity.id).toBe(work.id);
    expect(group.workCost).toEqual({});
    expect(group.workSeconds).toBe(0);
    expect(group.staffing).toEqual([]);
    expect(group.totalCost).toBeUndefined();
    expect(entry.plan.staffing).toEqual([]);
    expect(state).toEqual(before);
  }
});
it('guides receipt-only groups from the current place to a filing hub without source journeys', () => {
  for (const fantasy of [false, true]) {
    const { game, state, source } = fixture(fantasy);
    // Other already discovered work can remain offered at the same source. This case
    // isolates a destination whose remaining unclaimed contracts are all receipts.
    for (const entry of destinationPlan(game, state).groups.find((g) => g.source.id === source.id)!
      .entries)
      if (entry.status === 'offer')
        state.missions.push({
          id: entry.mission.id,
          progress: entry.mission.objective.count,
          claimed: true,
        });
    for (const accepted of state.missions)
      accepted.progress = game.missions.find((m) => m.id === accepted.id)!.objective.count;
    const group = destinationPlan(game, state).groups.find((g) => g.source.id === source.id)!;
    expect(group.receiptOnly).toBe(true);
    expect(group.outbound).toBeUndefined();
    expect(group.nearbyHub).toBeUndefined();
    expect(group.travelCost).toBeUndefined();
    expect(group.totalCost).toBeUndefined();
    expect(group.workCost).toEqual({});
    expect(group.filingHub).toEqual({ target: state.location, legs: [] });
    state.location = source.id;
    expect(
      destinationPlan(game, state).groups.find((g) => g.source.id === source.id)!.filingHub,
    ).toEqual(knownHubRoute(game, state));
    state.missions.forEach((m) => (m.claimed = true));
    expect(destinationPlan(game, state).groups.some((g) => g.source.id === source.id)).toBe(false);
  }
});
it('does not price unknown routes as free, reveal unknown hubs, or plan from a transit origin', () => {
  for (const fantasy of [false, true]) {
    const { game, state, source } = fixture(fantasy);
    game.routes = [];
    const missing = destinationPlan(game, state).groups.find((g) => g.source.id === source.id)!;
    expect(missing.outbound).toBeUndefined();
    expect(missing.travelCost).toBeUndefined();
    expect(missing.totalCost).toBeUndefined();
    expect(Object.keys(missing.workCost).length).toBeGreaterThan(0);
    state.location = source.id;
    state.known = [source.id];
    expect(destinationPlan(game, state).groups[0].nearbyHub).toBeUndefined();
    for (const kind of ['travel', 'rescue'] as const) {
      state.primary = {
        kind,
        id: 'paid',
        definition: kind,
        target: game.initial.location,
        total: 30,
        remaining: 20,
        days: 1,
        reward: {},
        risk: 0,
      };
      const transit = destinationPlan(game, state).groups[0];
      expect(transit.deferred).toBe(true);
      expect(transit.outbound).toBeUndefined();
      expect(transit.filingHub).toBeUndefined();
      expect(transit.nearbyHub).toBeUndefined();
      expect(transit.totalCost).toBeUndefined();
    }
  }
});
it('is portable across released generations and exact save restoration without changing catalogs', () => {
  for (const factory of [createGame, createHollowmere])
    for (const generation of [1, 2, 3, 4, 5, 6, 7]) {
      const game = factory(1701, generation),
        state = createState(game, 1701),
        before = JSON.stringify(game);
      if (generation >= 3) {
        const source = game.locations.find((l) => !l.station && l.initiallyKnown)!;
        state.discoveries[source.id] = {
          surveyed: true,
          sites: [source.sites[0]],
          dataSold: false,
        };
      }
      const plan = destinationPlan(game, state);
      expect(plan.groups.length > 0).toBe(generation >= 3);
      expect(destinationPlan(game, decodeSave(encodeSave(state, 1000), factory).state)).toEqual(
        plan,
      );
      expect(JSON.stringify(game)).toBe(before);
    }
});

it('renders navigation controls without engine commands and escapes display names', () => {
  const { game, state, source } = fixture(false);
  source.name = '<script>private source</script>';
  const before = structuredClone(state),
    html = destinationPanel(game, state);
  expect(html).not.toContain('data-command=');
  expect(html).toContain('data-contract-review=');
  expect(html).toContain('&lt;script&gt;private source&lt;/script&gt;');
  expect(html).not.toContain('<script>');
  expect(state).toEqual(before);
  game.routes = [];
  expect(destinationPanel(game, state)).toContain('Unknown route — not priced.');
  expect(destinationPanel(game, state)).toContain('Shared total unavailable');
});
