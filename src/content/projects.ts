import { generateProjects, type ProjectBranch } from '../engine/project-generation';
import type { GameDefinition } from '../engine/types';
/** Generation 6 adds projects; previous catalogs remain byte-for-byte reconstructible. */
export function finishProjects(game: GameDefinition, branches: ProjectBranch[]): GameDefinition {
  if (game.generationVersion < 6) return game;
  if (game.discoveryEvents) {
    game = {
      ...game,
      discoveryEvents: {
        ...game.discoveryEvents,
        entries: game.discoveryEvents.entries.map((incident) =>
          incident.kind !== 'choice'
            ? incident
            : {
                ...incident,
                choices: incident.choices.map((choice) => {
                  const override = branches.find(
                    (branch) => branch.incident === incident.id && branch.choice === choice.id,
                  )?.choiceDescription;
                  return override ? { ...choice, description: override } : choice;
                }),
              },
        ),
      },
    };
  }
  const generated = generateProjects(game, branches);
  return {
    ...game,
    missions: [...game.missions, ...generated.missions],
    activities: [...game.activities, ...generated.activities],
  };
}
