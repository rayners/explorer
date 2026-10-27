import { test, expect, type Page } from '@playwright/test';
const next = async (page: Page, seconds: number) =>
  page.evaluate((dt) => (window as any).__farWake.advance(dt), seconds);
const state = async (page: Page) => page.evaluate(() => (window as any).__farWake.state());
const nav = async (page: Page, name: string) =>
  page
    .getByRole('navigation')
    .getByRole('button', { name: new RegExp(name, 'i') })
    .click();
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
});
test('captain accepts a contract, travels, surveys, and files the findings', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await nav(page, 'contacts');
  const first = page
    .locator('.activity-card')
    .filter({ has: page.getByRole('heading', { name: 'First light', exact: true }) });
  await first.getByRole('button', { name: 'Accept contract' }).click();
  await nav(page, 'navigation');
  await page
    .locator('.route-card')
    .filter({ has: page.getByRole('heading', { name: 'Cinder', exact: true }) })
    .getByRole('button', { name: 'Set course' })
    .click();
  await expect(page.locator('.active-job')).toContainText('En route to Cinder');
  await next(page, 65);
  if ((await state(page)).encounter)
    await page.getByRole('button', { name: 'Surrender cargo', exact: true }).click();
  await nav(page, 'operations');
  await page
    .locator('.activity-card')
    .filter({ has: page.getByRole('heading', { name: 'Orbital survey', exact: true }) })
    .getByRole('button', { name: 'Begin activity' })
    .click();
  await next(page, 50);
  if ((await state(page)).encounter)
    await page.getByRole('button', { name: 'Surrender cargo', exact: true }).click();
  expect((await state(page)).known).toContain('pale-0');
  await page.reload();
  await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
  expect((await state(page)).discoveries.cinder.surveyed).toBe(true);
  await nav(page, 'navigation');
  await page
    .locator('.route-card')
    .filter({ has: page.getByRole('heading', { name: 'Anchor Station', exact: true }) })
    .getByRole('button', { name: 'Set course' })
    .click();
  await next(page, 65);
  if ((await state(page)).encounter)
    await page.getByRole('button', { name: 'Surrender cargo', exact: true }).click();
  await nav(page, 'contacts');
  await page
    .locator('.activity-card')
    .filter({ has: page.getByRole('heading', { name: 'First light', exact: true }) })
    .getByRole('button', { name: 'File contract' })
    .click();
  expect((await state(page)).missions.find((m: any) => m.id === 'first-light').claimed).toBe(true);
  expect(errors).toEqual([]);
});
test('console fits the viewport and supports keyboard and save transfer', async ({ page }) => {
  for (const name of ['overview', 'navigation', 'operations', 'contacts']) {
    await nav(page, name);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: 'Export to text' }).click();
  const exported = await page.getByRole('textbox', { name: 'Save JSON' }).inputValue();
  expect(JSON.parse(exported).state.seed).toBe(1701);
  await page.getByRole('textbox', { name: 'Save JSON' }).fill('broken');
  await page.getByRole('button', { name: 'Import pasted save' }).click();
  await page.getByRole('button', { name: 'Confirm order' }).click();
  await expect(page.locator('#settings-error')).toContainText('valid save');
  await page.getByRole('textbox', { name: 'Save JSON' }).fill(exported);
  await page.getByRole('button', { name: 'Import pasted save' }).click();
  await page.getByRole('button', { name: 'Confirm order' }).click();
  await expect(page.locator('#settings-dialog')).not.toBeVisible();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#settings-dialog')).not.toBeVisible();
});
test('only one tab can write to an expedition', async ({ page, context }) => {
  const second = await context.newPage();
  await second.goto('/');
  await expect(second.locator('#save-status')).toHaveText('READ-ONLY TAB');
  await expect(second.getByText('This tab is read-only.', { exact: false })).toBeVisible();
  await nav(page, 'operations');
  await page
    .locator('.activity-card')
    .filter({ has: page.getByRole('heading', { name: 'Station work shift', exact: true }) })
    .getByRole('button', { name: 'Begin activity' })
    .click();
  await next(page, 60);
  await expect.poll(async () => (await state(second)).inventory.credits).toBe(385);
  await page.close();
  await second.reload();
  await expect(second.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
  await second.close();
});
test('real viewport layouts remain usable in landscape', async ({ page }) => {
  await page.setViewportSize({ width: 932, height: 430 });
  await nav(page, 'operations');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('a previous expedition can be recovered through the backup import flow', async ({ page }) => {
  await nav(page, 'operations');
  await page
    .locator('.activity-card')
    .filter({ has: page.getByRole('heading', { name: 'Station work shift', exact: true }) })
    .getByRole('button', { name: 'Begin activity' })
    .click();
  await next(page, 60);
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.locator('#new-seed').fill('44');
  await page.getByRole('button', { name: 'Start a new expedition' }).click();
  await page.getByRole('button', { name: 'Confirm order' }).click();
  expect((await state(page)).seed).toBe(44);
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: 'Load local backup' }).click();
  await page.getByRole('button', { name: 'Import pasted save' }).click();
  await page.getByRole('button', { name: 'Confirm order' }).click();
  expect((await state(page)).seed).toBe(1701);
  expect((await state(page)).inventory.credits).toBe(385);
});
test('LAN fallback coordinates command ownership without Web Locks', async ({ page, context }) => {
  await page.close();
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'locks', { value: undefined, configurable: true });
  });
  const active = await context.newPage();
  await active.goto('/');
  await expect(active.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
  const other = await context.newPage();
  await other.goto('/');
  await expect(other.locator('#save-status')).toHaveText('READ-ONLY TAB');
  await nav(active, 'operations');
  await active
    .locator('.activity-card')
    .filter({ has: active.getByRole('heading', { name: 'Station work shift', exact: true }) })
    .getByRole('button', { name: 'Begin activity' })
    .click();
  await next(active, 60);
  await expect.poll(async () => (await state(other)).inventory.credits).toBe(385);
  await active.close();
  await other.reload();
  await expect(other.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
  await other.close();
});
