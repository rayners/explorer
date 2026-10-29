import { it, expect } from 'vitest';
import { createGame } from '../src/game/definition';
import { createHollowmere } from '../src/fantasy/definition';
import { createState, dispatch } from '../src/engine/simulation';
import {
  recruitmentCandidates,
  recruitName,
  nextRecruitSerial,
  joinRecruit,
} from '../src/engine/personnel';
import { encodeSave, decodeSave, validateState } from '../src/engine/save';
import { opportunityFixture } from '../e2e/opportunity-fixture';
import { discoverAtSite } from '../src/engine/discoveries';

it('shows different stable simultaneous candidates and hires exactly the selected preview across both games and all released generations', () => {
  for (const factory of [createGame, createHollowmere])
    for (const generation of [1, 2, 3, 4, 5, 6, 7])
      for (const seed of [1, 44, 1701]) {
        const game = factory(seed, generation),
          state = createState(game, seed),
          before = structuredClone(state),
          definition = JSON.stringify(game);
        const candidates = recruitmentCandidates(game, state);
        expect(new Set([...candidates.values()].map((c) => c.name)).size).toBe(candidates.size);
        expect(new Set([...candidates.values()].map((c) => c.serial)).size).toBe(candidates.size);
        expect(recruitmentCandidates(game, state)).toEqual(candidates);
        for (const offer of game.recruitment!.offers.filter((o) => !o.emergency)) {
          const selected = candidates.get(offer.id)!;
          const result = dispatch(game, state, { type: 'hire', id: offer.id });
          expect(result.error).toBeUndefined();
          expect(result.state.crew.at(-1)).toMatchObject({
            id: `${offer.id}-${selected.serial}`,
            name: selected.name,
            assignment: 'rest',
            recruit: offer.id,
          });
          expect(result.state.rng).toBe(state.rng);
          expect(validateState(result.state, game)).toBe(true);
          expect(decodeSave(encodeSave(result.state, 1000), factory).state).toEqual(result.state);
        }
        expect(state).toEqual(before);
        expect(JSON.stringify(game)).toBe(definition);
      }
});

it('does not spend names on previews or failed hires and fills unused gaps without reusing a memorial identity', () => {
  for (const factory of [createGame, createHollowmere]) {
    const game = factory(1701),
      state = createState(game, 1701),
      original = structuredClone(state);
    const offers = game.recruitment!.offers.filter((o) => !o.emergency),
      selected = recruitmentCandidates(game, state).get(offers.at(-1)!.id)!;
    expect(selected.serial).toBeGreaterThan(0);
    const poor = { ...state, inventory: { ...state.inventory, [game.rules.currency]: 0 } };
    expect(dispatch(game, poor, { type: 'hire', id: offers.at(-1)!.id }).error).toContain('funds');
    expect(poor.recruitSerial).toBe(0);
    expect(state).toEqual(original);
    const hired = dispatch(game, state, { type: 'hire', id: offers.at(-1)!.id }).state;
    expect(hired.recruitSerial).toBe(selected.serial + 1);
    hired.crew.at(-1)!.life = 'dead';
    const next = recruitmentCandidates(game, hired);
    expect(next.get(offers[0].id)!.serial).toBe(0);
    expect(
      [...next.values()].some((c) => c.serial === selected.serial || c.name === selected.name),
    ).toBe(false);
    expect(decodeSave(encodeSave(hired, 1000), factory).state).toEqual(hired);
  }
});

it('rejects a stale explicit candidate instead of charging for a different person', () => {
  for (const factory of [createGame, createHollowmere]) {
    const original = factory(44);
    const game = { ...original, recruitment: { ...original.recruitment!, capacity: 8 } };
    const state = createState(game, 44);
    state.inventory[game.rules.currency] = 2000;
    const offers = game.recruitment.offers.filter((offer) => !offer.emergency);
    const wanted = offers.at(-1)!;
    const preview = recruitmentCandidates(game, state).get(wanted.id)!;
    const changed = dispatch(game, state, { type: 'hire', id: offers[0].id }).state;
    expect(recruitmentCandidates(game, changed).get(wanted.id)!.serial).not.toBe(preview.serial);
    const before = structuredClone(changed);
    const stale = dispatch(game, changed, { type: 'hire', id: wanted.id, serial: preview.serial });
    expect(stale.error).toContain('candidate has changed');
    expect(stale.state).toBe(changed);
    expect(changed).toEqual(before);
    const current = recruitmentCandidates(game, changed).get(wanted.id)!;
    const hired = dispatch(game, changed, { type: 'hire', id: wanted.id, serial: current.serial });
    expect(hired.error).toBeUndefined();
    expect(hired.state.crew.at(-1)!.name).toBe(current.name);
  }
});

