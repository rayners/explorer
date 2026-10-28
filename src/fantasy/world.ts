import type { WorldRecipe } from '../engine/world-generation';
export const fantasyWorld: WorldRecipe = {
  regions: [
    { subtitle: 'Beyond the last boundary stones', color: '#91a17b' },
    { subtitle: 'Beneath a forgotten barony', color: '#b39baf' },
    { subtitle: 'A road the living abandoned', color: '#bea367' },
  ],
  hub: {
    kind: 'Forest refuge',
    description:
      'A bell hangs over the palisade. The watch offers hot food, tools and a place by the fire, provided no one rings it after midnight.',
    color: '#9dab7c',
  },
  fields: [
    {
      kind: 'Haunted forest',
      description:
        'Lantern moths follow a path through the roots. Every fallen tree bears the same wound, at the height of a human heart.',
      color: '#6e8c72',
      yields: { wood: 10, herbs: 5 },
      danger: 0.14,
    },
    {
      kind: 'Ancient ruins',
      description:
        'Rainwater gathers in a circle of broken altars. Fresh offerings rest beneath inscriptions no one admits to reading.',
      color: '#a7a18c',
      yields: { incense: 4, relics: 3 },
      danger: 0.17,
    },
    {
      kind: 'Ruined dungeon',
      description:
        'The steps lead below a lordless keep. Something has mended the iron doors from the inside, using silver wire and hair.',
      color: '#a29baf',
      yields: { relics: 5, wood: 3 },
      danger: 0.18,
    },
    {
      kind: 'Abandoned village',
      description:
        'The well is covered and the gardens are neatly weeded. No footprints cross the mud between the houses.',
      color: '#9d8b6e',
      yields: { wood: 9, herbs: 4 },
      danger: 0.12,
    },
  ],
  factions: ['wardens', 'covenant', 'court'],
  protectedRoutes: [
    { from: 'mournwatch', to: 'old-road' },
    { from: 'old-road', to: 'ash-camp' },
  ],
  local: { seconds: [45, 60, 75], days: [0.2, 0.4, 0.6], cost: { rations: 1 }, risk: 0.03 },
  crossing: {
    seconds: [180, 210, 240],
    days: [2, 3, 4],
    cost: { rations: 3, incense: 1 },
    risk: 0.12,
  },
};
