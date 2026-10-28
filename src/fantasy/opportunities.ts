import type { OpportunityTheme } from '../content/opportunities';
export const fantasyOpportunities: OpportunityTheme = {
  protectedLocation: 'old-road',
  recruit: 'scout',
  skill: 'mage',
  faction: 'wardens',
  rescue: {
    title: 'The lantern beyond the trees',
    description:
      'A lost pathfinder has kept a light burning in a ruined shelter. {faction:wardens} will guide them home, or the company can offer a permanent place by its fire.',
    join: 'Welcome the pathfinder',
    resettle: 'Guide the pathfinder home',
  },
  knowledge: {
    title: 'Annotations in the old tongue',
    description:
      'Notes in an abandoned grimoire explain how to read the forest’s older wards. The company’s mages could study them, or preserve them in the keeping of {faction:wardens}.',
    study: 'Study the annotated grimoire',
    release: 'Entrust the grimoire to the watch',
  },
};
