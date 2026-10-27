/** The public game catalog. This page does not load either game's simulation. */
export const GAMES = [
  {
    id: 'far-wake',
    title: 'Far Wake',
    href: './far-wake/',
    icon: './icon-192.png',
    saveKey: 'far-wake.save.v1',
    genre: 'SCIENCE FICTION / DEEP FIELD SURVEY',
    description:
      'Captain a survey ship beyond the corporate frontier. Chart worlds, gather supplies, hire a crew, and cross the years between stars. Be careful what you bring back aboard.',
    motto: 'A little further out.',
    tags: ['Ship & crew', 'Long voyages', 'Hidden threats'],
  },
  {
    id: 'hollowmere',
    title: 'Hollowmere',
    href: './hollowmere/',
    icon: './hollowmere/icon-192.png',
    saveKey: 'hollowmere.save.v1',
    genre: 'DARK FANTASY / THE COMPANY LEDGER',
    description:
      'Lead fighters, mages, clerics, and scouts beyond the last lantern. Explore a haunted forest and the ruins beneath it. Keep the company supplied, and count those who return.',
    motto: 'The forest keeps its own accounts.',
    tags: ['Party composition', 'Haunted realms', 'Ancient curses'],
  },
] as const;
export interface SaveReader {
  getItem(key: string): string | null;
}
/** Detect a recognizable checkpoint without changing it or simulating time. */
export function hasSavedGame(
  storage: SaveReader,
  game: Pick<(typeof GAMES)[number], 'id' | 'saveKey'>,
): boolean {
  try {
    const raw = storage.getItem(game.saveKey);
    if (!raw) return false;
    const save = JSON.parse(raw);
    return save?.format === 'exploration-save' && save.state?.definition === game.id;
  } catch {
    return false;
  }
}
/** Old installed Far Wake apps may still launch the former root URL. */
export function legacyLaunchTarget(standalone: boolean, search: string): string | null {
  return standalone && !new URLSearchParams(search).has('games') ? `./far-wake/${search}` : null;
}
