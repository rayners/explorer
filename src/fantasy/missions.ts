import type { FollowUpRecipe } from '../engine/mission-generation';
export const fantasyFollowUps: FollowUpRecipe = {
  sourceLine:
    'Source: {site} at {location}. Patron: {faction}. Accept at a refuge, return to this place for the work, then report at any refuge for payment and standing.',
  templates: [
    {
      id: 'consecrate',
      name: 'Renew the rites at {location}: {site}',
      description:
        'The expedition found a neglected sacred place. A cleric can restore its rites and record what the offerings reveal.',
      actionName: 'Renew the rites — {site}',
      actionDescription:
        'An expedition cleric returns to {site} at {location}, restores its rites and prepares a report for {faction}.',
      whenAny: { origin: ['shrine'], opportunity: ['relics'] },
      skill: 'cleric',
      requireSkill: true,
      seconds: 80,
      cost: { incense: 2, rations: 1 },
      reward: { gold: 180, incense: 2 },
      reputation: 8,
    },
    {
      id: 'path',
      name: 'Restore the path at {location}: {site}',
      description:
        'The damaged route deserves more than a passing expedition. A scout can reopen safe access and mark the path.',
      actionName: 'Restore the path — {site}',
      actionDescription:
        'An expedition scout uses tools and timber to reopen the route to {site} at {location}. Report the result to {faction}.',
      whenAny: { condition: ['unstable'], complication: ['unstable-path'] },
      skill: 'scout',
      requireSkill: true,
      seconds: 85,
      cost: { wood: 3, rations: 1 },
      reward: { gold: 175, rations: 2 },
      reputation: 8,
    },
    {
      id: 'lore',
      name: 'Recover lore at {location}: {site}',
      description:
        'The first findings hint at a fuller text. A mage can decipher the remaining signs and return with a reliable account.',
      actionName: 'Recover the lore — {site}',
      actionDescription:
        'An expedition mage studies the remaining signs at {site} in {location} for {faction}.',
      whenAny: { origin: ['ruin'], opportunity: ['lore'], complication: ['wards'] },
      skill: 'mage',
      requireSkill: true,
      seconds: 80,
      cost: { incense: 1, rations: 2 },
      reward: { gold: 185, relics: 2 },
      reputation: 7,
    },
    {
      id: 'resupply',
      name: 'Replenish stores at {location}: {site}',
      description:
        'Travelers still need the cache discovered here. Deliver new provisions and tools to keep the route supplied.',
      actionName: 'Replenish the cache — {site}',
      actionDescription:
        'Carry replacement stores to {site} at {location}. Return to a refuge with the delivery receipt for {faction}.',
      whenAny: { opportunity: ['supplies'] },
      skill: 'fighter',
      seconds: 75,
      cost: { rations: 4, wood: 1 },
      reward: { gold: 170, herbs: 2 },
      reputation: 9,
    },
    {
      id: 'recon',
      name: 'Watch the road at {location}: {site}',
      description:
        'Tracks of other companies warrant a watch. Observe their passage and return a report; no battle victory is required.',
      actionName: 'Watch the approaches — {site}',
      actionDescription:
        'An expedition fighter watches the approaches to {site} at {location} and records the companies passing through.',
      whenAny: { condition: ['occupied'], complication: ['hostile-signs'] },
      skill: 'fighter',
      requireSkill: true,
      seconds: 85,
      cost: { bolts: 1, rations: 2 },
      reward: { gold: 180, bolts: 2 },
      reputation: 8,
    },
    {
      id: 'study',
      name: 'Trace the old paths at {location}: {site}',
      description:
        'The first expedition left questions about the old route. Return and make a fuller account for the patron.',
      actionName: 'Trace the old paths — {site}',
      actionDescription:
        'Return to {site} at {location} and follow the remaining boundary signs for {faction}.',
      skill: 'fighter',
      seconds: 75,
      cost: { rations: 2 },
      reward: { gold: 150 },
      reputation: 6,
    },
  ],
};
