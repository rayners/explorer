import { createHollowmere } from '../src/fantasy/definition';
import { test, expect } from '@playwright/test';
import { createGame } from '../src/game/definition';
import { createState, dispatch, advance } from '../src/engine/simulation';
import { encodeSave } from '../src/engine/save';
test('production app catches up a saved voyage and reloads offline', async ({
  page,
  context,
  baseURL,
}) => {
  const game = createGame(1701);
  const started = dispatch(game, createState(game, 1701), {
    type: 'travel',
    target: 'cinder',
  }).state;
  const data = encodeSave(started, Date.now() - 120000);
  await page.addInitScript((raw) => {
    if (!sessionStorage.getItem('test-initialized')) {
      localStorage.setItem('far-wake.save.v1', raw);
      sessionStorage.setItem('test-initialized', 'true');
    }
  }, data);
  await page.goto(new URL('far-wake/', baseURL).href);
  await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
  await expect(
    page.getByText(game.locations.find((l) => l.id === 'cinder')!.name, { exact: true }).first(),
  ).toBeVisible();
  const registration = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    const manifestURL = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')!.href;
    const manifest = await (await fetch(manifestURL)).json();
    const icons = await Promise.all(
      manifest.icons.map(
        async (icon: { src: string }) => (await fetch(new URL(icon.src, manifestURL))).status,
      ),
    );
    return { scope: registration.scope, icons };
  });
  expect(registration.scope).toBe(new URL('../', page.url()).href);
  expect(registration.icons.every((status) => status === 200)).toBe(true);
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'A little further out.' })).toBeVisible();
  await page
    .getByRole('navigation')
    .getByRole('button', { name: /Operations/ })
    .click();
  await expect(page.getByRole('heading', { name: 'Orbital survey', exact: true })).toBeVisible();
  expect(await page.evaluate(() => typeof (window as any).__farWake)).toBe('undefined');
  await context.setOffline(false);
});
test('Hollowmere has its own install manifest and reloads offline under the shared service worker', async ({
  page,
  context,
  baseURL,
}) => {
  await page.goto(new URL('hollowmere/', baseURL).href);
  await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
  const info = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    const url = document.querySelector<HTMLLinkElement>('link[rel=manifest]')!.href;
    const manifest = await (await fetch(url)).json();
    return {
      scope: registration.scope,
      name: manifest.name,
      icons: await Promise.all(
        manifest.icons.map(
          async (icon: { src: string }) => (await fetch(new URL(icon.src, url))).status,
        ),
      ),
    };
  });
  expect(info.scope).toBe(new URL('../', page.url()).href);
  expect(info.name).toContain('Hollowmere');
  expect(info.icons.every((status: number) => status === 200)).toBe(true);
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Beyond the last lantern.' })).toBeVisible();
  await page.getByRole('navigation').getByRole('button', { name: 'Company', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Companions', exact: true })).toBeVisible();
  expect(await page.evaluate(() => typeof (window as any).__hollowmere)).toBe('undefined');
  await context.setOffline(false);
});
test('the picker caches both games and can open either game offline', async ({
  page,
  context,
  baseURL,
}) => {
  await page.goto(baseURL!);
  await expect(page.getByRole('link', { name: 'Play Far Wake', exact: true })).toBeVisible();
  await page.evaluate(async () => await navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('link', { name: 'Play Far Wake', exact: true }).click();
  await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
  const app = await page.evaluate(async () => {
    const url = document.querySelector<HTMLLinkElement>('link[rel=manifest]')!.href;
    return { url, manifest: await (await fetch(url)).json() };
  });
  expect(new URL(app.manifest.start_url, app.url).href).toBe(new URL('far-wake/', baseURL).href);
  expect(app.manifest.id).toBe(new URL(baseURL!).pathname);
  await page.getByRole('link', { name: 'All games', exact: true }).click();
  await page.getByRole('link', { name: 'Play Hollowmere', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Beyond the last lantern.' })).toBeVisible();
  await context.setOffline(false);
});

test('a recovered claim survives offline launch and applies its faction consequence once', async ({
  page,
  context,
  baseURL,
}) => {
  const game = createGame(1701, 2);
  let state = createState(game, 1701);
  state.rng = 1;
  state.location = 'morrow';
  state.known.push('morrow');
  state.discoveries.morrow = { surveyed: true, sites: [], dataSold: false };
  state.discoveries.cinder = {
    surveyed: true,
    sites: [...game.locations.find((l) => l.id === 'cinder')!.sites],
    dataSold: false,
  };
  state = advance(game, dispatch(game, state, { type: 'activity', id: 'explore' }).state, 100);
  state = advance(game, dispatch(game, state, { type: 'travel', target: 'anchor' }).state, 100);
  if (state.encounter)
    state = dispatch(game, state, { type: 'encounter', choice: 'surrender' }).state;
  const credits = state.inventory.credits;
  await page.addInitScript(
    (raw) => {
      if (!sessionStorage.getItem('test-initialized')) {
        localStorage.setItem('far-wake.save.v1', raw);
        sessionStorage.setItem('test-initialized', 'true');
      }
    },
    encodeSave(state, Date.now()),
  );
  await page.goto(new URL('far-wake/', baseURL).href);
  await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
  await page.evaluate(async () => await navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await page.reload();
  const panel = page.locator('.discovery-panel');
  await expect(panel).toContainText('A claim without an owner');
  await panel.getByRole('button', { name: 'Review discovery', exact: true }).click();
  await panel
    .getByRole('button', {
      name: `Release to ${game.factions.find((f) => f.id === 'independent')!.name}`,
      exact: true,
    })
    .click();
  await page.getByRole('button', { name: 'Confirm order', exact: true }).click();
  await expect(panel).toHaveCount(0);
  await page.reload();
  await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem('far-wake.save.v1')!).state,
  );
  expect(saved.incidents[0].choice).toBe('commons');
  expect(saved.reputation).toMatchObject({ independent: 14, combine: -8 });
  expect(saved.inventory.credits).toBe(credits + 90);
  expect(await page.evaluate(() => typeof (window as any).__farWake)).toBe('undefined');
  await context.setOffline(false);
});

test('selected generated-site expeditions finish exactly once across production offline reloads in both themes', async ({
  page,
  context,
  baseURL,
}) => {
  for (const fantasy of [false, true]) {
    const game = fantasy ? createHollowmere(1701) : createGame(1701);
    const location = fantasy ? 'old-road' : 'cinder';
    const state = createState(game, 1701);
    state.location = location;
    state.discoveries[location].surveyed = true;
    const site = game.sites!.filter((site) => site.location === location)[2];
    const started = dispatch(game, state, {
      type: 'activity',
      id: 'explore',
      site: site.id,
      approach: 'cautious',
    }).state;
    const expected = advance(game, started, 200);
    await page.addInitScript(
      ({ raw, key }) => {
        if (!sessionStorage.getItem('site-init-' + key)) {
          localStorage.setItem(key, raw);
          sessionStorage.setItem('site-init-' + key, 'yes');
        }
      },
      { raw: encodeSave(started, Date.now() - 200000), key: `${game.id}.save.v1` },
    );
    await context.setOffline(false);
    await page.goto(new URL(`${game.id}/`, baseURL).href);
    await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
    await page.evaluate(async () => await navigator.serviceWorker.ready);
    await page.reload();
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
    const saved = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).state,
      `${game.id}.save.v1`,
    );
    expect(saved.generationVersion).toBe(game.generationVersion);
    expect(saved.discoveries[location].sites).toEqual([site.id]);
    expect(saved.inventory).toEqual(expected.inventory);
    expect(saved.primary).toBeNull();
    await page
      .getByRole('navigation')
      .getByRole('button', { name: fantasy ? /Company/ : /Operations/ })
      .click();
    await expect(
      page
        .locator('.site-card')
        .filter({ has: page.getByRole('heading', { name: site.name, exact: true }) }),
    ).toContainText('This site cannot be explored again');
  }
  await context.setOffline(false);
});

