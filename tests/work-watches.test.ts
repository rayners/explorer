import { it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createGame } from '../src/game/definition';
import { createHollowmere } from '../src/fantasy/definition';
import { createState, dispatch, advance, skillBonus } from '../src/engine/simulation';
import { encodeSave, decodeSave, reconcile } from '../src/engine/save';
import { workWatchPlan, WORK_WATCHES, watchActivity } from '../src/engine/work-watches';
import { supportVarietyFixture } from '../e2e/variety-fixture';
import { watchCommitment } from '../src/ui/work-watches';
import type { Command } from '../src/engine/types';

function setup(factory = createGame, generation = 7) {
  const game = factory(1701, generation);
  let state = createState(game, 1701);
  const worker = state.crew.find((member) => member.skill === watchActivity(game)!.skill)!;
  state = dispatch(game, state, { type: 'assign', member: worker.id, assignment: 'primary' }).state;
  return { game, state, worker: state.crew.find((member) => member.id === worker.id)! };
}
it('commits every fixed watch once, with exact gross/net debt terms and one surviving participant credit', () => {
  for (const factory of [createGame, createHollowmere])
    for (const policy of WORK_WATCHES)
      for (const debt of [0, 0.5, 15, 1000]) {
        const { game, state, worker } = setup(factory);
        state.debt = debt;
        const before = structuredClone(state),
          plan = workWatchPlan(game, state, policy.id)!;
        expect(plan.gross).toBe(Math.round(65 * policy.units * 1.18));
        expect(plan.debtPayment).toBe(Math.min(debt, policy.units * 20));
        const started = dispatch(game, state, { type: 'work', watch: policy.id });
        expect(started.error).toBeUndefined();
        expect(state).toEqual(before);
        expect(started.state.inventory).toEqual(state.inventory);
        expect(started.state.rng).toBe(state.rng);
        expect(started.state.primary).toMatchObject({
          remaining: policy.seconds,
          total: policy.seconds,
          risk: 0,
          days: 0,
          watch: { id: policy.id, debtPayment: plan.debtPayment },
        });
        const almost = advance(game, started.state, policy.seconds - 1);
        expect(almost.inventory).toEqual(state.inventory);
        expect(almost.crew.find((m) => m.id === worker.id)!.experience).toBe(0);
        const done = advance(game, almost, 86400);
        expect(done.primary).toBeNull();
        expect(done.debt).toBe(debt - plan.debtPayment);
        expect(done.inventory[game.rules.currency]).toBe(
          state.inventory[game.rules.currency] + plan.net,
        );
        expect(done.crew.find((m) => m.id === worker.id)!.experience).toBe(1);
        expect(advance(game, done, 86400).inventory).toEqual(done.inventory);
        expect(decodeSave(encodeSave(done, 1000), factory).state).toEqual(done);
      }
});
it('supports every released generation without changing catalogs or the ordinary short shift', () => {
  for (const factory of [createGame, createHollowmere])
    for (const generation of [1, 2, 3, 4, 5, 6, 7]) {
      const { game, state } = setup(factory, generation),
        before = JSON.stringify(game);
      state.debt = 100;
      const ordinary = dispatch(game, state, { type: 'work' });
      expect(ordinary.state.primary!.watch).toBeUndefined();
      const done = advance(game, ordinary.state, 60);
      expect(done.inventory[game.rules.currency] - state.inventory[game.rules.currency]).toBe(45);
      expect(done.debt).toBe(80);
      expect(dispatch(game, state, { type: 'work', watch: '15m' }).error).toBeUndefined();
      expect(JSON.stringify(game)).toBe(before);
    }
});
it('holds terms through changed skills, injury, lost crew and support completion, without training replacements', () => {
  for (const factory of [createGame, createHollowmere]) {
    const { game, state, worker } = setup(factory);
    worker.experience = 12;
    const upgrade = game.upgrades.find((upgrade) => upgrade.skill === worker.skill)!;
    state.upgrades.push(upgrade.id);
    const plan = workWatchPlan(game, state, '1h')!;
    expect(plan.gross).toBe(
      Math.round(260 * (1 + skillBonus(game, state, worker.skill, 'primary'))),
    );
    const support = state.crew.find((m) => m.id !== worker.id)!;
    const prepared = dispatch(game, state, {
      type: 'assign',
      member: support.id,
      assignment: 'support',
    });
    expect(prepared.error).toBeUndefined();
    let started = dispatch(game, prepared.state, { type: 'work', watch: '1h' }).state;
    const parallel = dispatch(game, started, { type: 'activity', id: 'service' });
    expect(parallel.error).toBeUndefined();
    started = parallel.state;
    started.crew.find((m) => m.id === worker.id)!.life = 'dead';
    started.crew.forEach((m) => (m.injury = 1));
    const replacementOffer = game.recruitment!.offers.find(
      (offer) => offer.skill === worker.skill && !offer.emergency,
    )!;
    const hired = dispatch(game, started, { type: 'hire', id: replacementOffer.id });
    expect(hired.error).toBeUndefined();
    started = hired.state;
    const terms = structuredClone(started.primary);
    const restored = decodeSave(encodeSave(started, 1000), factory).state;
    expect(restored.primary).toEqual(terms);
    expect(watchCommitment(game, restored, restored.primary!, () => '', 'Cancel')).toContain(
      String(plan.gross),
    );
    const done = advance(game, restored, 3600);
    expect(done.primary).toBeNull();
    expect(done.support).toBeNull();
    expect(done.inventory[game.rules.currency]).toBe(
      started.inventory[game.rules.currency] + plan.gross,
    );
    expect(done.crew.find((m) => m.id === worker.id)!.experience).toBe(12);
    expect(done.crew.at(-1)!.experience).toBe(0);
  }
});
it('cancels only the named watch with no partial payout, debt credit or practice and preserves support', () => {
  for (const factory of [createGame, createHollowmere]) {
    const { game, state, worker } = setup(factory);
    state.debt = 150;
    const support = state.crew.find((m) => m.id !== worker.id)!;
    const prepared = dispatch(game, state, {
      type: 'assign',
      member: support.id,
      assignment: 'support',
    });
    expect(prepared.error).toBeUndefined();
    const started = dispatch(game, prepared.state, { type: 'work', watch: '8h' }).state;
    const parallel = dispatch(game, started, { type: 'activity', id: 'service' });
    expect(parallel.error).toBeUndefined();
    const partial = advance(game, parallel.state, 10);
    const failed = dispatch(game, partial, { type: 'cancelWorkWatch', id: 'stale' });
    expect(failed.error).toBeTruthy();
    expect(failed.state).toBe(partial);
    const cancel = dispatch(game, partial, { type: 'cancelWorkWatch', id: partial.primary!.id });
    expect(cancel.error).toBeUndefined();
    expect(cancel.state.primary).toBeNull();
    expect(cancel.state.support).toEqual(partial.support);
    expect(cancel.state.inventory).toEqual(partial.inventory);
    expect(cancel.state.debt).toBe(150);
    expect(cancel.state.crew).toEqual(partial.crew);
    const newer = dispatch(game, cancel.state, { type: 'work', watch: '15m' });
    expect(newer.error).toBeUndefined();
    expect(newer.state.primary!.id).not.toBe(partial.primary!.id);
    expect(
      dispatch(game, newer.state, { type: 'cancelWorkWatch', id: partial.primary!.id }).state,
    ).toBe(newer.state);
    const ordinary = dispatch(game, state, { type: 'work' }).state;
    expect(
      dispatch(game, ordinary, { type: 'cancelWorkWatch', id: ordinary.primary!.id }).error,
    ).toBeTruthy();
    const bound = supportVarietyFixture(factory === createHollowmere);
    expect(
      dispatch(bound.game, bound.paid, { type: 'cancelWorkWatch', id: bound.paid.support!.id })
        .error,
    ).toBeTruthy();
  }
});
it('rejects invalid options, unsafe content, foreign activity extensions, field work and transit without mutation', () => {
  const { game, state } = setup();
  for (const command of [
    { type: 'work', watch: null },
    { type: 'work', watch: 'infinite' },
    { type: 'activity', id: 'explore', watch: '15m' },
    { type: 'travel', target: 'cinder', watch: '15m' },
  ] as unknown as Command[]) {
    const before = structuredClone(state),
      result = dispatch(game, state, command);
    expect(result.error).toBeTruthy();
    expect(result.state).toBe(state);
    expect(state).toEqual(before);
  }
  for (const patch of [
    { cost: { provisions: 1 } },
    { effect: 'aid' },
    { mission: 'first-light' },
    { at: 'field' },
    { repeatable: false },
    { slot: 'support' },
    { requiresSurvey: true },
    { reward: { parts: 65 } },
  ]) {
    const altered = structuredClone(game);
    Object.assign(
      altered.activities.find((a) => a.id === altered.rules.workActivity)!,
      patch,
    );
    expect(watchActivity(altered)).toBeUndefined();
    expect(dispatch(altered, state, { type: 'work', watch: '15m' }).state).toBe(state);
  }
  const field = { ...state, location: 'cinder' };
  expect(watchActivity({ ...game, hooks: { afterActivity: (state) => state } })).toBeUndefined();
  const physicalCurrency = structuredClone(game);
  physicalCurrency.resources.find((r) => r.id === game.rules.currency)!.mass = 1;
  expect(watchActivity(physicalCurrency)).toBeUndefined();
  expect(dispatch(game, field, { type: 'work', watch: '15m' }).error).toContain('hub');
  const travel = dispatch(game, state, { type: 'travel', target: 'cinder' }).state;
  expect(dispatch(game, travel, { type: 'work', watch: '15m' }).error).toBeTruthy();
});
it('preserves once-only offline completion and decision holds without multiplying hidden threat development', () => {
  for (const factory of [createGame, createHollowmere]) {
    const { game, state } = setup(factory);
    const started = dispatch(game, state, { type: 'work', watch: '8h' }).state;
    started.threat = { id: game.threats![0].id, stage: 'hidden', pressure: 0, signs: 0 };
    started.threatHistory = [started.threat.id];
    const loaded = decodeSave(encodeSave(started, 1000), factory);
    const away = reconcile(game, loaded, 1000 + 86400000);
    expect(away.state).toEqual(advance(game, started, 86400));
    expect(away.state.threat!.signs).toBe(1);
    expect(away.state.crew.every((m) => m.life === 'alive')).toBe(true);
    expect(reconcile(game, away, 1000 + 86400000).state).toEqual(away.state);
    started.threat.stage = 'suspected';
    expect(advance(game, started, 86400)).toBe(started);
    expect(
      dispatch(game, started, { type: 'cancelWorkWatch', id: started.primary!.id }).error,
    ).toContain('threat');
  }
});
it('migrates captured released schema-4 commitments with every old field and outcome unchanged', () => {
  const { fixtures } = JSON.parse(
    readFileSync('tests/fixtures/schema4-before-watches.json', 'utf8'),
  );
  for (const fixture of fixtures) {
    const factory = fixture.game === 'far-wake' ? createGame : createHollowmere;
    const loaded = decodeSave(fixture.raw, factory),
      original = JSON.parse(fixture.raw).state;
    expect(loaded.state).toEqual({ ...original, version: 5 });
    const game = factory(loaded.state.seed, loaded.state.generationVersion);
    expect(advance(game, loaded.state, fixture.seconds)).toEqual({
      ...fixture.completed,
      version: 5,
    });
  }
});
it('rejects malformed watch commitments and validates legacy states/checksums before migration', () => {
  const { game, state } = setup();
  state.debt = 150;
  const started = dispatch(game, state, { type: 'work', watch: '15m' }).state;
  for (const patch of [
    { watch: null },
    { watch: { id: 'unknown', debtPayment: 0 } },
    { total: 901 },
    { risk: 0.1 },
    { days: 1 },
    { target: 'cinder' },
    { definition: 'aid' },
    { watch: { id: '15m', debtPayment: 41 } },
    { watch: { id: '15m', debtPayment: -1 } },
    { reward: { parts: 153 } },
  ]) {
    const invalid = structuredClone(started);
    Object.assign(invalid.primary!, patch);
    expect(() => decodeSave(encodeSave(invalid, 1000), createGame)).toThrow('invalid');
  }
  const legacy = { ...started, version: 4 };
  expect(() => decodeSave(encodeSave(legacy, 1000), createGame)).toThrow('Legacy');
  const broken = { ...state, version: 4, crew: state.crew.map((m) => ({ ...m, experience: -1 })) };
  expect(() => decodeSave(encodeSave(broken, 1000), createGame)).toThrow('Legacy');
  const raw = encodeSave({ ...state, version: 4 }, 1000).replace('320', '321');
  expect(() => decodeSave(raw, createGame)).toThrow('checksum');
});
