import { allocateNames, generateName } from '../engine/names';
import type { GameDefinition, NamePattern } from '../engine/types';

/** Theme data supplies vocabulary and style; the sampler knows no setting-specific names. */
export interface NamingTheme {
  people: NamePattern;
  regions: NamePattern;
  locations: Record<string, NamePattern>;
  factions: Record<string, NamePattern>;
  recruitPrefixes?: Record<string, string>;
}
/** Author text against stable identities, then resolve names for this expedition/version. */
export function nameReferences(game: GameDefinition, text: string): string {
  return text.replace(/\{(location|region|faction):([^}]+)\}/g, (_, kind: string, id: string) => {
    const catalog =
      kind === 'location' ? game.locations : kind === 'region' ? game.regions : game.factions;
    const entry = catalog.find((entry) => entry.id === id);
    if (!entry) throw Error(`Unknown ${kind} name reference: ${id}`);
    return entry.name;
  });
}
/** Generation 1 retains authored names; generation 2 uses the frozen initial name grammars. */
export function finishNamedDefinition(
  game: GameDefinition,
  seed: number,
  version: number,
  theme: NamingTheme,
): GameDefinition {
  if (version !== 1 && version !== 2) throw Error('Unsupported content generation version.');
  game.generationVersion = version;
  if (version === 2) {
    const regions = allocateNames(
      seed,
      `${game.id}:regions:v2`,
      game.regions.map((r) => ({ id: r.id, pattern: theme.regions })),
    );
    const locations = allocateNames(
      seed,
      `${game.id}:locations:v2`,
      game.locations.map((l) => ({ id: l.id, pattern: theme.locations[l.kind] })),
    );
    const factions = allocateNames(
      seed,
      `${game.id}:factions:v2`,
      game.factions.map((f) => ({ id: f.id, pattern: theme.factions[f.id] })),
    );
    for (const region of game.regions) region.name = regions[region.id];
    for (const location of game.locations) location.name = locations[location.id];
    for (const faction of game.factions) faction.name = factions[faction.id];
    const namespace = `${game.id}:people:v2`;
    game.initial.crew.forEach((member, index) => {
      member.name = generateName(seed, namespace, theme.people, index);
    });
    for (const offer of game.recruitment?.offers ?? []) {
      offer.names = [];
      offer.nameSource = {
        namespace,
        pattern: structuredClone(theme.people),
        offset: game.initial.crew.length,
        prefix: theme.recruitPrefixes?.[offer.id],
      };
    }
  }
  const resolve = (text: string) => nameReferences(game, text);
  for (const region of game.regions) region.subtitle = resolve(region.subtitle);
  for (const location of game.locations) location.description = resolve(location.description);
  for (const faction of game.factions) faction.description = resolve(faction.description);
  for (const entry of [...game.activities, ...game.missions, ...(game.threats ?? [])]) {
    entry.name = resolve(entry.name);
    entry.description = resolve(entry.description);
  }
  for (const entry of game.discoveryEvents?.entries ?? []) {
    entry.title = resolve(entry.title);
    entry.description = resolve(entry.description);
    if (entry.kind === 'choice')
      for (const choice of entry.choices) {
        choice.name = resolve(choice.name);
        choice.description = resolve(choice.description);
      }
  }
  return game;
}
