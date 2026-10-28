import type { WorldRecipe } from '../engine/world-generation';
export const scienceFictionWorld: WorldRecipe = {
  regions: [
    { subtitle: 'Unlicensed survey corridor', color: '#8aaab3' },
    { subtitle: 'Distant company concession', color: '#bb8c96' },
    { subtitle: 'Fragmented habitat network', color: '#91ad8b' },
  ],
  hub: {
    kind: 'Orbital station',
    description:
      'A rotating habitat built from retired freighters. Its tanks, machine shop and contract office remain open through the long communications delay.',
    color: '#89abb0',
  },
  fields: [
    {
      kind: 'Rocky planet',
      description:
        'A dry basin beneath an indifferent sun. Automated prospectors have gone silent, leaving their survey markers and mineral claims behind.',
      color: '#c28b6b',
      yields: { ore: 11, ice: 2 },
      danger: 0.16,
    },
    {
      kind: 'Icy moon',
      description:
        'Tidal fractures expose clean ice around a shuttered extraction rig. An old thermal trace persists under its landing pad.',
      color: '#8ab5c3',
      yields: { ice: 12, ore: 2 },
      danger: 0.14,
    },
    {
      kind: 'Asteroid field',
      description:
        'Cold rubble drifts around a derelict transfer stage. Identical corporate seals have been painted over in several different colors.',
      color: '#a49c88',
      yields: { ore: 12, parts: 2 },
      danger: 0.2,
    },
  ],
  factions: ['combine', 'independent', 'pirates'],
  protectedRoutes: [
    { from: 'anchor', to: 'cinder' },
    { from: 'cinder', to: 'pale-0' },
  ],
  local: { seconds: [60, 75, 90], days: [4, 6, 8], cost: { fuel: 4, provisions: 1 }, risk: 0.04 },
  crossing: {
    seconds: [900, 1200, 1500],
    days: [1461, 2192, 2922],
    cost: { fuel: 24, provisions: 3 },
    risk: 0.13,
  },
};
