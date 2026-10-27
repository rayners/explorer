import type { GameDefinition, GameState, RouteDef } from './types';

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
    for (const route of g.routes) {
      const next = route.from === current ? route.to : route.to === current ? route.from : null;
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