function preparedFollowUp(fantasy: boolean, readyToFile: boolean, generation = 6) {
  const game = fantasy ? createHollowmere(1701, generation) : createGame(1701, generation);
  const location = fantasy ? 'old-road' : 'cinder';
  let state = createState(game, 1701);
  state.location = location;
  state.discoveries[location].surveyed = true;
  const site = game.sites!.find((site) => site.location === location)!;
  const mission = game.missions.find((mission) => mission.sourceSite === site.id)!;
  const work = game.activities.find((activity) => activity.mission === mission.id)!;
  state = advance(
    game,
    dispatch(game, state, { type: 'activity', id: 'explore', site: site.id }).state,
    200,
  );
  state.location = game.initial.location;
  state = dispatch(game, state, { type: 'accept', id: mission.id }).state;
  state.location = location;
  state.rng = 1;
  state = dispatch(game, state, { type: 'activity', id: work.id }).state;
  if (readyToFile) {
    state = advance(game, state, 200);
    state = advance(
      game,
      dispatch(game, state, { type: 'travel', target: game.initial.location }).state,
      200,
    );
    if (state.encounter)
      state = dispatch(game, state, { type: 'encounter', choice: 'surrender' }).state;
  }
  return { game, state, mission };
}
test('accepted discovery work catches up offline once and retains the completed receipt in both games', async ({
  page,
  context,
  baseURL,
}) => {
  for (const fantasy of [false, true]) {
    const { game, state, mission } = preparedFollowUp(fantasy, false);
    const expected = advance(game, state, 200);
    await page.addInitScript(
      ({ key, raw }) => {
        if (!sessionStorage.getItem(key)) {
          localStorage.setItem(key, raw);
          sessionStorage.setItem(key, 'yes');
        }
      },
      { key: `${game.id}.save.v1`, raw: encodeSave(state, Date.now() - 200000) },
    );
    await context.setOffline(false);
    await page.goto(new URL(`${game.id}/`, baseURL).href);
    await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
    await page.evaluate(async () => await navigator.serviceWorker.ready);
    await page.reload();
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
    const saved = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).state,
      `${game.id}.save.v1`,
    );
    expect(saved.primary).toBeNull();
    expect(saved.inventory).toEqual(expected.inventory);
    expect(saved.missions.find((entry: any) => entry.id === mission.id)).toMatchObject({
      progress: 1,
      claimed: false,
    });
    await page.reload();
    await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
    expect(
      await page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)!).state.inventory,
        `${game.id}.save.v1`,
      ),
    ).toEqual(expected.inventory);
  }
  await context.setOffline(false);
});
test('discovery follow-ups can be filed offline with one durable payment in both games', async ({
  page,
  context,
  baseURL,
}) => {
  for (const fantasy of [false, true]) {
    const { game, state, mission } = preparedFollowUp(fantasy, true);
    await page.addInitScript(
      ({ key, raw }) => {
        if (!sessionStorage.getItem(key)) {
          localStorage.setItem(key, raw);
          sessionStorage.setItem(key, 'yes');
        }
      },
      { key: `${game.id}.save.v1`, raw: encodeSave(state, Date.now()) },
    );
    await context.setOffline(false);
    await page.goto(new URL(`${game.id}/`, baseURL).href);
    await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
    await page.evaluate(async () => await navigator.serviceWorker.ready);
    await page.reload();
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
    await page
      .getByRole('navigation')
      .getByRole('button', { name: fantasy ? /Refuge/ : /Contacts/ })
      .click();
    await page
      .locator('.activity-card')
      .filter({ has: page.getByRole('heading', { name: mission.name, exact: true }) })
      .getByRole('button', {
        name: fantasy ? 'Report completed oath' : 'File contract',
        exact: true,
      })
      .click();
    await page.reload();
    await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
    const saved = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).state,
      `${game.id}.save.v1`,
    );
    expect(saved.inventory[game.rules.currency]).toBe(
      state.inventory[game.rules.currency] + mission.reward[game.rules.currency],
    );
    expect(saved.missions.find((entry: any) => entry.id === mission.id).claimed).toBe(true);
  }
  await context.setOffline(false);
});

