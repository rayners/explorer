import './ui/styles.css';
import { createLease } from './browser/lease';
import { createGame } from './game/definition';
import { advance, createState, dispatch } from './engine/simulation';
import { decodeSave, encodeSave, reconcile } from './engine/save';
import { mountApp } from './ui/app';
import type { Command, GameState } from './engine/types';
const KEY = 'far-wake.save.v1',
  BACKUP = 'far-wake.backup.v1';
let game = createGame(1701),
  state = createState(game, 1701),
  savedAt = Date.now(),
  owner = false,
  storageOK = true,
  storageError = '',
  initialMessage = '',
  lastWall = Date.now(),
  audio: AudioContext | undefined;
const preferences = {
  sound: false,
  motion: matchMedia('(prefers-reduced-motion: reduce)').matches,
};
try {
  const p = JSON.parse(localStorage.getItem('far-wake.preferences') ?? '{}');
  preferences.sound = p.sound === true;
  preferences.motion = p.motion ?? preferences.motion;
} catch {
  storageOK = false;
}
document.body.classList.toggle('reduce-motion', preferences.motion);
try {
  const raw = localStorage.getItem(KEY);
  if (raw) {
    const loaded = decodeSave(raw, createGame);
    game = createGame(loaded.state.seed);
    state = loaded.state;
    savedAt = loaded.savedAt;
  }
} catch (e) {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) localStorage.setItem('far-wake.corrupt.v1', raw);
  } catch {
    storageOK = false;
  }
  initialMessage = `The saved expedition could not be loaded. Its original data was retained where storage permits. ${(e as Error).message}`;
  try {
    const backup = localStorage.getItem(BACKUP);
    if (backup) {
      const loaded = decodeSave(backup, createGame);
      game = createGame(loaded.state.seed);
      state = loaded.state;
      savedAt = loaded.savedAt;
      initialMessage =
        'Your latest save was unreadable. The previous expedition backup was restored; the unreadable original has been retained.';
    }
  } catch {
    /* Both originals remain available for manual recovery. */
  }
}
let lease: ReturnType<typeof createLease> | undefined;
function ownsCommand() {
  if (owner && lease && !lease.owns(Date.now())) {
    owner = false;
    app.update(state, game, true);
  }
  return owner;
}
function persist() {
  if (!ownsCommand()) return;
  try {
    localStorage.setItem(KEY, encodeSave(state, savedAt));
    storageOK = true;
    storageError = '';
  } catch {
    storageOK = false;
    storageError = 'Storage is unavailable or full. Export your save from Settings before leaving.';
    app.notify(storageError);
  }
}
function savePreferences() {
  try {
    localStorage.setItem('far-wake.preferences', JSON.stringify(preferences));
  } catch {
    app.notify('Preferences could not be saved on this device.');
  }
}
function sound() {
  if (!preferences.sound) return;
  try {
    audio ??= new AudioContext();
    void audio.resume();
    const osc = audio.createOscillator(),
      gain = audio.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(330, audio.currentTime);
    osc.frequency.exponentialRampToValueAtTime(165, audio.currentTime + 0.13);
    gain.gain.setValueAtTime(0.025, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.16);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + 0.17);
  } catch {
    /* Sound never blocks a command. */
  }
}
const debugSpeed = import.meta.env.DEV
  ? Math.min(600, Math.max(1, Number(new URLSearchParams(location.search).get('speed')) || 1))
  : 1;
