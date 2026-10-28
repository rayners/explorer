import type { GameDefinition, GameState, MissionDef } from './types';

/** A source discovery gates follow-ups without hiding authored prerequisite contracts. */
export function missionDiscovered(g: GameDefinition, s: GameState, mission: MissionDef): boolean {
  if (!mission.sourceSite) return true;
  const site = g.sites?.find((site) => site.id === mission.sourceSite);
  return !!site && !!s.discoveries[site.location]?.sites.includes(site.id);
}

/** Work is available only while its accepted contract still needs an actual completion. */
export function missionWorkError(g: GameDefinition, s: GameState, id: string): string | undefined {
  const definition = g.missions.find((mission) => mission.id === id);
  const mission = s.missions.find((mission) => mission.id === id);
  if (!definition || !mission)
    return 'Accept this follow-up at a service hub before starting its work.';
  if (mission.claimed || mission.progress >= definition.objective.count)
    return 'This follow-up work is complete. File the contract at a service hub.';
}
