import { test, expect, type Page } from '@playwright/test';
import { supportVarietyFixture } from './variety-fixture';
import { dispatch } from '../src/engine/simulation';
import { encodeSave } from '../src/engine/save';

async function install(page: Page, fantasy: boolean, raw: string) {
  await page.goto(fantasy ? '/hollowmere/' : '/far-wake/');
  await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('textbox', { name: 'Save JSON' }).fill(raw);
  await page.getByRole('button', { name: 'Import pasted save' }).click();
  await page.getByRole('button', { name: 'Confirm order', exact: true }).click();
  await expect(page.locator('#settings-dialog')).not.toBeVisible();
}
const state = (page: Page, fantasy: boolean) =>
  page.evaluate((key) => (window as any)[key].state(), fantasy ? '__hollowmere' : '__farWake');
async function board(page: Page, fantasy: boolean) {
  await page
    .getByRole('navigation')
    .getByRole('button', { name: fantasy ? /Refuge/ : /Contacts/ })
    .click();
}
test('destination groups compare accepted work and open focused briefs/routes without accepting or spending', async ({
  page,
}) => {
  const size = page.viewportSize()!;
  for (const fantasy of [false, true]) {
    await page.setViewportSize(size);
    const f = supportVarietyFixture(fantasy);
    const normal = f.game.missions.find(
      (m) => m.sourceSite === f.mission.sourceSite && !m.discoveryChoice,
    )!;
    const accepted = dispatch(
      f.game,
      { ...f.state, location: f.game.initial.location },
      { type: 'accept', id: normal.id },
    );
    expect(accepted.error).toBeUndefined();
    await install(page, fantasy, encodeSave(accepted.state, Date.now()));
    await board(page, fantasy);
    const before = await state(page, fantasy),
      group = page.locator(`[data-destination="${f.source.id}"]`);
    await group.locator('summary').click();
    await expect(group).toContainText('Accepted unstarted work (2)');
    await expect(group).toContainText('Shared travel counts once');
    for (const viewport of [size, { width: 932, height: 430 }]) {
      await page.setViewportSize(viewport);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
    await group.locator(`[data-contract-review="${f.mission.id}"]`).click();
    const card = page.locator(`[data-contract-brief="${f.mission.id}"]`);
    await expect(card.locator('h3')).toBeFocused();
    await expect(card).toContainText('Work supplies:');
    const reviewed = await state(page, fantasy);
    expect(reviewed.inventory).toEqual(before.inventory);
    expect(reviewed.missions).toEqual(before.missions);
    expect(reviewed.primary).toBeNull();
    expect(reviewed.support).toBeNull();
    const workGroup = page.locator(`[data-destination="${f.source.id}"]`);
    await workGroup.locator('summary').click();
    await workGroup.getByRole('button', { name: 'Plot source route', exact: true }).click();
    await expect(page.locator('#route-plan-title')).toBeFocused();
    expect((await state(page, fantasy)).inventory).toEqual(before.inventory);
    expect((await state(page, fantasy)).primary).toBeNull();
    await board(page, fantasy);
    await page.reload();
    await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
    await board(page, fantasy);
    await expect(page.locator(`[data-destination="${f.source.id}"]`)).toBeVisible();
    expect((await state(page, fantasy)).missions).toEqual(before.missions);
    const offers = page
      .locator('.destination-group')
      .filter({ has: page.locator('[data-contract-view="board"]') });
    expect(await offers.count()).toBeGreaterThan(0);
    await offers.first().locator('summary').click();
    const review = offers.first().locator('[data-contract-view="board"]').first();
    const offerId = await review.getAttribute('data-contract-review');
    await review.click();
    await expect(page.locator(`[data-contract-brief="${offerId}"] h3`)).toBeFocused();
    expect((await state(page, fantasy)).missions).toEqual(before.missions);
  }
});

test('paid work and completed receipts keep their own brief and filing guidance', async ({
  page,
}) => {
  for (const fantasy of [false, true]) {
    const f = supportVarietyFixture(fantasy);
    await install(page, fantasy, encodeSave(f.paid, Date.now()));
    await board(page, fantasy);
    let group = page.locator(`[data-destination="${f.source.id}"]`);
    await group.locator('summary').click();
    await expect(group).toContainText('Work in progress — supplies paid');
    await group.locator(`[data-contract-review="${f.mission.id}"]`).click();
    await expect(page.locator(`[data-contract-brief="${f.mission.id}"] h3`)).toBeFocused();
    const paid = await state(page, fantasy);
    expect(paid.support.reward).toEqual(f.paid.support!.reward);
    expect(paid.support.participants).toEqual(f.paid.support!.participants);
    await install(
      page,
      fantasy,
      encodeSave({ ...f.completed, location: f.game.initial.location }, Date.now()),
    );
    await board(page, fantasy);
    group = page.locator(`[data-destination="${f.source.id}"]`);
    await group.locator('summary').click();
    await expect(group.locator('.destination-filing')).toContainText('File at this service hub.');
    await group.locator(`[data-contract-review="${f.mission.id}"]`).click();
    await expect(page.locator('.bound-receipt h3')).toBeFocused();
    const receipt = await state(page, fantasy);
    expect(receipt.missions.find((m: any) => m.id === f.mission.id).claimed).toBe(false);
    expect(receipt.inventory).toEqual(f.completed.inventory);
  }
});
