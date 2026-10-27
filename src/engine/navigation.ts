import type { GameDefinition, GameState, RouteDef } from './types';

/** Resolve available connections from a location. Region travel includes local
 * departure and arrival transfers in the interregional estimate. Discovery checks
 * remain the caller's responsibility, as with ordinary location connections.
 */
export function routesAt(g: GameDefinition, origin: string): RouteDef[] {
  const region = g.locations.find((location) => location.id === origin)?.region;
  if (!region) return [];
  const available = new Map<string, RouteDef>();
  const offer = (route: RouteDef, target: string) => {
    const previous = available.get(target);
    if (!previous || route.seconds < previous.seconds)
      available.set(target, { ...route, from: origin, to: target });
  };
  for (const route of g.routes) {
    if (route.interregional && g.rules.interregionalTravel === 'region') {
      const fromRegion = g.locations.find((location) => location.id === route.from)!.region;
      const toRegion = g.locations.find((location) => location.id === route.to)!.region;
      const destinationRegion =
        fromRegion === region ? toRegion : toRegion === region ? fromRegion : null;
      if (destinationRegion)
        for (const location of g.locations)
          if (location.region === destinationRegion) offer(route, location.id);
    } else if (route.from === origin) offer(route, route.to);
    else if (route.to === origin) offer(route, route.from);
  }
  return [...available.values()];
}

/** Find the shortest known itinerary, with endpoints oriented in travel order.
 * Planning does not queue travel or reveal destinations; each leg needs an order.
 */
export function planRoute(g: GameDefinition, s: GameState, destination: string): RouteDef[] {
  if (!s.known.includes(destination) || destination === s.location) return [];
  const pending = new Set(s.known);
  const distances = new Map([[s.location, 0]]);
  const paths = new Map<string, RouteDef[]>([[s.location, []]]);
  while (pending.size) {
    const current = [...pending].sort(
      (a, b) => (distances.get(a) ?? Infinity) - (distances.get(b) ?? Infinity),
    )[0];
    const distance = distances.get(current);
    if (distance === undefined) break;
    if (current === destination) return paths.get(current)!;
    pending.delete(current);
    for (const route of routesAt(g, current)) {
      const next = route.to;
      if (!next || !pending.has(next)) continue;
      const candidate = distance + route.seconds;
      if (candidate < (distances.get(next) ?? Infinity)) {
        distances.set(next, candidate);
        paths.set(next, [...paths.get(current)!, { ...route, from: current, to: next }]);
      }
    }
  }
  return [];
}
