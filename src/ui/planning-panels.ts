import type { Command, GameDefinition, GameState } from '../engine/types';
import { missionDiscovered } from '../engine/missions';
import { planRoute } from '../engine/navigation';
import { dispatch } from '../engine/simulation';
import { expeditionPlan, routeCost, supplyGaps } from './expedition-planning';
const esc = (value: unknown) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
const time = (seconds: number) => `${Math.floor(seconds / 60)}m ${Math.ceil(seconds % 60)}s`;
function amounts(game: GameDefinition, cost: Record<string, number>) {
  return (
    Object.entries(cost)
      .map(
        ([id, amount]) =>
          `${amount} ${esc(game.resources.find((resource) => resource.id === id)?.name ?? id)}`,
      )
      .join(' · ') || 'None'
  );
}
const viewButton = (label: string, view: string) =>
  `<button data-planning-view="${view}">${label}</button>`;
export function preparationPanel(
  game: GameDefinition,
  state: GameState,
  id: string,
  context: 'board' | 'work' = 'board',
): string {
  const plan = expeditionPlan(game, state, id);
  if (!plan) return '';
  const settled = ['waiting', 'file', 'filed'].includes(plan.phase);
  const routes = !settled
    ? `<p class="cost">${plan.phase === 'return' ? 'Return travel' : 'Outbound travel'}: ${plan.routeMissing ? 'Unknown — not priced' : amounts(game, routeCost(plan.outbound ?? []))}${plan.phase !== 'return' ? `<br>Work: ${amounts(game, plan.workCost)}<br>Return to hub${plan.returnRoute ? ` (${esc(game.locations.find((location) => location.id === plan.returnRoute!.target)?.name)})` : ''}: ${plan.returnRoute ? amounts(game, routeCost(plan.returnRoute.legs)) : 'Unknown — not priced'}` : ''}<br>Estimated supplies needed: ${amounts(game, plan.totalCost)}</p>`
    : '';
  const gaps = Object.keys(plan.shortages).length
    ? `<p class="planning-gap">Missing supplies: ${amounts(game, plan.shortages)}</p>`
    : !settled
      ? '<p>Supplies cover the priced route and work.</p>'
      : '';
  const action =
    plan.target && plan.target !== state.location && !settled
      ? `<button data-route-target="${esc(plan.target)}">${plan.phase === 'return' ? 'Plot route to hub' : 'Plot route to source'}</button>`
      : '';
  const expanded =
    state.missions.some((mission) => mission.id === id) ||
    game.missions.find((mission) => mission.id === id)?.discoveryChoice;
  return `<section class="preparation" aria-label="Expedition preparation"><p class="next-step"><strong>Next step:</strong> ${esc(plan.next)}</p>${!settled && !expanded ? '<details><summary>Check expedition preparation</summary>' : ''}${routes}${settled ? '' : gaps}${plan.staffing.map((gap) => `<p class="planning-gap">${esc(gap)}</p>`).join('')}${!settled && !plan.staffing.length && plan.phase !== 'return' ? '<p>Required team assignments are ready.</p>' : ''}${plan.orderError ? `<p class="action-reason">Order unavailable: ${esc(plan.orderError)}</p>` : ''}${!settled && !expanded ? '</details>' : ''}<div class="row-actions">${action}${!settled && Object.keys(plan.shortages).length ? viewButton('Review supplies', 'supplies') : ''}${plan.staffing.length ? viewButton('Review team', 'crew') : ''}${plan.phase === 'work' && context === 'board' ? viewButton('Review field work', 'work') : plan.phase === 'file' && context === 'work' ? viewButton('Review contract board', 'board') : ''}</div><small>${settled ? '' : 'Estimate uses known routes and current stock. Hazard losses, optional work and future resupply are not included.'}</small></section>`;
}
export function planningSummary(game: GameDefinition, state: GameState): string {
  const unlocked = game.missions.filter(
    (mission) =>
      mission.discoveryChoice &&
      missionDiscovered(game, state, mission) &&
      !state.missions.some((saved) => saved.id === mission.id),
  ).length;
  const active = state.missions.filter(
    (saved) => !saved.claimed && game.activities.some((activity) => activity.mission === saved.id),
  );
  const completed = active.filter(
    (saved) =>
      saved.progress >= game.missions.find((mission) => mission.id === saved.id)!.objective.count,
  ).length;
  if (!unlocked && !active.length) return '';
  return `<section class="panel planning-summary" aria-label="Discovery work"><div class="panel-head"><h2>Discovery work</h2></div><div class="panel-body"><p>${unlocked} unlocked faction project${unlocked === 1 ? '' : 's'} · ${active.length} accepted field contract${active.length === 1 ? '' : 's'} · ${completed} ready to file</p><div class="row-actions">${viewButton('Review contract board', 'board')}${active.length ? viewButton('Review accepted work', 'work') : ''}</div></div></section>`;
}
export function routePlanPanel(
  game: GameDefinition,
  state: GameState,
  target: string,
  button: (label: string, command: Command, primary?: boolean) => string,
): string {
  const location = game.locations.find(
    (location) => location.id === target && state.known.includes(location.id),
  );
  if (!location) return '';
  let body: string;
  if (state.primary?.kind === 'travel' || state.primary?.kind === 'rescue')
    body = '<p>Journey in progress. Wait for arrival before planning the remaining route.</p>';
  else if (state.location === target)
    body = `<p>Destination reached.</p>${viewButton(location.station ? 'Review contract board' : 'Review field work', location.station ? 'board' : 'work')}`;
  else {
    const path = planRoute(game, state, target),
      next = path[0],
      cost = routeCost(path),
      gaps = supplyGaps(state, cost);
    const error = next
      ? dispatch(game, state, { type: 'travel', target: next.to }).error
      : undefined;
    body = next
      ? `<p>${[state.location, ...path.map((leg) => leg.to)].map((id) => esc(game.locations.find((location) => location.id === id)?.name)).join(' → ')}</p><p>Total journey: ${time(path.reduce((seconds, leg) => seconds + leg.seconds, 0))} real · ${path.reduce((days, leg) => days + leg.days, 0).toFixed(1)} fictional days<br>Travel supplies: ${amounts(game, cost)}</p>${Object.keys(gaps).length ? `<p class="planning-gap">Missing travel supplies: ${amounts(game, gaps)}</p>` : ''}<p>Next leg: ${esc(game.locations.find((location) => location.id === next.to)?.name)} · ${time(next.seconds)} · ${amounts(game, next.cost)}</p><div class="row-actions">${button(`Travel to ${game.locations.find((location) => location.id === next.to)!.name}`, { type: 'travel', target: next.to }, true)}</div>${error ? `<p class="action-reason">${esc(error)}</p>` : ''}<small>Plotting spends nothing. Every leg requires a separate order. Supply estimates exclude hazard losses.</small>`
      : '<p>No known route reaches this destination. Survey connected places to chart a path.</p>';
  }
  return `<section class="panel route-plan" aria-labelledby="route-plan-title"><div class="panel-head"><h2 id="route-plan-title" tabindex="-1">Route to ${esc(location.name)}</h2></div><div class="panel-body">${body}</div></section>`;
}

export function projectOffers(
  game: GameDefinition,
  state: GameState,
  render: (id: string) => string,
): string {
  const offers = game.missions.filter(
    (mission) =>
      mission.discoveryChoice &&
      missionDiscovered(game, state, mission) &&
      !state.missions.some((saved) => saved.id === mission.id),
  );
  return offers.length
    ? `<section class="project-offers" aria-label="Unlocked faction projects"><h2>Unlocked faction projects</h2><p>${offers.length} project${offers.length === 1 ? '' : 's'} from your settled discoveries. Optional work; review preparation before accepting.</p><div class="activity-grid">${offers.map((mission) => render(mission.id)).join('')}</div></section>`
    : '';
}
