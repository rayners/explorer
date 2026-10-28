import type { SiteRecipe } from '../engine/site-generation';
/** The same generation mechanism with fantasy traits, roles and physical resources. */
export const fantasySites: SiteRecipe = {
  seconds: 90,
  cost: { rations: 2 },
  reward: { gold: 60, relics: 2 },
  protectedLocations: ['old-road'],
  cautious: {
    name: 'Cautious expedition',
    description:
      'Take longer, carry an extra ration, and leave the most precarious finds behind to reduce incident risk.',
    cost: { rations: 1 },
  },
  origins: [
    {
      id: 'waystation',
      name: 'Wayside shelter',
      description: 'An old shelter holds travel records and abandoned belongings.',
      weight: 3,
    },
    {
      id: 'shrine',
      name: 'Forgotten shrine',
      description: 'Offerings remain beneath faded signs of worship.',
      weight: 3,
      reward: { incense: 2 },
      specialist: {
        skill: 'cleric',
        name: 'Consecrated recovery',
        description:
          'An expedition cleric tends the shrine and gathers its relics with fewer incidents.',
        cost: { incense: 1 },
      },
    },
    {
      id: 'ruin',
      name: 'Buried hall',
      description: 'A former seat of learning lies beneath the roots.',
      weight: 2,
      reward: { relics: 2 },
      locationKinds: ['Ancient ruins', 'Ruined dungeon', 'Underground sanctuary'],
      specialist: {
        skill: 'mage',
        name: 'Arcane recovery',
        description:
          'An expedition mage reads the old signs and opens otherwise overlooked caches.',
        cost: { incense: 1 },
      },
    },
    {
      id: 'camp',
      name: 'Lost encampment',
      description: 'An abandoned camp holds stores intended for a company that never returned.',
      weight: 3,
      reward: { wood: 3, rations: 2 },
    },
    {
      id: 'natural',
      name: 'Root hollow',
      description: 'The living forest shelters valuable herbs and old remains.',
      weight: 2,
      reward: { herbs: 3 },
      locationKinds: ['Haunted forest', 'Abandoned village'],
      specialist: {
        skill: 'scout',
        name: 'Scout-led recovery',
        description:
          'An expedition scout identifies a safer route through the roots and more useful finds.',
      },
    },
  ],
  conditions: [
    {
      id: 'intact',
      name: 'Quiet',
      description: 'The surviving structures remain accessible.',
      weight: 4,
    },
    {
      id: 'depleted',
      name: 'Plundered',
      description: 'Earlier visitors have taken much of value. The return will be smaller.',
      weight: 2,
      yieldFactor: 0.8,
      seconds: -10,
    },
    {
      id: 'unstable',
      name: 'Crumbling',
      description: 'Loose stone and failing timber make the expedition slower and more hazardous.',
      weight: 2,
      seconds: 15,
      risk: 0.05,
    },
    {
      id: 'occupied',
      name: 'Watched',
      description: 'Recent tracks suggest another company has not abandoned its interest.',
      weight: 1,
      risk: 0.06,
    },
  ],
  opportunities: [
    {
      id: 'salvage',
      name: 'Travelers’ remnants',
      description: 'Ordinary relics and records offer a modest return.',
      weight: 3,
    },
    {
      id: 'supplies',
      name: 'Hidden stores',
      description: 'The company may replenish its supplies from sealed chests.',
      weight: 2,
      reward: { rations: 3, wood: 2 },
    },
    {
      id: 'lore',
      name: 'Forgotten lore',
      description: 'The records are worth more than the physical salvage.',
      weight: 2,
      reward: { gold: 30 },
    },
    {
      id: 'relics',
      name: 'Buried offerings',
      description: 'Ritual objects remain to be gathered.',
      weight: 2,
      reward: { relics: 2, incense: 1 },
    },
  ],
  complications: [
    {
      id: 'clear',
      name: 'Open passage',
      description: 'The path is clear enough for an ordinary expedition.',
      weight: 4,
    },
    {
      id: 'wards',
      name: 'Faded wards',
      description: 'Old wards and concealed doors slow the company.',
      weight: 2,
      seconds: 10,
      specialist: {
        skill: 'mage',
        name: 'Arcane recovery',
        description: 'An expedition mage safely unravels the wards and secures more of the site.',
        cost: { incense: 1 },
      },
    },
    {
      id: 'unstable-path',
      name: 'Broken trail',
      description: 'An uncertain path increases incident risk.',
      weight: 2,
      risk: 0.03,
      seconds: 5,
      specialist: {
        skill: 'scout',
        name: 'Scout-led recovery',
        description:
          'An expedition scout finds a better approach and additional recoverable supplies.',
      },
    },
    {
      id: 'hostile-signs',
      name: 'Oathless tracks',
      description: 'Tracks of hostile companies cross the route.',
      weight: 1,
      risk: 0.06,
      specialist: {
        skill: 'fighter',
        name: 'Guarded recovery',
        description:
          'An expedition fighter secures the approach so the company can recover more safely.',
        cost: { bolts: 1 },
      },
    },
  ],
};
