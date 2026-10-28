import type { Amounts, Command, GameDefinition, GameState } from '../engine/types';
import { explorationPlan } from '../engine/sites';
import { activityDuration, dispatch } from '../engine/simulation';
import type { CommandButton } from './expedition-panels';
const esc = (value: unknown) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
/** Preview the same default exploration plan that dispatch will commit. */
export function activityPreview(g: GameDefinition, s: GameState, id: string) {
  const activity = g.activities.find((a) => a.id === id)!;
  const plan = id === g.rules.exploreActivity ? explorationPlan(g, s) : undefined;
  return plan && typeof plan !== 'string'
    ? {
        cost: plan.approach.cost,
        reward: plan.approach.reward,
        note: `Next site: ${plan.site.name} · ${Math.round(plan.approach.risk * 100)}% incident risk`,
      }
    : { cost: activity.cost, reward: activity.reward, note: '' };
}
/** Both games expose the same site decisions with their own data and command controls. */
export function sitePanel(g: GameDefinition, s: GameState, button: CommandButton): string {
  const location = g.locations.find((l) => l.id === s.location)!;
  if (!g.sites || location.station) return '';
  if (!s.discoveries[location.id]?.surveyed)
    return '<section class="panel"><div class="panel-body">Survey this location to resolve its exploration sites and approaches.</div></section>';
  const amounts = (value: Amounts) =>
    Object.entries(value)
      .map(([id, n]) => `${n} ${esc(g.resources.find((r) => r.id === id)?.name ?? id)}`)
      .join(' · ') || 'No supplies';
  const records = s.discoveries[location.id].sites;
  return `<section class="panel site-registry"><div class="panel-head"><h2>Exploration sites</h2><span class="eyebrow">${records.length} / ${location.sites.length} EXPLORED</span></div><div class="panel-body"><p>Choose any unfinished site. Approach costs and returns are committed when you depart; specialists are optional alternatives.</p>${g.sites
    .filter((site) => site.location === location.id)
    .map((site) => {
      const done = records.includes(site.id);
      const mission = g.missions.find((mission) => mission.sourceSite === site.id);
      const progress = s.missions.find((entry) => entry.id === mission?.id);
      const followUp = mission
        ? progress?.claimed
          ? 'Follow-up filed.'
          : progress
            ? progress.progress >= mission.objective.count
              ? 'Follow-up complete: return to a service hub to file it.'
              : 'Follow-up accepted: return here and complete the field work.'
            : 'A follow-up contract is available at a service hub.'
        : '';
      return `<article class="site-card" data-site="${esc(site.id)}"><div class="flex between"><h3>${esc(site.name)}</h3><span class="badge">${done ? 'EXPLORED' : s.primary?.site === site.id ? 'IN PROGRESS' : 'UNEXPLORED'}</span></div><p class="site-traits">${[site.origin, site.condition, site.opportunity, site.complication].map((trait) => esc(trait.name)).join(' · ')}</p><p>${esc(site.description)}</p>${
        done
          ? `<small>Findings secured. This site cannot be explored again.</small>${followUp ? `<p class="cost">${esc(followUp)}</p>` : ''}`
          : `<details><summary>Choose an approach</summary><div class="site-approaches">${site.approaches
              .map((approach) => {
                const command: Command = {
                  type: 'activity',
                  id: g.rules.exploreActivity,
                  site: site.id,
                  approach: approach.id,
                };
                const error = dispatch(g, s, command).error;
                return `<section class="site-approach"><h4>${esc(approach.name)}</h4><p>${esc(approach.description)}</p><p class="cost">${activityDuration(g, s, g.rules.exploreActivity, site.id, approach.id)}s real · ${Math.round(approach.risk * 100)}% incident risk<br>Cost: ${amounts(approach.cost)}<br>Return: ${amounts(approach.reward)}</p>${approach.requirements?.length ? `<small>Expedition requirements: ${approach.requirements.map((r) => `${r.count} ${esc(r.skill)}`).join(' · ')}</small>` : ''}${button(`Explore: ${approach.name}`, command)}${error ? `<div class="reason">${esc(error)}</div>` : ''}</section>`;
              })
              .join('')}</div></details>`
      }</article>`;
    })
    .join('')}</div></section>`;
}
