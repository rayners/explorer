import { it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createGame } from '../src/game/definition';
import { createHollowmere } from '../src/fantasy/definition';
import { opportunityFixture } from '../e2e/opportunity-fixture';
import { advance, dispatch } from '../src/engine/simulation';
import { encodeSave, decodeSave, reconcile, validateState } from '../src/engine/save';
import { missionDiscovered } from '../src/engine/missions';
import { discoverAtSite } from '../src/engine/discoveries';
import { scienceFictionVariety } from '../src/game/variety';
import { fantasyVariety } from '../src/fantasy/variety';
import { followUpBrief } from '../src/ui/mission-panels';
import { expeditionPlan } from '../src/ui/expedition-planning';
import { generateProjects } from '../src/engine/project-generation';
import type { GameDefinition, GameState, ActivityDef } from '../src/engine/types';
const themes = [
  { fantasy: false, factory: createGame, theme: scienceFictionVariety },
  { fantasy: true, factory: createHollowmere, theme: fantasyVariety },
];
function prepare(game: GameDefinition, state: GameState, work: ActivityDef) {
  state.location = game.initial.location;
  state.inventory[game.rules.currency] = 3000;
  // Ordinary recruiting/upgrades prepare every optional team; no invented members or skills.
  for (const upgrade of game.upgrades.filter((upgrade) => upgrade.crewCapacity)) {
    const result = dispatch(game, state, { type: 'upgrade', id: upgrade.id });
    if (!result.error) state = result.state;
  }
  for (const requirement of work.requirements ?? []) {
    if (
      !state.crew.some((member) => member.skill === requirement.skill && member.life !== 'dead')
    ) {
      const offer = game.recruitment!.offers.find((offer) => offer.skill === requirement.skill)!;
      const hired = dispatch(game, state, { type: 'hire', id: offer.id });
      expect(hired.error).toBeUndefined();
      state = hired.state;
    }
    const member = state.crew.find(
      (member) => member.skill === requirement.skill && member.life !== 'dead',
    )!;
    member.assignment = requirement.assignment ?? work.slot;
  }
  state.location = work.locations![0];
  state.rng = 1;
  // Finite stock within capacity; all dispatch costs remain real and tested.
  state.inventory = Object.fromEntries(
    game.resources.map((resource) => [resource.id, resource.mass ? 12 : 3000]),
  );
  return state;
}
it('adds six themed discoveries and twelve measurable branches while preserving complete prior catalogs', () => {
  for (const { factory, theme } of themes) {
    const game = factory(1701, 7),
      old = factory(1701, 6);
    expect(game.locations).toEqual(old.locations);
    expect(game.routes).toEqual(old.routes);
    expect(game.sites).toEqual(old.sites);
    expect(game.missions.slice(0, old.missions.length)).toEqual(old.missions);
    expect(game.activities.slice(0, old.activities.length)).toEqual(old.activities);
    expect(game.discoveryEvents!.entries.slice(0, old.discoveryEvents!.entries.length)).toEqual(
      old.discoveryEvents!.entries,
    );
    expect(factory(1701)).toEqual(game);
    expect(new Set(game.missions.map((mission) => mission.id)).size).toBe(game.missions.length);
    for (const event of theme.events) {
      const def = game.discoveryEvents!.entries.find((entry) => entry.id === event.id)!;
      expect(def.locations).not.toContain(theme.protectedLocation);
      if (def.kind !== 'choice') throw Error('Expected choices');
      expect(def.choices.some((choice) => !choice.recruit && !choice.training)).toBe(true);
      const terms = new Set<string>();
      for (const choice of def.choices) {
        const branch = theme.projects.find(
          (branch) => branch.incident === def.id && branch.choice === choice.id,
        )!;
        expect(branch).toBeTruthy();
        terms.add(
          JSON.stringify([
            branch.slot ?? 'primary',
            branch.skill,
            branch.requirements,
            branch.cost,
          ]),
        );
        expect(game.factions.some((faction) => faction.id === branch.faction)).toBe(true);
        for (const id of Object.keys({ ...choice.reward, ...branch.cost, ...branch.reward }))
          expect(game.resources.some((resource) => resource.id === id)).toBe(true);
        for (const id of Object.keys(choice.reputation))
          expect(game.factions.some((faction) => faction.id === id)).toBe(true);
      }
      expect(terms.size).toBe(2);
    }
    expect(theme.projects.filter((branch) => branch.slot === 'support')).toHaveLength(2);
    expect(theme.projects.some((branch) => (branch.requirements?.length ?? 0) > 1)).toBe(true);
  }
});
it('selects each new discovery only after its threshold, outside the protected journey, once with a safe hub response', () => {
  for (const { fantasy, factory, theme } of themes)
    for (const event of theme.events) {
      const { game, state } = opportunityFixture(fantasy, event.id, false, 7);
      expect(state.incidents).toHaveLength(1);
      expect(state.incidents[0].id).toBe(event.id);
      expect(
        Object.values(state.discoveries).reduce((n, discovery) => n + discovery.sites.length, 0),
      ).toBe(event.minimumSites);
      expect(validateState(state, game)).toBe(true);
      const catalog = game.discoveryEvents!,
        def = catalog.entries.find((entry) => entry.id === event.id)!;
      game.discoveryEvents = { ...catalog, chance: 1, entries: [def] };
      const before = structuredClone(state);
      before.incidents = [];
      before.recruitSerial = 0;
      before.discoveryCooldown = 0;
      for (const discovery of Object.values(before.discoveries)) discovery.sites = [];
      const context = { roll: () => 0, event: () => {} };
      discoverAtSite(game, before, state.location, state.incidents[0].site, context);
      expect(before.incidents).toEqual([]);
      const intro = structuredClone(state);
      intro.incidents = [];
      intro.recruitSerial = 0;
      intro.discoveryCooldown = 0;
      discoverAtSite(
        game,
        intro,
        theme.protectedLocation,
        game.locations.find((location) => location.id === theme.protectedLocation)!.sites[0],
        context,
      );
      expect(intro.incidents).toEqual([]);
      const once = structuredClone(state);
      once.discoveryCooldown = 0;
      discoverAtSite(game, once, state.location, state.incidents[0].site, context);
      expect(once.incidents).toEqual(state.incidents);
      game.discoveryEvents = catalog;
      if (def.kind !== 'choice') throw Error('Expected choices');
      const safe = def.choices.find((choice) => !choice.recruit && !choice.training)!;
      expect(
        dispatch(game, state, { type: 'discovery', id: def.id, choice: safe.id }).error,
      ).toContain('hub');
      const hub = structuredClone(state);
      hub.location = game.initial.location;
      hub.inventory = {};
      hub.crew.forEach((member) => (member.life = 'dead'));
      const settled = dispatch(game, hub, { type: 'discovery', id: def.id, choice: safe.id });
      expect(settled.error).toBeUndefined();
      expect(settled.state.threat).toBeNull();
      expect(
        dispatch(game, settled.state, { type: 'discovery', id: def.id, choice: safe.id }).error,
      ).toBeTruthy();
      expect(decodeSave(encodeSave(state, 1000), factory).state).toEqual(state);
    }
});
it('runs every branch through exact choice gating, paid team work, offline completion and one-time filing', () => {
  for (const { fantasy, factory, theme } of themes)
    for (const event of theme.events) {
      const { game, state: found } = opportunityFixture(fantasy, event.id, true, 7);
      const def = game.discoveryEvents!.entries.find((entry) => entry.id === event.id)!;
      if (def.kind !== 'choice') throw Error('Expected choices');
      for (const choice of def.choices) {
        const before = structuredClone(found),
          response = dispatch(game, found, { type: 'discovery', id: def.id, choice: choice.id });
        expect(response.error).toBeUndefined();
        expect(found).toEqual(before);
        let state = response.state;
        for (const [id, amount] of Object.entries(choice.reward))
          expect(state.inventory[id]).toBe(found.inventory[id] + amount);
        for (const [id, amount] of Object.entries(choice.reputation))
          expect(state.reputation[id]).toBe(found.reputation[id] + amount);
        if (choice.recruit) {
          expect(state.crew.at(-1)!.recruit).toBe(choice.recruit);
          expect(state.crew.at(-1)!.assignment).toBe('rest');
          expect(state.recruitSerial).toBe(found.recruitSerial);
        }
        if (choice.training)
          for (const member of found.crew.filter(
            (member) => member.skill === choice.training!.skill,
          ))
            expect(state.crew.find((entry) => entry.id === member.id)!.experience).toBe(
              Math.min(30, (member.experience ?? 0) + 4),
            );
        const mission = game.missions.find(
          (mission) =>
            mission.sourceSite === found.incidents[0].site &&
            mission.discoveryChoice?.incident === def.id &&
            mission.discoveryChoice.choice === choice.id,
        )!;
        expect(missionDiscovered(game, found, mission)).toBe(false);
        expect(missionDiscovered(game, state, mission)).toBe(true);
        const sibling = game.missions.find(
          (entry) =>
            entry.sourceSite === mission.sourceSite &&
            entry.discoveryChoice?.incident === def.id &&
            entry.id !== mission.id,
        )!;
        expect(missionDiscovered(game, state, sibling)).toBe(false);
        const forged = structuredClone(state);
        forged.missions.push({ id: sibling.id, progress: 0, claimed: false });
        expect(validateState(forged, game)).toBe(false);
        const work = game.activities.find((activity) => activity.mission === mission.id)!;
        const accepted = dispatch(game, state, { type: 'accept', id: mission.id });
        expect(accepted.error).toBeUndefined();
        state = prepare(game, accepted.state, work);
        const combat = game.missions.find((mission) => mission.objective.kind === 'combatWon')!;
        const combatAccepted = dispatch(
          game,
          { ...state, location: game.initial.location },
          { type: 'accept', id: combat.id },
        );
        expect(combatAccepted.error).toBeUndefined();
        state = { ...combatAccepted.state, location: state.location };
        const plan = expeditionPlan(game, state, mission.id)!;
        expect(plan.staffing).toEqual([]);
        for (const requirement of work.requirements!) {
          const missing = structuredClone(state);
          missing.crew
            .filter((member) => member.skill === requirement.skill)
            .forEach((member) => (member.assignment = 'rest'));
          expect(dispatch(game, missing, { type: 'activity', id: work.id }).error).toContain(
            requirement.skill,
          );
        }
        const start = dispatch(game, state, { type: 'activity', id: work.id });
        expect(start.error).toBeUndefined();
        expect(start.state[work.slot]!.definition).toBe(work.id);
        expect(work.reward).toEqual({});
        for (const [id, amount] of Object.entries(work.cost))
          expect(start.state.inventory[id]).toBe(state.inventory[id] - amount);
        expect(dispatch(game, start.state, { type: 'abandon', id: mission.id }).error).toContain(
          'committed',
        );
        const completed = reconcile(
          game,
          decodeSave(encodeSave(start.state, 1000), factory),
          201000,
        ).state;
        expect(completed.missions.find((entry) => entry.id === mission.id)!.progress).toBe(1);
        expect(completed.missions.find((entry) => entry.id === combat.id)!.progress).toBe(0);
        expect(completed.inventory).toEqual(start.state.inventory);
        for (const member of state.crew) {
          const after = completed.crew.find((entry) => entry.id === member.id)!;
          expect(after.experience).toBe(
            (member.experience ?? 0) +
              (start.state[work.slot]!.participants!.includes(member.id) ? 1 : 0),
          );
        }
        expect(dispatch(game, completed, { type: 'abandon', id: mission.id }).error).toContain(
          'retained',
        );
        expect(dispatch(game, completed, { type: 'activity', id: work.id }).error).toContain(
          'complete',
        );
        let done = completed;
        if (done.encounter)
          done = dispatch(game, done, { type: 'encounter', choice: 'surrender' }).state;
        done.location = game.initial.location;
        const claim = dispatch(game, done, { type: 'claim', id: mission.id });
        expect(claim.error).toBeUndefined();
        for (const [id, amount] of Object.entries(mission.reward))
          expect(claim.state.inventory[id]).toBe(done.inventory[id] + amount);
        expect(claim.state.reputation[mission.faction]).toBe(
          done.reputation[mission.faction] + mission.reputation,
        );
        expect(dispatch(game, claim.state, { type: 'claim', id: mission.id }).error).toBeTruthy();
        expect(decodeSave(encodeSave(claim.state, 2000), factory).state).toEqual(claim.state);
        expect(followUpBrief(game, state, mission.id)).toContain(
          work.slot === 'support' ? 'Work team: Support' : 'Work team: Expedition',
        );
      }
    }
});
it('runs support field work beside paid primary work and prevents departure until the support receipt completes', () => {
  for (const { fantasy, factory, theme } of themes) {
    const branch = theme.projects.find(
      (branch) => branch.slot === 'support' && !branch.incident.includes('distress'),
    )!;
    const { game, state: found } = opportunityFixture(fantasy, branch.incident, true, 7);
    let state = dispatch(game, found, {
      type: 'discovery',
      id: branch.incident,
      choice: branch.choice,
    }).state;
    const mission = game.missions.find(
      (mission) =>
        mission.sourceSite === found.incidents[0].site &&
        mission.discoveryChoice?.incident === branch.incident &&
        mission.discoveryChoice.choice === branch.choice,
    )!;
    state = dispatch(game, state, { type: 'accept', id: mission.id }).state;
    const work = game.activities.find((activity) => activity.mission === mission.id)!;
    state = prepare(game, state, work);
    const primary = dispatch(game, state, { type: 'activity', id: game.rules.gatherActivity });
    expect(primary.error).toBeUndefined();
    const support = dispatch(game, primary.state, { type: 'activity', id: work.id });
    expect(support.error).toBeUndefined();
    expect(support.state.primary).toEqual(primary.state.primary);
    expect(support.state.support!.risk).toBe(0);
    const casualty = structuredClone(support.state);
    const participant = casualty.crew.find((member) =>
      casualty.support!.participants!.includes(member.id),
    )!;
    participant.life = 'dead';
    participant.assignment = 'rest';
    const survivedTerms = decodeSave(encodeSave(casualty, 1000), factory).state;
    expect(survivedTerms.support).toEqual(support.state.support);
    const afterLoss = advance(game, survivedTerms, 200);
    expect(afterLoss.missions.find((entry) => entry.id === mission.id)!.progress).toBe(1);
    expect(afterLoss.crew.find((member) => member.id === participant.id)!.experience).toBe(
      participant.experience,
    );
    const target = game.routes.find(
      (route) => route.from === state.location || route.to === state.location,
    )!;
    const destination = target.from === state.location ? target.to : target.from;
    const paid = structuredClone(support.state);
    paid.primary = null;
    expect(dispatch(game, paid, { type: 'travel', target: destination }).error).toContain(
      'support',
    );
    const result = reconcile(
      game,
      decodeSave(encodeSave(support.state, 1000), factory),
      201000,
    ).state;
    expect(result.missions.find((entry) => entry.id === mission.id)!.progress).toBe(1);
    const again = reconcile(game, { state: result, savedAt: 201000 }, 201000).state;
    expect(again).toEqual(result);
  }
});
it('preserves released generation-6 project decisions and exact paid outcomes', () => {
  const { fixtures } = JSON.parse(
    readFileSync('tests/fixtures/generation6-before-variety.json', 'utf8'),
  );
  for (const fixture of fixtures) {
    const factory = fixture.game === 'far-wake' ? createGame : createHollowmere,
      loaded = decodeSave(fixture.raw, factory),
      game = factory(loaded.state.seed, 6);
    expect(advance(game, loaded.state, fixture.seconds)).toEqual(fixture.completed);
  }
  const game = createGame(1701, 6),
    portable = { ...game, id: 'another-theme' };
  expect(
    generateProjects(portable, [
      {
        incident: 'recovered-methods',
        choice: 'release',
        faction: game.factions[0].id,
        name: 'Test',
        description: 'Portable',
        work: 'Test',
        skill: 'engineering',
        slot: 'support',
        seconds: 30,
        cost: { parts: 1 },
        reward: { credits: 1 },
        reputation: 1,
      },
    ]).activities.every((activity) => activity.slot === 'support'),
  ).toBe(true);
});

