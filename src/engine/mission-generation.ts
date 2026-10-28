import type { ActivityDef, Amounts, GameDefinition, MissionDef } from './types';

type Axis = 'origin' | 'condition' | 'opportunity' | 'complication';
export interface FollowUpTemplate {
  id: string;
  name: string;
  description: string;
  actionName: string;
  actionDescription: string;
  whenAny?: Partial<Record<Axis, string[]>>;
  skill: string;
  requireSkill?: boolean;
  seconds: number;
  cost: Amounts;
  reward: Amounts;
  reputation: number;
}
export interface FollowUpRecipe {
  sourceLine: string;
  templates: FollowUpTemplate[];
}
/** Create deterministic follow-ups from discovered-site context; availability is checked separately. */
export function generateFollowUps(
  game: GameDefinition,
  recipe: FollowUpRecipe,
): { missions: MissionDef[]; activities: ActivityDef[] } {
  const missions: MissionDef[] = [],
    activities: ActivityDef[] = [];
  for (const site of game.sites ?? []) {
    const template = recipe.templates.find(
      (entry) =>
        !entry.whenAny ||
        Object.entries(entry.whenAny).some(([axis, ids]) => ids.includes(site[axis as Axis].id)),
    );
    if (!template) throw Error(`No follow-up template for ${site.id}.`);
    const location = game.locations.find((entry) => entry.id === site.location)!;
    const faction =
      game.factions.find((entry) => entry.id === location.faction) ?? game.factions[0];
    const values = { site: site.name, location: location.name, faction: faction.name };
    const text = (source: string) =>
      source.replace(/\{(site|location|faction)\}/g, (_, key: keyof typeof values) => values[key]);
    const id = `follow-up:${site.id}:${template.id}`,
      activity = `work:${id}`;
    missions.push({
      id,
      sourceSite: site.id,
      name: text(template.name),
      description: `${text(template.description)} ${text(recipe.sourceLine)}`,
      faction: faction.id,
      objective: { kind: activity, target: location.id, count: 1 },
      reward: structuredClone(template.reward),
      reputation: template.reputation,
    });
    activities.push({
      id: activity,
      mission: id,
      name: text(template.actionName),
      description: text(template.actionDescription),
      locations: [location.id],
      at: 'field',
      slot: 'primary',
      requiresSurvey: true,
      repeatable: false,
      seconds: template.seconds,
      cost: structuredClone(template.cost),
      reward: {},
      skill: template.skill,
      ...(template.requireSkill ? { requirements: [{ skill: template.skill, count: 1 }] } : {}),
    });
  }
  return { missions, activities };
}
