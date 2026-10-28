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
    expect(saved.generationVersion).toBe(3);
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
