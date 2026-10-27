import { it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { GAMES, hasSavedGame, legacyLaunchTarget } from '../src/picker/catalog';
import { farWakeManifest } from '../src/picker/manifest';
it('lists only implemented games at their own entry pages with independent save keys', () => {
  expect(GAMES.map((g) => g.id)).toEqual(['far-wake', 'hollowmere']);
  expect(new Set(GAMES.map((g) => g.saveKey)).size).toBe(GAMES.length);
  for (const game of GAMES) expect(existsSync(`${game.href.slice(2)}index.html`)).toBe(true);
});
it('recognizes a saved game without changing it and tolerates absent or blocked storage', () => {
  const game = GAMES[0],
    raw = JSON.stringify({ format: 'exploration-save', state: { definition: game.id } });
  expect(hasSavedGame({ getItem: () => raw }, game)).toBe(true);
  for (const value of [
    null,
    'broken',
    JSON.stringify({ format: 'exploration-save', state: { definition: 'hollowmere' } }),
  ])
    expect(hasSavedGame({ getItem: () => value }, game)).toBe(false);
  expect(
    hasSavedGame(
      {
        getItem: () => {
          throw Error('Storage denied');
        },
      },
      game,
    ),
  ).toBe(false);
});
it('preserves installed Far Wake identity and updates its start page for each deployment base', () => {
  const source = JSON.parse(readFileSync('src/game/manifest.json', 'utf8'));
  for (const base of ['/', '/explorer/']) {
    const manifest = farWakeManifest(source, base);
    expect(manifest.id).toBe(base);
    expect(manifest.start_url).toBe('./far-wake/');
    expect(manifest.scope).toBe('./far-wake/');
    expect(source.start_url).toBe('./');
  }
});
it('keeps old standalone launches working while allowing an explicit return to the library', () => {
  expect(legacyLaunchTarget(false, '')).toBeNull();
  expect(legacyLaunchTarget(true, '')).toBe('./far-wake/');
  expect(legacyLaunchTarget(true, '?games=1')).toBeNull();
});
