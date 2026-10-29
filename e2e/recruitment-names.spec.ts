import { test, expect } from '@playwright/test';
import { createGame } from '../src/game/definition';
import { createHollowmere } from '../src/fantasy/definition';
import { createState } from '../src/engine/simulation';
import { encodeSave } from '../src/engine/save';

test('recruitment offers have distinct stable names and a non-first hire matches its preview across old/current saves', async ({
  page,
}) => {
  test.setTimeout(60000);
  for (const fantasy of [false, true])
    for (const generation of [1, 7]) {
      const game = (fantasy ? createHollowmere : createGame)(44, generation);
      await page.goto(fantasy ? '/hollowmere/' : '/far-wake/');
      await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
      await page.getByRole('button', { name: 'Settings', exact: true }).click();
      await page
        .getByRole('textbox', { name: 'Save JSON' })
        .fill(encodeSave(createState(game, 44), Date.now()));
      await page.getByRole('button', { name: 'Import pasted save' }).click();
      await page.getByRole('button', { name: 'Confirm order', exact: true }).click();
      await page
        .getByRole('navigation')
        .getByRole('button', { name: fantasy ? /Refuge/ : /Contacts/ })
        .click();
      const read = () =>
        page.evaluate(
          (key) => (window as any)[key].state(),
          fantasy ? '__hollowmere' : '__farWake',
        );
      const before = await read();
      const names = await page.locator('[data-recruit-name]').allTextContents();
      expect(names.length).toBeGreaterThan(2);
      expect(new Set(names).size).toBe(names.length);
      await page.reload();
      await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
      await page
        .getByRole('navigation')
        .getByRole('button', { name: fantasy ? /Refuge/ : /Contacts/ })
        .click();
      expect(await page.locator('[data-recruit-name]').allTextContents()).toEqual(names);
      expect((await read()).recruitSerial).toBe(before.recruitSerial);
      expect((await read()).rng).toBe(before.rng);
      const card = page.locator('[data-recruit]').last(),
        name = await card.locator('[data-recruit-name]').textContent();
      await card.getByRole('button', { name: /^Recruit / }).click();
      await expect.poll(async () => (await read()).crew.at(-1).name).toBe(name);
      const hired = await read();
      expect(hired.crew.slice(0, -1)).toEqual(before.crew);
      expect(hired.rng).toBe(before.rng);
      await page.reload();
      await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
      expect((await read()).crew).toEqual(hired.crew);
    }
});
