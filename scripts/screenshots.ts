import { chromium, webkit, devices } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
await mkdir('docs/screenshots', { recursive: true });
for (const [name, browserType, options] of [
  ['desktop', chromium, { viewport: { width: 1440, height: 1100 } }],
  ['iphone', webkit, devices['iPhone 15 Pro Max']],
] as const) {
  const browser = await browserType.launch();
  const page = await browser.newPage(options);
  for (const [path, prefix] of [
    ['/?games=1', 'picker-'],
    ['/far-wake/', ''],
    ['/hollowmere/', 'hollowmere-'],
  ] as const) {
    await page.goto(`http://127.0.0.1:5199${path}`);
    if (prefix === 'picker-')
      await page.getByRole('heading', { name: 'There’s more beyond the map.' }).waitFor();
    else
      await page.waitForFunction(
        () => document.querySelector('#save-status')?.textContent === 'LOCAL SAVE ACTIVE',
      );
    await page.screenshot({ path: `docs/screenshots/${prefix}${name}.png` });
  }
  await browser.close();
}
