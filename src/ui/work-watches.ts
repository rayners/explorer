import type { Command, GameDefinition, GameState, Job, WorkWatch } from '../engine/types';
import { WORK_WATCHES, workWatchPlan, watchActivity } from '../engine/work-watches';
import { dispatch } from '../engine/simulation';

const esc = (value: unknown) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
type Button = (label: string, command: Command, primary?: boolean) => string;
export function watchLabel(id: WorkWatch) {
  return id === '15m' ? '15 minutes' : id === '1h' ? '1 hour' : '8 hours';
}
export function workWatchPanel(
  g: GameDefinition,
  s: GameState,
  button: Button,
  copy: { title: string; action: string },
) {
  if (!watchActivity(g)) return '';
  const currency = esc(
    g.resources.find((resource) => resource.id === g.rules.currency)!.name.toLowerCase(),
  );
  return `<details class="watch-options"><summary>${esc(copy.title)} · 15 min / 1 h / 8 h</summary><p>One fixed-duration order, paid once. Short shifts pay more per minute. Specialists and equipment improve pay; duration stays fixed. Matching participants earn one practice point on completion. No automatic repeat; cancel early without pay or practice.</p><div class="watch-choices">${WORK_WATCHES.map(
    ({ id }) => {
      const plan = workWatchPlan(g, s, id)!;
      const command: Command = { type: 'work', watch: id };
      const error = dispatch(g, s, command).error;
      return `<section class="watch-choice" aria-label="${watchLabel(id)} work"><h3>${watchLabel(id)} real</h3><p>Pay: ${plan.gross} ${currency}<br>Debt repayment: ${plan.debtPayment}<br>Take home: ${plan.net} ${currency}</p>${button(`${copy.action} · ${watchLabel(id)}`, command)}${error ? `<p class="action-reason">${esc(error)}</p>` : ''}</section>`;
    },
  ).join(
    '',
  )}</div><small>Uses the primary team at this hub. Support can work independently. Safe while you are away; consequential choices still hold progress.</small></details>`;
}
export function watchCommitment(
  g: GameDefinition,
  s: GameState,
  job: Job,
  button: Button,
  cancelLabel: string,
) {
  if (!job.watch) return '';
  const gross = job.reward[g.rules.currency];
  const debt = Math.min(job.watch.debtPayment, s.debt, gross);
  const currency = esc(
    g.resources.find((resource) => resource.id === g.rules.currency)!.name.toLowerCase(),
  );
  const command: Command = { type: 'cancelWorkWatch', id: job.id };
  const error = dispatch(g, s, command).error;
  return `<div class="watch-commitment"><p>Committed: ${watchLabel(job.watch.id)} real · ${gross} ${currency}<br>Debt repayment: ${debt} · Take home: ${gross - debt} ${currency}</p><small>Paid once on completion. Departure waits; cancelling forfeits all pay, repayment and practice.</small><div class="row-actions">${button(cancelLabel, command)}</div>${error ? `<p class="action-reason">${esc(error)}</p>` : ''}</div>`;
}
