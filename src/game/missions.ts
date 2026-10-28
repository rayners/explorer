import type { FollowUpRecipe } from '../engine/mission-generation';
/** Additive v1 follow-up catalog for frozen generation-3 sites. Retain its identities. */
export const scienceFictionFollowUps: FollowUpRecipe = {
  sourceLine:
    'Source: {site} at {location}. Recipient: {faction}. Accept at a station, return to this location for field work, then file at any station for payment and standing.',
  templates: [
    {
      id: 'restore',
      name: 'Restore access at {location}: {site}',
      description:
        'The initial expedition identified damaged field systems. An engineer can restore access and certify the installation for its owner.',
      actionName: 'Restore field systems — {site}',
      actionDescription:
        'At {location}, an expedition engineer stabilizes the damaged access systems at {site}. Bring spare parts; payment follows station filing.',
      whenAny: { origin: ['industrial'], condition: ['unstable'], complication: ['systems'] },
      skill: 'engineering',
      requireSkill: true,
      seconds: 90,
      cost: { parts: 3, provisions: 1 },
      reward: { credits: 210, parts: 1 },
      reputation: 8,
    },
    {
      id: 'archive',
      name: 'Complete the record at {location}: {site}',
      description:
        'The recovered index points to records left behind. A survey specialist can recover and authenticate the complete archive.',
      actionName: 'Recover archive — {site}',
      actionDescription:
        'Return to {site} at {location}. An expedition survey specialist authenticates the remaining records for {faction}.',
      whenAny: { origin: ['research'], opportunity: ['archive'] },
      skill: 'survey',
      requireSkill: true,
      seconds: 80,
      cost: { provisions: 2 },
      reward: { credits: 190 },
      reputation: 7,
    },
    {
      id: 'resupply',
      name: 'Replenish stores at {location}: {site}',
      description:
        'The recovered stores were useful, but their empty cache still serves the route. Deliver replacement provisions and a maintenance bundle.',
      actionName: 'Replenish field cache — {site}',
      actionDescription:
        'Carry replacement stores to {site} at {location}. The delivery receipt is filed with {faction} at a station.',
      whenAny: { opportunity: ['supplies'] },
      skill: 'engineering',
      seconds: 75,
      cost: { provisions: 4, parts: 1 },
      reward: { credits: 175, fuel: 2 },
      reputation: 9,
    },
    {
      id: 'recon',
      name: 'Assess traffic at {location}: {site}',
      description:
        'Recent traffic needs a closer assessment. Security should observe the approach and return a report; this is reconnaissance, not a contract to destroy a vessel.',
      actionName: 'Assess traffic — {site}',
      actionDescription:
        'Expedition security records traffic and checks the approaches to {site} at {location}. Ordinary field incidents may still occur.',
      whenAny: { condition: ['contested'], complication: ['hostile-signs'] },
      skill: 'security',
      requireSkill: true,
      seconds: 85,
      cost: { provisions: 2, ammo: 1 },
      reward: { credits: 185, ammo: 2 },
      reputation: 8,
    },
    {
      id: 'study',
      name: 'Extend the survey at {location}: {site}',
      description:
        'The first expedition found enough to justify a closer field study. Complete the measurements and bring the findings back.',
      actionName: 'Conduct field study — {site}',
      actionDescription:
        'Return to {site} at {location} and complete a second set of field measurements for {faction}.',
      skill: 'survey',
      seconds: 75,
      cost: { provisions: 2 },
      reward: { credits: 150 },
      reputation: 6,
    },
  ],
};
