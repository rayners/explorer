import { writeReplacement } from './storage';
import { createLease } from './lease';
import { advance, createState, dispatch } from '../engine/simulation';
import { decodeSave, encodeSave, reconcile } from '../engine/save';
import type { Command, GameDefinition, GameState, DefinitionFactory } from '../engine/types';
import type { AppController, GameApp } from './controller';
/** Shared browser lifecycle: independent saves, preferences and command locks per game. */
export function startBrowserGame(options: {
  namespace: string;
  debugName: string;
  createDefinition: DefinitionFactory;
  mount: (root: HTMLElement, controller: AppController) => GameApp;
}) {
  const createGame = options.createDefinition;
  const KEY = `${options.namespace}.save.v1`,
    BACKUP = `${options.namespace}.backup.v1`;
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
    const p = JSON.parse(localStorage.getItem(`${options.namespace}.preferences`) ?? '{}');
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
      game = createGame(loaded.state.seed, loaded.state.generationVersion);
      state = loaded.state;
      savedAt = loaded.savedAt;
    }
  } catch (e) {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) localStorage.setItem(`${options.namespace}.corrupt.v1`, raw);
    } catch {
      storageOK = false;
    }
    initialMessage = `The saved expedition could not be loaded. Its original data was retained where storage permits. ${(e as Error).message}`;
    try {
      const backup = localStorage.getItem(BACKUP);
      if (backup) {
        const loaded = decodeSave(backup, createGame);
        game = createGame(loaded.state.seed, loaded.state.generationVersion);
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
      storageError =
        'Storage is unavailable or full. Export your save from Settings before leaving.';
      app.notify(storageError);
    }
  }
  function savePreferences() {
    try {
      localStorage.setItem(`${options.namespace}.preferences`, JSON.stringify(preferences));
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
      if (state.encounter)
        app.notify('Unregistered contact. Operations are paused for your orders.');
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
  function replaceExpedition(
    nextGame: ReturnType<typeof createGame>,
    next: { state: GameState; savedAt: number },
  ) {
    tick();
    if (!ownsCommand()) throw Error('Only the active tab can replace the expedition.');
    try {
      writeReplacement(localStorage, { state, savedAt }, next, { save: KEY, backup: BACKUP });
    } catch (error) {
      storageOK = false;
      storageError = (error as Error).message;
      app.update(state, game, true);
      throw error;
    }
    game = nextGame;
    state = next.state;
    savedAt = next.savedAt;
    lastWall = Date.now();
    storageOK = true;
    storageError = '';
    app.update(state, game, true);
  }
  const app = options.mount(document.querySelector('#app')!, {
    command: issue,
    isOwner: () => owner,
    storageStatus: () =>
      owner ? (storageOK ? 'LOCAL SAVE ACTIVE' : 'SAVE UNAVAILABLE') : 'READ-ONLY TAB',
    storageError: () => storageError,
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
      const nextGame = createGame(loaded.state.seed, loaded.state.generationVersion);
      replaceExpedition(nextGame, reconcile(nextGame, loaded, Date.now()));
    },
    reset: (seed) => {
      if (!ownsCommand()) throw Error('Only the active tab can start a new expedition.');
      const nextGame = createGame(seed);
      replaceExpedition(nextGame, { state: createState(nextGame, seed), savedAt: Date.now() });
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
        `Welcome back. ${arrivals} arrivals, ${completed} jobs completed.${state.encounter ? ' A contact awaits your orders.' : !state.primary && !state.support ? ' Your expedition is standing by.' : ''}`,
      );
    }
  }
  // Web Locks provide an atomic, browser-managed single writer across tabs.
  if (navigator.locks) {
    void navigator.locks.request(
      `${options.namespace}-command`,
      { ifAvailable: true },
      async (lock) => {
        if (!lock) {
          app.update(state, game, true);
          return;
        }
        takeCommand();
        await new Promise<void>(() => {});
      },
    );
  } else {
    try {
      const token = Array.from(crypto.getRandomValues(new Uint32Array(4))).join('-');
      lease = createLease(localStorage, token, `${options.namespace}.command-lease`);
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
                  game = createGame(loaded.state.seed, loaded.state.generationVersion);
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
        game = createGame(state.seed, state.generationVersion);
        savedAt = loaded.savedAt;
        app.update(state, game);
      } catch {
        app.notify(
          'The active tab wrote an unreadable save. Your last valid view has been retained.',
        );
      }
  });
  if (import.meta.env.DEV) {
    (window as unknown as Record<string, unknown>)[options.debugName] = {
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
          app.notify('An update is ready. Close all game tabs and reopen when convenient.');
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
}
