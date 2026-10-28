import { createGame } from '../src/game/definition';
import { createHollowmere } from '../src/fantasy/definition';
import { createState, dispatch, advance } from '../src/engine/simulation';
/** Reach an opportunity through the actual seeded selector; do not fabricate its identity receipt. */
export function opportunityFixture(
  fantasy: boolean,
  id = 'stranded-specialist',
  atHub = true,
  generation = 5,
) {
  const game = (fantasy ? createHollowmere : createGame)(1701, generation);
  const source = game.locations.find((l) => !l.station && !l.initiallyKnown)!;
  for (let rng = 1; rng < 1000; rng++) {
    const state = createState(game, 1701);
    state.location = source.id;
    state.rng = rng;
    state.known = game.locations.map((l) => l.id);
    state.discoveries = Object.fromEntries(
      game.locations.map((l) => [l.id, { surveyed: true, sites: [], dataSold: false }]),
    );
    const intro = game.locations.find((l) => !l.station && l.initiallyKnown)!;
    state.discoveries[intro.id].sites = [...intro.sites];
    const minimum = game.discoveryEvents!.entries.find((event) => event.id === id)!.minimumSites;
    let explored = intro.sites.length;
    for (const location of game.locations)
      for (const site of location.sites) {
        if (explored >= minimum - 1) break;
        if (site === source.sites[0] || state.discoveries[location.id].sites.includes(site))
          continue;
        state.discoveries[location.id].sites.push(site);
        explored++;
      }
    const start = dispatch(game, state, {
      type: 'activity',
      id: game.rules.exploreActivity,
      site: source.sites[0],
    });
    if (start.error) throw Error(start.error);
    let found = advance(game, start.state, 200);
    if (found.incidents.some((record) => record.id === id)) {
      if (found.encounter)
        found = dispatch(game, found, { type: 'encounter', choice: 'surrender' }).state;
      if (atHub) found.location = game.initial.location;
      return { game, state: found, source };
    }
  }
  throw Error(`No seeded ${id} fixture found.`);
}
