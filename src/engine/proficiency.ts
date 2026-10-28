import type {
  ActivityDef,
  GameDefinition,
  GameState,
  Job,
  Member,
  SkillRequirement,
} from './types';
export const EXPERIENCE_CAP = 30;
/** An additive contribution to existing specialty calculations; no new class or headcount. */
export function proficiencyBonus(member: Member): number {
  const points = member.experience ?? 0;
  return points >= 12 ? 0.06 : points >= 4 ? 0.03 : 0;
}
/** Shared skill calculation for ordinary effort and fixed-duration work payment. */
export function teamSkillBonus(
  g: GameDefinition,
  s: GameState,
  skill: string,
  slot: 'primary' | 'support',
): number {
  return (
    s.crew
      .filter((c) => c.life !== 'dead' && c.assignment === slot && c.skill === skill)
      .reduce((n, c) => n + (c.injury ? 0.06 : 0.18) + proficiencyBonus(c), 0) +
    g.upgrades
      .filter((u) => s.upgrades.includes(u.id) && u.skill === skill)
      .reduce((n, u) => n + (u.bonus ?? 0), 0)
  );
}
/** Record actual eligible specialists on dispatch, independent of later roster changes. */
export function activitySkills(
  activity: ActivityDef,
  requirements: readonly SkillRequirement[] = [],
): Set<string> {
  return new Set([
    activity.skill,
    ...[...(activity.requirements ?? []), ...requirements]
      .filter((requirement) => !requirement.assignment || requirement.assignment === activity.slot)
      .map((requirement) => requirement.skill),
  ]);
}
export function activityParticipants(
  state: GameState,
  activity: ActivityDef,
  requirements: readonly SkillRequirement[] = [],
): string[] {
  const skills = activitySkills(activity, requirements);
  return state.crew
    .filter(
      (member) =>
        member.life !== 'dead' && member.assignment === activity.slot && skills.has(member.skill),
    )
    .map((member) => member.id);
}
/** Completion mutates only the transition's copied state, crediting surviving participants once. */
export function practice(state: GameState, job: Job): void {
  for (const id of job.participants ?? []) {
    const member = state.crew.find((member) => member.id === id && member.life !== 'dead');
    if (member) member.experience = Math.min(EXPERIENCE_CAP, (member.experience ?? 0) + 1);
  }
}
