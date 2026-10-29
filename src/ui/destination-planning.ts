import type {
  Amounts,
  ActivityDef,
  GameDefinition,
  GameState,
  Job,
  LocationDef,
  MissionDef,
  RouteDef,
} from '../engine/types';
import { missionDiscovered } from '../engine/missions';
import { planRoute } from '../engine/navigation';
import { activityDuration } from '../engine/simulation';
import {
  expeditionPlan,
  knownHubRoute,
  routeCost,
  supplyGaps,
  type ExpeditionPlan,
} from './expedition-planning';

export interface DestinationEntry {
  mission: MissionDef;
  activity: ActivityDef;
  status: 'offer' | 'unstarted' | 'committed' | 'receipt';
  plan: ExpeditionPlan;
  slot?: 'primary' | 'support';
  job?: Job;
}
export interface DestinationGroup {
  source: LocationDef;
  entries: DestinationEntry[];
  receiptOnly: boolean;
  deferred: boolean;
  outbound?: RouteDef[];
  nearbyHub?: ReturnType<typeof knownHubRoute>;
  filingHub?: ReturnType<typeof knownHubRoute>;
  travelCost?: Amounts;
  travelSeconds?: number;
  workCost: Amounts;
  workSeconds: number;
  totalCost?: Amounts;
  shortages?: Amounts;
  staffing: string[];
}
const add = (target: Amounts, cost: Amounts) => {
  for (const [id, amount] of Object.entries(cost)) target[id] = (target[id] ?? 0) + amount;
};
/** Actual discovered contracts only. Read-only: never accepts work or reprices paid jobs. */
export function destinationPlan(game: GameDefinition, state: GameState) {
  const groups = new Map<string, DestinationGroup>();
  const deferred = state.primary?.kind === 'travel' || state.primary?.kind === 'rescue';
  for (const mission of game.missions) {
    const accepted = state.missions.find((saved) => saved.id === mission.id);
    if (accepted?.claimed || !missionDiscovered(game, state, mission)) continue;
    const activity = game.activities.find((entry) => entry.mission === mission.id);
    const source = game.locations.find(
      (location) => location.id === mission.objective.target && state.known.includes(location.id),
    );
    if (!activity || !source) continue;
    const slot = (['primary', 'support'] as const).find(
      (slot) => state[slot]?.kind === 'activity' && state[slot]?.definition === activity.id,
    );
    const status = !accepted
      ? 'offer'
      : accepted.progress >= mission.objective.count
        ? 'receipt'
        : slot
          ? 'committed'
          : 'unstarted';
    const plan = expeditionPlan(game, state, mission.id)!;
    if (!groups.has(source.id))
      groups.set(source.id, {
        source,
        entries: [],
        receiptOnly: false,
        deferred,
        workCost: {},
        workSeconds: 0,
        staffing: [],
      });
    const group = groups.get(source.id)!;
    group.entries.push({
      mission,
      activity,
      status,
      plan,
      slot,
      job: slot ? state[slot]! : undefined,
    });
    if (status === 'unstarted') {
      add(group.workCost, activity.cost);
      group.workSeconds += activityDuration(game, state, activity.id);
      // During transit expeditionPlan intentionally defers staffing too; do not invent readiness.
      group.staffing.push(...plan.staffing);
    }
  }
  for (const group of groups.values()) {
    const statusOrder = { unstarted: 0, committed: 1, receipt: 2, offer: 3 };
    group.entries.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
    group.receiptOnly = group.entries.every((entry) => entry.status === 'receipt');
    group.staffing = [...new Set(group.staffing)];
    if (deferred) continue;
    if (group.entries.some((entry) => entry.status === 'receipt'))
      group.filingHub = knownHubRoute(game, state);
    if (group.receiptOnly) continue;
    const legs = group.source.id === state.location ? [] : planRoute(game, state, group.source.id);
    if (group.source.id === state.location || legs.length) group.outbound = legs;
    group.nearbyHub = knownHubRoute(game, { ...state, location: group.source.id });
    if (group.outbound && group.nearbyHub) {
      const route = [...group.outbound, ...group.nearbyHub.legs];
      group.travelCost = routeCost(route);
      group.travelSeconds = route.reduce((total, leg) => total + leg.seconds, 0);
      if (group.entries.some((entry) => entry.status === 'unstarted')) {
        group.totalCost = { ...group.workCost };
        add(group.totalCost, group.travelCost);
        group.shortages = supplyGaps(state, group.totalCost);
      }
    }
  }
  const active = state.missions.filter((mission) => !mission.claimed).length;
  const ordered = [...groups.values()].sort(
    (a, b) =>
      Number(b.entries.some((e) => e.status !== 'offer')) -
        Number(a.entries.some((e) => e.status !== 'offer')) ||
      Number(b.source.id === state.location) - Number(a.source.id === state.location),
  );
  return { active, capacity: 3, available: Math.max(0, 3 - active), groups: ordered };
}
