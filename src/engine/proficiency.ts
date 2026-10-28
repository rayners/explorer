import type { ActivityDef, GameState, Job, Member, SkillRequirement } from './types';
export const EXPERIENCE_CAP = 30;
/** An additive contribution to existing specialty calculations; no new class or headcount. */
export function proficiencyBonus(member: Member): number {
  const points = member.experience ?? 0;
  return points >= 12 ? 0.06 : points >= 4 ? 0.03 : 0;
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
