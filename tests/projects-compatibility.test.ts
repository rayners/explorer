import { it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createGame } from '../src/game/definition';
import { createHollowmere } from '../src/fantasy/definition';
import { decodeSave } from '../src/engine/save';
import { advance } from '../src/engine/simulation';
/** Pre-project baseline captured from released v0.8; keep settled branch/source identities stable. */
it('preserves every released generation-5 discovery response, source identity and paid work outcome', () => {
  const { fixtures } = JSON.parse(
    readFileSync('tests/fixtures/generation5-before-projects.json', 'utf8'),
  );
  for (const fixture of fixtures) {
    const factory = fixture.game === 'far-wake' ? createGame : createHollowmere,
      loaded = decodeSave(fixture.raw, factory),
      game = factory(loaded.state.seed, loaded.state.generationVersion);
    expect(loaded.state.generationVersion).toBe(5);
    expect(loaded.state.primary).not.toBeNull();
    const incident = loaded.state.incidents.find((record) => record.id === fixture.incident)!;
    expect(incident.choice).toBe(fixture.choice);
    expect(game.sites!.find((site) => site.id === incident.site)!.location).toBe(incident.location);
    expect(advance(game, loaded.state, fixture.seconds)).toEqual({ ...fixture.completed, version: 5 });
  }
});
