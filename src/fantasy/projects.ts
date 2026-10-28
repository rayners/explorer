import type { ProjectBranch } from '../engine/project-generation';
export const fantasyProjects: ProjectBranch[] = [
  {
    incident: 'stranded-specialist',
    choice: 'join',
    faction: 'covenant',
    name: 'Restore the pathfinder’s vigil',
    work: 'Consecrate the abandoned shelter',
    description:
      'Welcoming the pathfinder reveals a shelter that still draws the lost. A cleric can cleanse its threshold and restore its vigil for the Covenant.',
    skill: 'cleric',
    seconds: 105,
    cost: { incense: 3, herbs: 2 },
    reward: { gold: 220 },
    reputation: 9,
  },
  {
    incident: 'stranded-specialist',
    choice: 'resettle',
    faction: 'wardens',
    name: 'Keep the homeward path',
    work: 'Establish wayfarer caches',
    description:
      'Guiding the pathfinder home exposes a gap in the watch’s relief route. A fighter escorts food and timber to mark a safer passage.',
    skill: 'fighter',
    seconds: 90,
    cost: { rations: 4, wood: 3 },
    reward: { gold: 200, herbs: 1 },
    reputation: 11,
  },
  {
    incident: 'recovered-methods',
    choice: 'study',
    faction: 'court',
    name: 'Rekindle the elder ward',
    work: 'Test the annotated ward',
    description:
      'The grimoire’s annotations suggest an older binding beneath the ruins. A mage must test it with fresh incense and return the reading to the veiled court.',
    skill: 'mage',
    seconds: 120,
    cost: { incense: 4, rations: 1 },
    reward: { gold: 250 },
    reputation: 8,
  },
  {
    incident: 'recovered-methods',
    choice: 'release',
    faction: 'wardens',
    name: 'Carry the watch’s warning',
    work: 'Mark the ward boundaries',
    description:
      'The watch has copied the released grimoire into warnings for travelers. A fighter carries markers and provisions to the dangerous boundary.',
    skill: 'fighter',
    seconds: 85,
    cost: { wood: 2, rations: 3, bolts: 1 },
    reward: { gold: 210 },
    reputation: 11,
  },
];
