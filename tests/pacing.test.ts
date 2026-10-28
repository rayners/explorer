import { it, expect } from 'vitest';
import { simulate } from '../scripts/simulate';
import { iconPixels } from '../scripts/make-icons';
it('sustains a released generation-3 expedition through all systems across eight deterministic seeds', () => {
  for (const seed of [1701, 1, 7, 44, 91, 812, 2026, 4294967295]) {
    const result = simulate(seed);
    expect(result.surveyed).toBe(12);
    expect(result.integrity).toBeGreaterThan(0);
    expect(result.minutes).toBeLessThan(200);
  }
});
it('uses a square, palette-valid icon sprite', () => {
  expect(iconPixels.length).toBe(16);
  for (const row of iconPixels) {
    expect(row.length).toBe(16);
    expect(row).toMatch(/^[.a]+$/);
  }
});
