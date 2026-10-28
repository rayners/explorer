/** Round the whole remainder before splitting units, so a timer never shows 60 seconds. */
export function duration(seconds: number): string {
  const n = Math.ceil(seconds);
  return n >= 3600
    ? `${Math.floor(n / 3600)}h ${Math.floor((n % 3600) / 60)}m`
    : n >= 60
      ? `${Math.floor(n / 60)}m ${n % 60}s`
      : `${n}s`;
}
