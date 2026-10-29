import { expect, it, vi } from 'vitest';
import { captureBody, createTelemetry, telemetryAllowed } from '../src/browser/telemetry';

it('permits only configured canonical production routes and excludes development/debug variants', () => {
  const check = (url: string, prod = true, token = 'public', host = 'https://us.i.posthog.com') =>
    telemetryAllowed(prod, url, token, host);
  for (const path of [
    '',
    'index.html',
    'far-wake/',
    'far-wake/index.html',
    'hollowmere/',
    'hollowmere/index.html',
  ])
    expect(check(`https://rayners.github.io/explorer/${path}?campaign=private#secret`)).toBe(true);
  for (const url of [
    'http://localhost:5199/explorer/',
    'https://[::1]/explorer/',
    'https://example.org/explorer/',
    'https://rayners.github.io/clicker/',
    'https://rayners.github.io/explorer/?speed=60',
    'https://rayners.github.io/explorer/?debug',
    'https://rayners.github.io/explorer/?__posthog_debug=true',
    'invalid',
  ])
    expect(check(url)).toBe(false);
  expect(check('https://rayners.github.io/explorer/', false)).toBe(false);
  expect(check('https://rayners.github.io/explorer/', true, '')).toBe(false);
  expect(check('https://rayners.github.io/explorer/', true, 'key', 'http://localhost')).toBe(false);
});

it('reconstructs allowlisted payloads and sanitizes error classes/coordinates without raw fields', () => {
  const secret = 'private@example.org SAVE_CONTENT seed123';
  const body = captureBody('far-wake', 'test', 'public', 'ephemeral', {
    event: '$exception',
    errorType: secret,
    origin: 'error',
    line: NaN,
    column: -1,
    message: secret,
    stack: secret,
    filename: secret,
  } as any)!;
  expect(JSON.stringify(body)).not.toContain(secret);
  expect(body.properties.$exception_list).toEqual([
    { type: 'Error', value: 'Sanitized Error', mechanism: { handled: false, synthetic: true } },
  ]);
  expect(body.properties).toMatchObject({
    $process_person_profile: false,
    $geoip_disable: true,
    $ip: null,
    line: 0,
    column: 0,
  });
  expect(
    captureBody('library', 'test', 'key', 'id', { event: 'explorer_order', kind: secret }),
  ).toBeNull();
  expect(
    captureBody('library', 'test', 'key', 'id', { event: 'explorer_progress', kind: secret }),
  ).toBeNull();
  expect(captureBody('library', 'test', 'key', 'id', { event: '$autocapture' } as any)).toBeNull();
  expect(
    captureBody('library', 'test', 'key', 'id', { event: 'explorer_sitting', minutes: Infinity }),
  ).toBeNull();
  expect(
    captureBody('library', 'test', 'key', 'id', { event: 'explorer_sitting', minutes: 0.9 }),
  ).toBeNull();
  expect(
    captureBody('library', 'test', 'key', 'id', { event: 'explorer_sitting', minutes: 99999 })
      ?.properties.minutes,
  ).toBe(1440);
});

it('checks sharing and connectivity before every send, drops failures and bounds volume without retaining a queue', async () => {
  let sharing = true,
    online = true;
  const send = vi.fn().mockRejectedValue(new Error('network blocked')),
    id = vi.fn(() => 'page-only');
  const options = {
    surface: 'hollowmere' as const,
    release: 'test',
    token: 'key',
    host: 'https://us.i.posthog.com',
    allowed: true,
    sharing: () => sharing,
    online: () => online,
    id,
    send,
  };
  const recorder = createTelemetry(options);
  recorder.track({ event: 'explorer_opened' });
  sharing = false;
  recorder.track({ event: 'explorer_order', kind: 'accept' });
  sharing = true;
  online = false;
  recorder.track({ event: 'explorer_order', kind: 'work' });
  online = true;
  recorder.track({ event: 'explorer_order', kind: 'travel' });
  await Promise.resolve();
  expect(send).toHaveBeenCalledTimes(2);
  expect(id).toHaveBeenCalledTimes(1);
  expect(send.mock.calls[0][1]).toMatchObject({
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
    keepalive: true,
  });
  expect(send.mock.calls.map((call) => JSON.parse(call[1].body).event)).toEqual([
    'explorer_opened',
    'explorer_order',
  ]);
  for (let n = 0; n < 250; n++)
    recorder.track({ event: '$exception', errorType: 'TypeError', origin: 'rejection' });
  expect(send).toHaveBeenCalledTimes(12);
  for (let n = 0; n < 250; n++) recorder.track({ event: 'explorer_order', kind: 'work' });
  expect(send).toHaveBeenCalledTimes(200);
  createTelemetry({ ...options, allowed: false }).track({ event: 'explorer_opened' });
  expect(send).toHaveBeenCalledTimes(200);
  await Promise.resolve();
});
