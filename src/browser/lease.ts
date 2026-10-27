/** Fallback coordination for HTTP LAN previews where secure-context Web Locks are absent. */
interface LeaseStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
export function createLease(storage: LeaseStorage, id: string) {
  const key = 'far-wake.command-lease',
    lifetime = 12000;
  const read = (): { id: string; until: number } | null => {
    const raw = storage.getItem(key);
    if (raw === null) return null;
    const value = JSON.parse(raw);
    if (
      !value ||
      typeof value.id !== 'string' ||
      typeof value.until !== 'number' ||
      !Number.isFinite(value.until)
    )
      throw Error('Invalid command lease');
    return value;
  };
  const owns = (now: number) => {
    try {
      const current = read();
      return current?.id === id && current.until > now;
    } catch {
      return false;
    }
  };
  return {
    owns,
    acquire(now: number) {
      try {
        const current = read();
        if (current && current.id !== id && current.until > now) return false;
        storage.setItem(key, JSON.stringify({ id, until: now + lifetime }));
        return owns(now);
      } catch {
        return false;
      }
    },
    renew(now: number) {
      if (!owns(now)) return false;
      try {
        storage.setItem(key, JSON.stringify({ id, until: now + lifetime }));
        return owns(now);
      } catch {
        return false;
      }
    },
    release(now: number) {
      if (owns(now)) storage.removeItem(key);
    },
  };
}
