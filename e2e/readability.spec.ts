import { test, expect, type Page } from '@playwright/test';
import { supportVarietyFixture } from './variety-fixture';
import { encodeSave } from '../src/engine/save';

const state = (page: Page, fantasy: boolean) =>
  page.evaluate((key) => (window as any)[key].state(), fantasy ? '__hollowmere' : '__farWake');
async function importState(page: Page, raw: string) {
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('textbox', { name: 'Save JSON' }).fill(raw);
  await page.getByRole('button', { name: 'Import pasted save' }).click();
  await page.getByRole('button', { name: 'Confirm order', exact: true }).click();
  await expect(page.locator('#settings-dialog')).not.toBeVisible();
}
async function workView(page: Page) {
  await page
    .locator('.planning-summary')
    .getByRole('button', { name: 'Review accepted work', exact: true })
    .click();
}

test('opening directives have a readable explicit next action before the scene in portrait and short landscape', async ({
  page,
}) => {
  const originalSize = page.viewportSize()!;
  for (const fantasy of [false, true]) {
    await page.setViewportSize(originalSize);
    await page.goto(fantasy ? '/hollowmere/' : '/far-wake/');
    await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
    const directive = page.getByRole('region', { name: 'Current directive' });
    const accept = directive.getByRole('button', { name: /^Accept / });
    for (const size of [originalSize, { width: 932, height: 430 }]) {
      await page.setViewportSize(size);
      await page.evaluate(() => scrollTo(0, 0));
      await expect(accept).toBeInViewport({ ratio: 1 });
      const readable = await page
        .locator('.resource small')
        .evaluateAll((labels) =>
          labels.every((label) => parseFloat(getComputedStyle(label).fontSize) >= 12),
        );
      expect(readable).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const boxes = await page.evaluate(() => ({
        action: document.querySelector('.directive button')!.getBoundingClientRect().bottom,
        scene: document.querySelector('canvas.scene')!.getBoundingClientRect().top,
        nav:
          getComputedStyle(document.querySelector('.sidebar')!).position === 'fixed'
            ? document.querySelector('.sidebar')!.getBoundingClientRect().top
            : innerHeight,
      }));
      expect(boxes.action).toBeLessThanOrEqual(boxes.nav);
      expect(boxes.action).toBeLessThan(boxes.scene);
    }
    const before = await state(page, fantasy);
    expect(before.missions).toHaveLength(0);
    await accept.click();
    const accepted = await state(page, fantasy);
    expect(accepted.missions.map((mission: any) => mission.id)).toContain(
      fantasy ? 'first-road' : 'first-light',
    );
    expect(accepted.inventory).toEqual(before.inventory);
    expect(accepted.primary).toBeNull();
  }
});

test('accepted work separates story and estimates from visible requirements without dispatching on expansion', async ({
  page,
}, testInfo) => {
  for (const fantasy of [false, true]) {
    const fixture = supportVarietyFixture(fantasy);
    await page.goto(`/${fixture.game.id}/`);
    await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
    await importState(page, encodeSave(fixture.state, Date.now()));
    await workView(page);
    const card = page.locator('.bound-work');
    await expect(card.locator('.work-status')).toHaveText('Ready for work');
    await expect(card.locator('.cost').first()).toContainText('Work team: Support');
    await expect(card.locator('.work-details')).not.toHaveAttribute('open', '');
    await expect(card.locator('.preparation-details')).not.toHaveAttribute('open', '');
    const before = await state(page, fantasy);
    const story = card.getByText('Story & work details', { exact: true });
    await story.focus();
    await page.keyboard.press('Enter');
    await expect(card.locator('.work-details')).toHaveAttribute('open', '');
    await expect(card.locator('.work-details p').first()).toBeVisible();
    await card.getByText('Check expedition preparation', { exact: true }).click();
    await expect(card.getByText(/Estimated supplies needed:/)).toBeVisible();
    const after = await state(page, fantasy);
    expect(after.inventory).toEqual(before.inventory);
    expect(after.primary).toBeNull();
    expect(after.support).toBeNull();
    await story.click();
    await card.getByText('Check expedition preparation', { exact: true }).click();
    await card.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `/tmp/explorer-readability-${testInfo.project.name}-${fixture.game.id}.png`,
    });
    await card
      .getByRole('button', {
        name: fantasy ? 'Begin support work' : 'Start support job',
        exact: true,
      })
      .click();
    await expect(card.locator('.work-status')).toHaveText('Work in progress');
    await expect(card).toContainText('Supplies and participants are already committed');
    expect((await state(page, fantasy)).support.definition).toBe(fixture.work.id);
  }
});

test('collapsed briefs retain visible supply and wrong-team blockers', async ({ page }) => {
  for (const fantasy of [false, true]) {
    const fixture = supportVarietyFixture(fantasy);
    for (const resource of Object.keys(fixture.work.cost)) fixture.state.inventory[resource] = 0;
    for (const member of fixture.state.crew)
      if (member.skill === fixture.work.skill) member.assignment = 'rest';
    await page.goto(`/${fixture.game.id}/`);
    await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
    await importState(page, encodeSave(fixture.state, Date.now()));
    await workView(page);
    const card = page.locator('.bound-work');
    await expect(card.locator('.work-status')).toHaveText('Preparation needed');
    await expect(card.getByText(/Missing supplies:/)).toBeVisible();
    await expect(card.getByText(new RegExp(`Assign 1 ${fixture.work.skill}`))).toBeVisible();
    await expect(
      card.getByRole('button', {
        name: fantasy ? 'Begin support work' : 'Start support job',
        exact: true,
      }),
    ).toBeDisabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});
