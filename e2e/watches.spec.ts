import { test, expect, type Page } from '@playwright/test';
import { createGame } from '../src/game/definition';
import { createHollowmere } from '../src/fantasy/definition';
import { createState, dispatch } from '../src/engine/simulation';
import { encodeSave } from '../src/engine/save';

function fixture(fantasy: boolean) {
  const game = (fantasy ? createHollowmere : createGame)(1701, fantasy ? 7 : 1);
  let state = createState(game, 1701);
  state.debt = 150;
  const activity = game.activities.find((a) => a.id === game.rules.workActivity)!;
  const worker = state.crew.find((m) => m.skill === activity.skill)!;
  state = dispatch(game, state, { type: 'assign', member: worker.id, assignment: 'primary' }).state;
  const other = state.crew.find((m) => m.id !== worker.id)!;
  state = dispatch(game, state, { type: 'assign', member: other.id, assignment: 'support' }).state;
  return { game, state, worker };
}
const state = (page: Page, fantasy: boolean) =>
  page.evaluate((key) => (window as any)[key].state(), fantasy ? '__hollowmere' : '__farWake');
const next = (page: Page, fantasy: boolean, seconds: number) =>
  page.evaluate(({ key, seconds }) => (window as any)[key].advance(seconds), {
    key: fantasy ? '__hollowmere' : '__farWake',
    seconds,
  });
async function open(page: Page, fantasy: boolean, raw: string) {
  await page.goto(fantasy ? '/hollowmere/' : '/far-wake/');
  await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('textbox', { name: 'Save JSON' }).fill(raw);
  await page.getByRole('button', { name: 'Import pasted save' }).click();
  await page.getByRole('button', { name: 'Confirm order', exact: true }).click();
  await page
    .getByRole('navigation')
    .getByRole('button', { name: fantasy ? /Company/ : /Operations/ })
    .click();
}
test('longer work previews are read-only and cancellation forfeits pay while preserving support', async ({
  page,
}, testInfo) => {
  for (const fantasy of [false, true]) {
    const f = fixture(fantasy);
    const support = dispatch(f.game, f.state, { type: 'activity', id: 'service' });
    expect(support.error).toBeUndefined();
    await open(page, fantasy, encodeSave(support.state, Date.now()));
    const before = await state(page, fantasy),
      options = page.locator('.watch-options');
    await options.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(options.locator('.watch-choice')).toHaveCount(3);
    await expect(options).toContainText('Pay: 153');
    await expect(options).toContainText('Debt repayment: 40');
    await expect(options).toContainText('Take home: 113');
    const preview = await state(page, fantasy);
    expect(preview.inventory).toEqual(before.inventory);
    expect(preview.rng).toBe(before.rng);
    expect(preview.primary).toBeNull();
    await options.getByRole('button', { name: /15 minutes/ }).click();
    const paid = await state(page, fantasy);
    expect(paid.primary.watch).toEqual({ id: '15m', debtPayment: 40 });
    expect(paid.primary.total).toBe(900);
    expect(paid.primary.reward[f.game.rules.currency]).toBe(153);
    await expect(page.locator('.watch-commitment')).toContainText('Take home: 113');
    await next(page, fantasy, 10);
    await page.reload();
    await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
    expect((await state(page, fantasy)).primary.id).toBe(paid.primary.id);
    const cancel = page.locator('.watch-commitment').getByRole('button');
    await cancel.click();
    await expect(page.locator('#confirm-dialog')).toContainText('forfeit all its pay');
    await page.getByRole('button', { name: 'Keep current orders', exact: true }).click();
    expect((await state(page, fantasy)).primary.id).toBe(paid.primary.id);
    await cancel.click();
    await page.getByRole('button', { name: 'Confirm order', exact: true }).click();
    const cancelled = await state(page, fantasy);
    expect(cancelled.primary).toBeNull();
    expect(cancelled.support.id).toBe(paid.support.id);
    expect(cancelled.inventory).toEqual(paid.inventory);
    expect(cancelled.debt).toBe(150);
    expect(cancelled.crew.find((m: any) => m.id === f.worker.id).experience).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (testInfo.project.name === 'iphone') {
      await page
        .getByRole('navigation')
        .getByRole('button', { name: fantasy ? /Company/ : /Operations/ })
        .click();
      await page.locator('.watch-options summary').click();
      await page
        .locator('.watch-options')
        .screenshot({ path: `/tmp/${f.game.id}-watch-options.png` });
      await page.setViewportSize({ width: 932, height: 430 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.setViewportSize({ width: 430, height: 739 });
    }
  }
});
test('an explicit hourly order survives ownership locks and pays once with one practice point', async ({
  page,
  context,
}) => {
  for (const fantasy of [false, true]) {
    const f = fixture(fantasy);
    await open(page, fantasy, encodeSave(f.state, Date.now()));
    await page.locator('.watch-options summary').click();
    await page
      .locator('.watch-options')
      .getByRole('button', { name: /1 hour/ })
      .click();
    const paid = await state(page, fantasy);
    const secondary = await context.newPage();
    await secondary.goto(fantasy ? '/hollowmere/' : '/far-wake/');
    await expect(secondary.locator('.banner')).toContainText('another tab');
    await expect(secondary.locator('.watch-commitment button')).toBeDisabled();
    await secondary.close();
    await next(page, fantasy, 3600);
    const done = await state(page, fantasy);
    expect(done.primary).toBeNull();
    expect(done.inventory[f.game.rules.currency]).toBe(paid.inventory[f.game.rules.currency] + 227);
    expect(done.debt).toBe(70);
    expect(done.crew.find((m: any) => m.id === f.worker.id).experience).toBe(1);
    await page.reload();
    await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
    expect((await state(page, fantasy)).inventory).toEqual(done.inventory);
    expect((await state(page, fantasy)).primary).toBeNull();
  }
});
