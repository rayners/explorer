import type { DiscoveryChoice, GameDefinition, GameState, IncidentRecord } from './types';

interface DiscoveryContext {
  roll: (state: GameState) => number;
  event: (state: GameState, key: string, params: Record<string, string | number>) => void;
}

/** Unsettled discoveries are follow-ups, not time-blocking encounters. */
export function pendingDiscovery(g: GameDefinition, s: GameState): IncidentRecord | undefined {
  return s.incidents.find(
    (record) =>
      record.choice === null &&
      g.discoveryEvents?.entries.some((def) => def.id === record.id && def.kind === 'choice'),
  );
}

/** Called once per newly explored site, after existing threats develop. Never on a render or load. */
export function discoverAtSite(
  g: GameDefinition,
  s: GameState,
  location: string,
  site: string,
  c: DiscoveryContext,
): void {
  const policy = g.discoveryEvents;
  if (!policy) return;
  if (s.discoveryCooldown > 0) {
    s.discoveryCooldown--;
    return;
  }
  if (s.threat || pendingDiscovery(g, s)) return;
  const sites = Object.values(s.discoveries).reduce((total, d) => total + d.sites.length, 0);
  const eligible = policy.entries.filter(
    (def) =>
      def.weight > 0 &&
      sites >= def.minimumSites &&
      (!def.locations || def.locations.includes(location)) &&
      !s.incidents.some((record) => record.id === def.id) &&
      (def.kind !== 'exposure' || !s.threatHistory.includes(def.threat)),
  );
  if (!eligible.length || c.roll(s) >= policy.chance) return;
  let weight = c.roll(s) * eligible.reduce((total, def) => total + def.weight, 0);
  const selected = eligible.find((def) => (weight -= def.weight) < 0)!;
  s.incidents.push({ id: selected.id, location, site, at: s.elapsed, choice: null });
  s.discoveryCooldown = policy.cooldown;
  if (selected.kind === 'exposure') {
    s.threat = { id: selected.threat, stage: 'hidden', pressure: 0, signs: 0 };
    s.threatHistory.push(selected.threat);
    // No narrative event or visible follow-up: the onset must remain a surprise.
  } else c.event(s, 'discoveryFound', { discovery: selected.id, target: location });
}

/** Validate a follow-up choice without changing state or consuming random numbers. */
export function discoveryChoice(
  g: GameDefinition,
  s: GameState,
  id: string,
  choice: string,
): DiscoveryChoice | string {
  const record = s.incidents.find((r) => r.id === id);
  const def = g.discoveryEvents?.entries.find((entry) => entry.id === id);
  if (!record || record.choice !== null || def?.kind !== 'choice')
    return 'There is no unsettled discovery with that identity.';
  if (
    def.at === 'station' &&
    (!g.locations.find((l) => l.id === s.location)?.station ||
      s.primary?.kind === 'travel' ||
      s.primary?.kind === 'rescue')
  )
    return 'Visit a service hub to settle this discovery. You can keep exploring meanwhile.';
  return def.choices.find((option) => option.id === choice) ?? 'Unknown discovery response.';
}
