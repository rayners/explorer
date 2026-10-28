import { generator } from './random';
import type { Amounts, LocationDef, SiteDef } from './types';

/** Weighted, theme-owned ingredients for a reproducible site recipe. */
export interface SiteComponent {
  id: string;
  name: string;
  description: string;
  weight: number;
  locationKinds?: string[];
  seconds?: number;
  risk?: number;
  cost?: Amounts;
  reward?: Amounts;
  yieldFactor?: number;
  specialist?: { skill: string; name: string; description: string; cost?: Amounts };
  eventWeights?: Amounts;
}
export interface SiteRecipe {
  origins: SiteComponent[];
  conditions: SiteComponent[];
  opportunities: SiteComponent[];
  complications: SiteComponent[];
  seconds: number;
  cost: Amounts;
  reward: Amounts;
  protectedLocations: string[];
  cautious: { name: string; description: string; cost: Amounts };
}
function stream(seed: number, key: string) {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) hash = Math.imul(hash ^ key.charCodeAt(i), 16777619);
  return generator((seed ^ hash) >>> 0);
}
function pick(pool: SiteComponent[], location: LocationDef, roll: () => number): SiteComponent {
  const eligible = pool.filter(
    (entry) =>
      entry.weight > 0 && (!entry.locationKinds || entry.locationKinds.includes(location.kind)),
  );
  let value = roll() * eligible.reduce((total, entry) => total + entry.weight, 0);
  const result = eligible.find((entry) => (value -= entry.weight) < 0);
  if (!result) throw Error(`No eligible site component for ${location.id}.`);
  return result;
}
function sum(...amounts: (Amounts | undefined)[]): Amounts {
  const result: Amounts = {};
  for (const source of amounts)
    for (const [id, amount] of Object.entries(source ?? {}))
      result[id] = (result[id] ?? 0) + amount;
  return result;
}
const scale = (amounts: Amounts, factor: number): Amounts =>
  Object.fromEntries(
    Object.entries(amounts).map(([id, n]) => [id, Math.max(0, Math.floor(n * factor))]),
  );
/** Generate stable site identities and meaningful approaches without consuming outcome RNG. */
export function generateSites(
  seed: number,
  namespace: string,
  locations: LocationDef[],
  recipe: SiteRecipe,
): SiteDef[] {
  const sites: SiteDef[] = [];
  for (const location of locations.filter((location) => !location.station)) {
    for (let index = 0; index < location.sites.length; index++) {
      const id = `site:${location.id}:${index}`;
      const safe = recipe.protectedLocations.includes(location.id);
      const axes = [recipe.origins, recipe.conditions, recipe.opportunities, recipe.complications];
      const components = axes.map((pool, axis) =>
        safe ? pool[0] : pick(pool, location, stream(seed, `${namespace}:${id}:${axis}`)),
      );
      const [origin, condition, opportunity, complication] = components;
      const cost = sum(recipe.cost, ...components.map((part) => part.cost));
      const factor = components.reduce((value, part) => value * (part.yieldFactor ?? 1), 1);
      const reward = scale(sum(recipe.reward, ...components.map((part) => part.reward)), factor);
      const seconds = Math.max(
        30,
        recipe.seconds + components.reduce((n, part) => n + (part.seconds ?? 0), 0),
      );
      const risk = safe
        ? 0
        : Math.max(
            0,
            Math.min(
              0.45,
              location.danger + components.reduce((n, part) => n + (part.risk ?? 0), 0),
            ),
          );
      const specialist = [...components].reverse().find((part) => part.specialist)?.specialist;
      const trait = (entry: SiteComponent) => ({ id: entry.id, name: entry.name });
      const eventWeights: Amounts = {};
      for (const part of components)
        for (const [event, weight] of Object.entries(part.eventWeights ?? {}))
          eventWeights[event] = (eventWeights[event] ?? 1) * weight;
      sites.push({
        id,
        location: location.id,
        name: `${condition.name} ${origin.name.toLowerCase()} ${index + 1}`,
        description: components.map((part) => part.description).join(' '),
        origin: trait(origin),
        condition: trait(condition),
        opportunity: trait(opportunity),
        complication: trait(complication),
        eventWeights,
        approaches: [
          {
            id: 'direct',
            name: 'Direct expedition',
            description: 'Recover the available findings at the normal pace.',
            cost,
            reward,
            seconds,
            risk,
          },
          {
            id: 'cautious',
            name: recipe.cautious.name,
            description: recipe.cautious.description,
            cost: sum(cost, recipe.cautious.cost),
            reward: scale(reward, 0.85),
            seconds: Math.ceil(seconds * 1.35),
            risk: risk * 0.35,
          },
          ...(specialist
            ? [
                {
                  id: 'specialist',
                  name: specialist.name,
                  description: specialist.description,
                  cost: sum(cost, specialist.cost),
                  reward: scale(reward, 1.3),
                  seconds: Math.ceil(seconds * 0.8),
                  risk: risk * 0.6,
                  requirements: [{ skill: specialist.skill, count: 1 }],
                },
              ]
            : []),
        ],
      });
    }
  }
  return sites;
}
