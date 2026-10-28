import assert from 'node:assert/strict';
import { createGame } from '../src/game/definition';
import { createHollowmere } from '../src/fantasy/definition';
import type {
  ActivityDef,
  Amounts,
  GameDefinition,
  GameState,
  MissionDef,
} from '../src/engine/types';
import { createState, activityDuration, advance, dispatch, price } from '../src/engine/simulation';
import { planRoute } from '../src/engine/navigation';
import { crewCapacity } from '../src/engine/personnel';
import { WORK_WATCHES } from '../src/engine/work-watches';

const seeds = [1701, 1, 7, 44, 91, 812, 2026, 4294967295];
const add = (target: Amounts, amounts: Amounts) => {
  for (const [id, amount] of Object.entries(amounts)) target[id] = (target[id] ?? 0) + amount;
};
/** Ideal, stated staffing assumption for estimates, never a persisted player expedition. */
function staffing(game: GameDefinition, base: GameState, work: ActivityDef) {
  const state = structuredClone(base);
  state.crew.forEach((member) => (member.assignment = 'rest'));
  const requirements = [...(work.requirements ?? [])];
  if (
    !requirements.some((r) => r.skill === work.skill && (r.assignment ?? work.slot) === work.slot)
  )
    requirements.push({ skill: work.skill, count: 1, assignment: work.slot });
  let recruitmentCost = 0;
  for (const requirement of requirements) {
    const assignment = requirement.assignment ?? work.slot;
    while (
      state.crew.filter((m) => m.skill === requirement.skill && m.assignment === assignment)
        .length < requirement.count
    ) {
      let member = state.crew.find((m) => m.skill === requirement.skill && m.assignment === 'rest');
      if (!member) {
        const offer = game.recruitment?.offers.find(
          (offer) => !offer.emergency && offer.skill === requirement.skill,
        );
        assert(offer, `No hire for ${requirement.skill}`);
        member = {
          id: `audit-${state.crew.length}`,
          name: offer.name,
          skill: offer.skill,
          assignment: 'rest',
          injury: 0,
          experience: 0,
          life: 'alive',
        };
        state.crew.push(member);
        recruitmentCost += Object.entries(offer.cost).reduce(
          (total, [id, amount]) =>
            total + amount * (id === game.rules.currency ? 1 : price(game, state, id, 'buy')),
          0,
        );
      }
      member.assignment = assignment;
    }
  }
  assert(
    state.crew.length <= crewCapacity(game, state),
    'Benchmark staffing exceeds starting accommodation',
  );
  return { state, recruitmentCost };
}

function trip(game: GameDefinition, base: GameState, missions: MissionDef[], hub: string) {
  const source = missions[0].objective.target!;
  assert(missions.every((mission) => mission.objective.target === source));
  assert(missions.length <= 3);
  const outbound = planRoute(game, { ...base, location: hub }, source);
  const back = planRoute(game, { ...base, location: source }, hub);
  assert(outbound.length && back.length);
  const travel = [...outbound, ...back],
    costs: Amounts = {},
    rewards: Amounts = {};
  travel.forEach((leg) => add(costs, leg.cost));
  let workSeconds = 0,
    recruitmentCost = 0;
  for (const mission of missions) {
    const work = game.activities.find((work) => work.mission === mission.id)!;
    assert(work);
    const staffed = staffing(game, base, work);
    workSeconds += activityDuration(game, staffed.state, work.id);
    recruitmentCost = Math.max(recruitmentCost, staffed.recruitmentCost);
    add(costs, work.cost);
    add(rewards, mission.reward);
  }
  const seconds = travel.reduce((sum, leg) => sum + leg.seconds, 0) + workSeconds;
  const departure = { ...base, location: hub };
  const arrival = {
    ...departure,
    calendarDays: base.calendarDays + travel.reduce((sum, leg) => sum + leg.days, 0),
  };
  const supplyCost = Object.entries(costs).reduce(
    (sum, [id, amount]) => sum + amount * price(game, departure, id, 'buy'),
    0,
  );
  const cash = (rewards[game.rules.currency] ?? 0) - supplyCost;
  const sale = Object.entries(rewards)
    .filter(([id]) => id !== game.rules.currency)
    .reduce((sum, [id, amount]) => sum + amount * price(game, arrival, id, 'sell'), 0);
  return {
    seed: base.seed,
    source,
    hub,
    missions: missions.map((mission) => mission.id),
    minutes: seconds / 60,
    supplyCost,
    cash,
    cashPerMinute: (cash / seconds) * 60,
    optimisticSalePerMinute: ((cash + sale) / seconds) * 60,
    recruitmentCost,
    dispatches: travel.length + missions.length,
    // Acceptance and filing are explicit too; assignment/trade/confirm clicks are excluded.
    commands: travel.length + missions.length * 3,
  };
}
type Trip = ReturnType<typeof trip>;
function summary(rows: Trip[]) {
  assert(rows.length);
  const range = (
    key: 'cashPerMinute' | 'optimisticSalePerMinute' | 'minutes' | 'commands' | 'recruitmentCost',
  ) => {
    const values = rows.map((row) => row[key]).sort((a, b) => a - b);
    return { min: values[0], median: values[Math.floor(values.length / 2)], max: values.at(-1)! };
  };
  return {
    cases: rows.length,
    cashPerMinute: range('cashPerMinute'),
    optimisticSalePerMinute: range('optimisticSalePerMinute'),
    minutes: range('minutes'),
    commands: range('commands'),
    recruitmentCost: range('recruitmentCost'),
  };
}

