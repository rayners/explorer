import { it, expect } from 'vitest';
import { createGame } from '../src/game/definition';
import { createHollowmere } from '../src/fantasy/definition';
import {
  createState,
  dispatch,
  advance,
  skillBonus,
  activityDuration,
} from '../src/engine/simulation';
import { decodeSave, encodeSave, reconcile, validateState } from '../src/engine/save';
import { activityParticipants, proficiencyBonus } from '../src/engine/proficiency';
import { proficiencyLabel } from '../src/ui/proficiency';

it('credits only matching living committed specialists once, including support work and injuries', () => {
  for (const factory of [createGame, createHollowmere]) {
    const game = factory(7, 4);
    let state = createState(game, 7);
    state.location = game.id === 'far-wake' ? 'cinder' : 'old-road';
    state.integrity = 50;
    const skill = game.id === 'far-wake' ? 'survey' : 'mage';
    const learner = state.crew.find((m) => m.skill === skill)!;
    learner.injury = 1;
    const primary = game.activities.find((a) => a.id === game.rules.surveyActivity)!;
    expect(activityParticipants(state, primary)).toEqual([learner.id]);
    const support = game.id === 'far-wake' ? 'repair' : 'triage';
    for (const id of [primary.id, support]) {
      const result = dispatch(game, state, { type: 'activity', id });
      expect(result.error).toBeUndefined();
      state = result.state;
    }
    const before = structuredClone(state),
      job = state.primary!;
    const done = advance(game, state, 200);
    expect(state).toEqual(before);
    expect(done.crew.find((m) => m.id === learner.id)!.experience).toBe(1);
    const supporter = state.support!.participants![0];
    expect(done.crew.find((m) => m.id === supporter)!.experience).toBe(1);
    expect(
      done.crew
        .filter((m) => m.id !== learner.id && m.id !== supporter)
        .every((m) => m.experience === 0),
    ).toBe(true);
    const again = advance(game, done, 86400);
    expect(again.crew).toEqual(done.crew);
    const loaded = decodeSave(encodeSave(before, 1000), factory);
    expect(reconcile(game, loaded, 201000).state).toEqual(done);
    expect(job.participants).toEqual([learner.id]);
  }
});
it('provides bounded contributions at published thresholds without bypassing role or injury checks', () => {
  const game = createGame(7, 4),
    state = createState(game, 7),
    member = state.crew[0];
  for (const [experience, bonus] of [
    [0, 0],
    [3, 0],
    [4, 0.03],
    [11, 0.03],
    [12, 0.06],
    [30, 0.06],
  ]) {
    member.experience = experience;
    expect(proficiencyBonus(member)).toBe(bonus);
    expect(skillBonus(game, state, member.skill, 'primary')).toBeCloseTo(0.18 + bonus);
    member.injury = 1;
    expect(skillBonus(game, state, member.skill, 'primary')).toBeCloseTo(0.06 + bonus);
    member.injury = 0;
    expect(proficiencyLabel(member)).toContain(`+${Math.round(bonus * 100)}% specialty`);
  }
  member.life = 'dead';
  expect(skillBonus(game, state, member.skill, 'primary')).toBe(0);
  const fantasy = createHollowmere(7, 4),
    company = createState(fantasy, 7);
  company.location = 'old-road';
  company.discoveries['old-road'].surveyed = true;
  company.crew.forEach((m) => {
    m.experience = 30;
    if (m.skill === 'fighter') m.assignment = 'rest';
  });
  expect(dispatch(fantasy, company, { type: 'activity', id: 'explore' }).error).toContain(
    'fighter',
  );
});
it('retains paid timers and returns while practice develops, caps points, and gives no credit for travel or failed orders', () => {
  const game = createGame(7, 4);
  let state = createState(game, 7);
  state.location = 'cinder';
  state.crew[0].experience = 3;
  const started = dispatch(game, state, { type: 'activity', id: 'survey' }).state;
  const job = structuredClone(started.primary!);
  expect(job.total).toBe(activityDuration(game, state, 'survey'));
  started.crew[0].experience = 12;
  expect(started.primary).toEqual(job);
  const capped = advance(
    game,
    { ...started, crew: started.crew.map((m) => ({ ...m, experience: 30 })) },
    200,
  );
  expect(capped.crew.every((m) => m.experience === 30)).toBe(true);
  const fail = dispatch(game, started, { type: 'activity', id: 'survey' });
  expect(fail.error).toBeTruthy();
  expect(fail.state).toBe(started);
  const traveling = dispatch(game, createState(game, 7), {
    type: 'travel',
    target: 'cinder',
  }).state;
  expect(traveling.primary!.participants).toBeUndefined();
  expect(advance(game, traveling, 120).crew.every((m) => m.experience === 0)).toBe(true);
});
it('never credits a casualty or a later replacement for an already committed activity', () => {
  const game = createGame(7, 4);
  let state = createState(game, 7);
  state.location = 'cinder';
  state = dispatch(game, state, { type: 'activity', id: 'survey' }).state;
  const committed = state.primary!;
  state.crew[0].life = 'dead';
  state.crew[0].assignment = 'rest';
  expect(validateState(state, game)).toBe(true);
  const done = advance(game, state, 200);
  expect(done.discoveries.cinder.surveyed).toBe(true);
  expect(done.crew[0].experience).toBe(0);
  expect(committed.participants).toContain(state.crew[0].id);
});
it('rejects malformed personnel progress and participant references and checks old checksums before migration', () => {
  const game = createGame(7, 4);
  const state = createState(game, 7);
  state.location = 'cinder';
  const started = dispatch(game, state, { type: 'activity', id: 'survey' }).state;
  for (const points of [-1, 31, 1.5, NaN, undefined]) {
    const changed = structuredClone(started);
    changed.crew[0].experience = points;
    expect(() => decodeSave(encodeSave(changed, 1000), createGame)).toThrow('invalid');
  }
  for (const participants of [undefined, null, ['missing'], ['mara', 'mara'], ['ishaan']]) {
    const changed = structuredClone(started);
    changed.primary!.participants = participants as any;
    expect(() => decodeSave(encodeSave(changed, 1000), createGame)).toThrow('invalid');
  }
  const old = { ...state, version: 3 };
  const raw = encodeSave(old, 1000).replace('"version":3', '"version":2');
  expect(() => decodeSave(raw, createGame)).toThrow('checksum');
});

