import { it, expect } from 'vitest';
import { connectedGraph } from '../src/engine/topology';
const ids = ['anchor', 'first-world', 'forest', 'refuge', 'ruins', 'frontier'];
it('guarantees reachability across seeds without relying on lucky extra links', () => {
  for (let seed = 0; seed < 100; seed++) {
    const graph = connectedGraph(seed, 'layout-v1', ids, [], 0);
    expect(graph).toHaveLength(ids.length - 1);
    const visited = new Set([ids[0]]);
    for (let pass = 0; pass < ids.length; pass++)
      for (const edge of graph) {
        if (visited.has(edge.from)) visited.add(edge.to);
        if (visited.has(edge.to)) visited.add(edge.from);
      }
    expect([...visited].sort()).toEqual([...ids].sort());
    expect(new Set(graph.map((edge) => JSON.stringify([edge.from, edge.to]))).size).toBe(
      graph.length,
    );
  }
});
it('retains introductory links, rejects bad endpoints, and supports a single isolated starting node', () => {
  const required = [{ from: 'first-world', to: 'anchor' }];
  const before = structuredClone(required),
    input = [...ids];
  const graph = connectedGraph(44, 'layout-v1', ids, required, 0);
  expect(graph).toContainEqual({ from: 'anchor', to: 'first-world' });
  expect(required).toEqual(before);
  expect(ids).toEqual(input);
  expect(connectedGraph(1, 'one', ['home'])).toEqual([]);
  expect(() => connectedGraph(1, 'bad', ids, [{ from: 'missing', to: 'anchor' }])).toThrow('known');
  expect(() => connectedGraph(1, 'bad', ids, [{ from: 'anchor', to: 'anchor' }])).toThrow(
    'distinct',
  );
});
it('is independent of input ordering and varies reproducibly with seed and namespace', () => {
  const a = connectedGraph(44, 'layout-v1', ids);
  expect(a).toEqual(connectedGraph(44, 'layout-v1', [...ids].reverse()));
  const variety = new Set(
    Array.from({ length: 20 }, (_, seed) => JSON.stringify(connectedGraph(seed, 'layout-v1', ids))),
  );
  expect(variety.size).toBeGreaterThan(5);
  connectedGraph(44, 'unrelated', ids);
  expect(connectedGraph(44, 'layout-v1', ids)).toEqual(a);
});
it('bounds optional connectivity and validates the finite generation inputs', () => {
  expect(connectedGraph(44, 'all', ids, [], 1)).toHaveLength((ids.length * (ids.length - 1)) / 2);
  expect(() => connectedGraph(1, 'bad', [])).toThrow('unique');
  expect(() => connectedGraph(1, 'bad', ['a', 'a'])).toThrow('unique');
  for (const chance of [-1, 2, NaN, Infinity])
    expect(() => connectedGraph(1, 'bad', ids, [], chance)).toThrow('probability');
});
