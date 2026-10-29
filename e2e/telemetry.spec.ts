import { test, expect, type BrowserContext } from '@playwright/test';
import { createGame } from '../src/game/definition';
import { createHollowmere } from '../src/fantasy/definition';
import { createState, dispatch } from '../src/engine/simulation';
import { encodeSave } from '../src/engine/save';
const canonical = 'https://rayners.github.io/explorer/';
async function serve(context: BrowserContext, fail = false) {
  const events: any[] = [],
    headers: Record<string, string>[] = [];
  await context.route('https://rayners.github.io/explorer/**', async (route) => {
    const url = new URL(route.request().url());
    const response = await context.request.get(`http://127.0.0.1:5201${url.pathname}${url.search}`);
    await route.fulfill({ response });
  });
  await context.route('https://us.i.posthog.com/**', async (route) => {
    events.push(JSON.parse(route.request().postData()!));
    headers.push(await route.request().allHeaders());
    if (fail) await route.abort();
    else
      await route.fulfill({
        status: 200,
        body: '{"status":"Ok"}',
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
  });
  return { events, headers };
}

test('canonical production sends only bounded usage and sanitized errors, with fresh page identity', async ({
  page,
  context,
}) => {
  const { events, headers } = await serve(context);
  await page.goto(`${canonical}?private=private@example.org#SAVE_SECRET`);
  await expect.poll(() => events.length).toBe(1);
  expect(events[0]).toMatchObject({
    event: 'explorer_opened',
    properties: {
      app: 'explorer',
      surface: 'library',
      $process_person_profile: false,
      $geoip_disable: true,
    },
  });
  expect(headers[0].referer).toBeUndefined();
  expect(headers[0].cookie).toBeUndefined();
  await page.evaluate(() => {
    const secret = 'private@example.org SAVE_SECRET';
    dispatchEvent(
      new ErrorEvent('error', {
        error: new TypeError(secret),
        message: secret,
        filename: `https://evil.test/${secret}`,
        lineno: 123,
        colno: 4,
      }),
    );
    dispatchEvent(
      new PromiseRejectionEvent('unhandledrejection', {
        promise: Promise.resolve(),
        reason: { email: secret, message: secret },
      }),
    );
  });
  await expect.poll(() => events.length).toBe(3);
  expect(events[1]).toMatchObject({
    event: '$exception',
    properties: {
      line: 123,
      column: 4,
      $exception_list: [{ type: 'TypeError', value: 'Sanitized TypeError' }],
    },
  });
  expect(events[2].properties.$exception_list[0].type).toBe('Error');
  expect(JSON.stringify(events)).not.toMatch(
    /private@example|SAVE_SECRET|evil\.test|current_url|referrer|\$device|\$browser|\$session/,
  );
  expect(await context.cookies()).toEqual([]);
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  const previous = events[0].distinct_id;
  await page.reload();
  await expect.poll(() => events.length).toBe(4);
  expect(events[3].distinct_id).not.toBe(previous);
});

test('both games record accepted orders, share opt-out with the library and keep playing when delivery fails', async ({
  page,
  context,
}) => {
  const { events } = await serve(context, true);
  for (const game of ['far-wake', 'hollowmere']) {
    await page.goto(`${canonical}${game}/`);
    await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
    await page
      .getByRole('region', { name: 'Current directive' })
      .getByRole('button', { name: /^Accept / })
      .click();
    await expect
      .poll(
        () =>
          events.filter((e) => e.event === 'explorer_order' && e.properties.surface === game)
            .length,
      )
      .toBe(1);
    expect(events.at(-1).properties.kind).toBe('accept');
    await page
      .getByRole('navigation')
      .getByRole('button', { name: game === 'hollowmere' ? /Refuge/ : /Contacts/ })
      .click();
    const candidate = page.locator('[data-recruit]').last();
    const candidateName = await candidate.locator('[data-recruit-name]').textContent();
    await candidate.getByRole('button', { name: /^Recruit / }).click();
    await expect
      .poll(
        () =>
          events.filter((e) => e.event === 'explorer_order' && e.properties.surface === game)
            .length,
      )
      .toBe(2);
    expect(events.at(-1).properties.kind).toBe('hire');
    expect(JSON.stringify(events)).not.toContain(candidateName);
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.getByRole('checkbox', { name: 'Share usage and sanitized error reports' }).uncheck();
    const count = events.length;
    await page.evaluate(() =>
      dispatchEvent(new ErrorEvent('error', { error: new Error('private') })),
    );
    await page.reload();
    await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
    expect(events.length).toBe(count);
    await page.goto(`${canonical}?games=1`);
    await expect(
      page.getByRole('checkbox', { name: 'Share usage and sanitized error reports' }),
    ).not.toBeChecked();
    expect(events.length).toBe(count);
    await page.getByRole('checkbox', { name: 'Share usage and sanitized error reports' }).check();
    expect(events.length).toBe(count); // No retroactive buffered events.
  }
  expect(events.filter((e) => e.event === 'explorer_progress')).toEqual([]);
});

test('local previews and browser privacy signals suppress outbound capture', async ({
  page,
  context,
}) => {
  const { events } = await serve(context);
  await page.goto('http://127.0.0.1:5201/explorer/far-wake/');
  await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
  expect(events).toEqual([]);
  await context.addInitScript(() =>
    Object.defineProperty(navigator, 'globalPrivacyControl', { value: true }),
  );
  await page.goto(canonical);
  await expect(
    page.getByRole('checkbox', { name: 'Share usage and sanitized error reports' }),
  ).toBeDisabled();
  expect(events).toEqual([]);
});

test('storage denial and DNT suppress sharing while keeping the library usable', async ({
  browser,
}) => {
  for (const reason of ['storage', 'dnt']) {
    const context = await browser.newContext({ serviceWorkers: 'block' });
    const { events } = await serve(context);
    await context.addInitScript((reason) => {
      if (reason === 'storage')
        Storage.prototype.getItem = () => {
          throw Error('private storage');
        };
      else Object.defineProperty(navigator, 'doNotTrack', { value: '1' });
    }, reason);
    const page = await context.newPage();
    await page.goto(canonical);
    await expect(page.getByRole('heading', { name: 'There’s more beyond the map.' })).toBeVisible();
    await expect(
      page.getByRole('checkbox', { name: 'Share usage and sanitized error reports' }),
    ).not.toBeChecked();
    expect(events).toEqual([]);
    await context.unrouteAll({ behavior: 'wait' });
    await context.close();
  }
});

test('secondary tabs, failed imports and offline activity do not invent progress or queue usage', async ({
  page,
  context,
}) => {
  const { events } = await serve(context);
  await page.goto(`${canonical}far-wake/`);
  await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
  const secondary = await context.newPage();
  await secondary.goto(`${canonical}far-wake/`);
  await expect(secondary.locator('#save-status')).toHaveText('READ-ONLY TAB');
  await page
    .getByRole('region', { name: 'Current directive' })
    .getByRole('button', { name: /^Accept / })
    .click();
  await expect.poll(() => events.filter((e) => e.event === 'explorer_order').length).toBe(1);
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('textbox', { name: 'Save JSON' }).fill('private@example.org invalid save');
  await page.getByRole('button', { name: 'Import pasted save' }).click();
  await page.getByRole('button', { name: 'Confirm order', exact: true }).click();
  await expect(page.locator('#settings-error')).not.toBeEmpty();
  expect(events.filter((e) => e.event === '$exception')).toEqual([]);
  const count = events.length;
  await context.setOffline(true);
  await page.evaluate(() =>
    dispatchEvent(new ErrorEvent('error', { error: new Error('offline private') })),
  );
  await context.setOffline(false);
  await page.getByRole('checkbox', { name: 'Share usage and sanitized error reports' }).uncheck();
  await expect(secondary.locator('.telemetry-preference input')).not.toBeChecked();
  expect(events.length).toBe(count);
  expect(JSON.stringify(events)).not.toContain('private@example.org');
  expect(events.filter((e) => e.event === 'explorer_progress')).toEqual([]);
});

test('foreground completions are reported once and restored history is not replayed', async ({
  browser,
}) => {
  for (const [surface, factory] of [
    ['far-wake', createGame],
    ['hollowmere', createHollowmere],
  ] as const) {
    const context = await browser.newContext({ serviceWorkers: 'block' });
    const { events } = await serve(context);
    const game = factory(1701),
      result = dispatch(game, createState(game, 1701), { type: 'work' });
    expect(result.error).toBeUndefined();
    result.state.primary!.remaining = 3;
    const page = await context.newPage();
    await page.addInitScript(
      ({ surface, state }) => {
        if (!localStorage.getItem(`${surface}.save.v1`))
          localStorage.setItem(`${surface}.save.v1`, state);
      },
      { surface, state: encodeSave(result.state, Date.now()) },
    );
    await page.goto(`${canonical}${surface}/`);
    await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
    await expect
      .poll(() => events.filter((e) => e.event === 'explorer_progress').length, { timeout: 10000 })
      .toBe(1);
    expect(events.find((e) => e.event === 'explorer_progress').properties.kind).toBe(
      'activityComplete',
    );
    await page.reload();
    await expect(page.locator('#save-status')).toHaveText('LOCAL SAVE ACTIVE');
    expect(events.filter((e) => e.event === 'explorer_progress')).toHaveLength(1);
    expect(events.filter((e) => e.event === 'explorer_order')).toHaveLength(0);
    await context.unrouteAll({ behavior: 'wait' });
    await context.close();
  }
});
