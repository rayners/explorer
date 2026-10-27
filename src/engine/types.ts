/** Theme-independent exploration contracts. All simulation state is serializable. */
export type Amounts = Record<string, number>;
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
  effect?: 'repair' | 'service' | 'heal' | 'aid';
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
    skill?: string;
    bonus?: number;
  }[];
}
export type Command =
  | { type: 'travel'; target: string }
  | { type: 'activity'; id: string }
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
