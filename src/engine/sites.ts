import type { GameDefinition, GameState, SiteApproach, SiteDef } from './types';

export interface SitePlan {
  site: SiteDef;
  approach: SiteApproach;
}
/** Pick an unfinished site without mutation; legacy games retain their ordinary activity. */
export function explorationPlan(
  g: GameDefinition,
  s: GameState,
  siteId?: string,
  approachId?: string,
): SitePlan | string | undefined {
  if (!g.sites)
    return siteId || approachId ? 'This expedition has no selectable site approaches.' : undefined;
  const location = g.locations.find((l) => l.id === s.location)!;
  const completed = s.discoveries[s.location]?.sites ?? [];
  const id = siteId ?? location.sites.find((id) => !completed.includes(id));
  const site = g.sites.find((site) => site.id === id && site.location === s.location);
  if (!site) return 'No unfinished site is available at this location.';
  if (completed.includes(site.id)) return 'This site has already been explored.';
  const approach = site.approaches.find((entry) => entry.id === (approachId ?? 'direct'));
  return approach ? { site, approach } : 'Unknown site approach.';
}
