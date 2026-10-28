import type { GameDefinition, GameState, WorkWatch } from './types';
import { teamSkillBonus } from './proficiency';

/** Frozen policy for committed watches; new terms must use new IDs or explicit migration. */
export const WORK_WATCHES = [
  { id: '15m', seconds: 900, units: 2 },
  { id: '1h', seconds: 3600, units: 4 },
  { id: '8h', seconds: 28800, units: 8 },
] as const;

export function watchPolicy(id: unknown) {
  return WORK_WATCHES.find((watch) => watch.id === id);
}
/** The content's existing recovery-work mapping opts in only when the activity is safe. */
export function watchActivity(g: GameDefinition) {
  const a = g.activities.find((activity) => activity.id === g.rules.workActivity);
  const distinct = [
    g.rules.surveyActivity,
    g.rules.exploreActivity,
    g.rules.gatherActivity,
    g.rules.raidActivity,
    g.rules.aidActivity,
  ];
  return a &&
    !distinct.includes(a.id) &&
    a.repeatable &&
    a.slot === 'primary' &&
    a.at === 'station' &&
    !a.effect &&
    !a.mission &&
    !a.requiresSurvey &&
    !g.hooks?.afterActivity &&
    Object.keys(a.cost).length === 0 &&
    Object.keys(a.reward).length === 1 &&
    Number.isFinite(a.reward[g.rules.currency]) &&
    a.reward[g.rules.currency] > 0 &&
    g.resources.find((resource) => resource.id === g.rules.currency)?.mass === 0
    ? a
    : undefined;
}

/** No random draws or mutation: previews and dispatch use identical committed terms. */
export function workWatchPlan(g: GameDefinition, s: GameState, id: WorkWatch) {
  const policy = watchPolicy(id),
    activity = watchActivity(g);
  if (!policy || !activity) return undefined;
  const gross = Math.max(
    1,
    Math.round(
      activity.reward[g.rules.currency] *
        policy.units *
        (1 + teamSkillBonus(g, s, activity.skill, activity.slot)),
    ),
  );
  const debtPayment = Math.min(s.debt, 20 * policy.units, gross);
  return {
    id,
    seconds: policy.seconds,
    gross,
    debtPayment,
    net: gross - Math.min(gross, debtPayment),
  };
}
