import type { DiscoveryChoice, GameDefinition } from '../engine/types';
import { generateProjects, type ProjectBranch } from '../engine/project-generation';
import { nameReferences } from './names';
export interface VarietyTheme {
  protectedLocation: string;
  events: {
    id: string;
    title: string;
    description: string;
    minimumSites: number;
    choices: DiscoveryChoice[];
  }[];
  projects: ProjectBranch[];
}
/** Frozen generation-7 additions. Prior catalogs and outcome streams are reconstructed unchanged. */
export function finishVariety(game: GameDefinition, theme: VarietyTheme): GameDefinition {
  if (game.generationVersion < 7) return game;
  const locations = game.locations
    .filter((location) => !location.station && location.id !== theme.protectedLocation)
    .map((location) => location.id);
  const events = theme.events.map((event) => ({
    ...event,
    title: nameReferences(game, event.title),
    description: nameReferences(game, event.description),
    kind: 'choice' as const,
    at: 'station' as const,
    weight: 1,
    locations: [...locations],
    choices: event.choices.map((choice) => ({
      ...structuredClone(choice),
      description: nameReferences(game, choice.description),
      name: nameReferences(game, choice.name),
    })),
  }));
  const expanded: GameDefinition = {
    ...game,
    discoveryEvents: {
      ...game.discoveryEvents!,
      entries: [...(game.discoveryEvents?.entries ?? []), ...events],
    },
  };
  const generated = generateProjects(expanded, theme.projects);
  return {
    ...expanded,
    missions: [...expanded.missions, ...generated.missions],
    activities: [...expanded.activities, ...generated.activities],
  };
}
