import type { GameDefinition } from '../engine/types';
/** Both settings draw their real interregional connections on the chart. */
export function chartLines(game: GameDefinition): string {
  return `<svg class="map-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${game.routes
    .filter((route) => route.interregional)
    .map((route) => {
      const from = game.regions.find(
        (region) => region.id === game.locations.find((l) => l.id === route.from)!.region,
      )!;
      const to = game.regions.find(
        (region) => region.id === game.locations.find((l) => l.id === route.to)!.region,
      )!;
      return `<path d="M${from.x} ${from.y}L${to.x} ${to.y}"/>`;
    })
    .join('')}</svg>`;
}
