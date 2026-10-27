/** A serializable deterministic PRNG. Never reads ambient randomness. */
export function random(seed: number): [number, number] {
  const next = (seed + 0x6d2b79f5) >>> 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next];
}
export function generator(seed: number) {
  let current = seed >>> 0;
  return () => {
    const [v, n] = random(current);
    current = n;
    return v;
  };
}
