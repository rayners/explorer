import { generator } from './random';
import { connectedGraph, type GraphEdge } from './topology';
import type { Amounts, LocationDef, RegionDef, RouteDef } from './types';

export interface PlaceRecipe {
  kind: string;
  description: string;
  color: string;
  yields: Amounts;
  danger: number;
}
export interface WorldRecipe {
  regions: { subtitle: string; color: string }[];
  hub: Omit<PlaceRecipe, 'yields' | 'danger'>;
  fields: PlaceRecipe[];
  factions: string[];
  protectedRoutes: { from: string; to: string }[];
  local: { seconds: number[]; days: number[]; cost: Amounts; risk: number };
  crossing: { seconds: number[]; days: number[]; cost: Amounts; risk: number };
}
/** Reconstruct a bounded world with a protected authored spine and seeded optional geography. */
export function generateWorld(
  seed: number,
  namespace: string,
  original: { regions: RegionDef[]; locations: LocationDef[]; routes: RouteDef[] },
  recipe: WorldRecipe,
): typeof original {
  const world = structuredClone(original);
  const random = (domain: string) => {
    let hash = 2166136261;
    for (const c of `${namespace}:${domain}`) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619);
    return generator((seed ^ hash) >>> 0);
  };
  const population = random('population');
  const count = Math.floor(population() * 3);
  for (let i = 0; i < count; i++) {
    const style = recipe.regions[Math.floor(population() * recipe.regions.length)];
    world.regions.push({ id: `generated-region-${i}`, name: '', ...style, x: 0, y: 0 });
  }
  const authoredRegions = new Set(original.regions.map((r) => r.id));
  for (const region of world.regions) {
    const roll = random(`places:${region.id}`);
    const faction = recipe.factions[Math.floor(roll() * recipe.factions.length)];
    const addedRegion = !authoredRegions.has(region.id);
    if (addedRegion)
      world.locations.push({
        id: `${region.id}-hub`,
        region: region.id,
        name: '',
        ...recipe.hub,
        faction,
        station: true,
        initiallyKnown: false,
        sites: [],
        yields: {},
        danger: 0,
      });
    const fields = addedRegion ? 2 + Math.floor(roll() * 2) : Math.floor(roll() * 2);
    for (let i = 0; i < fields; i++) {
      const style = recipe.fields[Math.floor(roll() * recipe.fields.length)];
      world.locations.push({
        id: `${region.id}-generated-${i}`,
        region: region.id,
        name: '',
        ...structuredClone(style),
        faction,
        station: false,
        initiallyKnown: false,
        sites: ['0', '1', '2'],
      });
    }
  }
  // A regular chart gives each label room; the topology, rather than proximity, determines travel.
  const rows = Math.ceil(world.regions.length / 2);
  world.regions.forEach((region, i) => {
    region.x = i % 2 ? 72 : 27;
    region.y = 20 + Math.floor(i / 2) * (60 / Math.max(1, rows - 1));
  });
  const protectedRoutes = recipe.protectedRoutes.map((edge) => {
    const route = original.routes.find(
      (r) =>
        (r.from === edge.from && r.to === edge.to) || (r.to === edge.from && r.from === edge.to),
    );
    if (!route) throw Error('A protected world route is missing.');
    return route;
  });
  const routes: RouteDef[] = [];
  const route = (edge: GraphEdge, interregional: boolean) => {
    const protectedRoute = protectedRoutes.find(
      (r) =>
        (r.from === edge.from && r.to === edge.to) || (r.to === edge.from && r.from === edge.to),
    );
    if (protectedRoute) {
      routes.push(structuredClone(protectedRoute));
      return;
    }
    const style = interregional ? recipe.crossing : recipe.local;
    const roll = random(`route:${edge.from}:${edge.to}`);
    const index = Math.floor(roll() * style.seconds.length);
    routes.push({
      ...edge,
      interregional,
      seconds: style.seconds[index],
      days: style.days[index],
      cost: { ...style.cost },
      risk: style.risk,
    });
  };
  for (const region of world.regions) {
    const ids = world.locations.filter((l) => l.region === region.id).map((l) => l.id);
    const required = protectedRoutes.filter((r) => !r.interregional && ids.includes(r.from));
    for (const edge of connectedGraph(seed, `${namespace}:local:${region.id}`, ids, required, 0.25))
      route(edge, false);
  }
  const regionOf = (id: string) => world.locations.find((l) => l.id === id)!.region;
  const required = protectedRoutes
    .filter((r) => r.interregional)
    .map((r) => ({ from: regionOf(r.from), to: regionOf(r.to) }));
  for (const edge of connectedGraph(
    seed,
    `${namespace}:regions`,
    world.regions.map((r) => r.id),
    required,
    0.15,
  )) {
    const fixed = protectedRoutes.find(
      (r) =>
        r.interregional &&
        ((regionOf(r.from) === edge.from && regionOf(r.to) === edge.to) ||
          (regionOf(r.to) === edge.from && regionOf(r.from) === edge.to)),
    );
    if (fixed) {
      routes.push(structuredClone(fixed));
      continue;
    }
    // Arrive at a hub; a field departure gives surveys a meaningful outbound discovery.
    const departures = world.locations.filter((l) => l.region === edge.from && !l.station);
    const roll = random(`gateway:${edge.from}:${edge.to}`);
    const from = departures[Math.floor(roll() * departures.length)].id;
    const to = world.locations.find((l) => l.region === edge.to && l.station)!.id;
    route({ from, to }, true);
  }
  return { ...world, routes };
}
