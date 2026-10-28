/** Theme-independent exploration contracts. All simulation state is serializable. */
export type Amounts = Record<string, number>;
/** Theme-supplied vocabularies, composed with a separator into a display name. */
export interface NamePattern {
  parts: readonly (readonly string[])[];
  separator?: string;
}
export type DefinitionFactory = (seed: number, generationVersion?: number) => GameDefinition;
export interface ResourceDef {
  id: string;
  name: string;
  unit: string;
  mass: number;
  price: number;
  description: string;
}
export interface LocationDef {
  id: string;
  region: string;
  name: string;
  kind: string;
  description: string;
  faction?: string;
  station: boolean;
  initiallyKnown: boolean;
  color: string;
  sites: string[];
  yields: Amounts;
  danger: number;
}
export interface RegionDef {
  id: string;
  name: string;
  subtitle: string;
  x: number;
  y: number;
  color: string;
}
export interface SkillRequirement {
  skill: string;
  count: number;
  assignment?: Member['assignment'];
}
export interface SiteTrait {
  id: string;
  name: string;
}
export interface SiteApproach {
  id: string;
  name: string;
  description: string;
  seconds: number;
  cost: Amounts;
  reward: Amounts;
  risk: number;
  requirements?: SkillRequirement[];
}
export interface SiteDef {
  id: string;
  location: string;
  name: string;
  description: string;
  origin: SiteTrait;
  condition: SiteTrait;
  opportunity: SiteTrait;
  complication: SiteTrait;
  approaches: SiteApproach[];
  eventWeights?: Amounts;
}
export interface RouteDef {
  from: string;
  to: string;
  seconds: number;
  days: number;
  cost: Amounts;
  risk: number;
  interregional: boolean;
}
export interface Member {
  id: string;
  name: string;
  skill: string;
  assignment: 'primary' | 'support' | 'rest';
  injury: number;
  life?: 'alive' | 'dead';
  recruit?: string;
}
export interface ActivityDef {
  id: string;
  name: string;
  description: string;
  seconds: number;
  slot: 'primary' | 'support';
  cost: Amounts;
  reward: Amounts;
  skill: string;
  requiresSurvey?: boolean;
  repeatable: boolean;
  at: 'station' | 'field' | 'any';
  effect?: 'repair' | 'service' | 'heal' | 'aid' | 'expose';
  locations?: string[];
  requirements?: SkillRequirement[];
  threat?: string;
  mission?: string;
}
export interface Objective {
  kind: string;
  target?: string;
  count: number;
}
export interface MissionDef {
  id: string;
  name: string;
  description: string;
  faction: string;
  objective: Objective;
  reward: Amounts;
  reputation: number;
  requires?: string;
  sourceSite?: string;
}
export interface Job {
  id: string;
  kind: 'travel' | 'activity' | 'rescue';
  definition: string;
  target: string;
  remaining: number;
  total: number;
  days: number;
  reward: Amounts;
  risk: number;
  site?: string;
}
export interface Encounter {
  id: string;
  source: string;
  strength: number;
  round?: number;
  hostility?: number;
}
export interface GameEvent {
  id: number;
  at: number;
  key: string;
  params: Record<string, string | number>;
}
export interface MissionState {
  id: string;
  progress: number;
  claimed: boolean;
}
export interface Discovery {
  surveyed: boolean;
  sites: string[];
  dataSold: boolean;
}
export interface RecruitDef {
  id: string;
  name: string;
  description: string;
  skill: string;
  cost: Amounts;
  names: string[];
  nameSource?: { namespace: string; pattern: NamePattern; offset: number; prefix?: string };
  emergency?: boolean;
}
export interface ThreatDef {
  id: string;
  name: string;
  description: string;
  searchSkill: string;
  supportSkill: string;
  combatSkill: string;
  medicalSkill: string;
  stealth: number;
  revealAfter: number;
  attackAfter: number;
  searchCost: Amounts;
  containCost: Amounts;
  combatCost: Amounts;
  purgeLoss: number;
}
export interface ThreatState {
  id: string;
  stage: 'hidden' | 'suspected' | 'located' | 'contained';
  pressure: number;
  signs: number;
}
export interface DiscoveryChoice {
  id: string;
  name: string;
  description: string;
  reward: Amounts;
  reputation: Amounts;
}
/** Once-only discoveries selected at a new site; presentation stays in the catalog. */
export type DiscoveryEventDef = {
  id: string;
  title: string;
  description: string;
  locations?: string[];
  minimumSites: number;
  weight: number;
} & (
  | { kind: 'exposure'; threat: string }
  | { kind: 'choice'; at: 'station' | 'any'; choices: DiscoveryChoice[] }
);
/** Durable history, independent of the capped narrative log. IDs are unique per expedition. */
export interface IncidentRecord {
  id: string;
  location: string;
  site: string;
  at: number;
  choice: string | null;
}
export interface GameState {
  version: number;
  definition: string;
  generationVersion: number;
  seed: number;
  rng: number;
  elapsed: number;
  calendarDays: number;
  location: string;
  inventory: Amounts;
  integrity: number;
  wear: number;
  capacity: number;
  debt: number;
  crew: Member[];
  recruitSerial: number;
  threat: ThreatState | null;
  threatHistory: string[];
  incidents: IncidentRecord[];
  discoveryCooldown: number;
  known: string[];
  discoveries: Record<string, Discovery>;
  reputation: Amounts;
  primary: Job | null;
  support: Job | null;
  encounter: Encounter | null;
  missions: MissionState[];
  upgrades: string[];
  events: GameEvent[];
  nextEvent: number;
  milestones: string[];
}
export interface GameDefinition {
  sites?: SiteDef[];
  discoveryEvents?: { chance: number; cooldown: number; entries: DiscoveryEventDef[] };
  recruitment?: { capacity: number; offers: RecruitDef[] };
  threats?: ThreatDef[];
  milestones?: { id: string; measure: 'journeyDays' | 'surveyedLocations'; threshold: number }[];
  hooks?: { afterActivity?: (state: GameState, activity: ActivityDef) => GameState };
  id: string;
  generationVersion: number;
  title: string;
  regions: RegionDef[];
  locations: LocationDef[];
  routes: RouteDef[];
  resources: ResourceDef[];
  activities: ActivityDef[];
  missions: MissionDef[];
  factions: { id: string; name: string; description: string; color: string }[];
  initial: { location: string; inventory: Amounts; crew: Member[]; capacity: number };
  rules: {
    medicalSkill?: string;
    additionalCombatSkill?: string;
    interregionalTravel?: 'location' | 'region';
    marketCycle?: { days: number; multipliers: number[] };
    oppositionFaction: string;
    combatSkill: string;
    aidActivity: string;
    currency: string;
    supplies: string;
    ammunition: string;
    materials: string;
    travelResource: string;
    surveyActivity: string;
    exploreActivity: string;
    gatherActivity: string;
    raidActivity: string;
    workActivity: string;
    startingYear: number;
    recoverySeconds: number;
    recoveryDebt: number;
  };
  upgrades: {
    id: string;
    name: string;
    description: string;
    cost: Amounts;
    capacity?: number;
    crewCapacity?: number;
    skill?: string;
    bonus?: number;
  }[];
}
export type Command =
  | { type: 'discovery'; id: string; choice: string }
  | { type: 'travel'; target: string }
  | { type: 'activity'; id: string; site?: string; approach?: string }
  | { type: 'hire'; id: string }
  | { type: 'threat'; action: 'search' | 'contain' | 'confront' | 'purge' }
  | { type: 'work' }
  | { type: 'rescue' }
  | { type: 'accept' | 'claim' | 'abandon'; id: string }
  | { type: 'trade'; resource: string; amount: number; direction: 'buy' | 'sell' }
  | { type: 'assign'; member: string; assignment: Member['assignment'] }
  | { type: 'encounter'; choice: 'fight' | 'evade' | 'bargain' | 'surrender' }
  | { type: 'sellData' }
  | { type: 'aid' }
  | { type: 'upgrade'; id: string };
export interface CommandResult {
  state: GameState;
  error?: string;
}
