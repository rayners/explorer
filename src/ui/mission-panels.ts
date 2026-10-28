import { preparationPanel } from './planning-panels';
import type { ActivityDef, GameDefinition, GameState } from '../engine/types';
import { activityDuration } from '../engine/simulation';
const esc = (value: unknown) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
export function workTeamRequirements(activity: ActivityDef): string {
  const team = (slot: string) => (slot === 'support' ? 'support' : 'expedition');
  return `Work team: ${activity.slot === 'support' ? 'Support' : 'Expedition'}<br>Team requirements: ${activity.requirements?.map((requirement) => `${requirement.count} ${esc(requirement.skill)} (${team(requirement.assignment ?? activity.slot)})`).join(' · ') || 'One living member on the work team'}`;
}
/** Show the actual work requirements before the player accepts a generated contract. */
export function followUpBrief(
  g: GameDefinition,
  s: GameState,
  id: string,
  context: 'board' | 'work' = 'board',
): string {
  const activity = g.activities.find((activity) => activity.mission === id);
  if (!activity) return '';
  const progress = s.missions.find((mission) => mission.id === id);
  const mission = g.missions.find((mission) => mission.id === id)!;
  const preparation = preparationPanel(g, s, id, context);
  const committed = [s.primary, s.support].find((job) => job?.definition === activity.id);
  const patron = mission.discoveryChoice
    ? `<br>Patron standing on filing: +${mission.reputation} ${esc(g.factions.find((faction) => faction.id === mission.faction)?.name)}`
    : '';
  if (progress && progress.progress >= mission.objective.count)
    return `<p class="cost">Field work complete. ${progress.claimed ? 'Payment filed.' : 'Return to a service hub with the work receipt.'}</p>${preparation}`;
  const cost = Object.entries(activity.cost)
    .map(
      ([id, amount]) =>
        `${amount} ${esc(g.resources.find((resource) => resource.id === id)?.name ?? id)}`,
    )
    .join(' · ');
  return `<p class="cost">Field work: ${committed?.total ?? activityDuration(g, s, activity.id)}s real<br>Work supplies: ${cost || 'None'}${patron}<br>${workTeamRequirements(activity)}</p>${preparation}`;
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
      s.missions.some((mission) => mission.id === activity.mission && !mission.claimed),
  );
  return work.length
    ? `<div class="section-label">Discovery follow-up work / ACCEPTED CONTRACTS</div><div class="activity-grid follow-up-work">${work
        .map((activity) => {
          const mission = s.missions.find((mission) => mission.id === activity.mission)!;
          const definition = g.missions.find((definition) => definition.id === mission.id)!;
          return mission.progress >= definition.objective.count
            ? `<article class="activity-card"><h3>${esc(definition.name)}</h3>${followUpBrief(g, s, mission.id, 'work')}</article>`
            : render(activity.id);
        })
        .join('')}</div>`
    : '';
}
