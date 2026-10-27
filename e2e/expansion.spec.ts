import { test, expect, type Page } from '@playwright/test';
import { createGame } from '../src/game/definition';
import { createHollowmere } from '../src/fantasy/definition';
import { createState } from '../src/engine/simulation';
import { encodeSave } from '../src/engine/save';
const nav = async (page: Page, name: string) =>
  page
    .getByRole('navigation')
    .getByRole('button', { name: new RegExp(name, 'i') })
    .click();
const state = (page: Page, fantasy = false) =>
  page.evaluate((key) => (window as any)[key].state(), fantasy ? '__hollowmere' : '__farWake');
const next = (page: Page, seconds: number, fantasy = false) =>
  page.evaluate(({ seconds, key }) => (window as any)[key].advance(seconds), {
    seconds,
    key: fantasy ? '__hollowmere' : '__farWake',
  });
async function importState(page: Page, raw: string) {
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('textbox', { name: 'Save JSON' }).fill(raw);
  await page.getByRole('button', { name: 'Import pasted save' }).click();
  await page.getByRole('button', { name: 'Confirm order' }).click();
  await expect(page.locator('#settings-dialog')).not.toBeVisible();
}
async function open(page: Page, path = '/') {
  await page.goto(path);
  await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
}
async function escape(page: Page, fantasy = false) {
  if ((await state(page, fantasy)).encounter)
    await page
      .getByRole('button', {
        name: fantasy ? 'Surrender supplies' : 'Surrender cargo',
        exact: true,
      })
      .click();
}
test('specialists fill accommodation, expanded berths permit more hires, and the roster reloads', async ({
  page,
}) => {
  await open(page);
  await nav(page, 'operations');
  for (let i = 0; i < 4; i++) {
    await page
      .locator('.activity-card')
      .filter({ has: page.getByRole('heading', { name: 'Station work shift', exact: true }) })
      .getByRole('button', { name: 'Begin activity' })
      .click();
    await next(page, 60);
  }
  await nav(page, 'contacts');
  await page.getByRole('button', { name: 'Recruit Medical officer', exact: true }).click();
  expect((await state(page)).crew.filter((m: any) => m.life === 'alive')).toHaveLength(4);
  await expect(page.getByRole('button', { name: 'Recruit Engineer', exact: true })).toBeDisabled();
  await nav(page, 'operations');
  await page
    .getByRole('heading', { name: 'Expanded cryo berths', exact: true })
    .locator('..')
    .getByRole('button', { name: 'Install upgrade' })
    .click();
  await nav(page, 'contacts');
  await page.getByRole('button', { name: 'Recruit Engineer', exact: true }).click();
  await page.reload();
  await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
  expect((await state(page)).crew).toHaveLength(5);
  await nav(page, 'operations');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('a specimen causes a hidden stowaway that waits for orders and can be safely purged', async ({
  page,
}) => {
  await open(page);
  const start = createState(createGame(1701), 1701);
  start.location = 'morrow';
  start.known.push('morrow');
  start.discoveries.morrow = { surveyed: true, sites: [], dataSold: false };
  await importState(page, encodeSave(start, Date.now()));
  await nav(page, 'operations');
  await page
    .locator('.activity-card')
    .filter({ has: page.getByRole('heading', { name: 'Recover sealed specimen', exact: true }) })
    .getByRole('button', { name: 'Begin activity' })
    .click();
  await expect(page.locator('#confirm-dialog')).toContainText('permanently kill crew');
  await page.getByRole('button', { name: 'Confirm order' }).click();
  await next(page, 100);
  await escape(page);
  expect((await state(page)).threat.stage).toBe('hidden');
  for (let i = 0; i < 2; i++) {
    await page
      .locator('.activity-card')
      .filter({ has: page.getByRole('heading', { name: 'Resource extraction', exact: true }) })
      .getByRole('button', { name: 'Begin activity' })
      .click();
    await next(page, 100);
    await escape(page);
  }
  await expect(page.locator('.threat-panel')).toContainText('The unmanifested');
  const before = await state(page);
  await next(page, 86400);
  expect((await state(page)).crew).toEqual(before.crew);
  await page.getByRole('button', { name: 'Vent contaminated compartment', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm order' }).click();
  expect((await state(page)).threat).toBeNull();
  await page.reload();
  await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
  expect((await state(page)).threatHistory).toContain('stowaway');
});
test('a legacy Far Wake save migrates without losing resources or the original crew', async ({
  page,
}) => {
  await open(page);
  const legacy: any = createState(createGame(7), 7);
  legacy.version = 1;
  delete legacy.recruitSerial;
  delete legacy.threat;
  delete legacy.threatHistory;
  legacy.crew.forEach((m: any) => delete m.life);
  legacy.inventory.credits = 777;
  await importState(page, encodeSave(legacy, Date.now()));
  expect((await state(page)).version).toBe(2);
  expect((await state(page)).inventory.credits).toBe(777);
  expect((await state(page)).crew).toHaveLength(3);
  await page.reload();
  await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
  expect((await state(page)).inventory.credits).toBe(777);
});
test('Hollowmere completes its first oath through shared journey and exploration mechanics', async ({
  page,
}) => {
  await open(page, '/hollowmere/');
  await page.getByRole('button', { name: 'Accept Beyond the last lantern', exact: true }).click();
  await nav(page, 'journey');
  await page
    .locator('.route-card')
    .filter({ has: page.getByRole('heading', { name: 'The Old Road', exact: true }) })
    .getByRole('button', { name: 'Travel', exact: true })
    .click();
  await next(page, 50, true);
  await escape(page, true);
  await nav(page, 'company');
  await page
    .locator('.activity-card')
    .filter({ has: page.getByRole('heading', { name: 'Read the signs', exact: true }) })
    .getByRole('button', { name: 'Begin activity' })
    .click();
  await next(page, 50, true);
  await escape(page, true);
  expect((await state(page, true)).known).toContain('ash-camp');
  await nav(page, 'journey');
  await page
    .locator('.route-card')
    .filter({ has: page.getByRole('heading', { name: 'Mournwatch', exact: true }) })
    .getByRole('button', { name: 'Travel', exact: true })
    .click();
  await next(page, 50, true);
  await escape(page, true);
  await nav(page, 'refuge');
  await page
    .locator('.activity-card')
    .filter({ has: page.getByRole('heading', { name: 'Beyond the last lantern', exact: true }) })
    .getByRole('button', { name: 'Report completed oath' })
    .click();
  expect((await state(page, true)).missions[0].claimed).toBe(true);
  for (const name of ['chronicle', 'journey', 'company', 'refuge']) {
    await nav(page, name);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});
test('fantasy class composition gates magic, holy rites and dangerous expeditions', async ({
  page,
}) => {
  await open(page, '/hollowmere/');
  const start = createState(createHollowmere(1701), 1701);
  start.location = 'old-road';
  start.discoveries['old-road'].surveyed = true;
  await importState(page, encodeSave(start, Date.now()));
  await nav(page, 'company');
  await page.getByRole('combobox', { name: 'Ves Rook assignment' }).selectOption('rest');
  const ward = page
    .locator('.activity-card')
    .filter({ has: page.getByRole('heading', { name: 'Unravel the ward', exact: true }) });
  await expect(ward.getByRole('button', { name: 'Begin activity' })).toBeDisabled();
  await expect(ward).toContainText('mage specialist');
  await page.getByRole('combobox', { name: 'Ves Rook assignment' }).selectOption('primary');
  await expect(ward.getByRole('button', { name: 'Begin activity' })).toBeEnabled();
  const shrine = page
    .locator('.activity-card')
    .filter({ has: page.getByRole('heading', { name: 'Consecrate the shrine', exact: true }) });
  await expect(shrine.getByRole('button', { name: 'Begin activity' })).toBeDisabled();
  await page.getByRole('combobox', { name: 'Sister Elin assignment' }).selectOption('primary');
  await expect(shrine.getByRole('button', { name: 'Begin activity' })).toBeEnabled();
  await page.getByRole('combobox', { name: 'Bran Ash assignment' }).selectOption('rest');
  await expect(
    page
      .locator('.activity-card')
      .filter({ has: page.getByRole('heading', { name: 'Lead an expedition', exact: true }) })
      .getByRole('button', { name: 'Begin activity' }),
  ).toBeDisabled();
});
test('both games keep independent saves and command locks, and reject cross-game imports', async ({
  page,
  context,
}) => {
  await open(page);
  const raw = await page.evaluate(() => localStorage.getItem('far-wake.save.v1')!);
  const fantasy = await context.newPage();
  await open(fantasy, '/hollowmere/');
  await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
  await nav(fantasy, 'refuge');
  await fantasy.getByRole('button', { name: 'Recruit Scout', exact: true }).click();
  expect((await state(fantasy, true)).crew).toHaveLength(4);
  expect((await state(page)).crew).toHaveLength(3);
  await fantasy.getByRole('button', { name: 'Settings', exact: true }).click();
  await fantasy.getByRole('textbox', { name: 'Save JSON' }).fill(raw);
  await fantasy.getByRole('button', { name: 'Import pasted save' }).click();
  await fantasy.getByRole('button', { name: 'Confirm order' }).click();
  await expect(fantasy.locator('#settings-error')).toContainText('invalid');
  expect((await state(fantasy, true)).crew).toHaveLength(4);
  await fantasy.close();
});
