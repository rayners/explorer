import { it, expect } from 'vitest';
import { createLease } from '../src/browser/lease';
it('prevents another tab taking an unexpired lease and allows takeover after expiry', () => {
  const map = new Map<string, string>();
  const storage = {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
  };
  const first = createLease(storage, 'first'),
    second = createLease(storage, 'second');
  expect(first.acquire(1000)).toBe(true);
  expect(second.acquire(1001)).toBe(false);
  expect(first.owns(2000)).toBe(true);
  expect(second.acquire(14000)).toBe(true);
  expect(first.owns(14000)).toBe(false);
  expect(first.renew(14000)).toBe(false);
  expect(second.owns(14000)).toBe(true);
  second.release(14000);
  expect(first.acquire(14000)).toBe(true);
});
it('does not overwrite malformed lease data without a recoverable expiration', () => {
  const storage = { getItem: () => '{broken', setItem: () => {}, removeItem: () => {} };
  const lease = createLease(storage, 'first');
  expect(lease.acquire(1000)).toBe(false);
  expect(lease.owns(1000)).toBe(false);
});