test('generated-world journeys catch up once and query-string game URLs keep their theme offline', async ({
  page,
  context,
  baseURL,
}) => {
  for (const factory of [createGame, createHollowmere]) {
    const game = factory(1),
      added = game.locations.find((l) => l.id.includes('generated') && !l.station)!;
    const edge = game.routes.find(
      (r) => !r.interregional && (r.from === added.id || r.to === added.id),
    )!;
    const state = createState(game, 1);
    state.location = edge.from === added.id ? edge.to : edge.from;
    state.known = game.locations.map((l) => l.id);
    state.discoveries = Object.fromEntries(
      game.locations.map((l) => [l.id, { surveyed: l.station, sites: [], dataSold: false }]),
    );
    const started = dispatch(game, state, { type: 'travel', target: added.id });
    expect(started.error).toBeUndefined();
    await page.addInitScript(
      ({ key, raw }) => {
        if (!sessionStorage.getItem(key)) {
          localStorage.setItem(key, raw);
          sessionStorage.setItem(key, 'yes');
        }
      },
      { key: `${game.id}.save.v1`, raw: encodeSave(started.state, Date.now() - 120000) },
    );
    await context.setOffline(false);
    await page.goto(new URL(`${game.id}/?expedition=1`, baseURL).href);
    await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
    await page.evaluate(async () => await navigator.serviceWorker.ready);
    await page.reload();
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
    const read = () =>
      page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).state, `${game.id}.save.v1`);
    const arrived = await read();
    expect(arrived.location).toBe(added.id);
    expect(arrived.generationVersion).toBe(game.generationVersion);
    expect(arrived.primary).toBeNull();
    expect(arrived.inventory).toEqual(started.state.inventory);
    await page.reload();
    await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
    const again = await read();
    expect(again.location).toBe(added.id);
    expect(again.calendarDays).toBe(arrived.calendarDays);
    expect(again.inventory).toEqual(arrived.inventory);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await context.setOffline(false);
});