it('retains a discovered survivor through other hiring and reserves new survivors in free gaps without consuming RNG', () => {
  for (const fantasy of [false, true]) {
    const { game, state } = opportunityFixture(fantasy, 'stranded-specialist', true, 7);
    const record = state.incidents[0],
      serial = record.recruitSerial!;
    const def = game.discoveryEvents!.entries.find((e) => e.id === record.id)!;
    if (def.kind !== 'choice') throw Error('Expected choices');
    const offer = game.recruitment!.offers.find(
      (o) => o.id === def.choices.find((c) => c.recruit)!.recruit,
    )!;
    const name = recruitName(offer, state.seed, serial);
    expect(
      [...recruitmentCandidates(game, state).values()].some(
        (c) => c.serial === serial || c.name === name,
      ),
    ).toBe(false);
    const ordinary = game.recruitment!.offers.find((o) => !o.emergency && o.id !== offer.id)!;
    const hired = dispatch(game, state, { type: 'hire', id: ordinary.id });
    expect(hired.error).toBeUndefined();
    expect(hired.state.incidents[0].recruitSerial).toBe(serial);
    expect(recruitName(offer, hired.state.seed, serial)).toBe(name);
    // Isolate a fresh onset after a non-first offer leaves unconsumed serial gaps.
    const fresh = createState(game, 1701),
      last = game.recruitment!.offers.filter((o) => !o.emergency).at(-1)!;
    const booked = dispatch(game, fresh, { type: 'hire', id: last.id }).state;
    expect(nextRecruitSerial(booked)).toBe(0);
    booked.location = state.incidents[0].location;
    booked.discoveries = structuredClone(state.discoveries);
    booked.known = [...state.known];
    const single = {
      ...game,
      discoveryEvents: {
        ...game.discoveryEvents!,
        chance: 1,
        entries: [{ ...def, minimumSites: 0 }],
      },
    };
    const rng = booked.rng;
    discoverAtSite(single, booked, record.location, record.site, {
      roll: () => 0,
      event: () => {},
    });
    expect(booked.incidents[0].recruitSerial).toBe(0);
    expect(booked.rng).toBe(rng);
    expect([...recruitmentCandidates(game, booked).values()].some((c) => c.serial === 0)).toBe(
      false,
    );
  }
});

it('does not exhaust the supported archive through unselected offers and keeps emergency recovery available at the boundary', () => {
  for (const factory of [createGame, createHollowmere]) {
    const game = factory(1701),
      state = createState(game, 1701);
    // A high-water mark near the bound does not turn unselected gaps into people.
    state.recruitSerial = 1000;
    const offer = game.recruitment!.offers[0];
    for (let serial = 0; serial < 998; serial++) {
      if (serial === 0 || serial === 17) continue;
      const member = joinRecruit(state, offer, serial);
      member.life = 'dead';
    }
    state.crew.forEach((m) => (m.life = 'dead'));
    // Three original members plus 996 recruits leave one archive place, while
    // four unselected serials are still available to the five visible roles.
    const emergency = game.recruitment!.offers.find((o) => o.emergency)!;
    const candidate = recruitmentCandidates(game, state).get(emergency.id)!;
    expect(candidate).toBeDefined();
    const result = dispatch(game, state, { type: 'hire', id: emergency.id });
    expect(result.error).toBeUndefined();
    expect(result.state.crew.at(-1)!.name).toBe(candidate.name);
    expect(result.state.recruitSerial).toBe(1000);
  }
});

it('supports the full generated roster archive with interleaved roles rather than consuming every preview as a hire', () => {
  for (const factory of [createGame, createHollowmere]) {
    const game = factory(1701, 7);
    let state = createState(game, 1701);
    state.inventory[game.rules.currency] = 1_000_000;
    const roles = game.recruitment!.offers.filter((offer) => !offer.emergency);
    const names = new Set(state.crew.map((member) => member.name));
    for (let index = 0; index < 997; index++) {
      const offer = roles[index % roles.length];
      const candidate = recruitmentCandidates(game, state).get(offer.id)!;
      const result = dispatch(game, state, { type: 'hire', id: offer.id });
      expect(result.error).toBeUndefined();
      state = result.state;
      expect(state.crew.at(-1)!.name).toBe(candidate.name);
      expect(names.has(candidate.name)).toBe(false);
      names.add(candidate.name);
      state.crew.at(-1)!.life = 'dead';
    }
    expect(state.crew).toHaveLength(1000);
    expect(names.size).toBe(1000);
    expect(validateState(state, game)).toBe(true);
    expect(decodeSave(encodeSave(state, 1000), factory).state).toEqual(state);
  }
});
