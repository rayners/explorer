import { test, expect } from '@playwright/test';
import { createGame } from '../src/game/definition';
import { createState } from '../src/engine/simulation';
import { encodeSave } from '../src/engine/save';
test('the home page lists both games without starting an expedition', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'There’s more beyond the map.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Play Far Wake', exact: true })).toHaveAttribute(
    'href',
    './far-wake/',
  );
  await expect(page.getByRole('link', { name: 'Play Hollowmere', exact: true })).toHaveAttribute(
    'href',
    './hollowmere/',
  );
  expect(
    await page.evaluate(() => [
      localStorage.getItem('far-wake.save.v1'),
      localStorage.getItem('hollowmere.save.v1'),
    ]),
  ).toEqual([null, null]);
  expect(await page.evaluate(() => typeof (window as any).__farWake)).toBe('undefined');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('a previous Far Wake save resumes at the new address and the library does not change it', async ({
  page,
}) => {
  const saved = createState(createGame(7), 7);
  saved.inventory.credits = 777;
  const raw = encodeSave(saved, Date.now());
  await page.addInitScript((value) => {
    if (!sessionStorage.getItem('picker-initialized')) {
      localStorage.setItem('far-wake.save.v1', value);
      sessionStorage.setItem('picker-initialized', 'yes');
    }
  }, raw);
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Resume Far Wake', exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('far-wake.save.v1'))).toBe(raw);
  await page.getByRole('link', { name: 'Resume Far Wake', exact: true }).click();
  await expect(page).toHaveURL(/\/far-wake\/$/);
  await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
  expect(await page.evaluate(() => (window as any).__farWake.state().inventory.credits)).toBe(777);
  await page.getByRole('link', { name: 'All games', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Resume Far Wake', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Resume Far Wake', exact: true }).click();
  await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
  expect(await page.evaluate(() => (window as any).__farWake.state().inventory.credits)).toBe(777);
  await page.getByRole('link', { name: 'All games', exact: true }).click();
  await page.getByRole('link', { name: 'Play Hollowmere', exact: true }).click();
  await expect(page).toHaveURL(/\/hollowmere\/$/);
  await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
  await page.locator('.topbar').getByRole('link', { name: 'All games', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Resume Hollowmere', exact: true })).toBeVisible();
});
test('legacy installed launches open Far Wake and All games still opens the library', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = window.matchMedia.bind(window);
    window.matchMedia = (query) => {
      const result = original(query);
      if (query === '(display-mode: standalone)')
        Object.defineProperty(result, 'matches', { value: true });
      return result;
    };
  });
  await page.goto('/');
  await expect(page).toHaveURL(/\/far-wake\/$/);
  await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
  await page.getByRole('link', { name: 'All games', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'There’s more beyond the map.' })).toBeVisible();
});