test('reserved specialists and knowledge choices settle once offline in both themes', async ({
  page,
  context,
  baseURL,
}) => {
  const { opportunityFixture } = await import('./opportunity-fixture');
  for (const fantasy of [false, true])
    for (const id of ['stranded-specialist', 'recovered-methods']) {
      const fixture = opportunityFixture(fantasy, id),
        { game, state } = fixture;
      const key = `${game.id}.save.v1`,
        marker = `${game.id}-${id}`;
      await page.addInitScript(
        ({ key, raw, marker }) => {
          if (!sessionStorage.getItem(marker)) {
            localStorage.setItem(key, raw);
            sessionStorage.setItem(marker, 'yes');
          }
        },
        { key, raw: encodeSave(state, Date.now()), marker },
      );
      await context.setOffline(false);
      await page.goto(new URL(`${game.id}/?discovery=${id}`, baseURL).href);
      await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
      await page.evaluate(async () => await navigator.serviceWorker.ready);
      await page.reload();
      await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
      await context.setOffline(true);
      await page.reload();
      await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
      await page
        .getByRole('navigation')
        .getByRole('button', { name: fantasy ? /Refuge/ : /Contacts/ })
        .click();
      const def = game.discoveryEvents!.entries.find((event) => event.id === id)!;
      if (def.kind !== 'choice') throw Error('Expected choices');
      const choice = def.choices.find(
        (choice) => choice.id === (id === 'stranded-specialist' ? 'join' : 'study'),
      )!;
      await page
        .locator('.discovery-panel')
        .getByRole('button', { name: choice.name, exact: true })
        .click();
      await page.getByRole('button', { name: 'Confirm order', exact: true }).click();
      await page.reload();
      await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
      const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).state, key);
      expect(saved.version).toBe(4);
      expect(saved.incidents.find((record: any) => record.id === id).choice).toBe(choice.id);
      if (choice.recruit) {
        expect(saved.crew.length).toBe(state.crew.length + 1);
        expect(saved.crew.at(-1).assignment).toBe('rest');
        expect(saved.recruitSerial).toBe(state.recruitSerial);
      } else {
        const skill = choice.training!.skill;
        for (const member of state.crew.filter(
          (member) => member.skill === skill && member.life !== 'dead',
        ))
          expect(saved.crew.find((entry: any) => entry.id === member.id).experience).toBe(
            Math.min(30, (member.experience ?? 0) + 4),
          );
      }
      await page.reload();
      await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
      const again = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).state, key);
      expect(again.crew).toEqual(saved.crew);
    }
  await context.setOffline(false);
});

