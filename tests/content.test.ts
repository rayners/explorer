import { describe, it, expect } from 'vitest';
import { createGame } from '../src/game/definition';
import { createState, dispatch, advance, cargo } from '../src/engine/simulation';
import { readdirSync, readFileSync } from 'node:fs';
const g = createGame(44);
describe('content and isolation', () => {
  it('regenerates stable definitions without sharing mutable state', () => {
    expect(createGame(44)).toEqual(g);
    expect(createGame(45)).not.toEqual(g);
  });
  it('has connected routes, unique identities, valid resources and reachable missions', () => {
    const ids = g.locations.map((l) => l.id);
    expect(new Set(ids).size).toBe(16);
    const visited = new Set([ids[0]]);
    for (let i = 0; i < 16; i++)
      for (const r of g.routes) {
        expect(ids).toContain(r.from);
        expect(ids).toContain(r.to);
        if (visited.has(r.from)) visited.add(r.to);
        if (visited.has(r.to)) visited.add(r.from);
      }
    expect(visited.size).toBe(16);
    expect(g.missions.filter((mission) => !mission.sourceSite).length).toBe(13);
    for (const m of g.missions) {
      if (m.requires) expect(g.missions.some((x) => x.id === m.requires)).toBe(true);
      if (m.objective.target)
        expect(m.objective.kind === 'threatStopped' ? g.threats!.map((t) => t.id) : ids).toContain(
          m.objective.target,
        );
    }
    for (const a of g.activities)
      for (const r of Object.keys({ ...a.cost, ...a.reward }))
        expect(g.resources.some((x) => x.id === r)).toBe(true);
  });
  it('keeps the engine independent of content, DOM, wall clock and ambient random sources', () => {
    for (const file of readdirSync('src/engine').filter((f) => f.endsWith('.ts'))) {
      const text = readFileSync(`src/engine/${file}`, 'utf8');
      expect(text).not.toMatch(/'interstellar'|'frontier'|'pirates'|'cryosleep'/);
      expect(text).not.toMatch(/from\s+['"].*(?:game|ui)\//);
      if (file !== 'save.ts')
        expect(text).not.toMatch(/Date\.now|Math\.random|document\.|window\./);
    }
  });
  it('caps collected cargo and never creates negative inventory', () => {
    let s = createState(g, 44);
    s.location = 'cinder';
    s.discoveries.cinder.surveyed = true;
    s.capacity = cargo(g, s);
    s = dispatch(g, s, { type: 'activity', id: 'gather' }).state;
    s = advance(g, s, 180);
    expect(cargo(g, s)).toBeLessThanOrEqual(s.capacity);
    expect(Object.values(s.inventory).every((n) => n >= 0)).toBe(true);
  });
});

it('discovery catalogs have valid probabilities, identities, sources and consequence references', () => {
  const policy = g.discoveryEvents!;
  expect(policy.chance).toBeGreaterThan(0);
  expect(policy.chance).toBeLessThan(1);
  expect(Number.isInteger(policy.cooldown) && policy.cooldown >= 0).toBe(true);
  expect(new Set(policy.entries.map((entry) => entry.id)).size).toBe(policy.entries.length);
  for (const entry of policy.entries) {
    expect(entry.weight).toBeGreaterThan(0);
    expect(Number.isInteger(entry.minimumSites) && entry.minimumSites > 0).toBe(true);
    for (const id of entry.locations ?? [])
      expect(g.locations.some((l) => l.id === id && !l.station)).toBe(true);
    expect(entry.locations).not.toContain('cinder');
    if (entry.kind === 'exposure') expect(g.threats!.some((t) => t.id === entry.threat)).toBe(true);
    else {
      expect(entry.choices.length).toBeGreaterThan(0);
      expect(new Set(entry.choices.map((choice) => choice.id)).size).toBe(entry.choices.length);
      for (const choice of entry.choices) {
        for (const [id, amount] of Object.entries(choice.reward)) {
          expect(g.resources.some((r) => r.id === id)).toBe(true);
          expect(Number.isFinite(amount) && amount >= 0).toBe(true);
        }
        for (const [id, amount] of Object.entries(choice.reputation)) {
          expect(g.factions.some((f) => f.id === id)).toBe(true);
          expect(Number.isFinite(amount)).toBe(true);
        }
      }
    }
  }
});
