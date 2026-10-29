import type { Amounts, GameDefinition, GameState } from '../engine/types';
import { destinationPlan } from './destination-planning';
import { routeCost } from './expedition-planning';
import { duration } from './time';
const esc = (value: unknown) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
/** Navigation-only summaries; all acceptance, payment and dispatch remain in existing briefs. */
export function destinationPanel(game: GameDefinition, state: GameState): string {
  const plan = destinationPlan(game, state);
  if (!plan.groups.length) return '';
  const amounts = (cost: Amounts) =>
    Object.entries(cost)
      .map(([id, n]) => `${n} ${esc(game.resources.find((r) => r.id === id)?.name ?? id)}`)
      .join(' · ') || 'None';
  const name = (id: string) => esc(game.locations.find((l) => l.id === id)?.name ?? id);
  return `<section class="panel destination-overview" aria-label="Work by destination"><div class="panel-head"><h2>Work by destination</h2></div><div class="panel-body"><p>${plan.active} / ${plan.capacity} active contracts · ${plan.available} free slot${plan.available === 1 ? '' : 's'}. Completed receipts still use slots until filed.</p><p class="payment-note">Compare discovered work. Offers are possibilities; accept each contract separately at a service hub.</p>${plan.groups
    .map((group) => {
      const count = (status: string) => group.entries.filter((e) => e.status === status).length;
      const unstarted = count('unstarted'),
        committed = count('committed'),
        receipts = count('receipt');
      const summary = [
        unstarted ? `${unstarted} unstarted` : '',
        committed ? `${committed} in progress` : '',
        receipts ? `${receipts} receipt${receipts === 1 ? '' : 's'}` : '',
        count('offer') ? `${count('offer')} offer${count('offer') === 1 ? '' : 's'}` : '',
      ]
        .filter(Boolean)
        .join(' · ');
      const sourceJourney = group.receiptOnly
        ? ''
        : group.deferred
          ? '<p>Journey in progress. Route and team estimates wait for arrival.</p>'
          : `<p><strong>Travel only — source and nearby hub:</strong> ${group.travelCost ? `${duration(group.travelSeconds!)} · ${amounts(group.travelCost)}` : 'Unknown route — not priced.'}</p><p>${group.source.id === state.location ? 'You are at the source.' : group.outbound ? 'Known route to source.' : 'No known route to source.'} ${group.nearbyHub ? `Known staging / filing hub: ${name(group.nearbyHub.target)}.` : 'No reachable known hub from the source.'}</p>${group.outbound && group.source.id !== state.location ? `<button data-route-target="${esc(group.source.id)}">Plot source route</button>` : ''}`;
      const work = !unstarted
        ? ''
        : `<div class="destination-estimate"><p><strong>Accepted unstarted work (${unstarted}):</strong> ${amounts(group.workCost)}<br>Estimated work in sequence: ${duration(group.workSeconds)} at current team assignments.</p>${group.totalCost ? `<p>Shared trip + accepted unstarted work: ${amounts(group.totalCost)}</p>${Object.keys(group.shortages!).length ? `<p class="planning-gap">Missing supplies: ${amounts(group.shortages!)}</p>` : '<p>Current stock covers these estimated supplies.</p>'}` : '<p>Shared total unavailable until the routes are known. Work supplies above exclude travel.</p>'}${group.staffing.map((gap) => `<p class="planning-gap">${esc(gap)}</p>`).join('')}<small>Shared travel counts once. Work already in progress and receipts are excluded. Work is estimated in sequence; support scheduling and team changes remain explicit. Hazards and future resupply are not included.</small></div>`;
      const filing = !receipts
        ? ''
        : `<div class="destination-filing"><p><strong>${receipts} completed receipt${receipts === 1 ? '' : 's'}:</strong> ${group.deferred ? 'Wait for arrival to plan filing.' : !group.filingHub ? 'No known filing route — not priced.' : group.filingHub.target === state.location ? 'File at this service hub.' : `Return from here to ${name(group.filingHub.target)}: ${duration(group.filingHub.legs.reduce((n, l) => n + l.seconds, 0))} · ${amounts(routeCost(group.filingHub.legs))}.`}</p><small>Receipts need no source visit or work supplies. Filing is available at any service hub.</small>${group.filingHub && group.filingHub.target !== state.location ? `<button data-route-target="${esc(group.filingHub.target)}">Plot filing route</button>` : ''}</div>`;
      return `<details class="destination-group" data-destination="${esc(group.source.id)}"><summary>${esc(group.source.name)} · ${summary}</summary><div class="destination-body">${sourceJourney}${work}${filing}${group.entries.map((entry) => `<div class="destination-entry"><p class="work-status">${{ offer: 'Discovered offer', unstarted: 'Accepted — not started', committed: 'Work in progress — supplies paid', receipt: 'Completed receipt' }[entry.status]}${entry.job ? ` · <span data-timer="${entry.slot}">${duration(entry.job.remaining)}</span> remaining; supplies and participants stay committed.` : ''}</p><button data-contract-review="${esc(entry.mission.id)}" data-contract-view="${entry.status === 'offer' ? 'board' : 'work'}">Review ${esc(entry.mission.name)}</button></div>`).join('')}</div></details>`;
    })
    .join('')}</div></section>`;
}
/** Find by stable ID without interpolating generated names into selectors. */
export function focusContractBrief(root: HTMLElement, id: string) {
  const card = [...root.querySelectorAll<HTMLElement>('[data-contract-brief]')].find(
    (el) => el.dataset.contractBrief === id,
  );
  if (!card) return;
  const heading = card.querySelector<HTMLElement>('h3') ?? card;
  heading.setAttribute('tabindex', '-1');
  heading.focus();
  heading.scrollIntoView({ block: 'start' });
}
