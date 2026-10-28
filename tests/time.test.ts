import { it, expect } from 'vitest';
import { duration } from '../src/ui/time';
it('formats fractional countdown boundaries and long watches without invalid units', () => {
  for (const [seconds, expected] of [
    [0, '0s'],
    [0.01, '1s'],
    [59.999, '1m 0s'],
    [60, '1m 0s'],
    [899.999, '15m 0s'],
    [3599.999, '1h 0m'],
    [3600, '1h 0m'],
    [28799.9, '8h 0m'],
    [28798.9, '7h 59m'],
  ] as const)
    expect(duration(seconds)).toBe(expected);
});
