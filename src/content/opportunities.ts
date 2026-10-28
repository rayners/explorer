import type { DiscoveryEventDef, GameDefinition } from '../engine/types';
import { nameReferences } from './names';
export interface OpportunityTheme {
  protectedLocation: string;
  recruit: string;
  skill: string;
  rescue: { title: string; description: string; join: string; resettle: string };
  knowledge: { title: string; description: string; study: string; release: string };
  faction: string;
}
/** Frozen generation-5 opportunities are additive to the frozen generation-4 world. */
export function finishOpportunities(game: GameDefinition, theme: OpportunityTheme): GameDefinition {
  if (game.generationVersion < 5) return game;
  const locations = game.locations
    .filter((l) => !l.station && l.id !== theme.protectedLocation)
    .map((l) => l.id);
  const resolve = (text: string) => nameReferences(game, text);
  const entries: DiscoveryEventDef[] = [
    {
      id: 'stranded-specialist',
      title: theme.rescue.title,
      description: resolve(theme.rescue.description),
      kind: 'choice',
      at: 'station',
      minimumSites: 4,
      weight: 1,
      locations,
      choices: [
        {
          id: 'join',
          name: theme.rescue.join,
          description:
            'Offer a permanent place after reaching a service hub. One accommodation place is required; they join resting. No recruitment fee.',
          reward: {},
          reputation: {},
          recruit: theme.recruit,
        },
        {
          id: 'resettle',
          name: theme.rescue.resettle,
          description: resolve(
            'Arrange safe resettlement with {faction:' +
              theme.faction +
              '}. No accommodation is required.',
          ),
          reward: { [game.rules.currency]: 70 },
          reputation: { [theme.faction]: 8 },
        },
      ],
    },
    {
      id: 'recovered-methods',
      title: theme.knowledge.title,
      description: resolve(theme.knowledge.description),
      kind: 'choice',
      at: 'station',
      minimumSites: 4,
      weight: 1,
      locations,
      choices: [
        {
          id: 'study',
          name: theme.knowledge.study,
          description:
            'Add four practice points to each living specialist in the named discipline, up to the limit of 30. Resting or working members can study; paid orders retain their original terms.',
          reward: {},
          reputation: {},
          training: { skill: theme.skill, points: 4 },
        },
        {
          id: 'release',
          name: theme.knowledge.release,
          description: resolve(
            'Release the recovered knowledge to {faction:' +
              theme.faction +
              '}. The payment and standing are applied once.',
          ),
          reward: { [game.rules.currency]: 120 },
          reputation: { [theme.faction]: 10 },
        },
      ],
    },
  ];
  return {
    ...game,
    discoveryEvents: {
      chance: game.discoveryEvents?.chance ?? 0.3,
      cooldown: 2,
      entries: [...(game.discoveryEvents?.entries ?? []), ...entries],
    },
  };
}