it('preserves paid activity terms through an actual last-member threat casualty and gives the memorial no practice', () => {
  const game = createGame(1701, 4);
  let state = createState(game, 1701);
  state.location = 'cinder';
  state = dispatch(game, state, { type: 'activity', id: 'survey' }).state;
  const job = structuredClone(state.primary!);
  state.crew.slice(1).forEach((member) => (member.life = 'dead'));
  state.threat = { id: 'stowaway', stage: 'suspected', pressure: 1, signs: 2 };
  state.threatHistory = ['stowaway'];
  state.rng = 1;
  state = dispatch(game, state, { type: 'threat', action: 'search' }).state;
  expect(state.crew.every((member) => member.life === 'dead')).toBe(true);
  expect(state.primary).toEqual(job);
  state = dispatch(game, state, { type: 'threat', action: 'purge' }).state;
  const done = advance(game, state, 200);
  expect(done.discoveries.cinder.surveyed).toBe(true);
  expect(done.crew.every((member) => member.experience === 0)).toBe(true);
  expect(dispatch(game, done, { type: 'activity', id: 'gather' }).error).toContain('living');
});

it('credits an explicit specialist approach alongside its lead activity specialty', () => {
  const game = createGame(7, 5);
  const site = game.sites!.find((site) =>
    site.approaches.some((approach) =>
      approach.requirements?.some((requirement) => requirement.skill === 'engineering'),
    ),
  )!;
  const approach = site.approaches.find((approach) =>
    approach.requirements?.some((requirement) => requirement.skill === 'engineering'),
  )!;
  const state = createState(game, 7);
  state.location = site.location;
  state.known = game.locations.map((location) => location.id);
  state.discoveries = Object.fromEntries(
    game.locations.map((location) => [location.id, { surveyed: true, sites: [], dataSold: false }]),
  );
  state.crew.find((member) => member.skill === 'engineering')!.assignment = 'primary';
  const order = dispatch(game, state, {
    type: 'activity',
    id: 'explore',
    site: site.id,
    approach: approach.id,
  });
  expect(order.error).toBeUndefined();
  expect(order.state.primary!.participants).toContain('ishaan');
  expect(order.state.primary!.participants).toContain('mara');
  expect(validateState(order.state, game)).toBe(true);
  const loaded = decodeSave(encodeSave(order.state, 1000), createGame);
  const done = advance(game, loaded.state, 300);
  expect(done.crew.find((member) => member.id === 'ishaan')!.experience).toBe(1);
  expect(done.crew.find((member) => member.id === 'mara')!.experience).toBe(1);
});
