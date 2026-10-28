import type { ActivityDef, Amounts, GameDefinition, MissionDef } from './types';

export interface ProjectBranch {
  incident: string;
  choice: string;
  choiceDescription?: string;
  faction: string;
  name: string;
  description: string;
  work: string;
  skill: string;
  seconds: number;
  cost: Amounts;
  reward: Amounts;
  reputation: number;
}
/** A bounded potential catalog. Only an exact settled ledger record exposes its branch. */
export function generateProjects(game: GameDefinition, branches: ProjectBranch[]) {
  const missions: MissionDef[] = [],
    activities: ActivityDef[] = [];
  for (const branch of branches) {
    const incident = game.discoveryEvents?.entries.find((event) => event.id === branch.incident);
    if (!incident || incident.kind !== 'choice')
      throw Error(`Unknown project incident: ${branch.incident}`);
    const choice = incident.choices.find((choice) => choice.id === branch.choice);
    const faction = game.factions.find((faction) => faction.id === branch.faction);
    if (!choice || !faction) throw Error('Invalid project choice or patron.');
    for (const site of game.sites ?? []) {
      if (incident.locations && !incident.locations.includes(site.location)) continue;
      const location = game.locations.find((location) => location.id === site.location)!;
      const id = `project:${site.id}:${branch.incident}:${branch.choice}`,
        activity = `work:${id}`;
      missions.push({
        id,
        name: `${branch.name} — ${location.name}`,
        description: `${branch.description} Origin: “${incident.title}” → “${choice.name}” at ${site.name}, ${location.name}. Patron: ${faction.name}. Return to this source for field work, then file at any service hub.`,
        sourceSite: site.id,
        discoveryChoice: { incident: branch.incident, choice: branch.choice },
        faction: faction.id,
        objective: { kind: activity, target: location.id, count: 1 },
        reward: structuredClone(branch.reward),
        reputation: branch.reputation,
      });
      activities.push({
        id: activity,
        mission: id,
        name: `${branch.work} — ${site.name}`,
        description: `${branch.description} Source: ${site.name} at ${location.name}. Patron: ${faction.name}. Supplies are committed on dispatch; file the receipt at a service hub for payment.`,
        locations: [location.id],
        at: 'field',
        slot: 'primary',
        requiresSurvey: true,
        repeatable: false,
        seconds: branch.seconds,
        cost: structuredClone(branch.cost),
        reward: {},
        skill: branch.skill,
        requirements: [{ skill: branch.skill, count: 1 }],
      });
    }
  }
  return { missions, activities };
}
