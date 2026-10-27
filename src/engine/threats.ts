import type { Amounts, GameDefinition, GameState, Job } from './types';
import { living } from './personnel';
interface ThreatContext {
  event: (s: GameState, key: string, params?: Record<string, string | number>) => void;
  progress: (g: GameDefinition, s: GameState, kind: string, target?: string) => void;
  roll: (s: GameState) => number;
  spend: (s: GameState, cost: Amounts) => void;
  affordable: (s: GameState, cost: Amounts) => boolean;
  bonus: (g: GameDefinition, s: GameState, skill: string, slot: 'primary' | 'support') => number;
}
/** Unresolved alerts stop simulation, including offline catch-up. */
export function threatAlert(s: GameState): boolean {
  return !!s.threat && s.threat.stage !== 'hidden' && s.threat.stage !== 'contained';
}
/** Activity completion can reveal an intrusion, but never injures or kills a member. */
export function developThreat(g: GameDefinition, s: GameState, job: Job, c: ThreatContext): void {
  const activity = g.activities.find((a) => a.id === job.definition);
  if (
    activity?.effect === 'expose' &&
    activity.threat &&
    !s.threat &&
    !s.threatHistory.includes(activity.threat)
  ) {
    s.threat = { id: activity.threat, stage: 'hidden', pressure: 0, signs: 0 };
    s.threatHistory.push(activity.threat);
    c.event(s, 'threatAnomaly');
    return;
  }
  if (s.threat?.stage === 'hidden') {
    const def = g.threats!.find((t) => t.id === s.threat!.id)!;
    s.threat.signs++;
    if (s.threat.signs >= def.revealAfter) {
      s.threat.stage = 'suspected';
      c.event(s, 'threatRevealed', { threat: def.id });
    }
  }
}
/** Explicit player responses are the only transitions that can cause permanent losses. */
export function respondToThreat(
  g: GameDefinition,
  s: GameState,
  action: 'search' | 'contain' | 'confront' | 'purge',
  c: ThreatContext,
): string | undefined {
  const threat = s.threat,
    def = g.threats?.find((t) => t.id === threat?.id);
  if (!threat || !def || threat.stage === 'hidden')
    return 'There is no reported threat to respond to.';
  const finish = (method: string) => {
    s.threat = null;
    c.progress(g, s, 'threatStopped', def.id);
    c.event(s, 'threatStopped', { threat: def.id, method });
  };
  if (action === 'purge') {
    for (const resource of g.resources)
      if (resource.mass > 0)
        s.inventory[resource.id] = Math.floor(
          (s.inventory[resource.id] ?? 0) * (1 - def.purgeLoss),
        );
    finish('purge');
    return;
  }
  if (action === 'search' && (threat.stage === 'located' || threat.stage === 'contained'))
    return 'The threat is already located. Contain or confront it.';
  if (action === 'contain' && threat.stage === 'contained')
    return 'The threat is already contained.';
  if (action === 'confront' && threat.stage !== 'located' && threat.stage !== 'contained')
    return 'Locate or contain the threat before confronting it.';
  const cost =
    action === 'search' ? def.searchCost : action === 'contain' ? def.containCost : def.combatCost;
  if (!c.affordable(s, cost))
    return 'Insufficient supplies for this response. Purging remains available.';
  c.spend(s, cost);
  const search =
    c.bonus(g, s, def.searchSkill, 'primary') + c.bonus(g, s, def.supportSkill, 'support');
  const combat =
    c.bonus(g, s, def.combatSkill, 'primary') +
    (g.rules.additionalCombatSkill ? c.bonus(g, s, g.rules.additionalCombatSkill, 'primary') : 0);
  const chance =
    action === 'search'
      ? Math.min(0.95, 0.5 + search - def.stealth)
      : action === 'contain'
        ? Math.min(0.95, 0.65 + search)
        : Math.min(0.95, 0.45 + combat + (threat.stage === 'contained' ? 0.2 : 0));
  if (c.roll(s) < chance) {
    if (action === 'search') {
      threat.stage = 'located';
      c.event(s, 'threatLocated', { threat: def.id });
    } else if (action === 'contain') {
      threat.stage = 'contained';
      c.event(s, 'threatContained', { threat: def.id });
    } else finish('confront');
    return;
  }
  threat.stage = 'suspected';
  threat.pressure++;
  c.event(s, 'threatEvaded', { threat: def.id });
  if (threat.pressure >= def.attackAfter) {
    threat.pressure = 0;
    const available = living(s),
      victim = available[Math.floor(c.roll(s) * available.length)];
    if (victim) {
      const medical = c.bonus(g, s, def.medicalSkill, 'support');
      if (medical > 0 && c.roll(s) < Math.min(0.85, 0.4 + medical)) {
        victim.injury = 1;
        c.event(s, 'threatRescued', { member: victim.name });
      } else {
        victim.life = 'dead';
        victim.injury = 0;
        c.event(s, 'memberLost', { member: victim.name });
        for (const slot of ['primary', 'support'] as const)
          if (s[slot] && !living(s).some((m) => m.assignment === slot)) {
            s[slot] = null;
            c.event(s, 'jobAbandoned');
          }
      }
    }
  }
}
