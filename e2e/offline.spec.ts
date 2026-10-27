import { test, expect } from '@playwright/test';
import { createGame } from '../src/game/definition';
import { createState, dispatch } from '../src/engine/simulation';
import { encodeSave } from '../src/engine/save';
test('production app catches up a saved voyage and reloads offline', async ({ page, context }) => {
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
  await page.goto('./');
  await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
  await expect(page.getByText('Cinder', { exact: true }).first()).toBeVisible();
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
  expect(registration.scope).toBe(new URL('./', page.url()).href);
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
