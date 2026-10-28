import { readFileSync } from 'node:fs';
import { test, expect, type Page } from '@playwright/test';
import { createGame } from '../src/game/definition';
import { createHollowmere } from '../src/fantasy/definition';
import { createState } from '../src/engine/simulation';
import { encodeSave } from '../src/engine/save';
const defaultGame = createGame(1701);
const defaultFantasy = createHollowmere(1701);
const claimChoice = `Release to ${defaultGame.factions.find((f) => f.id === 'independent')!.name}`;
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
async function open(page: Page, path = '/far-wake/') {
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
  delete legacy.incidents;
  delete legacy.discoveryCooldown;
  delete legacy.recruitSerial;
  delete legacy.threat;
  delete legacy.threatHistory;
  legacy.crew.forEach((m: any) => delete m.life);
  legacy.inventory.credits = 777;
  await importState(page, encodeSave(legacy, Date.now()));
  expect((await state(page)).version).toBe(3);
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
    .filter({
      has: page.getByRole('heading', {
        name: defaultFantasy.locations.find((l) => l.id === 'old-road')!.name,
        exact: true,
      }),
    })
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
    .filter({
      has: page.getByRole('heading', {
        name: defaultFantasy.locations.find((l) => l.id === 'mournwatch')!.name,
        exact: true,
      }),
    })
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
  await page
    .getByRole('combobox', {
      name: `${defaultFantasy.initial.crew.find((c) => c.id === 'ves')!.name} assignment`,
    })
    .selectOption('rest');
  const ward = page
    .locator('.activity-card')
    .filter({ has: page.getByRole('heading', { name: 'Unravel the ward', exact: true }) });
  await expect(ward.getByRole('button', { name: 'Begin activity' })).toBeDisabled();
  await expect(ward).toContainText('mage specialist');
  await page
    .getByRole('combobox', {
      name: `${defaultFantasy.initial.crew.find((c) => c.id === 'ves')!.name} assignment`,
    })
    .selectOption('primary');
  await expect(ward.getByRole('button', { name: 'Begin activity' })).toBeEnabled();
  const shrine = page
    .locator('.activity-card')
    .filter({ has: page.getByRole('heading', { name: 'Consecrate the shrine', exact: true }) });
  await expect(shrine.getByRole('button', { name: 'Begin activity' })).toBeDisabled();
  await page
    .getByRole('combobox', {
      name: `${defaultFantasy.initial.crew.find((c) => c.id === 'elin')!.name} assignment`,
    })
    .selectOption('primary');
  await expect(shrine.getByRole('button', { name: 'Begin activity' })).toBeEnabled();
  await page
    .getByRole('combobox', {
      name: `${defaultFantasy.initial.crew.find((c) => c.id === 'bran')!.name} assignment`,
    })
    .selectOption('rest');
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

function discoveryStart(rng: number) {
  const game = createGame(1701);
  const start = createState(game, 1701);
  start.rng = rng;
  start.location = 'morrow';
  start.known.push('morrow');
  start.discoveries.morrow = { surveyed: true, sites: [], dataSold: false };
  start.discoveries.cinder = {
    surveyed: true,
    sites: [...game.locations.find((location) => location.id === 'cinder')!.sites],
    dataSold: false,
  };
  return start;
}
async function beginActivity(page: Page, name: string) {
  await page
    .locator('.activity-card')
    .filter({ has: page.getByRole('heading', { name, exact: true }) })
    .getByRole('button', { name: 'Begin activity', exact: true })
    .click();
}
test('an ordinary expedition can bring back a surprise passenger without an exposure warning', async ({
  page,
}) => {
  await open(page);
  // This saved RNG state selects a passenger from the real shipped event catalog.
  await importState(page, encodeSave(discoveryStart(2), Date.now()));
  await nav(page, 'operations');
  await beginActivity(page, 'Surface expedition');
  await expect(page.locator('#confirm-dialog')).not.toBeVisible();
  await next(page, 100);
  expect((await state(page)).threat.stage).toBe('hidden');
  await expect(page.locator('.threat-panel')).toHaveCount(0);
  await expect(page.locator('.discovery-panel')).toHaveCount(0);
  await expect(page.getByText('Unseen passenger', { exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
  expect((await state(page)).threat.stage).toBe('hidden');
  for (let i = 0; i < 2; i++) {
    await nav(page, 'operations');
    await beginActivity(page, 'Resource extraction');
    await next(page, 100);
    await escape(page);
  }
  await expect(page.locator('.threat-panel')).toContainText(
    'Responses can cause permanent casualties',
  );
  const before = await state(page);
  await next(page, 86400);
  expect((await state(page)).crew).toEqual(before.crew);
  await page.getByRole('button', { name: 'Vent contaminated compartment', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm order' }).click();
  expect((await state(page)).threat).toBeNull();
  await page.reload();
  await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
  expect((await state(page)).incidents[0].id).toBe('unseen-passenger');
});
test('a discovery becomes a station follow-up with a persistent, explicit faction choice', async ({
  page,
}) => {
  await open(page);
  await importState(page, encodeSave(discoveryStart(1), Date.now()));
  await nav(page, 'operations');
  await beginActivity(page, 'Surface expedition');
  await next(page, 100);
  const panel = page.locator('.discovery-panel');
  await expect(
    panel.getByRole('heading', { name: 'A claim without an owner', exact: true }),
  ).toBeVisible();
  await expect(panel.getByRole('button', { name: claimChoice, exact: true })).toHaveCount(0);
  await panel.getByRole('button', { name: 'Review discovery', exact: true }).click();
  await expect(panel).toContainText('Visit a service hub');
  await expect(panel.getByRole('button', { name: claimChoice, exact: true })).toBeDisabled();
  await expect(panel).toContainText(
    `+14 ${defaultGame.factions.find((f) => f.id === 'independent')!.name}`,
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.reload();
  await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
  await expect(panel).toBeVisible();
  await nav(page, 'navigation');
  await page
    .locator('.route-card')
    .filter({
      has: page.getByRole('heading', {
        name: defaultGame.locations.find((l) => l.id === 'anchor')!.name,
      }),
    })
    .getByRole('button', { name: 'Set course', exact: true })
    .click();
  await next(page, 100);
  await escape(page);
  const before = await state(page);
  await panel.getByRole('button', { name: 'Review discovery', exact: true }).click();
  await panel.getByRole('button', { name: claimChoice, exact: true }).click();
  await expect(page.locator('#confirm-dialog')).toContainText('final for this expedition');
  await page.getByRole('button', { name: 'Confirm order', exact: true }).click();
  await expect(panel).toHaveCount(0);
  const after = await state(page);
  expect(after.inventory.credits).toBe(before.inventory.credits + 90);
  expect(after.reputation.independent).toBe(before.reputation.independent + 14);
  expect(after.reputation.combine).toBe(before.reputation.combine - 8);
  await page.reload();
  await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
  await nav(page, 'contacts');
  await expect(page.locator('.discovery-history')).toContainText(claimChoice);
  expect((await state(page)).incidents[0].choice).toBe('commons');
  expect((await state(page)).inventory.credits).toBe(after.inventory.credits);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('released worlds retain their original names across import, secondary-tab updates and reload', async ({
  page,
  context,
}) => {
  await open(page);
  const legacy = readFileSync('tests/fixtures/far-wake-generation1.json', 'utf8');
  await importState(page, legacy);
  await expect(page.locator('#breadcrumb')).toContainText('ANCHOR STATION');
  await expect(page.locator('.topbar-location .eyebrow')).toContainText('ORISON COMBINE');
  expect((await state(page)).crew[1].name).toBe('Ishaan Rao');
  expect((await state(page)).generationVersion).toBe(1);
  const observer = await context.newPage();
  await observer.goto('/far-wake/');
  await expect(observer.locator('#save-status')).toHaveText('READ-ONLY TAB');
  await expect(observer.locator('#breadcrumb')).toContainText('ANCHOR STATION');
  await nav(page, 'contacts');
  await page.getByRole('button', { name: 'Recruit Engineer', exact: true }).click();
  await expect.poll(async () => (await state(observer)).crew.length).toBe(5);
  await expect(observer.locator('.topbar-location .eyebrow')).toContainText('ORISON COMBINE');
  await observer.close();
  await page.reload();
  await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
  await expect(page.locator('#breadcrumb')).toContainText('ANCHOR STATION');
  expect((await state(page)).crew[1].name).toBe('Ishaan Rao');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.locator('#new-seed').fill('91');
  await page.getByRole('button', { name: 'Start a new expedition', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm order', exact: true }).click();
  const fresh = createGame(91);
  expect((await state(page)).generationVersion).toBe(2);
  expect((await state(page)).crew.map((member: any) => member.name)).toEqual(
    fresh.initial.crew.map((member) => member.name),
  );
  await expect(page.locator('#breadcrumb')).toContainText(fresh.locations[0].name.toUpperCase());
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('far-wake.backup.v1')!).state.generationVersion,
    ),
  ).toBe(1);
  await page.reload();
  await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
  await expect(page.locator('#breadcrumb')).toContainText(fresh.locations[0].name.toUpperCase());
  const fantasy = readFileSync('tests/fixtures/hollowmere-generation1.json', 'utf8');
  await page.goto('/hollowmere/');
  await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
  await importState(page, fantasy);
  await expect(page.locator('#breadcrumb')).toContainText('Mournwatch');
  expect((await state(page, true)).crew[1].name).toBe('Ves Rook');
  await page.reload();
  await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
  expect((await state(page, true)).generationVersion).toBe(1);
  await expect(page.locator('#breadcrumb')).toContainText('Mournwatch');
});