it('keeps safe alternatives available when new training is capped or the required specialty is absent', () => {
  for (const { fantasy, theme } of themes)
    for (const event of theme.events.filter((event) =>
      event.choices.some((choice) => choice.training),
    )) {
      const { game, state } = opportunityFixture(fantasy, event.id, true, 7),
        training = event.choices.find((choice) => choice.training)!,
        safe = event.choices.find((choice) => !choice.training && !choice.recruit)!;
      for (const member of state.crew) member.experience = 30;
      const refused = dispatch(game, state, {
        type: 'discovery',
        id: event.id,
        choice: training.id,
      });
      expect(refused.error).toContain('No living specialist');
      expect(refused.state).toBe(state);
      state.crew
        .filter((member) => member.skill === training.training!.skill)
        .forEach((member) => {
          member.life = 'dead';
          member.assignment = 'rest';
        });
      const settled = dispatch(game, state, { type: 'discovery', id: event.id, choice: safe.id });
      expect(settled.error).toBeUndefined();
      expect(settled.state.threat).toBeNull();
    }
});
it('reserves new rescue names through other hiring and capacity changes, then joins exactly once', async () => {
  const { recruitName } = await import('../src/engine/personnel');
  for (const { fantasy, factory, theme } of themes) {
    const event = theme.events.find((event) => event.choices.some((choice) => choice.recruit))!,
      join = event.choices.find((choice) => choice.recruit)!;
    const { game, state: found } = opportunityFixture(fantasy, event.id, true, 7),
      offer = game.recruitment!.offers.find((offer) => offer.id === join.recruit)!;
    const reserved = found.incidents[0].recruitSerial!,
      name = recruitName(offer, found.seed, reserved);
    const other = game.recruitment!.offers.find(
      (offer) => !offer.emergency && offer.id !== join.recruit,
    )!;
    let state = dispatch(game, found, { type: 'hire', id: other.id }).state;
    expect(state.crew).toHaveLength(4);
    expect(
      dispatch(game, state, { type: 'discovery', id: event.id, choice: join.id }).error,
    ).toContain('accommodation');
    state.inventory[game.rules.currency] = 3000;
    const upgrade = game.upgrades.find((upgrade) => upgrade.crewCapacity)!;
    const expanded = dispatch(game, state, { type: 'upgrade', id: upgrade.id });
    expect(expanded.error).toBeUndefined();
    state = expanded.state;
    const serial = state.recruitSerial;
    const response = dispatch(game, state, { type: 'discovery', id: event.id, choice: join.id });
    expect(response.error).toBeUndefined();
    expect(response.state.crew.at(-1)!.name).toBe(name);
    expect(response.state.crew.at(-1)!.id).toBe(`${offer.id}-${reserved}`);
    expect(response.state.recruitSerial).toBe(serial);
    const restored = decodeSave(encodeSave(response.state, 1000), factory).state;
    expect(
      dispatch(game, restored, { type: 'discovery', id: event.id, choice: join.id }).error,
    ).toBeTruthy();
    expect(restored.crew).toHaveLength(5);
  }
});