function audit(factory: typeof createGame) {
  const rows: Record<string, Trip[]> = {
    ordinaryHome: [],
    ordinaryNearest: [],
    bundlesNearest: [],
    projectsNearest: [],
  };
  const samples: Trip[] = [];
  const localTimers: number[] = [],
    crossingTimers: number[] = [];
  const sessions = [];
  const watchSessions = [];
  for (const seed of seeds) {
    const game = factory(seed, 7),
      before = JSON.stringify(game),
      base = createState(game, seed);
    base.known = game.locations.map((location) => location.id);
    for (const route of game.routes)
      (route.interregional ? crossingTimers : localTimers).push(route.seconds);
    const closest = (mission: MissionDef) =>
      game.locations
        .filter((location) => location.station)
        .map((hub) => trip(game, base, [mission], hub.id))
        .sort((a, b) => a.minutes - b.minutes)[0];
    for (const mission of game.missions.filter((mission) => mission.sourceSite)) {
      const nearby = closest(mission);
      if (mission.discoveryChoice) rows.projectsNearest.push(nearby);
      else {
        const home = trip(game, base, [mission], game.initial.location);
        rows.ordinaryHome.push(home);
        rows.ordinaryNearest.push(nearby);
        if (
          seed === 1701 &&
          mission.sourceSite ===
            game.locations.find((location) => !location.station && location.initiallyKnown)!
              .sites[0]
        )
          samples.push(home);
      }
    }
    for (const location of game.locations.filter((location) => !location.station)) {
      const bundle = game.missions
        .filter(
          (mission) =>
            mission.sourceSite &&
            !mission.discoveryChoice &&
            mission.objective.target === location.id,
        )
        .slice(0, 3);
      if (bundle.length < 2) continue;
      const nearest = closest(bundle[0]);
      rows.bundlesNearest.push(trip(game, base, bundle, nearest.hub));
    }
    if (seed === 1701) {
      const work = game.activities.find((work) => work.id === game.rules.workActivity)!;
      let state = createState(game, seed);
      const worker = state.crew.find((member) => member.skill === work.skill)!;
      state = dispatch(game, state, {
        type: 'assign',
        member: worker.id,
        assignment: 'primary',
      }).state;
      const started = dispatch(game, state, { type: 'activity', id: work.id });
      assert(!started.error);
      for (const seconds of [300, 3600, 28800]) {
        const finished = advance(game, started.state, seconds);
        sessions.push({
          checkInMinutes: seconds / 60,
          committedSeconds: started.state.primary!.total,
          currencyEarned:
            finished.inventory[game.rules.currency] - state.inventory[game.rules.currency],
          pendingJob: !!finished.primary,
        });
      }
      for (const watch of WORK_WATCHES) {
        const extended = dispatch(game, state, { type: 'work', watch: watch.id });
        assert(!extended.error);
        for (const seconds of [300, 3600, 28800]) {
          const finished = advance(game, extended.state, seconds);
          watchSessions.push({
            watch: watch.id,
            checkInMinutes: seconds / 60,
            committedSeconds: extended.state.primary!.total,
            currencyEarned:
              finished.inventory[game.rules.currency] - state.inventory[game.rules.currency],
            practiceEarned:
              (finished.crew.find((member) => member.id === worker.id)!.experience ?? 0) -
              (worker.experience ?? 0),
            pendingJob: !!finished.primary,
          });
        }
      }
    }
    assert.equal(JSON.stringify(game), before, 'Audit mutated a definition');
  }
  return {
    game: factory(1701, 7).id,
    seeds,
    generation: 7,
    wagePerMinute: (sessions[0].currencyEarned / sessions[0].committedSeconds) * 60,
    summaries: Object.fromEntries(
      Object.entries(rows).map(([key, values]) => [key, summary(values)]),
    ),
    samples,
    sessions,
    watchSessions,
    routeSeconds: {
      local: { min: Math.min(...localTimers), max: Math.max(...localTimers) },
      crossing: { min: Math.min(...crossingTimers), max: Math.max(...crossingTimers) },
    },
  };
}
const results = [audit(createGame), audit(createHollowmere)];
if (process.argv.includes('--json')) console.log(JSON.stringify(results, null, 2));
else {
  console.log(
    'Return-commission audit: ideal staffing, fully known map, purchased supplies, no hazards. See docs/EXPEDITION-AUDIT.md for limits.\n',
  );
  for (const result of results) {
    console.log(
      `${result.game}: hub wage ${result.wagePerMinute.toFixed(1)}/min; eight generation-7 seeds`,
    );
    console.table(
      Object.entries(result.summaries).map(([kind, stats]) => ({
        kind,
        cases: stats.cases,
        'cash/min median': stats.cashPerMinute.median.toFixed(1),
        'sale/min median': stats.optimisticSalePerMinute.median.toFixed(1),
        'minutes median': stats.minutes.median.toFixed(1),
        'commands median': stats.commands.median,
        'additional hire max': stats.recruitmentCost.max,
      })),
    );
    console.table(result.sessions);
    console.table(result.watchSessions);
  }
}
