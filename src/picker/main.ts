import { mountTelemetryPreference, startTelemetry } from '../browser/telemetry';
import './picker.css';
import { GAMES, hasSavedGame, legacyLaunchTarget } from './catalog';
const standalone =
  matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;
const launch = legacyLaunchTarget(standalone, location.search);
if (launch) location.replace(new URL(launch, location.href).href);
else {
  startTelemetry('library');
  const root = document.querySelector('#app')!;
  root.innerHTML = `<main class="library"><header class="library-header"><a class="library-mark" href="./?games=1" aria-label="Explorer game library"><span aria-hidden="true">◇</span> EXPLORER</a><span class="library-note">SMALL GAMES / DISTANT PLACES</span></header><section class="introduction" aria-labelledby="page-title"><p class="eyebrow">CHOOSE YOUR NEXT EXPEDITION</p><h1 id="page-title">There’s more beyond the map.</h1><p>Two worlds to explore, at your own pace.<br>Choose a game and pick up where you left off.</p></section><div class="game-doors">${GAMES.map((game) => `<a class="game-door ${game.id}" href="${game.href}" data-game="${game.id}" aria-label="Play ${game.title}"><div class="door-art" aria-hidden="true"><span class="art-coordinate">${game.id === 'far-wake' ? 'FW / 017' : 'HM / I'}</span><img src="${game.icon}" width="112" height="112" alt=""><span class="art-caption">${game.id === 'far-wake' ? 'SIGNAL ACQUIRED' : 'KEEP THE LANTERNS LIT'}</span></div><div class="door-body"><p class="eyebrow">${game.genre}</p><h2>${game.title}</h2><p class="door-description">${game.description}</p><ul class="tags">${game.tags.map((tag) => `<li>${tag}</li>`).join('')}</ul><p class="motto">${game.motto}</p><div class="door-action"><span data-cta="${game.id}">Play ${game.title}</span><span aria-hidden="true">→</span></div><small data-save="${game.id}">A new expedition awaits.</small></div></a>`).join('')}</div><footer class="library-footer"><p>Free browser games. No accounts. Each game keeps its own save on this device.</p><p>Play on phone, tablet, or desktop. Open a game to install it for offline play.</p></footer></main>`;
  mountTelemetryPreference(root.querySelector('.library-footer')!);
  const refresh = () => {
    for (const game of GAMES) {
      let saved = false;
      try {
        saved = hasSavedGame(localStorage, game);
      } catch {
        /* Storage access may be denied by the browser. */
      }
      const label = `${saved ? 'Resume' : 'Play'} ${game.title}`;
      root.querySelector(`[data-cta="${game.id}"]`)!.textContent = label;
      root.querySelector(`[data-game="${game.id}"]`)!.setAttribute('aria-label', label);
      root.querySelector(`[data-save="${game.id}"]`)!.textContent = saved
        ? 'Saved expedition on this device.'
        : 'A new expedition awaits.';
    }
  };
  refresh();
  addEventListener('pageshow', refresh);
  addEventListener('storage', refresh);
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    import('virtual:pwa-register').then(({ registerSW }) =>
      registerSW({
        onRegisterError() {
          root.querySelector('.library-footer')!.append(
            Object.assign(document.createElement('p'), {
              textContent:
                'Offline caching is unavailable here. You can still open and play a game online.',
            }),
          );
        },
      }),
    );
  }
}
