import { finishNamedDefinition } from '../content/names';
import { scienceFictionNames } from './names';
import type { GameDefinition, LocationDef, MissionDef, RouteDef } from '../engine/types';
import { generator } from '../engine/random';
/** Stable frontier geography; generation v1 retains authored names, v2 generates display names. */
export function createGame(seed = 1701, generationVersion = 2): GameDefinition {
  const rng = generator(seed);
  const regions = [
    {
      id: 'vesper',
      name: 'Vesper',
      subtitle: 'Company space · charted',
      x: 20,
      y: 57,
      color: '#d7a979',
    },
    {
      id: 'pale',
      name: 'Pale Reach',
      subtitle: 'Outer survey corridor',
      x: 44,
      y: 29,
      color: '#8aaab3',
    },
    {
      id: 'meridian',
      name: 'Meridian',
      subtitle: 'Independent holdings',
      x: 65,
      y: 65,
      color: '#91ad8b',
    },
    {
      id: 'hollow',
      name: 'The Hollow',
      subtitle: 'Unverified transmissions',
      x: 84,
      y: 23,
      color: '#bb8c96',
    },
  ];
  const locations: LocationDef[] = [
    {
      id: 'anchor',
      region: 'vesper',
      name: 'Anchor Station',
      kind: 'Orbital station',
      description:
        'A wheel of warm windows above a cold gas giant. Your berth is paid through Friday. Your employer has not specified which Friday.',
      faction: 'combine',
      station: true,
      initiallyKnown: true,
      color: '#89abb0',
      sites: [],
      yields: {},
      danger: 0,
    },
    {
      id: 'cinder',
      region: 'vesper',
      name: 'Cinder',
      kind: 'Rocky planet',
      description:
        'Rust-red escarpments under a thin nitrogen sky. A decommissioned survey beacon still reports perfect working conditions.',
      faction: 'combine',
      station: false,
      initiallyKnown: true,
      color: '#c28b6b',
      sites: ['The silent beacon', 'Basalt extraction camp', 'Subsurface heat signature'],
      yields: { ore: 9, ice: 3 },
      danger: 0.08,
    },
    {
      id: 'morrow',
      region: 'vesper',
      name: 'Morrow',
      kind: 'Icy moon',
      description:
        'A fractured ice shell, blue shadows, and a dark ocean that no company has yet found a way to invoice.',
      faction: 'independent',
      station: false,
      initiallyKnown: false,
      color: '#8ab5c3',
      sites: ['Pressure ridge', 'Abandoned borehole', 'Under-ice observatory'],
      yields: { ice: 10, ore: 3 },
      danger: 0.12,
    },
    {
      id: 'rubble',
      region: 'vesper',
      name: 'The Shingle',
      kind: 'Asteroid field',
      description:
        'Metal-rich rubble from a collision older than the sun. Some of the reflective surfaces are much newer.',
      faction: 'pirates',
      station: false,
      initiallyKnown: false,
      color: '#a49c88',
      sites: ['Survey cache', 'Tethered wreck', 'Unregistered transponder'],
      yields: { ore: 14, parts: 2 },
      danger: 0.22,
    },
  ];
  const names = [
    ['Wayfarer Exchange', 'Nacre', 'Hush', 'Pale Debris'],
    ['Union Anchorage', 'Serein', 'Bracken', 'Meridian Belt'],
    ['Last Light Depot', 'Vigil', 'Orison', 'The Broken Choir'],
  ];
  const kinds = ['Orbital station', 'Rocky planet', 'Icy moon', 'Asteroid field'];
  const descriptors = [
    'A low sun cuts across salt flats and fractured stone. A survey stake stands where no landing is recorded.',
    'Frost has sealed the machinery into the cliff. Beneath it, an automatic pump still draws power.',
    'The rocks drift in practiced silence. A navigation light repeats a distress sequence with one digit missing.',
  ];
  for (let ri = 1; ri < regions.length; ri++)
    for (let j = 0; j < 4; j++) {
      const region = regions[ri],
        id = `${region.id}-${j}`,
        station = j === 0;
      locations.push({
        id,
        region: region.id,
        name: names[ri - 1][j],
        kind: kinds[j],
        description: station
          ? 'A patched-together port at the end of the supply chain. The dockmaster asks for your date of departure before asking your name.'
          : descriptors[(j + ri) % 3],
        faction: ri === 2 ? 'independent' : ri === 3 ? 'pirates' : 'combine',
        station,
        initiallyKnown: false,
        color: station ? '#89abb0' : j === 2 ? '#9fbcc6' : region.color,
        sites: station
          ? []
          : [
              `Sector ${Math.floor(rng() * 80) + 10} landing site`,
              'Sealed research annex',
              'Uncatalogued signal',
            ],
        yields: station
          ? {}
          : j === 2
            ? { ice: 10 + Math.floor(rng() * 5), ore: 2 }
            : { ore: 9 + Math.floor(rng() * 8), ice: 2, parts: Math.floor(rng() * 3) },
        danger: station ? 0 : 0.1 + ri * 0.035 + rng() * 0.06,
      });
    }
  const routes: RouteDef[] = [];
  for (const region of regions) {
    const ls = locations.filter((l) => l.region === region.id);
    for (let a = 0; a < ls.length; a++)
      for (let b = a + 1; b < ls.length; b++)
        routes.push({
          from: ls[a].id,
          to: ls[b].id,
          seconds: 45 + (a + b) * 15,
          days: 2 + (a + b) * 2,
          cost: { fuel: 3 + a + b, provisions: 1 },
          risk: 0.02 + (a + b) * 0.008,
          interregional: false,
        });
  }
  const link = (from: string, to: string, seconds: number, days: number) =>
    routes.push({
      from,
      to,
      seconds,
      days,
      cost: { fuel: 24, provisions: 3 },
      risk: 0.13,
      interregional: true,
    });
  link('cinder', 'pale-0', 900, 1461);
  link('morrow', 'meridian-0', 1800, 2557);
  link('pale-1', 'hollow-0', 2700, 3652);
  link('meridian-1', 'hollow-0', 3600, 4383);
  const missions: MissionDef[] = [
    {
      id: 'first-light',
      name: 'First light',
      description:
        'Take the survey launch to {location:cinder}. Complete an orbital survey, then return to any station to file your findings.',
      faction: 'combine',
      objective: { kind: 'survey', target: 'cinder', count: 1 },
      reward: { credits: 180, fuel: 8 },
      reputation: 8,
    },
    {
      id: 'boots',
      name: 'Boots on basalt',
      description:
        'Explore one site on {location:cinder}. Leave the company equipment where you found it. Probably.',
      faction: 'combine',
      objective: { kind: 'explore', target: 'cinder', count: 1 },
      reward: { credits: 140, parts: 5 },
      reputation: 6,
      requires: 'first-light',
    },
    {
      id: 'cold-store',
      name: 'Cold storage',
      description:
        'Extract resources from {location:morrow} twice. The independent habitats need a reliable source of water.',
      faction: 'independent',
      objective: { kind: 'gather', target: 'morrow', count: 2 },
      reward: { credits: 190, provisions: 6 },
      reputation: 10,
      requires: 'first-light',
    },
    {
      id: 'belt',
      name: 'Loose ends',
      description:
        'Explore two sites in {location:rubble}. Photograph any salvage identification plates.',
      faction: 'combine',
      objective: { kind: 'explore', target: 'rubble', count: 2 },
      reward: { credits: 260, ammo: 6 },
      reputation: 8,
    },
    {
      id: 'reach',
      name: 'Beyond the ledger',
      description:
        'Reach {location:pale-0} in {region:pale}. Cryosleep expenses are reimbursable upon arrival.',
      faction: 'combine',
      objective: { kind: 'travel', target: 'pale-0', count: 1 },
      reward: { credits: 400, fuel: 12 },
      reputation: 12,
      requires: 'first-light',
    },
    {
      id: 'free-port',
      name: 'Independent verification',
      description: 'Establish contact with {location:meridian-0} in {region:meridian}.',
      faction: 'independent',
      objective: { kind: 'travel', target: 'meridian-0', count: 1 },
      reward: { credits: 420, parts: 8 },
      reputation: 12,
    },
    {
      id: 'nacre',
      name: 'Fine print',
      description:
        'Survey {location:pale-1}. The company claims mineral rights based on a telescope image taken seventy years ago.',
      faction: 'combine',
      objective: { kind: 'survey', target: 'pale-1', count: 1 },
      reward: { credits: 220, parts: 6 },
      reputation: 8,
    },
    {
      id: 'relief',
      name: 'Mutual assistance',
      description:
        'Complete two station relief deliveries. Supplies go directly to local life support.',
      faction: 'independent',
      objective: { kind: 'aidDelivered', count: 2 },
      reward: { credits: 180, fuel: 10 },
      reputation: 12,
    },
    {
      id: 'exclusive',
      name: 'An exclusive arrangement',
      description:
        'Sell a batch of unpublished survey data to a station. Its owners receive an exclusive claim; rivals will notice.',
      faction: 'combine',
      objective: { kind: 'sellData', count: 1 },
      reward: { credits: 150 },
      reputation: 5,
    },
    {
      id: 'security',
      name: 'Terms of passage',
      description:
        'Win two armed encounters. Be certain your insurance lists weapons discharge as an authorized activity.',
      faction: 'independent',
      objective: { kind: 'combatWon', count: 2 },
      reward: { credits: 350, ammo: 10 },
      reputation: 10,
    },
    {
      id: 'hollow',
      name: 'A light at the edge',
      description:
        'Reach {location:hollow-0} in {region:hollow}. The last authenticated message from there is eleven years old.',
      faction: 'pirates',
      objective: { kind: 'travel', target: 'hollow-0', count: 1 },
      reward: { credits: 500, fuel: 15 },
      reputation: 15,
    },
    {
      id: 'hand',
      name: 'An honest day',
      description: 'Complete two station work shifts. Someone has to patch the air recyclers.',
      faction: 'independent',
      objective: { kind: 'work', count: 2 },
      reward: { credits: 100, provisions: 4 },
      reputation: 5,
    },
  ];
  const definition: GameDefinition = {
    id: 'far-wake',
    discoveryEvents: {
      chance: 0.35,
      cooldown: 2,
      entries: [
        {
          id: 'unseen-passenger',
          title: 'Unseen passenger',
          description: 'An unnoticed return from a surface expedition.',
          kind: 'exposure',
          threat: 'stowaway',
          minimumSites: 4,
          weight: 1,
          locations: locations.filter((l) => !l.station && l.id !== 'cinder').map((l) => l.id),
        },
        {
          id: 'settlement-claim',
          title: 'A claim without an owner',
          description:
            'The expedition recovered a settlement charter and the coordinates of an abandoned supply reserve. {faction:combine} calls it company property; {faction:independent} call it an inheritance. Carry the records to a station and decide whose claim to recognize.',
          kind: 'choice',
          at: 'station',
          minimumSites: 4,
          weight: 1,
          locations: locations.filter((l) => !l.station && l.id !== 'cinder').map((l) => l.id),
          choices: [
            {
              id: 'company',
              name: 'License to {faction:combine}',
              description:
                'Sign an exclusive company claim. A larger payment now, and better standing at {faction:combine} ports; independent settlements will remember the exclusion.',
              reward: { credits: 180 },
              reputation: { combine: 14, independent: -8 },
            },
            {
              id: 'commons',
              name: 'Release to {faction:independent}',
              description:
                'File an open settlement charter. {faction:independent} pay a smaller recovery fee and recognize the Kestrel as a friend. {faction:combine} disputes your authority.',
              reward: { credits: 90 },
              reputation: { independent: 14, combine: -8 },
            },
            {
              id: 'archive',
              name: 'Archive without a claim',
              description:
                'Deposit the records without endorsing either owner. No payment or change in faction standing. This closes the matter for this expedition.',
              reward: {},
              reputation: {},
            },
          ],
        },
      ],
    },
    recruitment: {
      capacity: 4,
      offers: [
        {
          id: 'engineer',
          name: 'Engineer',
          skill: 'engineering',
          description:
            'Faster repairs, refining and fabrication. Support engineers also improve internal threat searches.',
          cost: { credits: 140 },
          names: ['Leena Cho', 'Emil Mercer', 'Ruth Sato', 'Niko Vale'],
        },
        {
          id: 'medic',
          name: 'Medical officer',
          skill: 'medical',
          description:
            'Enables field triage. Assigned support medics can save a crew member during a creature attack.',
          cost: { credits: 160 },
          names: ['Dr. Selene Ibarra', 'Dr. Noel Singh', 'Dr. Imani Cole', 'Dr. Theo Lin'],
        },
        {
          id: 'security-officer',
          name: 'Security officer',
          skill: 'security',
          description: 'Improves combat, searches, containment and direct confrontation.',
          cost: { credits: 150 },
          names: ['Vera Holt', 'Tomas Reed', 'Sol Adeyemi', 'June Alvarez'],
        },
        {
          id: 'surveyor',
          name: 'Survey specialist',
          skill: 'survey',
          description: 'Faster surveys and surface expeditions.',
          cost: { credits: 130 },
          names: ['Anja Bell', 'Dara Chen', 'Owen Neri', 'Esme Voss'],
        },
        {
          id: 'relief-hand',
          name: 'Emergency relief hand',
          skill: 'general',
          description:
            'A free replacement when no crew survive. Assign them to Expedition to earn station wages.',
          cost: {},
          emergency: true,
          names: ['Alex Ward', 'Sami Osei', 'Robin Tao', 'Lee Moss'],
        },
      ],
    },
    threats: [
      {
        id: 'stowaway',
        name: 'The unmanifested',
        description:
          'Something brought back by an expedition is moving through the maintenance ducts. It hides from security and attacks when repeated searches fail. Losses are permanent; responses wait for your orders.',
        searchSkill: 'security',
        supportSkill: 'engineering',
        combatSkill: 'security',
        medicalSkill: 'medical',
        stealth: 0.15,
        revealAfter: 2,
        attackAfter: 2,
        searchCost: { provisions: 1 },
        containCost: { parts: 2 },
        combatCost: { ammo: 2 },
        purgeLoss: 0.2,
      },
    ],
    milestones: [
      { id: 'interstellar', measure: 'journeyDays', threshold: 365 },
      { id: 'frontier', measure: 'surveyedLocations', threshold: 10 },
    ],
    generationVersion: 1,
    title: 'Far Wake',
    regions,
    locations,
    routes,
    missions: [
      ...missions,
      {
        id: 'unmanifested',
        name: 'Unmanifested cargo',
        description:
          'Stop an unmanifested shipboard lifeform. The sealed specimen at {location:morrow} offers one lead; an ordinary expedition may also bring something back. Failed responses can lead to permanent crew losses.',
        faction: 'combine',
        objective: { kind: 'threatStopped', target: 'stowaway', count: 1 },
        reward: { credits: 450, parts: 8 },
        reputation: 10,
      },
    ],
    resources: [
      {
        id: 'credits',
        name: 'Credits',
        unit: 'cr',
        mass: 0,
        price: 1,
        description: 'Company scrip. Accepted reluctantly, everywhere.',
      },
      {
        id: 'fuel',
        name: 'Propellant',
        unit: 't',
        mass: 1,
        price: 5,
        description: 'Reaction mass for transfers and interstellar burns.',
      },
      {
        id: 'parts',
        name: 'Spare parts',
        unit: 'units',
        mass: 1,
        price: 8,
        description: 'Standardized enough to fit after some persuasion.',
      },
      {
        id: 'ammo',
        name: 'Ammunition',
        unit: 'crates',
        mass: 1,
        price: 7,
        description: 'Kinetic defense ammunition. Two crates per firing round.',
      },
      {
        id: 'provisions',
        name: 'Provisions',
        unit: 'packs',
        mass: 1,
        price: 3,
        description: 'Food, scrubber cartridges, and expedition consumables.',
      },
      {
        id: 'ore',
        name: 'Metal ore',
        unit: 't',
        mass: 1,
        price: 4,
        description: 'Refine into parts or ammunition aboard the ship.',
      },
      {
        id: 'ice',
        name: 'Water ice',
        unit: 't',
        mass: 1,
        price: 3,
        description: 'Crack into usable propellant aboard the ship.',
      },
    ],
    activities: [
      {
        id: 'specimen',
        name: 'Recover sealed specimen',
        description:
          'Optional containment investigation at {location:morrow}. An unidentified organism may come aboard. Once alerted, failed responses can permanently kill crew. Purging cargo is a safe escape.',
        seconds: 90,
        slot: 'primary',
        cost: { provisions: 2 },
        reward: { credits: 40 },
        skill: 'survey',
        requiresSurvey: true,
        repeatable: false,
        at: 'field',
        effect: 'expose',
        locations: ['morrow'],
        threat: 'stowaway',
      },
      {
        id: 'triage',
        name: 'Field triage',
        description:
          'A support medic treats injured crew without a station. Consumes 2 provisions.',
        seconds: 45,
        slot: 'support',
        cost: { provisions: 2 },
        reward: {},
        skill: 'medical',
        repeatable: true,
        at: 'any',
        effect: 'heal',
        requirements: [{ skill: 'medical', count: 1 }],
      },
      {
        id: 'survey',
        name: 'Orbital survey',
        description: 'Map this body, locate its sites, and resolve new navigation signals.',
        seconds: 45,
        slot: 'primary',
        cost: {},
        reward: {},
        skill: 'survey',
        repeatable: false,
        at: 'field',
      },
      {
        id: 'explore',
        name: 'Surface expedition',
        description:
          'Investigate the next site. Recover records and salvage; hazards are possible.',
        seconds: 100,
        slot: 'primary',
        cost: { provisions: 2 },
        reward: { parts: 3, ore: 3 },
        skill: 'survey',
        requiresSurvey: true,
        repeatable: false,
        at: 'field',
      },
      {
        id: 'gather',
        name: 'Resource extraction',
        description: 'Deploy the collection rig. Returns depend on local deposits.',
        seconds: 75,
        slot: 'primary',
        cost: { provisions: 1 },
        reward: {},
        skill: 'engineering',
        requiresSurvey: true,
        repeatable: true,
        at: 'field',
      },
      {
        id: 'raid',
        name: 'Intercept hostiles',
        description: 'Approach an unregistered contact and initiate an armed encounter.',
        seconds: 50,
        slot: 'primary',
        cost: { fuel: 2 },
        reward: {},
        skill: 'security',
        requiresSurvey: true,
        repeatable: true,
        at: 'field',
      },
      {
        id: 'repair',
        name: 'Patch the hull',
        description: 'Use 3 spare parts to restore 35 hull integrity.',
        seconds: 40,
        slot: 'support',
        cost: { parts: 3 },
        reward: {},
        skill: 'engineering',
        repeatable: true,
        at: 'any',
        effect: 'repair',
      },
      {
        id: 'service',
        name: 'Service machinery',
        description: 'Use 2 spare parts to remove 35 points of equipment wear.',
        seconds: 50,
        slot: 'support',
        cost: { parts: 2 },
        reward: {},
        skill: 'engineering',
        repeatable: true,
        at: 'any',
        effect: 'service',
      },
      {
        id: 'refine',
        name: 'Crack water ice',
        description: 'Process 4 water ice into 8 propellant.',
        seconds: 60,
        slot: 'support',
        cost: { ice: 4 },
        reward: { fuel: 8 },
        skill: 'engineering',
        repeatable: true,
        at: 'any',
      },
      {
        id: 'fabricate',
        name: 'Fabricate parts',
        description: 'Process 4 metal ore into 3 spare parts.',
        seconds: 55,
        slot: 'support',
        cost: { ore: 4 },
        reward: { parts: 3 },
        skill: 'engineering',
        repeatable: true,
        at: 'any',
      },
      {
        id: 'arm',
        name: 'Machine ammunition',
        description: 'Process 4 metal ore into 4 ammunition crates.',
        seconds: 60,
        slot: 'support',
        cost: { ore: 4 },
        reward: { ammo: 4 },
        skill: 'engineering',
        repeatable: true,
        at: 'any',
      },
      {
        id: 'work',
        name: 'Station work shift',
        description:
          'Earn 65 credits without spending supplies. Recovery debt takes 20 credits per shift.',
        seconds: 45,
        slot: 'primary',
        cost: {},
        reward: { credits: 65 },
        skill: 'engineering',
        repeatable: true,
        at: 'station',
      },
      {
        id: 'heal',
        name: 'Visit the infirmary',
        description: 'Station treatment restores all injured crew to full duty.',
        seconds: 35,
        slot: 'support',
        cost: { credits: 25 },
        reward: {},
        skill: 'engineering',
        repeatable: true,
        at: 'station',
        effect: 'heal',
      },
      {
        id: 'aid',
        name: 'Deliver relief supplies',
        description:
          'Give 4 provisions to the local faction. Gain standing here; rivals lose a little trust.',
        seconds: 40,
        slot: 'primary',
        cost: { provisions: 4 },
        reward: {},
        skill: 'survey',
        repeatable: true,
        at: 'station',
        effect: 'aid',
      },
    ],
    factions: [
      {
        id: 'combine',
        name: 'Orison Combine',
        description:
          'Your charter issuer. Every discovery is an asset; every asset already belongs to someone.',
        color: '#d7a979',
      },
      {
        id: 'independent',
        name: 'Free Habitats',
        description: 'A loose association of settlements that would prefer to own their own air.',
        color: '#91ad8b',
      },
      {
        id: 'pirates',
        name: 'The Unregistered',
        description:
          'Outlaws, deserters, and people whose docking fees exceeded the value of their ships.',
        color: '#bb8c96',
      },
    ],
    initial: {
      location: 'anchor',
      inventory: { credits: 320, fuel: 32, parts: 12, ammo: 8, provisions: 18, ore: 0, ice: 0 },
      capacity: 120,
      crew: [
        { id: 'mara', name: 'Mara Venn', skill: 'survey', assignment: 'primary', injury: 0 },
        {
          id: 'ishaan',
          name: 'Ishaan Rao',
          skill: 'engineering',
          assignment: 'support',
          injury: 0,
        },
        { id: 'ada', name: 'Ada Okonkwo', skill: 'security', assignment: 'primary', injury: 0 },
      ],
    },
    rules: {
      medicalSkill: 'medical',
      interregionalTravel: 'region',
      marketCycle: { days: 365, multipliers: [1, 1.2, 0.9] },
      oppositionFaction: 'pirates',
      combatSkill: 'security',
      aidActivity: 'aid',
      currency: 'credits',
      supplies: 'provisions',
      ammunition: 'ammo',
      materials: 'parts',
      travelResource: 'fuel',
      surveyActivity: 'survey',
      exploreActivity: 'explore',
      gatherActivity: 'gather',
      raidActivity: 'raid',
      workActivity: 'work',
      startingYear: 2186,
      recoverySeconds: 120,
      recoveryDebt: 150,
    },
    upgrades: [
      {
        id: 'berths',
        name: 'Expanded cryo berths',
        description: 'Two additional bunks and cryo pods. Crew capacity increases from 4 to 6.',
        cost: { credits: 220, parts: 4 },
        crewCapacity: 2,
      },
      {
        id: 'habitat',
        name: 'Auxiliary habitat module',
        description:
          'Two more pressurized berths. With expanded berths installed, the Kestrel can carry eight crew.',
        cost: { credits: 450, parts: 8 },
        crewCapacity: 2,
      },
      {
        id: 'cargo',
        name: 'External cargo racks',
        description:
          '+50 cargo capacity. The brackets are rated for considerably more than you want to test.',
        cost: { credits: 240, parts: 5 },
        capacity: 50,
      },
      {
        id: 'array',
        name: 'Synthetic aperture array',
        description: 'Survey team activities are 25% faster before crew bonuses.',
        cost: { credits: 300, parts: 5 },
        skill: 'survey',
        bonus: 0.25,
      },
      {
        id: 'tools',
        name: 'Microfabrication suite',
        description: 'Engineering activities are 25% faster before crew bonuses.',
        cost: { credits: 280, parts: 6 },
        skill: 'engineering',
        bonus: 0.25,
      },
      {
        id: 'defense',
        name: 'Point-defense predictor',
        description: 'Improves armed encounter odds and speeds security operations.',
        cost: { credits: 320, parts: 5 },
        skill: 'security',
        bonus: 0.2,
      },
    ],
  };
  return finishNamedDefinition(definition, seed, generationVersion, scienceFictionNames);
}
