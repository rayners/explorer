import type { GameDefinition, GameState } from '../engine/types';
import { activityDuration } from '../engine/simulation';
const esc = (value: unknown) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
/** Show the actual work requirements before the player accepts a generated contract. */
export function followUpBrief(g: GameDefinition, s: GameState, id: string): string {
  const activity = g.activities.find((activity) => activity.mission === id);
  if (!activity) return '';
  const progress = s.missions.find((mission) => mission.id === id);
  const mission = g.missions.find((mission) => mission.id === id)!;
  if (progress && progress.progress >= mission.objective.count)
    return `<p class="cost">Field work complete. ${progress.claimed ? 'Payment filed.' : 'Return to a service hub with the work receipt.'}</p>`;
  const cost = Object.entries(activity.cost)
    .map(
      ([id, amount]) =>
        `${amount} ${esc(g.resources.find((resource) => resource.id === id)?.name ?? id)}`,
    )
    .join(' · ');
  return `<p class="cost">Field work: ${activityDuration(g, s, activity.id)}s real<br>Work supplies: ${cost || 'None'}${activity.requirements?.length ? `<br>Expedition requirements: ${activity.requirements.map((r) => `${r.count} ${esc(r.skill)}`).join(' · ')}` : ''}</p>`;
}
/** Accepted work remains visible with its destination even while preparing at a hub. */
export function followUpWork(
  g: GameDefinition,
  s: GameState,
  render: (id: string) => string,
): string {
  const work = g.activities.filter(
    (activity) =>
      activity.mission &&
      s.missions.some(
        (mission) =>
          mission.id === activity.mission &&
          !mission.claimed &&
          mission.progress < g.missions.find((def) => def.id === mission.id)!.objective.count,
      ),
  );
  return work.length
    ? `<div class="section-label">Discovery follow-up work / ACCEPTED CONTRACTS</div><div class="activity-grid follow-up-work">${work.map((activity) => render(activity.id)).join('')}</div>`
    : '';
}
