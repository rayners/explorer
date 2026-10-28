import type { VarietyTheme } from '../content/variety';
export const fantasyVariety: VarietyTheme = {
  protectedLocation: 'old-road',
  events: [
    {
      id: 'haunted-shrine',
      title: 'A prayer without an answer',
      minimumSites: 6,
      description:
        'A roadside shrine repeats the names of travelers who never reached sanctuary. Its worn liturgy could teach a cleric how to quiet such echoes, or be preserved as a warning for the watch. Carry the account to a refuge before choosing its future.',
      choices: [
        {
          id: 'consecrate',
          name: 'Learn the quieting liturgy',
          description:
            'Living clerics gain four practice points, up to 30. {faction:covenant} recognizes the recovered liturgy with +6 standing.',
          training: { skill: 'cleric', points: 4 },
          reward: {},
          reputation: { covenant: 6 },
        },
        {
          id: 'record',
          name: 'Preserve the shrine’s account',
          description:
            'Give the names and warnings to {faction:wardens}. They provide medicinal herbs and +5 standing. No cleric is required.',
          reward: { herbs: 3 },
          reputation: { wardens: 5 },
        },
      ],
    },
    {
      id: 'lost-caravan',
      title: 'The wagons beyond the lanterns',
      minimumSites: 4,
      description:
        'A scattered caravan left a wounded guard keeping watch over its abandoned wagons. The guard can take a place in your company, or return with the survivors under the watch’s protection. The survivors wait for arrangements at a refuge.',
      choices: [
        {
          id: 'welcome',
          name: 'Welcome the caravan guard',
          description:
            'A free fighter joins resting after you reach a refuge. One accommodation place is required.',
          recruit: 'fighter',
          reward: {},
          reputation: {},
        },
        {
          id: 'return',
          name: 'Arrange the caravan’s safe return',
          description:
            'Ask {faction:wardens} to bring the survivors home. Receive 70 crowns and +8 standing without using a company place.',
          reward: { gold: 70 },
          reputation: { wardens: 8 },
        },
      ],
    },
    {
      id: 'dangerous-bargain',
      title: 'The price beneath the roots',
      minimumSites: 8,
      description:
        'A sealed coffer offers payment for restoring a forgotten court marker. Taking its boon declares a patron; refusing leaves the company free of the commission.',
      choices: [
        {
          id: 'accept',
          name: 'Take the court’s material boon',
          description:
            'Receive 80 crowns and four incense. Gain +10 standing with {faction:court}, but lose 6 with {faction:wardens}. The later commission remains optional.',
          reward: { gold: 80, incense: 4 },
          reputation: { court: 10, wardens: -6 },
        },
        {
          id: 'refuse',
          name: 'Refuse and seal the coffer',
          description:
            'Keep the marker sealed and give its warning to {faction:covenant}. Receive two herbs and +4 standing. No payment, specialist or threat response is required.',
          reward: { herbs: 2 },
          reputation: { covenant: 4 },
        },
      ],
    },
  ],
  projects: [
    {
      incident: 'haunted-shrine',
      choice: 'consecrate',
      faction: 'covenant',
      name: 'Quiet the travelers’ vigil',
      work: 'Consecrate the echoing threshold',
      description:
        'A support cleric prepares a vigil and quiets the recorded names. The work costs incense and herbs, using the recovered liturgy.',
      skill: 'cleric',
      slot: 'support',
      seconds: 110,
      cost: { incense: 3, herbs: 2 },
      reward: { gold: 240 },
      reputation: 12,
    },
    {
      incident: 'haunted-shrine',
      choice: 'record',
      faction: 'wardens',
      name: 'Read the shrine boundaries',
      work: 'Measure the old ward lines',
      description:
        'An expedition mage traces the limits of the shrine’s echo and records warnings for future travelers.',
      skill: 'mage',
      seconds: 90,
      cost: { incense: 2, rations: 2 },
      reward: { gold: 200 },
      reputation: 8,
    },
    {
      incident: 'lost-caravan',
      choice: 'welcome',
      faction: 'wardens',
      name: 'Recover the caravan ledger',
      work: 'Escort the remaining wagons',
      description:
        'An expedition fighter brings the wagons’ records and movable stores onto the watched road. The company keeps the hired guard even if it declines this commission.',
      skill: 'fighter',
      seconds: 95,
      cost: { rations: 3, bolts: 2 },
      reward: { gold: 220, wood: 2 },
      reputation: 9,
    },
    {
      incident: 'lost-caravan',
      choice: 'return',
      faction: 'wardens',
      name: 'Keep the relief wagons moving',
      work: 'Guide the relief caravan',
      description:
        'A support scout marks the safe track and stocks waypoints for later relief wagons. Hire or assign a scout before starting.',
      skill: 'scout',
      slot: 'support',
      seconds: 105,
      cost: { wood: 3, rations: 4 },
      reward: { gold: 230, bolts: 2 },
      reputation: 10,
    },
    {
      incident: 'dangerous-bargain',
      choice: 'accept',
      faction: 'court',
      name: 'Raise the forgotten court marker',
      work: 'Bind the root-bound marker',
      description:
        'An expedition mage binds the marker while a support fighter guards the rite. Both specialties are required to complete the field rite.',
      skill: 'mage',
      requirements: [
        { skill: 'mage', count: 1 },
        { skill: 'fighter', count: 1, assignment: 'support' },
      ],
      seconds: 130,
      cost: { incense: 4, bolts: 2, rations: 2 },
      reward: { gold: 300, relics: 1 },
      reputation: 12,
    },
    {
      incident: 'dangerous-bargain',
      choice: 'refuse',
      faction: 'covenant',
      name: 'Record the sealed warning',
      work: 'Inscribe the coffer warning',
      description:
        'An expedition cleric inscribes a lasting warning without accepting the court’s claim or reopening the coffer.',
      skill: 'cleric',
      seconds: 85,
      cost: { incense: 2, wood: 2 },
      reward: { gold: 190, herbs: 2 },
      reputation: 10,
    },
  ],
};
