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
  expect((await state(page)).version).toBe(5);
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
  const game = createGame(1701, 2);
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
  expect((await state(page)).generationVersion).toBe(7);
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

test('generated sites let both games select and preserve a cautious expedition out of order', async ({
  page,
}) => {
  for (const fantasy of [false, true]) {
    const game = fantasy ? createHollowmere(1701) : createGame(1701);
    const location = fantasy ? 'old-road' : 'cinder';
    const start = createState(game, 1701);
    start.location = location;
    start.discoveries[location].surveyed = true;
    await open(page, fantasy ? '/hollowmere/' : '/far-wake/');
    await importState(page, encodeSave(start, Date.now()));
    await nav(page, fantasy ? 'company' : 'operations');
    const site = game.sites!.filter((site) => site.location === location)[2];
    const card = page
      .locator('.site-card')
      .filter({ has: page.getByRole('heading', { name: site.name, exact: true }) });
    await expect(card).toContainText(site.opportunity.name);
    await card.locator('summary').click();
    const cautious = site.approaches.find((approach) => approach.id === 'cautious')!;
    const choice = card
      .locator('.site-approach')
      .filter({ has: page.getByRole('heading', { name: cautious.name, exact: true }) });
    await expect(choice).toContainText('incident risk');
    await expect(choice).toContainText('Cost:');
    await expect(choice).toContainText('Return:');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await choice.getByRole('button', { name: `Explore: ${cautious.name}`, exact: true }).click();
    expect((await state(page, fantasy)).primary.site).toBe(site.id);
    await page.reload();
    await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
    expect((await state(page, fantasy)).primary.site).toBe(site.id);
    await next(page, 200, fantasy);
    await escape(page, fantasy);
    expect((await state(page, fantasy)).discoveries[location].sites).toEqual([site.id]);
    await nav(page, fantasy ? 'company' : 'operations');
    await expect(card).toContainText('This site cannot be explored again');
    await expect(card.getByRole('button')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});

test('an explored site creates a follow-up with accepted field work and one-time hub payment in both games', async ({
  page,
}) => {
  for (const fantasy of [false, true]) {
    const game = fantasy ? createHollowmere(1701) : createGame(1701);
    const location = fantasy ? 'old-road' : 'cinder';
    const source = game.locations.find((entry) => entry.id === location)!;
    const home = game.locations.find((entry) => entry.id === game.initial.location)!;
    const site = game.sites!.find((site) => site.location === location)!;
    const mission = game.missions.find((mission) => mission.sourceSite === site.id)!;
    const work = game.activities.find((activity) => activity.mission === mission.id)!;
    await open(page, `/${game.id}/`);
    await nav(page, fantasy ? 'refuge' : 'contacts');
    await expect(page.getByRole('heading', { name: mission.name, exact: true })).toHaveCount(0);
    const start = createState(game, 1701);
    start.location = location;
    start.discoveries[location].surveyed = true;
    await importState(page, encodeSave(start, Date.now()));
    await nav(page, fantasy ? 'company' : 'operations');
    await beginActivity(page, fantasy ? 'Lead an expedition' : 'Surface expedition');
    await next(page, 150, fantasy);
    await escape(page, fantasy);
    await expect(
      page
        .locator('.site-card')
        .filter({ has: page.getByRole('heading', { name: site.name, exact: true }) }),
    ).toContainText('follow-up contract is available');
    const travel = async (name: string) => {
      await nav(page, fantasy ? 'journey' : 'navigation');
      await page
        .locator('.route-card')
        .filter({ has: page.getByRole('heading', { name, exact: true }) })
        .getByRole('button', { name: fantasy ? 'Travel' : 'Set course', exact: true })
        .click();
      await next(page, 100, fantasy);
      await escape(page, fantasy);
    };
    await travel(home.name);
    await nav(page, fantasy ? 'refuge' : 'contacts');
    const card = page
      .locator('.activity-card')
      .filter({ has: page.getByRole('heading', { name: mission.name, exact: true }) });
    await expect(card).toContainText('Work supplies:');
    await expect(card).toContainText(source.name);
    await card
      .getByRole('button', { name: fantasy ? 'Accept oath' : 'Accept contract', exact: true })
      .click();
    await nav(page, fantasy ? 'company' : 'operations');
    const task = page
      .locator('.follow-up-work .activity-card')
      .filter({ has: page.getByRole('heading', { name: work.name, exact: true }) });
    await expect(task.getByRole('button', { name: 'Begin activity', exact: true })).toBeDisabled();
    await expect(task).toContainText(source.name);
    await travel(source.name);
    await nav(page, fantasy ? 'company' : 'operations');
    await task.getByRole('button', { name: 'Begin activity', exact: true }).click();
    expect((await state(page, fantasy)).primary.definition).toBe(work.id);
    await next(page, 150, fantasy);
    await escape(page, fantasy);
    expect(
      (await state(page, fantasy)).missions.find((entry: any) => entry.id === mission.id).progress,
    ).toBe(1);
    await expect(task).toHaveCount(0);
    await page.reload();
    await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
    await travel(home.name);
    await nav(page, fantasy ? 'refuge' : 'contacts');
    await expect(
      card.getByRole('button', {
        name: fantasy ? 'Release oath' : 'Release contract',
        exact: true,
      }),
    ).toBeDisabled();
    await expect(card).toContainText('retained until filed');
    const before = await state(page, fantasy);
    await card
      .getByRole('button', {
        name: fantasy ? 'Report completed oath' : 'File contract',
        exact: true,
      })
      .click();
    const after = await state(page, fantasy);
    expect(after.inventory[game.rules.currency]).toBe(
      before.inventory[game.rules.currency] + mission.reward[game.rules.currency],
    );
    expect(after.missions.find((entry: any) => entry.id === mission.id).claimed).toBe(true);
    await page.reload();
    await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
    expect(
      (await state(page, fantasy)).missions.find((entry: any) => entry.id === mission.id).claimed,
    ).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});

test('generated worlds show actual connections and preserve journeys to optional places through import and reload', async ({
  page,
}, testInfo) => {
  const initialViewport = page.viewportSize()!;
  for (const fantasy of [false, true]) {
    await page.setViewportSize(initialViewport);
    const seed = fantasy ? 2026 : 44;
    const game = fantasy ? createHollowmere(seed) : createGame(seed);
    const added = game.locations.find((l) => l.id.includes('generated') && !l.station)!;
    const edge = game.routes.find(
      (r) => !r.interregional && (r.from === added.id || r.to === added.id),
    )!;
    const start = createState(game, seed);
    start.location = edge.from === added.id ? edge.to : edge.from;
    start.known = game.locations.map((l) => l.id);
    start.discoveries = Object.fromEntries(
      game.locations.map((l) => [l.id, { surveyed: l.station, sites: [], dataSold: false }]),
    );
    await open(page, `/${game.id}/`);
    await importState(page, encodeSave(start, Date.now()));
    await nav(page, fantasy ? 'journey' : 'navigation');
    await expect(page.locator('.star-button')).toHaveCount(game.regions.length);
    await expect(page.locator('.map-lines path')).toHaveCount(
      game.routes.filter((r) => r.interregional).length,
    );
    const buttons = await page.locator('.star-button').all();
    for (let i = 0; i < buttons.length; i++) {
      const a = (await buttons[i].boundingBox())!;
      expect(a.height).toBeGreaterThanOrEqual(44);
      expect(a.width).toBeGreaterThanOrEqual(44);
      for (let j = i + 1; j < buttons.length; j++) {
        const b = (await buttons[j].boundingBox())!;
        expect(
          a.x + a.width <= b.x ||
            b.x + b.width <= a.x ||
            a.y + a.height <= b.y ||
            b.y + b.height <= a.y,
        ).toBe(true);
      }
    }
    const region = game.regions.find((r) => r.id === added.region)!;
    await page.locator(`[data-region="${region.id}"]`).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (testInfo.project.name === 'iphone')
      await page.screenshot({ path: `/tmp/${game.id}-generated-world.png`, fullPage: true });
    const card = page
      .locator('.route-card')
      .filter({ has: page.getByRole('heading', { name: added.name, exact: true }) });
    await expect(card).toContainText(/real/i);
    await card
      .getByRole('button', { name: fantasy ? 'Travel' : 'Set course', exact: true })
      .click();
    expect((await state(page, fantasy)).primary.target).toBe(added.id);
    await page.reload();
    await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
    expect((await state(page, fantasy)).generationVersion).toBe(game.generationVersion);
    expect((await state(page, fantasy)).primary.target).toBe(added.id);
    await next(page, 120, fantasy);
    await escape(page, fantasy);
    expect((await state(page, fantasy)).location).toBe(added.id);
    await nav(page, fantasy ? 'company' : 'operations');
    await beginActivity(page, fantasy ? 'Read the signs' : 'Orbital survey');
    await next(page, 120, fantasy);
    await escape(page, fantasy);
    await expect(page.locator('.site-card')).toHaveCount(3);
    const saved = await state(page, fantasy);
    await page.reload();
    await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
    expect((await state(page, fantasy)).discoveries[added.id]).toEqual(saved.discoveries[added.id]);
    await page.setViewportSize({ width: 932, height: 430 });
    await nav(page, fantasy ? 'journey' : 'navigation');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});

test('specialists gain practice and lasting discoveries join or train crew in both themes', async ({
  page,
}, testInfo) => {
  const originalViewport = page.viewportSize()!;
  for (const fantasy of [false, true]) {
    await page.setViewportSize(originalViewport);
    const { opportunityFixture } = await import('./opportunity-fixture');
    const { recruitName } = await import('../src/engine/personnel');
    const rescue = opportunityFixture(fantasy),
      { game } = rescue;
    await open(page, `/${game.id}/`);
    await importState(page, encodeSave(rescue.state, Date.now()));
    await nav(page, fantasy ? 'refuge' : 'contacts');
    const def = game.discoveryEvents!.entries.find((event) => event.id === 'stranded-specialist')!;
    if (def.kind !== 'choice') throw Error('Expected response');
    const join = def.choices.find((choice) => choice.id === 'join')!,
      offer = game.recruitment!.offers.find((offer) => offer.id === join.recruit)!;
    const expected = recruitName(
      offer,
      rescue.state.seed,
      rescue.state.incidents[0].recruitSerial!,
    );
    const panel = page.locator('.discovery-panel');
    await expect(panel).toContainText(expected);
    await expect(panel).toContainText('Joins resting');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (testInfo.project.name === 'iphone')
      await panel.screenshot({ path: `/tmp/${game.id}-rescue-opportunity.png` });
    const { dispatch } = await import('../src/engine/simulation');
    const full = dispatch(game, rescue.state, { type: 'hire', id: offer.id });
    expect(full.error).toBeUndefined();
    await importState(page, encodeSave(full.state, Date.now()));
    await nav(page, fantasy ? 'refuge' : 'contacts');
    await expect(panel.getByRole('button', { name: join.name, exact: true })).toBeDisabled();
    await expect(panel).toContainText('No accommodation available');
    const alternative = def.choices.find((choice) => choice.id === 'resettle')!;
    await panel.getByRole('button', { name: alternative.name, exact: true }).click();
    await page.getByRole('button', { name: 'Confirm order', exact: true }).click();
    expect((await state(page, fantasy)).crew.length).toBe(full.state.crew.length);
    expect((await state(page, fantasy)).incidents[0].choice).toBe('resettle');
    await importState(page, encodeSave(rescue.state, Date.now()));
    await nav(page, fantasy ? 'refuge' : 'contacts');
    await page.setViewportSize({ width: 932, height: 430 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.setViewportSize(originalViewport);
    await panel.getByRole('button', { name: join.name, exact: true }).click();
    await expect(page.locator('#confirm-dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Confirm order', exact: true }).click();
    expect((await state(page, fantasy)).crew.at(-1)).toMatchObject({
      name: expected,
      assignment: 'rest',
      experience: 0,
    });
    await page.reload();
    await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
    expect((await state(page, fantasy)).incidents[0].choice).toBe('join');
    const knowledge = opportunityFixture(fantasy, 'recovered-methods');
    const discipline = fantasy ? 'mage' : 'engineering';
    knowledge.state.crew.find((member) => member.skill === discipline)!.experience = 3;
    await importState(page, encodeSave(knowledge.state, Date.now()));
    await nav(page, fantasy ? 'refuge' : 'contacts');
    const lore = game.discoveryEvents!.entries.find((event) => event.id === 'recovered-methods')!;
    if (lore.kind !== 'choice') throw Error('Expected response');
    await expect(panel).toContainText('3 → 7');
    await panel
      .getByRole('button', {
        name: lore.choices.find((choice) => choice.id === 'study')!.name,
        exact: true,
      })
      .click();
    await page.getByRole('button', { name: 'Confirm order', exact: true }).click();
    await nav(page, fantasy ? 'company' : 'operations');
    const member = knowledge.state.crew.find((member) => member.skill === discipline)!;
    const row = page
      .locator('.crew-row')
      .filter({ has: page.getByText(member.name, { exact: true }) });
    await expect(row).toContainText('Practiced · 7/12 practice');
    await expect(row).toContainText('+3% specialty');
    // Actual work, rather than a second discovery response, advances the next point.
    const fresh = createState(game, 1701);
    fresh.location = game.id === 'far-wake' ? 'cinder' : 'old-road';
    const learner = fresh.crew.find((member) => member.skill === (fantasy ? 'mage' : 'survey'))!;
    learner.experience = 3;
    await importState(page, encodeSave(fresh, Date.now()));
    await nav(page, fantasy ? 'company' : 'operations');
    await beginActivity(page, fantasy ? 'Read the signs' : 'Orbital survey');
    await next(page, 120, fantasy);
    await escape(page, fantasy);
    expect(
      (await state(page, fantasy)).crew.find((member: any) => member.id === learner.id).experience,
    ).toBe(4);
    await expect(
      page.locator('.proficiency').filter({ hasText: 'Practiced · 4/12 practice' }),
    ).toBeVisible();
    if (testInfo.project.name === 'iphone')
      await page
        .locator('.crew-row')
        .filter({ has: page.getByText(learner.name, { exact: true }) })
        .screenshot({ path: `/tmp/${game.id}-crew-proficiency.png` });
  }
});

test('settled discoveries unlock distinct faction projects with source work and retained filing receipts', async ({
  page,
}, testInfo) => {
  const { opportunityFixture } = await import('./opportunity-fixture');
  const { planRoute } = await import('../src/engine/navigation');
  for (const fantasy of [false, true]) {
    const {
      game,
      state: found,
      source,
    } = opportunityFixture(fantasy, 'stranded-specialist', true, 6);
    await open(page, `/${game.id}/`);
    await importState(page, encodeSave(found, Date.now()));
    await nav(page, fantasy ? 'refuge' : 'contacts');
    const mission = game.missions.find(
      (mission) =>
        mission.sourceSite === found.incidents[0].site &&
        mission.discoveryChoice?.incident === 'stranded-specialist' &&
        mission.discoveryChoice.choice === 'resettle',
    )!;
    const work = game.activities.find((activity) => activity.mission === mission.id)!;
    await expect(page.getByRole('heading', { name: mission.name, exact: true })).toHaveCount(0);
    await expect(page.locator('.discovery-panel')).toContainText('Optional project unlocked');
    const event = game.discoveryEvents!.entries.find(
      (event) => event.id === 'stranded-specialist',
    )!;
    if (event.kind !== 'choice') throw Error('Expected response');
    await page
      .locator('.discovery-panel')
      .getByRole('button', {
        name: event.choices.find((choice) => choice.id === 'resettle')!.name,
        exact: true,
      })
      .click();
    await page.getByRole('button', { name: 'Confirm order', exact: true }).click();
    const card = page
      .locator('.activity-card')
      .filter({ has: page.getByRole('heading', { name: mission.name, exact: true }) });
    await expect(card).toContainText('Origin:');
    await expect(card).toContainText('Patron standing on filing');
    await expect(card).toContainText(source.name);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (testInfo.project.name === 'iphone')
      await card.screenshot({ path: `/tmp/${game.id}-faction-project.png` });
    await card
      .getByRole('button', { name: fantasy ? 'Accept oath' : 'Accept contract', exact: true })
      .click();
    const travel = async (target: string) => {
      const itinerary = planRoute(game, await state(page, fantasy), target);
      for (const leg of itinerary) {
        await nav(page, fantasy ? 'journey' : 'navigation');
        const destination = game.locations.find((location) => location.id === leg.to)!;
        await page
          .locator('.route-card')
          .filter({ has: page.getByRole('heading', { name: destination.name, exact: true }) })
          .getByRole('button', { name: fantasy ? 'Travel' : 'Set course', exact: true })
          .click();
        await next(page, leg.seconds + 10, fantasy);
        await escape(page, fantasy);
      }
    };
    await nav(page, fantasy ? 'company' : 'operations');
    const task = page
      .locator('.follow-up-work .activity-card')
      .filter({ has: page.getByRole('heading', { name: work.name, exact: true }) });
    await expect(task.getByRole('button', { name: 'Begin activity', exact: true })).toBeDisabled();
    await travel(source.id);
    await nav(page, fantasy ? 'company' : 'operations');
    await task.getByRole('button', { name: 'Begin activity', exact: true }).click();
    expect((await state(page, fantasy)).primary.definition).toBe(work.id);
    await page.reload();
    await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
    await next(page, 150, fantasy);
    await escape(page, fantasy);
    await travel(game.initial.location);
    await nav(page, fantasy ? 'refuge' : 'contacts');
    await expect(card).toContainText('Field work complete');
    const before = await state(page, fantasy);
    await card
      .getByRole('button', {
        name: fantasy ? 'Report completed oath' : 'File contract',
        exact: true,
      })
      .click();
    const after = await state(page, fantasy);
    expect(after.inventory[game.rules.currency]).toBe(
      before.inventory[game.rules.currency] + mission.reward[game.rules.currency],
    );
    await page.reload();
    await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
    await nav(page, fantasy ? 'refuge' : 'contacts');
    if (fantasy) await expect(card).toContainText('FULFILLED');
    else await expect(page.getByText(mission.name, { exact: true })).toBeVisible();
    expect((await state(page, fantasy)).inventory).toEqual(after.inventory);
    await page.setViewportSize({ width: 932, height: 430 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});

test('planning surfaces unlocked projects, supply and assignment gaps, and read-only source routes', async ({
  page,
}, testInfo) => {
  const { opportunityFixture } = await import('./opportunity-fixture');
  const { dispatch } = await import('../src/engine/simulation');
  for (const fantasy of [false, true]) {
    const fixture = opportunityFixture(fantasy, 'stranded-specialist', true, 6),
      { game } = fixture;
    const settled = dispatch(game, fixture.state, {
      type: 'discovery',
      id: 'stranded-specialist',
      choice: 'join',
    }).state;
    const mission = game.missions.find(
      (mission) =>
        mission.sourceSite === settled.incidents[0].site &&
        mission.discoveryChoice?.incident === 'stranded-specialist' &&
        mission.discoveryChoice.choice === 'join',
    )!;
    const work = game.activities.find((activity) => activity.mission === mission.id)!;
    for (const member of settled.crew) if (member.skill === work.skill) member.assignment = 'rest';
    for (const resource of Object.keys(work.cost)) settled.inventory[resource] = 0;
    await open(page, `/${game.id}/`);
    await importState(page, encodeSave(settled, Date.now()));
    await expect(page.locator('.planning-summary')).toContainText('1 unlocked faction project');
    await page
      .locator('.planning-summary')
      .getByRole('button', { name: 'Review contract board', exact: true })
      .click();
    const card = page
      .locator('.project-offers .activity-card')
      .filter({ has: page.getByRole('heading', { name: mission.name, exact: true }) });
    await expect(card).toContainText('Missing supplies:');
    await expect(card).toContainText(`Assign 1 ${work.skill}`);
    await card
      .getByRole('button', { name: fantasy ? 'Accept oath' : 'Accept contract', exact: true })
      .click();
    await page
      .locator('.planning-summary')
      .getByRole('button', { name: 'Review accepted work', exact: true })
      .click();
    const task = page.locator('.follow-up-work .activity-card');
    await expect(task).toContainText('Prepare supplies and team');
    await task.getByRole('button', { name: 'Review team', exact: true }).click();
    await expect(page.locator('.crew-row').first()).toBeFocused();
    await page
      .locator('.planning-summary')
      .getByRole('button', { name: 'Review accepted work', exact: true })
      .click();
    const before = await state(page, fantasy);
    await task.getByRole('button', { name: 'Plot route to source', exact: true }).click();
    await expect(page.locator('#route-plan-title')).toHaveText(`Route to ${fixture.source.name}`);
    await expect(page.locator('#route-plan-title')).toBeFocused();
    await expect(page.locator('.star-button.selected')).toHaveAttribute(
      'data-region',
      fixture.source.region,
    );
    const after = await state(page, fantasy);
    expect(after.primary).toBeNull();
    expect(after.inventory).toEqual(before.inventory);
    expect(after.crew).toEqual(before.crew);
    expect(after.missions).toEqual(before.missions);
    expect(after.rng).toBe(before.rng);
    await expect(page.locator('.route-plan')).toContainText('Plotting spends nothing');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (testInfo.project.name === 'iphone')
      await page.locator('.route-plan').screenshot({ path: `/tmp/${game.id}-planning-route.png` });
    await page.setViewportSize({ width: 932, height: 430 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.reload();
    await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
    expect((await state(page, fantasy)).inventory).toEqual(before.inventory);
    await page
      .locator('.planning-summary')
      .getByRole('button', { name: 'Review accepted work', exact: true })
      .click();
    await expect(task).toContainText('Missing supplies:');
  }
});

test('legacy discovery work plans explicit multi-leg journeys and guides completed receipts home', async ({
  page,
}, testInfo) => {
  const { planRoute } = await import('../src/engine/navigation');
  const { dispatch } = await import('../src/engine/simulation');
  for (const fantasy of [false, true]) {
    const game = (fantasy ? createHollowmere : createGame)(1701, 3),
      fresh = createState(game, 1701);
    fresh.known = game.locations.map((location) => location.id);
    fresh.discoveries = Object.fromEntries(
      game.locations.map((location) => [
        location.id,
        { surveyed: true, sites: [], dataSold: false },
      ]),
    );
    if (!fantasy) fresh.inventory.fuel = 70;
    const source = game.locations.find(
      (location) => !location.station && planRoute(game, fresh, location.id).length >= 2,
    )!;
    expect(source).toBeTruthy();
    fresh.discoveries[source.id] = { surveyed: true, sites: [source.sites[0]], dataSold: false };
    const mission = game.missions.find((mission) => mission.sourceSite === source.sites[0])!,
      work = game.activities.find((activity) => activity.mission === mission.id)!;
    if (!fresh.crew.some((member) => member.skill === work.skill)) {
      const offer = game.recruitment!.offers.find((offer) => offer.skill === work.skill)!;
      const hired = dispatch(game, fresh, { type: 'hire', id: offer.id });
      expect(hired.error).toBeUndefined();
      Object.assign(fresh, hired.state);
    }
    for (const member of fresh.crew) if (member.skill === work.skill) member.assignment = 'primary';
    const accepted = dispatch(game, fresh, { type: 'accept', id: mission.id });
    expect(accepted.error).toBeUndefined();
    await open(page, `/${game.id}/`);
    await importState(page, encodeSave(accepted.state, Date.now()));
    await page
      .locator('.planning-summary')
      .getByRole('button', { name: 'Review accepted work', exact: true })
      .click();
    let steps = 0;
    await page
      .locator('.follow-up-work')
      .getByRole('button', { name: 'Plot route to source', exact: true })
      .click();
    while ((await state(page, fantasy)).location !== source.id) {
      const current = await state(page, fantasy),
        nextLeg = planRoute(game, current, source.id)[0];
      expect(nextLeg).toBeTruthy();
      await page
        .locator('.route-plan')
        .getByRole('button', {
          name: `Travel to ${game.locations.find((location) => location.id === nextLeg.to)!.name}`,
          exact: true,
        })
        .click();
      if (!fantasy && nextLeg.interregional)
        await page.getByRole('button', { name: 'Confirm order', exact: true }).click();
      expect((await state(page, fantasy)).primary.target).toBe(nextLeg.to);
      await next(page, nextLeg.seconds + 5, fantasy);
      await escape(page, fantasy);
      expect((await state(page, fantasy)).primary).toBeNull();
      steps++;
    }
    expect(steps).toBeGreaterThanOrEqual(2);
    await page
      .locator('.route-plan')
      .getByRole('button', { name: 'Review field work', exact: true })
      .click();
    const task = page.locator('.follow-up-work .activity-card');
    await expect(task).toContainText('Perform the accepted field work here');
    if (testInfo.project.name === 'iphone')
      await task.screenshot({ path: `/tmp/${game.id}-planning-work.png` });
    await task.getByRole('button', { name: 'Begin activity', exact: true }).click();
    await expect(task).toContainText('Supplies and participants are already committed');
    await next(page, 150, fantasy);
    await escape(page, fantasy);
    await expect(page.locator('.follow-up-work')).toContainText('Return to a known service hub');
    await expect(page.locator('.planning-summary')).toContainText('1 ready to file');
    const before = await state(page, fantasy);
    await page
      .locator('.follow-up-work')
      .getByRole('button', { name: 'Plot route to hub', exact: true })
      .click();
    await expect(page.locator('.route-plan')).toBeVisible();
    expect((await state(page, fantasy)).inventory).toEqual(before.inventory);
    await page.reload();
    await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
    await page
      .locator('.planning-summary')
      .getByRole('button', { name: 'Review accepted work', exact: true })
      .click();
    await expect(page.locator('.follow-up-work')).toContainText('Field work complete');
  }
});

test('new discoveries show explicit effects and unlock only the chosen generation-7 project', async ({
  page,
}, testInfo) => {
  test.setTimeout(60000);
  const { opportunityFixture } = await import('./opportunity-fixture');
  const { dispatch } = await import('../src/engine/simulation');
  const scenarios = [
    { fantasy: false, id: 'derelict-salvage', choice: 'recover' },
    { fantasy: false, id: 'distress-beacon', choice: 'berth' },
    { fantasy: false, id: 'disputed-research', choice: 'publish' },
    { fantasy: true, id: 'haunted-shrine', choice: 'consecrate' },
    { fantasy: true, id: 'lost-caravan', choice: 'welcome' },
    { fantasy: true, id: 'dangerous-bargain', choice: 'accept' },
  ];
  for (const scenario of scenarios) {
    const { game, state: found } = opportunityFixture(scenario.fantasy, scenario.id, true, 7);
    const def = game.discoveryEvents!.entries.find((entry) => entry.id === scenario.id)!;
    if (def.kind !== 'choice') throw Error('Expected response');
    const choice = def.choices.find((choice) => choice.id === scenario.choice)!;
    const expected = dispatch(game, found, { type: 'discovery', id: def.id, choice: choice.id });
    expect(expected.error).toBeUndefined();
    await open(page, `/${game.id}/`);
    await importState(page, encodeSave(found, Date.now()));
    await nav(page, scenario.fantasy ? 'refuge' : 'contacts');
    const panel = page.locator('.discovery-panel');
    await expect(panel).toContainText(def.title);
    if (Object.values(choice.reputation).some((value) => value < 0))
      await expect(panel).toContainText('-6');
    await panel.getByRole('button', { name: choice.name, exact: true }).click();
    await page.getByRole('button', { name: 'Confirm order', exact: true }).click();
    const saved = await state(page, scenario.fantasy);
    expect(saved.crew).toEqual(expected.state.crew);
    expect(saved.inventory).toEqual(expected.state.inventory);
    expect(saved.reputation).toEqual(expected.state.reputation);
    expect(saved.incidents).toEqual(expected.state.incidents);
    const mission = game.missions.find(
      (mission) =>
        mission.sourceSite === found.incidents[0].site &&
        mission.discoveryChoice?.incident === def.id &&
        mission.discoveryChoice.choice === choice.id,
    )!;
    await expect(page.locator('.project-offers .activity-card')).toHaveCount(1);
    const card = page.locator('.project-offers .activity-card');
    await expect(card).toContainText(mission.name);
    await expect(card).toContainText('Team requirements:');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (testInfo.project.name === 'iphone' && scenario.id === 'dangerous-bargain')
      await card.screenshot({ path: '/tmp/hollowmere-bargain-project.png' });
    await page.reload();
    await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
    expect((await state(page, scenario.fantasy)).incidents).toEqual(expected.state.incidents);
  }
});

test('support field commissions share the source with primary work and retain one receipt through reload', async ({
  page,
}, testInfo) => {
  const { supportVarietyFixture } = await import('./variety-fixture');
  const { planRoute } = await import('../src/engine/navigation');
  for (const fantasy of [false, true]) {
    const { game, state: prepared, mission, work } = supportVarietyFixture(fantasy);
    await open(page, `/${game.id}/`);
    await importState(page, encodeSave(prepared, Date.now()));
    await page
      .locator('.planning-summary')
      .getByRole('button', { name: 'Review accepted work', exact: true })
      .click();
    const task = page.locator('.follow-up-work .activity-card');
    await expect(task).toContainText('Work team: Support');
    const gather = game.activities.find((activity) => activity.id === game.rules.gatherActivity)!;
    await page
      .locator('.activity-card')
      .filter({ has: page.getByRole('heading', { name: gather.name, exact: true }) })
      .getByRole('button', { name: 'Begin activity', exact: true })
      .click();
    const before = await state(page, fantasy);
    await task
      .getByRole('button', {
        name: fantasy ? 'Begin support work' : 'Start support job',
        exact: true,
      })
      .click();
    const working = await state(page, fantasy);
    expect(working.primary.id).toBe(before.primary.id);
    expect(working.support.definition).toBe(work.id);
    await expect(task).toContainText('already committed');
    if (testInfo.project.name === 'iphone')
      await task.screenshot({ path: `/tmp/${game.id}-support-commission.png` });
    await page.reload();
    await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
    const restored = await state(page, fantasy);
    expect(restored.support.id).toBe(working.support.id);
    expect(restored.inventory).toEqual(working.inventory);
    await next(page, 200, fantasy);
    await escape(page, fantasy);
    await page
      .locator('.planning-summary')
      .getByRole('button', { name: 'Review accepted work', exact: true })
      .click();
    await expect(page.locator('.follow-up-work')).toContainText('Field work complete');
    const current = await state(page, fantasy),
      hub = game.locations
        .filter((location) => location.station)
        .map((location) => ({ location, path: planRoute(game, current, location.id) }))
        .filter((entry) => entry.path.length)
        .sort(
          (a, b) =>
            a.path.reduce((n, leg) => n + leg.seconds, 0) -
            b.path.reduce((n, leg) => n + leg.seconds, 0),
        )[0];
    await page
      .locator('.follow-up-work')
      .getByRole('button', { name: 'Plot route to hub', exact: true })
      .click();
    for (const leg of hub.path) {
      await page
        .locator('.route-plan')
        .getByRole('button', {
          name: `Travel to ${game.locations.find((location) => location.id === leg.to)!.name}`,
          exact: true,
        })
        .click();
      if (!fantasy && leg.interregional)
        await page.getByRole('button', { name: 'Confirm order', exact: true }).click();
      await next(page, leg.seconds + 5, fantasy);
      await escape(page, fantasy);
    }
    await page
      .locator('.route-plan')
      .getByRole('button', { name: 'Review contract board', exact: true })
      .click();
    const card = page
      .locator('.activity-card')
      .filter({ has: page.getByRole('heading', { name: mission.name, exact: true }) });
    const beforeClaim = await state(page, fantasy);
    await card
      .getByRole('button', {
        name: fantasy ? 'Report completed oath' : 'File contract',
        exact: true,
      })
      .click();
    const filed = await state(page, fantasy);
    expect(filed.inventory[game.rules.currency]).toBe(
      beforeClaim.inventory[game.rules.currency] + mission.reward[game.rules.currency],
    );
    await page.reload();
    await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
    expect(
      (await state(page, fantasy)).missions.find((saved: any) => saved.id === mission.id),
    ).toMatchObject({ progress: 1, claimed: true });
    await page.setViewportSize({ width: 932, height: 430 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});
