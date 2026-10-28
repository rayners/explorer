import type { VarietyTheme } from '../content/variety';
export const scienceFictionVariety: VarietyTheme = {
  protectedLocation: 'cinder',
  events: [
    {
      id: 'derelict-salvage',
      title: 'A wreck with two manifests',
      minimumSites: 4,
      description:
        'A grounded tender carries usable hull sections and conflicting ownership records. Recovering the loose stores would help the Kestrel now; leaving them intact would preserve a refuge for later crews. The claim can wait for a station visit.',
      choices: [
        {
          id: 'recover',
          name: 'Recover the unsealed stores',
          description:
            'Take loose spare parts and ammunition, recording the recovery for {faction:combine}. The sealed shelter remains intact.',
          reward: { parts: 3, ammo: 2 },
          reputation: { combine: 5 },
        },
        {
          id: 'preserve',
          name: 'Preserve the derelict refuge',
          description:
            'Leave the salvage in place and publish its bearings to {faction:independent}. No supplies or specialist are required.',
          reward: {},
          reputation: { independent: 7 },
        },
      ],
    },
    {
      id: 'distress-beacon',
      title: 'The last medical watch',
      minimumSites: 6,
      description:
        'A clinic beacon is still transmitting. Its surviving medical officer has kept evacuation records through several failed corporate relief cycles. Offer a berth, or arrange a relief corridor through the nearest independent habitat.',
      choices: [
        {
          id: 'berth',
          name: 'Offer the medical officer a berth',
          description:
            'A free medical recruit joins resting at a station. Uses one accommodation place.',
          recruit: 'medic',
          reward: {},
          reputation: {},
        },
        {
          id: 'relief',
          name: 'Coordinate habitat relief',
          description:
            'Send the evacuation records to {faction:independent}. They supply provisions and organize a continuing relief effort. No berth is required.',
          reward: { provisions: 4 },
          reputation: { independent: 8 },
        },
      ],
    },
    {
      id: 'disputed-research',
      title: 'Measurements under embargo',
      minimumSites: 8,
      description:
        'An unattended research array contains measurements that contradict a licensed prospecting claim. The raw observations could improve your survey practice, or become an open record beyond the company’s embargo.',
      choices: [
        {
          id: 'study',
          name: 'Study the raw observations',
          description:
            'Living survey specialists gain four practice points, up to 30. No standing changes now; the original array can support a later calibration trial.',
          training: { skill: 'survey', points: 4 },
          reward: {},
          reputation: {},
        },
        {
          id: 'publish',
          name: 'Publish the disputed measurements',
          description:
            'Release the record to {faction:independent} for 100 credits and +10 standing. {faction:combine} loses 6 standing with you over the broken embargo.',
          reward: { credits: 100 },
          reputation: { independent: 10, combine: -6 },
        },
      ],
    },
  ],
  projects: [
    {
      incident: 'derelict-salvage',
      choice: 'recover',
      faction: 'combine',
      name: 'Cut the remaining hull',
      work: 'Recover pressure-safe hull sections',
      description:
        'Engineering leads the cutting work while support security watches the unstable approaches. Both assignments are required.',
      skill: 'engineering',
      requirements: [
        { skill: 'engineering', count: 1 },
        { skill: 'security', count: 1, assignment: 'support' },
      ],
      seconds: 110,
      cost: { parts: 2, ammo: 2, provisions: 2 },
      reward: { credits: 280, ore: 4 },
      reputation: 9,
    },
    {
      incident: 'derelict-salvage',
      choice: 'preserve',
      faction: 'independent',
      name: 'Mark the tender refuge',
      work: 'Chart safe refuge approaches',
      description:
        'A survey expedition charts an approach that leaves the remaining stores undisturbed.',
      skill: 'survey',
      seconds: 80,
      cost: { provisions: 2, fuel: 1 },
      reward: { credits: 180, fuel: 2 },
      reputation: 10,
    },
    {
      incident: 'distress-beacon',
      choice: 'berth',
      faction: 'independent',
      name: 'Finish the clinic handover',
      work: 'Prepare the evacuation handover',
      description:
        'A support medical officer documents remaining treatments and restocks the clinic. Assign a living medic to support; the newly rescued officer can fill that role.',
      skill: 'medical',
      slot: 'support',
      seconds: 100,
      cost: { provisions: 4, parts: 2 },
      reward: { credits: 240, provisions: 2 },
      reputation: 11,
    },
    {
      incident: 'distress-beacon',
      choice: 'relief',
      faction: 'independent',
      name: 'Restore the relief relay',
      work: 'Install a relief transponder',
      description:
        'An expedition engineer installs the relay needed to guide relief craft to the clinic.',
      skill: 'engineering',
      seconds: 95,
      cost: { parts: 3, provisions: 3 },
      reward: { credits: 230, fuel: 2 },
      reputation: 10,
    },
    {
      incident: 'disputed-research',
      choice: 'study',
      faction: 'combine',
      name: 'Calibrate the disputed array',
      work: 'Run an independent calibration',
      description:
        'Expedition surveyors collect a fresh control series while support engineering monitors the reference equipment. The audit does not erase your original findings.',
      skill: 'survey',
      requirements: [
        { skill: 'survey', count: 1 },
        { skill: 'engineering', count: 1, assignment: 'support' },
      ],
      seconds: 125,
      cost: { parts: 3, provisions: 2 },
      reward: { credits: 270 },
      reputation: 8,
    },
    {
      incident: 'disputed-research',
      choice: 'publish',
      faction: 'independent',
      name: 'Keep the public array online',
      work: 'Service the open research relay',
      description:
        'Support engineering services a public transmitter carrying the released measurements. Work remains at the original array until complete.',
      skill: 'engineering',
      slot: 'support',
      seconds: 105,
      cost: { parts: 4, provisions: 1 },
      reward: { credits: 230, parts: 1 },
      reputation: 12,
    },
  ],
};
