import { generator } from './random';

export interface GraphEdge {
  from: string;
  to: string;
}
/** Build a connected undirected graph, retaining required links without mutating inputs. */
export function connectedGraph(
  seed: number,
  namespace: string,
  identities: readonly string[],
  required: readonly GraphEdge[] = [],
  extraChance = 0.2,
): GraphEdge[] {
  const ids = [...identities].sort();
  if (!ids.length || new Set(ids).size !== ids.length || ids.some((id) => !id))
    throw Error('Graph identities must be nonempty and unique.');
  if (!Number.isFinite(extraChance) || extraChance < 0 || extraChance > 1)
    throw Error('Extra-link probability must be between zero and one.');
  let hash = 2166136261;
  for (let i = 0; i < namespace.length; i++)
    hash = Math.imul(hash ^ namespace.charCodeAt(i), 16777619);
  const roll = generator((seed ^ hash) >>> 0);
  const parents = new Map(ids.map((id) => [id, id]));
  const root = (id: string): string => {
    let current = id;
    while (parents.get(current) !== current) current = parents.get(current)!;
    return current;
  };
  const selected = new Map<string, GraphEdge>();
  const key = (from: string, to: string) => JSON.stringify([from, to]);
  const add = (from: string, to: string) => {
    if (from === to || !parents.has(from) || !parents.has(to))
      throw Error('Graph links must connect distinct known identities.');
    const [a, b] = from < to ? [from, to] : [to, from];
    selected.set(key(a, b), { from: a, to: b });
    parents.set(root(a), root(b));
  };
  for (const edge of required) add(edge.from, edge.to);
  const candidates: GraphEdge[] = [];
  for (let i = 0; i < ids.length; i++)
    for (let j = i + 1; j < ids.length; j++) candidates.push({ from: ids[i], to: ids[j] });
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(roll() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  // Joining components first guarantees reachability, even when extra links are disabled.
  for (const edge of candidates) if (root(edge.from) !== root(edge.to)) add(edge.from, edge.to);
  for (const edge of candidates)
    if (!selected.has(key(edge.from, edge.to)) && roll() < extraChance) add(edge.from, edge.to);
  return [...selected.values()].sort((a, b) =>
    a.from < b.from ? -1 : a.from > b.from ? 1 : a.to < b.to ? -1 : a.to > b.to ? 1 : 0,
  );
}