function tick() {
  if (!ownsCommand()) return;
  const now = Date.now(),
    seconds = Math.max(0, (now - lastWall) / 1000);
  lastWall = Math.max(now, lastWall);
  const before = state.nextEvent;
  state = advance(game, state, seconds * (document.hidden ? 1 : debugSpeed));
  savedAt = Math.max(savedAt, now);
  if (state.nextEvent !== before) {
    persist();
    if (state.encounter) app.notify('Unregistered contact. Operations are paused for your orders.');
  }
  app.update(state, game);
}
function issue(command: Command) {
  if (!ownsCommand()) {
    app.notify('Another tab holds command. Close it and reload here.');
    return;
  }
  tick();
  const result = dispatch(game, state, command);
  if (result.error) {
    app.notify(result.error);
    return;
  }
  state = result.state;
  sound();
  persist();
  app.update(state, game);
}
const app = mountApp(document.querySelector('#app')!, {
  command: issue,
  isOwner: () => owner,
  storageStatus: () =>
    owner ? (storageOK ? 'LOCAL SAVE ACTIVE' : 'SAVE UNAVAILABLE') : 'READ-ONLY TAB',
  preferences,
  exportSave: () => {
    tick();
    return encodeSave(state, savedAt);
  },
  backupSave: () => {
    const raw = localStorage.getItem(BACKUP);
    if (!raw)
      throw Error(
        'No local backup exists yet. Backups are created before importing or starting a new expedition.',
      );
    return raw;
  },
  importSave: (text) => {
    if (!ownsCommand()) throw Error('Only the active tab can import saves.');
    const loaded = decodeSave(text, createGame);
    try {
      localStorage.setItem(BACKUP, encodeSave(state, savedAt));
    } catch {
      throw Error(
        'Cannot back up your current expedition. Export it and free browser storage before importing.',
      );
    }
    game = createGame(loaded.state.seed);
    const caught = reconcile(game, loaded, Date.now());
    state = caught.state;
    savedAt = caught.savedAt;
    lastWall = Date.now();
    persist();
    app.update(state, game, true);
  },
  reset: (seed) => {
    if (!ownsCommand()) throw Error('Only the active tab can start a new expedition.');
    try {
      localStorage.setItem(BACKUP, encodeSave(state, savedAt));
    } catch {
      throw Error(
        'Cannot back up your current expedition. Export it and free browser storage first.',
      );
    }
    game = createGame(seed);
    state = createState(game, seed);
    savedAt = lastWall = Date.now();
    persist();
    app.update(state, game, true);
  },
  setSound: (on) => {
    preferences.sound = on;
    savePreferences();
    if (on) sound();
  },
  setMotion: (on) => {
    preferences.motion = on;
    document.body.classList.toggle('reduce-motion', on);
    savePreferences();
  },
});
app.update(state, game, true);
function takeCommand() {
  owner = true;
  const before = state,
    now = Date.now(),
    caught = reconcile(game, { state, savedAt }, now);
  state = caught.state;
  savedAt = caught.savedAt;
  lastWall = now;
  persist();
  app.update(state, game, true);
  if (initialMessage) app.notify(initialMessage);
  else if ((caught.awaySeconds ?? 0) > 15) {
    const arrivals = state.events.filter(
        (e) => e.id >= before.nextEvent && e.key === 'arrived',
      ).length,
      completed = state.events.filter(
        (e) => e.id >= before.nextEvent && e.key === 'activityComplete',
      ).length;
    app.notify(
      `Welcome back. ${arrivals} arrivals, ${completed} jobs completed.${state.encounter ? ' A contact awaits your orders.' : !state.primary && !state.support ? ' The crew is standing by.' : ''}`,
    );
  }
}
// Web Locks provide an atomic, browser-managed single writer across tabs.
if (navigator.locks) {
  void navigator.locks.request('far-wake-command', { ifAvailable: true }, async (lock) => {
    if (!lock) {
      app.update(state, game, true);
      return;
    }
    takeCommand();
    await new Promise<void>(() => {});
  });
} else {
  try {
    const token = Array.from(crypto.getRandomValues(new Uint32Array(4))).join('-');
    lease = createLease(localStorage, token);
    const attempt = () => {
      if (document.hidden) return;
      if (owner) {
        if (!lease!.renew(Date.now())) {
          owner = false;
          app.update(state, game, true);
        }
        return;
      }
      if (lease!.acquire(Date.now()))
        setTimeout(() => {
          if (lease!.owns(Date.now())) {
            try {
              const raw = localStorage.getItem(KEY);
              if (raw) {
                const loaded = decodeSave(raw, createGame);
                game = createGame(loaded.state.seed);
                state = loaded.state;
                savedAt = loaded.savedAt;
              }
            } catch {
              /* Retain the already validated in-memory state. */
            }
            takeCommand();
          }
        }, 80);
    };
    attempt();
    setInterval(attempt, 3000);
    addEventListener('pagehide', () => {
      if (owner) {
        tick();
        persist();
        lease!.release(Date.now());
        owner = false;
      }
    });
  } catch {
    initialMessage =
      'Command coordination is unavailable. Use HTTPS or enable browser storage to take command. Save export remains available.';
    app.notify(initialMessage);
  }
}
setInterval(tick, 250);
setInterval(persist, 10000);
addEventListener('pagehide', () => {
  tick();
  persist();
});
document.addEventListener('visibilitychange', () => {
  tick();
  persist();
});
addEventListener('storage', (e) => {
  if (e.key === KEY && !owner && e.newValue)
    try {
      const loaded = decodeSave(e.newValue, createGame);
      state = loaded.state;
      game = createGame(state.seed);
      savedAt = loaded.savedAt;
      app.update(state, game);
    } catch {
      app.notify(
        'The active tab wrote an unreadable save. Your last valid view has been retained.',
      );
    }
});
if (import.meta.env.DEV) {
  (window as unknown as { __farWake: unknown }).__farWake = {
    advance: (seconds: number) => {
      if (!owner) return;
      state = advance(game, state, seconds);
      savedAt = Date.now();
      lastWall = savedAt;
      persist();
      app.update(state, game, true);
    },
    state: () => structuredClone(state),
  };
  if (debugSpeed > 1) app.notify(`Development clock: ${debugSpeed}× while visible.`);
}
// Prompted updates avoid reloading a live expedition without saving it first.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    const update = registerSW({
      onNeedRefresh() {
        app.notify(
          'A ship software update is ready. Close all game tabs and reopen when convenient.',
        );
      },
      onRegisterError() {
        app.notify(
          'Offline installation is unavailable. The game and local saves still work online.',
        );
      },
    });
    void update;
  });
}
