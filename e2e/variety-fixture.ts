import { opportunityFixture } from './opportunity-fixture';
import { dispatch, advance } from '../src/engine/simulation';
/** Actual generation-7 onset/response/acceptance; travel positioning isolates the work under test. */
export function supportVarietyFixture(fantasy: boolean) {
  const incident = fantasy ? 'haunted-shrine' : 'distress-beacon',
    choice = fantasy ? 'consecrate' : 'berth';
  const { game, state: found, source } = opportunityFixture(fantasy, incident, true, 7);
  const response = dispatch(game, found, { type: 'discovery', id: incident, choice });
  if (response.error) throw Error(response.error);
  const mission = game.missions.find(
    (mission) =>
      mission.sourceSite === found.incidents[0].site &&
      mission.discoveryChoice?.incident === incident &&
      mission.discoveryChoice.choice === choice,
  )!;
  const accepted = dispatch(game, response.state, { type: 'accept', id: mission.id });
  if (accepted.error) throw Error(accepted.error);
  const work = game.activities.find((activity) => activity.mission === mission.id)!;
  let state = accepted.state;
  for (const member of state.crew.filter((member) => member.skill === work.skill)) {
    const assigned = dispatch(game, state, {
      type: 'assign',
      member: member.id,
      assignment: 'support',
    });
    if (assigned.error) throw Error(assigned.error);
    state = assigned.state;
  }
  state = { ...state, location: source.id, rng: 1 };
  const primary = dispatch(game, state, { type: 'activity', id: game.rules.gatherActivity });
  if (primary.error) throw Error(primary.error);
  const support = dispatch(game, primary.state, { type: 'activity', id: work.id });
  if (support.error) throw Error(support.error);
  const completed = advance(game, support.state, 200);
  if (completed.primary || completed.support || completed.encounter)
    throw Error('Expected uninterrupted parallel work fixture.');
  return { game, state, source, mission, work, paid: support.state, completed };
}
