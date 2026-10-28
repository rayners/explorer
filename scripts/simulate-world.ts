import { createGame } from '../src/game/definition';
import { createHollowmere } from '../src/fantasy/definition';
import { advance, createState, dispatch, price, cargo } from '../src/engine/simulation';
import { planRoute } from '../src/engine/navigation';
import { threatAlert } from '../src/engine/threats';
import { pendingDiscovery } from '../src/engine/discoveries';
import type { Command, DefinitionFactory } from '../src/engine/types';
/** Explore the actual known graph, returning to reachable service hubs for replenishment. */
export function simulateWorld(seed: number, factory: DefinitionFactory = createGame) {
  const game = factory(seed);
  const visitedHubs = new Set([game.initial.location]);
  let state = createState(game, seed),
    orders = 0,
    firstTenMinutes = 0;
  const order = (command: Command) => {
    const result = dispatch(game, state, command);
    if (result.error)
      throw Error(
        `${game.id} seed ${seed} at ${state.location}: ${JSON.stringify(command)}: ${result.error}`,
      );
    state = result.state;
    orders++;
  };
  const finish = () => {
    for (let i = 0; state.primary || state.support || state.encounter || threatAlert(state); i++) {
      if (i > 30) throw Error('Unresolved world simulation order.');
      if (state.encounter) order({ type: 'encounter', choice: 'surrender' });
      else if (threatAlert(state)) order({ type: 'threat', action: 'purge' });
      else
        state = advance(
          game,
          state,
          Math.max(state.primary?.remaining ?? 0, state.support?.remaining ?? 0) + 1,
        );
    }
  };
  const activity = (id: string) => {
    order({ type: 'activity', id });
    finish();
  };
  const earn = (amount: number) => {
    for (let i = 0; state.inventory[game.rules.currency] < amount; i++) {
      if (i > 100) throw Error('Cannot replenish at hub.');
      activity(game.rules.workActivity);
    }
  };
  const prepare = () => {
    const discovery = pendingDiscovery(game, state);
    if (discovery) {
      const def = game.discoveryEvents!.entries.find((entry) => entry.id === discovery.id)!;
      if (def.kind === 'choice') {
        const choice =
          def.choices.find((choice) => ['archive', 'resettle', 'release'].includes(choice.id)) ??
          def.choices.find(
            (choice) =>
              !choice.recruit &&
              !choice.training &&
              Object.values(choice.reputation).every((value) => value >= 0),
          ) ??
          def.choices.find(
            (choice) =>
              !dispatch(game, state, { type: 'discovery', id: def.id, choice: choice.id }).error,
          );
        if (!choice) throw Error(`No available discovery response for ${def.id}.`);
        order({
          type: 'discovery',
          id: discovery.id,
          choice: choice.id,
        });
      }
    }
    const reserves: Record<string, number> = {};
    reserves[game.rules.travelResource] = 45;
    reserves[game.rules.supplies] = game.rules.travelResource === game.rules.supplies ? 45 : 20;
    reserves[game.rules.materials] = 16;
    reserves[game.rules.ammunition] = 5;
    // Non-travel components cover magical roads and triage without assuming a theme resource ID.
    for (const route of game.routes)
      for (const [id, n] of Object.entries(route.cost))
        reserves[id] = Math.max(reserves[id] ?? 0, n * 2);
    for (const resource of game.resources.filter((r) => r.mass > 0)) {
      const surplus = state.inventory[resource.id] - (reserves[resource.id] ?? 0);
      if (surplus > 0)
        order({ type: 'trade', resource: resource.id, amount: surplus, direction: 'sell' });
    }
    for (const [resource, target] of Object.entries(reserves)) {
      const amount = Math.max(0, target - state.inventory[resource]);
      if (amount) {
        earn(amount * price(game, state, resource, 'buy'));
        order({ type: 'trade', resource, amount, direction: 'buy' });
      }
    }
    while (state.integrity < 90) activity('repair');
    if (state.wear > 25) activity('service');
    if (state.crew.some((c) => c.injury)) {
      earn(25);
      activity('heal');
    }
  };
  const travel = (target: string) => {
    let hops = 0;
    while (state.location !== target) {
      if (++hops > game.locations.length * 3) throw Error('Itinerary failed to converge.');
      const route = planRoute(game, state, target)[0];
      if (!route) throw Error('No known itinerary.');
      if (game.locations.find((l) => l.id === state.location)!.station) prepare();
      if (state.integrity < 35) activity('repair');
      order({ type: 'travel', target: route.to });
      finish();
      const arrived = game.locations.find((l) => l.id === state.location)!;
      if (arrived.station) visitedHubs.add(arrived.id);
      else if (route.interregional && state.location !== target) {
        const hub = game.locations.find(
          (l) => l.region === arrived.region && l.station && state.known.includes(l.id),
        );
        if (hub) {
          travel(hub.id);
          prepare();
        }
      }
    }
  };
  const returnToHub = () => {
    const hubs = game.locations
      .filter((l) => l.station && state.known.includes(l.id))
      .map((l) => ({ id: l.id, path: planRoute(game, state, l.id) }))
      .filter((h) => h.id === state.location || h.path.length)
      .sort(
        (a, b) =>
          a.path.reduce((s, r) => s + r.seconds, 0) - b.path.reduce((s, r) => s + r.seconds, 0),
      );
    if (!hubs.length) throw Error('No reachable service hub.');
    travel(hubs[0].id);
    prepare();
  };
  const introductory = game.missions.find(
    (m) =>
      m.objective.kind === 'survey' &&
      m.objective.target &&
      game.locations.find((l) => l.id === m.objective.target)?.initiallyKnown,
  )!;
  order({ type: 'accept', id: introductory.id });
  let milestoneAt = 0;
  for (let attempts = 0; ; attempts++) {
    const remaining = game.locations.filter(
      (l) => !l.station && !state.discoveries[l.id]?.surveyed,
    );
    if (!remaining.length) break;
    if (attempts > game.locations.length * 2) throw Error('World exploration stalled.');
    const destinations = remaining
      .filter((l) => state.known.includes(l.id))
      .map((l) => ({ location: l, path: planRoute(game, state, l.id) }))
      .filter((d) => d.location.id === state.location || d.path.length)
      .sort(
        (a, b) =>
          a.path.reduce((n, r) => n + r.seconds, 0) - b.path.reduce((n, r) => n + r.seconds, 0),
      );
    if (!destinations.length) {
      const hubs = game.locations
        .filter((l) => l.station && state.known.includes(l.id) && !visitedHubs.has(l.id))
        .map((l) => ({ id: l.id, path: planRoute(game, state, l.id) }))
        .filter((h) => h.path.length)
        .sort(
          (a, b) =>
            a.path.reduce((n, r) => n + r.seconds, 0) - b.path.reduce((n, r) => n + r.seconds, 0),
        );
      if (!hubs.length) throw Error('Survey discovery stranded a connected world.');
      travel(hubs[0].id);
      prepare();
      continue;
    }
    travel(destinations[0].location.id);
    activity(game.rules.surveyActivity);
    activity(game.rules.exploreActivity);
    activity(game.rules.gatherActivity);
    const surveyed = Object.entries(state.discoveries).filter(
      ([id, d]) => d.surveyed && !game.locations.find((l) => l.id === id)!.station,
    ).length;
    if (surveyed === 10) firstTenMinutes = state.elapsed / 60;
    if ((game.milestones ?? []).every((m) => state.milestones.includes(m.id)) && !milestoneAt)
      milestoneAt = state.elapsed / 60;
    returnToHub();
    const mission = state.missions.find((m) => m.id === introductory.id)!;
    if (!mission.claimed && mission.progress >= introductory.objective.count)
      order({ type: 'claim', id: introductory.id });
    order({ type: 'sellData' });
  }
  if (
    cargo(game, state) > state.capacity ||
    Object.values(state.inventory).some((n) => n < 0) ||
    state.crew.some((c) => c.life === 'dead')
  )
    throw Error('Unsafe expedition outcome.');
  if (!(game.milestones ?? []).every((m) => state.milestones.includes(m.id)))
    throw Error('Missing charter milestones.');
  return {
    game: game.id,
    seed,
    regions: game.regions.length,
    fields: game.locations.filter((l) => !l.station).length,
    surveyed: Object.entries(state.discoveries).filter(
      ([id, d]) => d.surveyed && !game.locations.find((l) => l.id === id)!.station,
    ).length,
    orders,
    minutes: Math.round(state.elapsed / 60),
    firstTenMinutes: Math.round(firstTenMinutes),
    milestoneMinutes: Math.round(milestoneAt),
    integrity: state.integrity,
  };
}
if (process.argv[1]?.endsWith('simulate-world.ts'))
  for (const factory of [createGame, createHollowmere])
    for (const seed of [1701, 1, 7, 44, 91, 812, 2026, 4294967295])
      console.log(simulateWorld(seed, factory));
