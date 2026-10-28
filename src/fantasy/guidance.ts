import type { GameDefinition, GameState } from '../engine/types';
import { threatAlert } from '../engine/threats';

/** Themed next steps; read-only guidance never commits orders or reveals hidden threats. */
export function fantasyGuidance(g: GameDefinition, s: GameState) {
  const destination = g.locations.find((place) => place.id === 'old-road')!.name;
  const first = s.missions.find((mission) => mission.id === 'first-road');
  if (s.encounter || threatAlert(s))
    return {
      title: 'The company waits.',
      text: 'Resolve the encounter or revealed threat above. Your companions remain safe while you decide.',
      tab: 'company',
    };
  if (s.primary?.kind === 'travel' || s.primary?.kind === 'rescue')
    return {
      title: 'The road is taken.',
      text: 'Your journey is committed. Return after arrival; no further orders are needed while you are away.',
      tab: 'journey',
    };
  if (!first)
    return {
      title: 'Take the first oath.',
      text: `Accept Beyond the last lantern, then chart ${destination} and return to a refuge.`,
      tab: 'refuge',
      accept: true,
    };
  if (!first.claimed) {
    if (first.progress >= g.missions.find((mission) => mission.id === first.id)!.objective.count)
      return {
        title: 'Bring the findings home.',
        text: 'Return to a refuge and file Beyond the last lantern for payment.',
        tab: 'refuge',
      };
    if (s.location === 'old-road')
      return {
        title: 'Read the signs.',
        text: 'Survey this place to reveal its sites and nearby paths.',
        tab: 'company',
      };
    return {
      title: `Follow ${destination}.`,
      text: 'Open Journey, review the road and order your departure.',
      tab: 'journey',
    };
  }
  return {
    title: 'Keep the lanterns lit.',
    text: 'Chart places, investigate sites and bring your findings back to a refuge. Prepare your company before taking another road.',
    tab: 'journey',
  };
}
