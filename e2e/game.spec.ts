import { createGame } from '../src/game/definition';
const defaultGame = createGame(1701);
const locationName = (id: string) => defaultGame.locations.find((l) => l.id === id)!.name;
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
  await page.goto('/far-wake/');
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
    .filter({ has: page.getByRole('heading', { name: locationName('cinder'), exact: true }) })
    .getByRole('button', { name: 'Set course' })
    .click();
  await expect(page.locator('.active-job')).toContainText(`En route to ${locationName('cinder')}`);
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
    .filter({ has: page.getByRole('heading', { name: locationName('anchor'), exact: true }) })
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
  await second.goto('/far-wake/');
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
  await active.goto('/far-wake/');
  await expect(active.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
  const other = await context.newPage();
  await other.goto('/far-wake/');
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
test('a charted interstellar destination can be reached directly from a station', async ({
  page,
}) => {
  await nav(page, 'navigation');
  await page
    .locator('.route-card')
    .filter({ has: page.getByRole('heading', { name: locationName('cinder'), exact: true }) })
    .getByRole('button', { name: 'Set course' })
    .click();
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
  await nav(page, 'navigation');
  await page
    .locator('.route-card')
    .filter({ has: page.getByRole('heading', { name: locationName('anchor'), exact: true }) })
    .getByRole('button', { name: 'Set course' })
    .click();
  await next(page, 65);
  if ((await state(page)).encounter)
    await page.getByRole('button', { name: 'Surrender cargo', exact: true }).click();
  await nav(page, 'contacts');
  await page
    .locator('.trade-row')
    .filter({ has: page.getByRole('heading', { name: /Propellant/ }) })
    .getByRole('button', { name: 'Buy 5', exact: true })
    .click();
  await nav(page, 'navigation');
  await page
    .getByRole('button', {
      name: `${defaultGame.regions.find((r) => r.id === 'pale')!.name} system`,
      exact: true,
    })
    .click();
  const destination = page
    .locator('.route-card')
    .filter({ has: page.getByRole('heading', { name: locationName('pale-0'), exact: true }) });
  await expect(destination).toContainText('15m 0s REAL');
  await expect(destination.getByRole('button', { name: 'Set course' })).toBeEnabled();
  await expect(
    destination.getByRole('button', { name: `Travel to ${locationName('cinder')}` }),
  ).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await destination.getByRole('button', { name: 'Set course' }).click();
  await expect(page.locator('#confirm-dialog')).toContainText('cryosleep');
  await page.getByRole('button', { name: 'Confirm order' }).click();
  const departed = await state(page);
  expect(departed.primary.target).toBe('pale-0');
  expect(departed.location).toBe('anchor');
  expect(departed.primary.total).toBe(900);
});
for (const operation of ['import', 'reset'] as const)
  test(`failed ${operation} preserves the current expedition and reports the failure`, async ({
    page,
  }) => {
    const { createGame } = await import('../src/game/definition');
    const { createState } = await import('../src/engine/simulation');
    const { encodeSave } = await import('../src/engine/save');
    const replacement = encodeSave(createState(createGame(44), 44), Date.now());
    await page.evaluate(() => {
      const original = Storage.prototype.setItem;
      (window as any).__rejectSave = true;
      Storage.prototype.setItem = function (key, value) {
        if (key === 'far-wake.save.v1' && (window as any).__rejectSave)
          throw new DOMException('Full storage', 'QuotaExceededError');
        return original.call(this, key, value);
      };
    });
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    const attempt = async () => {
      if (operation === 'import') {
        await page.getByRole('textbox', { name: 'Save JSON' }).fill(replacement);
        await page.getByRole('button', { name: 'Import pasted save' }).click();
      } else {
        await page.locator('#new-seed').fill('44');
        await page.getByRole('button', { name: 'Start a new expedition' }).click();
      }
      await page.getByRole('button', { name: 'Confirm order' }).click();
    };
    await attempt();
    await expect(page.locator('#settings-dialog')).toBeVisible();
    await expect(page.locator('#settings-error')).toContainText('not saved');
    await expect(page.locator('#save-warning')).toBeVisible();
    expect((await state(page)).seed).toBe(1701);
    expect(
      await page.evaluate(() => JSON.parse(localStorage.getItem('far-wake.save.v1')!).state.seed),
    ).toBe(1701);
    await page.getByRole('button', { name: 'Export to text' }).click();
    expect(
      JSON.parse(await page.getByRole('textbox', { name: 'Save JSON' }).inputValue()).state.seed,
    ).toBe(1701);
    await page.evaluate(() => ((window as any).__rejectSave = false));
    await attempt();
    await expect(page.locator('#settings-dialog')).not.toBeVisible();
    expect((await state(page)).seed).toBe(44);
    await page.reload();
    await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
    expect((await state(page)).seed).toBe(44);
    await expect(page.locator('#save-warning')).not.toBeVisible();
  });
test('resupply explains a full cargo hold and updates after selling cargo', async ({ page }) => {
  const { createGame } = await import('../src/game/definition');
  const { createState } = await import('../src/engine/simulation');
  const { encodeSave } = await import('../src/engine/save');
  const full = createState(createGame(1701), 1701);
  full.inventory.ore = 50;
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('textbox', { name: 'Save JSON' }).fill(encodeSave(full, Date.now()));
  await page.getByRole('button', { name: 'Import pasted save' }).click();
  await page.getByRole('button', { name: 'Confirm order' }).click();
  await nav(page, 'contacts');
  await expect(page.getByRole('meter', { name: 'Cargo hold' })).toHaveAttribute(
    'aria-valuenow',
    '120',
  );
  const fuel = page
    .locator('.trade-row')
    .filter({ has: page.getByRole('heading', { name: /Propellant/ }) });
  await expect(fuel.getByRole('button', { name: 'Buy 5', exact: true })).toBeDisabled();
  await expect(fuel.getByText('Buy 5: Not enough cargo space.', { exact: true })).toBeVisible();
  const ore = page
    .locator('.trade-row')
    .filter({ has: page.getByRole('heading', { name: /Metal ore/ }) });
  await ore.getByRole('button', { name: 'Sell 5', exact: true }).click();
  await expect(fuel.getByRole('button', { name: 'Buy 5', exact: true })).toBeEnabled();
  await expect(page.getByRole('meter', { name: 'Cargo hold' })).toHaveAttribute(
    'aria-valuenow',
    '115',
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('a resting engineer can join idle support while an expedition team is working', async ({
  page,
}) => {
  await nav(page, 'operations');
  const engineer = page.getByRole('combobox', {
    name: `${defaultGame.initial.crew.find((c) => c.id === 'ishaan')!.name} assignment`,
  });
  await engineer.selectOption('rest');
  await page
    .locator('.activity-card')
    .filter({ has: page.getByRole('heading', { name: 'Station work shift', exact: true }) })
    .getByRole('button', { name: 'Begin activity' })
    .click();
  await expect(engineer).toBeEnabled();
  await expect(engineer.locator('option[value=primary]')).toBeDisabled();
  await engineer.selectOption('support');
  expect((await state(page)).crew.find((c: any) => c.id === 'ishaan').assignment).toBe('support');
  await page
    .locator('.activity-card')
    .filter({ has: page.getByRole('heading', { name: 'Service machinery', exact: true }) })
    .getByRole('button', { name: 'Start support job' })
    .click();
  await expect(page.locator('.active-job')).toHaveCount(2);
  await expect(engineer).toBeDisabled();
});
