import { it, expect } from 'vitest';
import type { GameDefinition } from '../src/engine/types';
import { createState, dispatch, advance, view } from '../src/engine/simulation';
import { encodeSave, decodeSave } from '../src/engine/save';
const definition: GameDefinition = {
  id: 'gaslight',
  generationVersion: 1,
  title: 'The Lamplighter',
  regions: [
    { id: 'london', name: 'London', subtitle: 'November fog', x: 0, y: 0, color: '#aaaaaa' },
  ],
  locations: [
    {
      id: 'office',
      region: 'london',
      name: 'Detective agency',
      kind: 'Office',
      description: 'A letter waits.',
      station: true,
      initiallyKnown: true,
      sites: [],
      yields: {},
      danger: 0,
      color: '#aaa',
      faction: 'society',
    },
    {
      id: 'docks',
      region: 'london',
      name: 'Limehouse',
      kind: 'District',
      description: 'Footsteps in the fog.',
      station: false,
      initiallyKnown: true,
      sites: ['The locked warehouse'],
      yields: { evidence: 2 },
      danger: 0,
      color: '#aaa',
    },
  ],
  routes: [
    {
      from: 'office',
      to: 'docks',
      seconds: 30,
      days: 0,
      cost: { fares: 1 },
      risk: 0,
      interregional: false,
    },
  ],
  resources: [
    { id: 'shillings', name: 'Shillings', unit: 's', mass: 0, price: 1, description: '' },
    { id: 'fares', name: 'Carriage fares', unit: 'tickets', mass: 0, price: 2, description: '' },
    { id: 'evidence', name: 'Evidence', unit: 'items', mass: 1, price: 1, description: '' },
  ],
  activities: [
    {
      id: 'investigate',
      name: 'Investigate',
      description: 'Question the witnesses.',
      seconds: 20,
      slot: 'primary',
      cost: {},
      reward: { evidence: 1 },
      skill: 'deduction',
      repeatable: false,
      at: 'field',
    },
  ],
  missions: [
    {
      id: 'warehouse',
      name: 'The missing clerk',
      description: 'Investigate Limehouse.',
      faction: 'society',
      objective: { kind: 'investigate', target: 'docks', count: 1 },
      reward: { shillings: 5 },
      reputation: 2,
    },
  ],
  factions: [
    { id: 'society', name: 'The Society', description: '', color: '#aaa' },
    { id: 'gang', name: 'Dockside gang', description: '', color: '#aaa' },
  ],
  initial: {
    location: 'office',
    inventory: { shillings: 10, fares: 3, evidence: 0 },
    capacity: 10,
    crew: [{ id: 'ada', name: 'Ada Finch', skill: 'deduction', assignment: 'primary', injury: 0 }],
  },
  rules: {
    oppositionFaction: 'gang',
    combatSkill: 'deduction',
    aidActivity: 'assist',
    currency: 'shillings',
    supplies: 'fares',
    ammunition: 'evidence',
    materials: 'evidence',
    travelResource: 'fares',
    surveyActivity: 'investigate',
    exploreActivity: 'inspect',
    gatherActivity: 'collect',
    raidActivity: 'confront',
    workActivity: 'consult',
    startingYear: 1891,
    recoverySeconds: 30,
    recoveryDebt: 5,
  },
  upgrades: [],
};
it('runs a different genre through the documented public engine interface', () => {
  let s = createState(definition, 1);
  s = dispatch(definition, s, { type: 'accept', id: 'warehouse' }).state;
  s = dispatch(definition, s, { type: 'travel', target: 'docks' }).state;
  s = advance(definition, s, 30);
  expect(view(definition, s).location.name).toBe('Limehouse');
  s = dispatch(definition, s, { type: 'activity', id: 'investigate' }).state;
  s = advance(definition, s, 20);
  expect(s.inventory.evidence).toBe(1);
  expect(s.missions[0].progress).toBe(1);
  expect(decodeSave(encodeSave(s, 100), () => definition).state).toEqual(s);
  s = dispatch(definition, s, { type: 'travel', target: 'office' }).state;
  s = advance(definition, s, 30);
  s = dispatch(definition, s, { type: 'claim', id: 'warehouse' }).state;
  expect(s.inventory.shillings).toBe(15);
});
