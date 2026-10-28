import type { Member } from '../engine/types';
import { proficiencyBonus } from '../engine/proficiency';
/** Shared personnel copy; numeric bonuses are supplied by the same mechanism used by dispatch. */
export function proficiencyLabel(member: Member): string {
  const points = member.experience ?? 0;
  const progress =
    points < 4
      ? `Learning · ${points}/4 practice`
      : points < 12
        ? `Practiced · ${points}/12 practice`
        : `Veteran · ${points} practice`;
  return `${progress} · +${Math.round(proficiencyBonus(member) * 100)}% specialty`;
}

export const proficiencyHelp =
  'Matching specialists gain one practice point per completed activity on their assigned team. At 4 and 12 points, their specialty contribution improves by 3% and 6%. Resting members do not train.';
