import { generator } from './random';
import type { NamePattern } from './types';

function domainSeed(seed: number, namespace: string): number {
  let hash = 2166136261;
  for (const char of namespace) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return (hash ^ seed) >>> 0;
}
function gcd(a: number, b: number): number {
  while (b) [a, b] = [b, a % b];
  return a;
}
/** The number of combinations available before an indexed name sequence is exhausted. */
export function nameCapacity(pattern: NamePattern): number {
  if (
    !pattern.parts.length ||
    pattern.parts.some(
      (part) =>
        !part.length || new Set(part).size !== part.length || part.some((word) => !word.trim()),
    )
  )
    throw Error('Name patterns require nonempty vocabularies with distinct entries.');
  const capacity = pattern.parts.reduce((total, part) => total * part.length, 1);
  if (!Number.isSafeInteger(capacity * capacity)) throw Error('Name vocabulary is too large.');
  return capacity;
}
/** A seeded permutation of vocabulary combinations, independent of gameplay RNG. */
export function generateName(
  seed: number,
  namespace: string,
  pattern: NamePattern,
  ordinal = 0,
): string {
  const capacity = nameCapacity(pattern);
  if (!Number.isSafeInteger(ordinal) || ordinal < 0 || ordinal >= capacity)
    throw Error('Name vocabulary exhausted or invalid name ordinal.');
  const rng = generator(domainSeed(seed, namespace));
  const offset = Math.floor(rng() * capacity);
  let stride = Math.max(1, Math.floor(rng() * capacity));
  while (gcd(stride, capacity) !== 1) stride++;
  let index = (offset + ordinal * stride) % capacity;
  return pattern.parts
    .map((part) => {
      const word = part[index % part.length];
      index = Math.floor(index / part.length);
      return word;
    })
    .join(pattern.separator ?? ' ');
}
/** Allocate distinct display names in stable identity order, regardless of input order. */
export function allocateNames(
  seed: number,
  namespace: string,
  entries: readonly { id: string; pattern: NamePattern }[],
): Record<string, string> {
  const result: Record<string, string> = Object.create(null);
  const used = new Set<string>();
  for (const entry of [...entries].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))) {
    if (Object.hasOwn(result, entry.id)) throw Error('Duplicate naming identity.');
    const capacity = nameCapacity(entry.pattern);
    for (let ordinal = 0; ordinal < capacity; ordinal++) {
      const name = generateName(seed, `${namespace}:${entry.id}`, entry.pattern, ordinal);
      if (used.has(name)) continue;
      result[entry.id] = name;
      used.add(name);
      break;
    }
    if (!Object.hasOwn(result, entry.id))
      throw Error('Not enough distinct names for this catalog.');
  }
  return result;
}
