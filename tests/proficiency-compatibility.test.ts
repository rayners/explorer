import { it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createGame } from '../src/game/definition';
import { createHollowmere } from '../src/fantasy/definition';
import { decodeSave } from '../src/engine/save';
import { advance } from '../src/engine/simulation';
/** Captured before personnel progression changes; preserve this baseline during migration. */
it('preserves released paid parallel jobs, injuries and memorials before proficiency migration', () => {
  const { fixtures } = JSON.parse(
    readFileSync('tests/fixtures/schema3-before-proficiency.json', 'utf8'),
  );
  for (const fixture of fixtures) {
    const factory = fixture.game === 'far-wake' ? createGame : createHollowmere;
    const loaded = decodeSave(fixture.raw, factory);
    const game = factory(loaded.state.seed, loaded.state.generationVersion);
    if (fixture.kind === 'parallel-work') {
      expect(loaded.state.primary).not.toBeNull();
      expect(loaded.state.support).not.toBeNull();
      expect(loaded.state.crew.some((member) => member.life === 'dead')).toBe(true);
      expect(loaded.state.crew.some((member) => member.injury)).toBe(true);
    } else {
      const receipt = loaded.state.missions.find((mission) => mission.id === fixture.mission)!;
      expect(receipt.progress).toBe(1);
      expect(receipt.claimed).toBe(fixture.kind === 'filed-receipt');
    }
    expect(advance(game, loaded.state, fixture.seconds)).toEqual(fixture.expected);
  }
});
