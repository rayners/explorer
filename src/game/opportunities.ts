import type { OpportunityTheme } from '../content/opportunities';
export const scienceFictionOpportunities: OpportunityTheme = {
  protectedLocation: 'cinder',
  recruit: 'engineer',
  skill: 'engineering',
  faction: 'independent',
  rescue: {
    title: 'A berth outside the manifest',
    description:
      'A rescue pod carries an engineer whose contract expired during cryosleep. The nearest {faction:independent} habitat will arrange resettlement, or the Kestrel can offer a berth.',
    join: 'Offer an engineering berth',
    resettle: 'Arrange habitat resettlement',
  },
  knowledge: {
    title: 'Maintenance beyond the manual',
    description:
      'A recovered service archive describes field repairs withheld from the company handbook. It could improve engineering practice aboard the Kestrel, or be released to {faction:independent}.',
    study: 'Study the service archive',
    release: 'Release the maintenance archive',
  },
};
