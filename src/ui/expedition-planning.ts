import type { Amounts, GameDefinition, GameState, RouteDef } from '../engine/types';
import { planRoute } from '../engine/navigation';
import { dispatch } from '../engine/simulation';
import { living } from '../engine/personnel';

export function routeCost(legs: RouteDef[]): Amounts {
  const result: Amounts = {};
  for (const leg of legs)
    for (const [id, amount] of Object.entries(leg.cost)) result[id] = (result[id] ?? 0) + amount;
  return result;
}
export function supplyGaps(state: GameState, cost: Amounts): Amounts {
  return Object.fromEntries(
    Object.entries(cost).flatMap(([id, amount]) => {
      const missing = amount - (state.inventory[id] ?? 0);
      return missing > 0 ? [[id, missing]] : [];
    }),
  );
}
export function knownHubRoute(
  game: GameDefinition,
  state: GameState,
): { target: string; legs: RouteDef[] } | undefined {
  return game.locations
    .filter((location) => location.station && state.known.includes(location.id))
    .map((location) => ({ target: location.id, legs: planRoute(game, state, location.id) }))
    .filter((route) => route.target === state.location || route.legs.length > 0)
    .sort(
      (a, b) =>
        a.legs.reduce((n, leg) => n + leg.seconds, 0) -
        b.legs.reduce((n, leg) => n + leg.seconds, 0),
    )[0];
}
export interface ExpeditionPlan {
  phase: 'accept' | 'prepare' | 'travel' | 'work' | 'waiting' | 'return' | 'file' | 'filed';
  next: string;
  target?: string;
  outbound?: RouteDef[];
  returnRoute?: ReturnType<typeof knownHubRoute>;
  workCost: Amounts;
  totalCost: Amounts;
  shortages: Amounts;
  staffing: string[];
  orderError?: string;
  routeMissing?: boolean;
}
/** Read-only preparation: never accepts, assigns, buys, queues, or changes paid orders. */
export function expeditionPlan(
  game: GameDefinition,
  state: GameState,
  id: string,
): ExpeditionPlan | undefined {
  const mission = game.missions.find((mission) => mission.id === id);
  const activity = game.activities.find((activity) => activity.mission === id);
  if (!mission || !activity) return;
  const progress = state.missions.find((mission) => mission.id === id);
  const base = { workCost: {}, totalCost: {}, shortages: {}, staffing: [] };
  if (progress?.claimed) return { ...base, phase: 'filed', next: 'Filed. Payment received.' };
  if (
    [state.primary, state.support].some(
      (job) => job?.kind === 'activity' && job.definition === activity.id,
    )
  )
    return {
      ...base,
      phase: 'waiting',
      next: 'Work in progress. Supplies and participants are already committed.',
    };
  if (state.primary?.kind === 'travel' || state.primary?.kind === 'rescue')
    return {
      ...base,
      phase: 'waiting',
      next: 'Journey in progress. Wait for arrival before planning the remaining route.',
    };
  const complete = !!progress && progress.progress >= mission.objective.count;
  const source = mission.objective.target;
  const hub = complete ? knownHubRoute(game, state) : undefined;
  const target = complete ? hub?.target : source;
  const outbound =
    target && (target === state.location || state.known.includes(target))
      ? target === state.location
        ? []
        : planRoute(game, state, target)
      : undefined;
  const routeMissing = !target || !outbound || (target !== state.location && !outbound.length);
  const returnRoute =
    !complete && source && !routeMissing
      ? knownHubRoute(game, { ...state, location: source })
      : undefined;
  const workCost = complete ? {} : activity.cost;
  const totalCost = { ...workCost };
  for (const legs of [outbound ?? [], returnRoute?.legs ?? []])
    for (const [resource, amount] of Object.entries(routeCost(legs)))
      totalCost[resource] = (totalCost[resource] ?? 0) + amount;
  const shortages = supplyGaps(state, totalCost);
  const staffing: string[] = [];
  if (!complete) {
    const requirements = new Map<string, { skill: string; assignment: string; count: number }>();
    for (const requirement of activity.requirements ?? []) {
      const assignment = requirement.assignment ?? activity.slot,
        key = `${requirement.skill}:${assignment}`;
      requirements.set(key, {
        ...requirement,
        assignment,
        count: Math.max(requirement.count, requirements.get(key)?.count ?? 0),
      });
    }
    for (const requirement of requirements.values()) {
      const members = living(state).filter((member) => member.skill === requirement.skill);
      const assigned = members.filter(
        (member) => member.assignment === requirement.assignment,
      ).length;
      if (assigned < requirement.count) {
        const missing = Math.max(0, requirement.count - members.length);
        staffing.push(
          missing
            ? `Recruit ${missing} ${requirement.skill} specialist${missing === 1 ? '' : 's'}; requires ${requirement.count} on the ${requirement.assignment} team.`
            : `Assign ${requirement.count - assigned} ${requirement.skill} specialist${requirement.count - assigned === 1 ? '' : 's'} to the ${requirement.assignment} team.`,
        );
      }
    }
    if (!living(state).some((member) => member.assignment === activity.slot) && !staffing.length)
      staffing.push(`Assign a living member to the ${activity.slot} team.`);
  }
  const orderError =
    complete && target === state.location
      ? dispatch(game, state, { type: 'claim', id }).error
      : progress && target === state.location
        ? dispatch(game, state, { type: 'activity', id: activity.id }).error
        : outbound?.length
          ? dispatch(game, state, { type: 'travel', target: outbound[0].to }).error
          : undefined;
  const preparation = Object.keys(shortages).length > 0 || staffing.length > 0;
  let phase: ExpeditionPlan['phase'], next: string;
  if (!progress) {
    phase = 'accept';
    next = 'Accept this contract at a service hub.';
  } else if (complete) {
    phase = target === state.location ? 'file' : 'return';
    next =
      phase === 'file'
        ? 'File the completed receipt at this service hub.'
        : 'Return to a known service hub to file the receipt.';
  } else if (routeMissing || !returnRoute) {
    phase = 'prepare';
    next = 'Chart the missing route before committing to this expedition.';
  } else if (preparation) {
    phase = 'prepare';
    next = 'Prepare supplies and team before field work.';
  } else if (target === state.location) {
    phase = 'work';
    next = 'Perform the accepted field work here.';
  } else {
    phase = 'travel';
    next = 'Travel to the source, then perform field work.';
  }
  if (progress && !complete && orderError && !preparation && !routeMissing && returnRoute) {
    phase = 'prepare';
    next = `Resolve the current restriction: ${orderError}`;
  }
  if (routeMissing || (!complete && !returnRoute))
    next += ' A route is unknown; the supply estimate is incomplete.';
  return {
    phase,
    next,
    target,
    outbound,
    returnRoute,
    workCost,
    totalCost,
    shortages,
    staffing,
    orderError,
    routeMissing,
  };
}
