import type { SiteRecipe } from '../engine/site-generation';
/** Frozen v3 site vocabulary and mechanics. Names remain on the v2 naming streams. */
export const scienceFictionSites: SiteRecipe = {
  seconds: 100,
  cost: { provisions: 2 },
  reward: { credits: 25, parts: 3, ore: 3 },
  protectedLocations: ['cinder'],
  cautious: {
    name: 'Cautious recovery',
    description:
      'Extra precautions reduce incident risk, taking longer and leaving some salvage behind.',
    cost: { provisions: 1 },
  },
  origins: [
    {
      id: 'outpost',
      name: 'Survey outpost',
      description: 'A small survey installation holds field records and standardized salvage.',
      weight: 3,
    },
    {
      id: 'industrial',
      name: 'Extraction plant',
      description: 'Processing machinery surrounds a worked deposit.',
      weight: 3,
      reward: { parts: 2, ore: 3 },
      seconds: 5,
      specialist: {
        skill: 'engineering',
        name: 'Engineering recovery',
        description:
          'An expedition engineer brings idle machinery online for a faster, more productive recovery.',
        cost: { parts: 1 },
      },
      eventWeights: { 'unseen-passenger': 0.5 },
    },
    {
      id: 'research',
      name: 'Research annex',
      description:
        'An automated research installation has continued collecting data without its owners.',
      weight: 2,
      reward: { credits: 15 },
      eventWeights: { 'unseen-passenger': 2, 'settlement-claim': 1.5 },
      specialist: {
        skill: 'survey',
        name: 'Scientific recovery',
        description: 'A survey specialist extracts a fuller record before the systems fail.',
      },
    },
    {
      id: 'wreck',
      name: 'Grounded wreck',
      description: 'A broken hull shelters freight and a partial navigation archive.',
      weight: 2,
      reward: { fuel: 2, parts: 1 },
      risk: 0.02,
      eventWeights: { 'settlement-claim': 2 },
    },
    {
      id: 'natural',
      name: 'Subsurface formation',
      description: 'Fractures expose unusual mineral deposits beneath the surface.',
      weight: 2,
      reward: { ore: 4, ice: 2 },
      locationKinds: ['Rocky planet', 'Icy moon', 'Asteroid field'],
      eventWeights: { 'settlement-claim': 0 },
    },
  ],
  conditions: [
    {
      id: 'intact',
      name: 'Intact',
      description: 'Accessways and structures remain usable.',
      weight: 4,
    },
    {
      id: 'depleted',
      name: 'Depleted',
      description: 'Earlier expeditions have stripped the obvious stores. Less remains to recover.',
      weight: 2,
      yieldFactor: 0.8,
      seconds: -10,
    },
    {
      id: 'unstable',
      name: 'Fractured',
      description: 'Structural damage slows the operation and raises incident risk.',
      weight: 2,
      seconds: 15,
      risk: 0.05,
    },
    {
      id: 'contested',
      name: 'Contested',
      description: 'Recent markings suggest other crews are still interested in the site.',
      weight: 1,
      risk: 0.06,
      eventWeights: { 'settlement-claim': 2 },
    },
  ],
  opportunities: [
    {
      id: 'salvage',
      name: 'Standard salvage',
      description: 'Ordinary parts and saleable records make this a practical stop.',
      weight: 3,
    },
    {
      id: 'supplies',
      name: 'Supply cache',
      description: 'Sealed stores can replenish the ship after recovery.',
      weight: 2,
      reward: { fuel: 3, provisions: 2 },
      eventWeights: { 'settlement-claim': 1.5 },
    },
    {
      id: 'archive',
      name: 'Records archive',
      description: 'The valuable return is a set of authenticated records.',
      weight: 2,
      reward: { credits: 30 },
      eventWeights: { 'settlement-claim': 2 },
    },
    {
      id: 'materials',
      name: 'Spare machinery',
      description: 'Recoverable mechanisms offer extra maintenance stock.',
      weight: 2,
      reward: { parts: 3 },
    },
  ],
  complications: [
    {
      id: 'clear',
      name: 'Clear access',
      description: 'The approach is straightforward.',
      weight: 4,
    },
    {
      id: 'seals',
      name: 'Unverified seals',
      description: 'Compartment seals have no current inspection record. Precautions take time.',
      weight: 2,
      seconds: 5,
      risk: 0.02,
      eventWeights: { 'unseen-passenger': 2 },
      specialist: {
        skill: 'medical',
        name: 'Controlled recovery',
        description:
          'An expedition medical officer supervises recovery with reduced incident risk and better sample handling.',
        cost: { provisions: 1 },
      },
    },
    {
      id: 'systems',
      name: 'Locked systems',
      description: 'Power and access controls complicate recovery.',
      weight: 2,
      seconds: 10,
      specialist: {
        skill: 'engineering',
        name: 'Engineering recovery',
        description:
          'An expedition engineer bypasses damaged controls and recovers more usable equipment.',
        cost: { parts: 1 },
      },
    },
    {
      id: 'hostile-signs',
      name: 'Unidentified activity',
      description: 'Unidentified traffic has passed through recently.',
      weight: 1,
      risk: 0.06,
      specialist: {
        skill: 'security',
        name: 'Secured recovery',
        description: 'Expedition security establishes a perimeter for a quicker, fuller recovery.',
        cost: { ammo: 1 },
      },
    },
  ],
};