for (const readyToFile of [false, true])
  test(`faction projects ${readyToFile ? 'file offline' : 'catch up offline'} with one durable receipt in both themes`, async ({
    page,
    context,
    baseURL,
  }) => {
    const { opportunityFixture } = await import('./opportunity-fixture');
    for (const fantasy of [false, true]) {
      const {
        game,
        state: found,
        source,
      } = opportunityFixture(fantasy, 'stranded-specialist', true, 6);
      let state = dispatch(game, found, {
        type: 'discovery',
        id: 'stranded-specialist',
        choice: 'resettle',
      }).state;
      const mission = game.missions.find(
        (mission) =>
          mission.sourceSite === state.incidents[0].site &&
          mission.discoveryChoice?.incident === 'stranded-specialist' &&
          mission.discoveryChoice.choice === 'resettle',
      )!;
      const work = game.activities.find((activity) => activity.mission === mission.id)!;
      state = dispatch(game, state, { type: 'accept', id: mission.id }).state;
      state.location = source.id;
      state.rng = 1;
      const order = dispatch(game, state, { type: 'activity', id: work.id });
      expect(order.error).toBeUndefined();
      state = order.state;
      if (readyToFile) {
        state = advance(game, state, 200);
        if (state.encounter)
          state = dispatch(game, state, { type: 'encounter', choice: 'surrender' }).state;
        state.location = game.initial.location;
      }
      const key = `${game.id}.save.v1`,
        marker = `${key}-project-${readyToFile}`;
      await page.addInitScript(
        ({ key, raw, marker }) => {
          if (!sessionStorage.getItem(marker)) {
            localStorage.setItem(key, raw);
            sessionStorage.setItem(marker, 'yes');
          }
        },
        { key, raw: encodeSave(state, Date.now() - (readyToFile ? 0 : 200000)), marker },
      );
      await context.setOffline(false);
      await page.goto(new URL(`${game.id}/?project=1`, baseURL).href);
      await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
      await page.evaluate(async () => await navigator.serviceWorker.ready);
      await page.reload();
      await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
      await context.setOffline(true);
      await page.reload();
      await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
      const read = () => page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).state, key);
      if (readyToFile) {
        await page
          .getByRole('navigation')
          .getByRole('button', { name: fantasy ? /Refuge/ : /Contacts/ })
          .click();
        const card = page
          .locator('.activity-card')
          .filter({ has: page.getByRole('heading', { name: mission.name, exact: true }) });
        await expect(card).toContainText('Field work complete');
        await card
          .getByRole('button', {
            name: fantasy ? 'Report completed oath' : 'File contract',
            exact: true,
          })
          .click();
      }
      const saved = await read();
      expect(saved.missions.find((entry: any) => entry.id === mission.id)).toMatchObject({
        progress: 1,
        claimed: readyToFile,
      });
      expect(saved.inventory[game.rules.currency]).toBe(
        state.inventory[game.rules.currency] +
          (readyToFile ? mission.reward[game.rules.currency] : 0),
      );
      await page.reload();
      await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
      const again = await read();
      expect(again.inventory).toEqual(saved.inventory);
      expect(again.reputation).toEqual(saved.reputation);
      expect(again.crew).toEqual(saved.crew);
      expect(again.missions).toEqual(saved.missions);
      expect(
        await page.evaluate(() => !('__farWake' in window) && !('__hollowmere' in window)),
      ).toBe(true);
    }
    await context.setOffline(false);
  });

test('existing and current expeditions plan receipt return routes offline without automatic departure', async ({
  page,
  context,
  baseURL,
}) => {
  for (const fantasy of [false, true])
    for (const generation of [3, 6]) {
      const fixture = preparedFollowUp(fantasy, false, generation),
        { game, mission } = fixture;
      let state = advance(game, fixture.state, 200);
      if (state.encounter)
        state = dispatch(game, state, { type: 'encounter', choice: 'surrender' }).state;
      const key = `${game.id}.save.v1`,
        marker = `planning-${game.id}-${generation}`;
      await page.addInitScript(
        ({ key, raw, marker }) => {
          if (!sessionStorage.getItem(marker)) {
            localStorage.setItem(key, raw);
            sessionStorage.setItem(marker, 'yes');
          }
        },
        { key, raw: encodeSave(state, Date.now()), marker },
      );
      await context.setOffline(false);
      await page.goto(new URL(`${game.id}/?planning=${generation}`, baseURL).href);
      await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
      await page.evaluate(async () => await navigator.serviceWorker.ready);
      await page.reload();
      await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
      await context.setOffline(true);
      await page.reload();
      await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
      await page
        .locator('.planning-summary')
        .getByRole('button', { name: 'Review accepted work', exact: true })
        .click();
      await expect(page.locator('.follow-up-work')).toContainText('Return to a known service hub');
      await page
        .locator('.follow-up-work')
        .getByRole('button', { name: 'Plot route to hub', exact: true })
        .click();
      await expect(page.locator('#route-plan-title')).toBeFocused();
      await expect(page.locator('.route-plan')).toContainText('Plotting spends nothing');
      const read = () => page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).state, key);
      const plotted = await read();
      expect(plotted.inventory).toEqual(state.inventory);
      expect(plotted.primary).toBeNull();
      expect(plotted.generationVersion).toBe(generation);
      expect(plotted.missions.find((saved: any) => saved.id === mission.id)).toMatchObject({
        progress: 1,
        claimed: false,
      });
      await page
        .locator('.route-plan')
        .getByRole('button', { name: /^Travel to / })
        .click();
      const departed = await read();
      expect(departed.primary.kind).toBe('travel');
      expect(departed.inventory).not.toEqual(plotted.inventory);
      await page.reload();
      await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
      const saved = await read();
      expect(saved.inventory).toEqual(departed.inventory);
      expect(saved.primary.target).toBe(departed.primary.target);
      expect(saved.missions).toEqual(plotted.missions);
      expect(
        await page.evaluate(() => !('__farWake' in window) && !('__hollowmere' in window)),
      ).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
  await context.setOffline(false);
});
