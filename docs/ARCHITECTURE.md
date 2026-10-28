# Architecture and extension notes

For exact types and API examples, read [ENGINE.md](ENGINE.md). This document explains how the pieces compose and what must change together.

## Layers

```text
HTML entry pages
  library -> picker catalog / save recognition / service-worker registration
  Far Wake -> definition + themed UI --+
  Hollowmere -> definition + themed UI +-> shared browser runtime -> engine
                                        persistence / clock / ownership
engine -> types, navigation, personnel, threats, seeded RNG, save validation
```

The engine cannot import either game or browser/UI code. Game definitions supply the world, prices, roles, routes, activities, missions, factions and rule mappings. Structured engine events carry keys and parameters; themed rendering supplies narrative. Some shared validation errors remain setting-neutral English rather than localization keys.

`src/game/definition.ts` builds Far Wake; `src/game/text.ts` renders its event writing. `src/ui/` renders its console and pixel art. `src/fantasy/definition.ts`, `app.ts` and `art.ts` supply Hollowmere. Hollowmere also uses shared UI CSS. These are separate game implementations over one engine, not a fully declarative theme editor.

`tests/content.test.ts` checks engine isolation and Far Wake references; `tests/victorian.test.ts` exercises an alternate setting without importing Far Wake. Fantasy, personnel, threat and save tests cover the second actual consumer and its mechanics.

## Command and time flow

1. An entry point calls `startBrowserGame` with a namespace, definition factory, development-helper name and UI mount.
2. The runtime loads preferences and the checkpoint, validates it through the definition factory, and tries the prior backup if loading fails. It retains the unreadable original where storage allows.
3. After gaining command ownership it reconciles elapsed wall time. Only the owner writes or issues commands. The UI receives state through the controller/mount contract.
4. A user action first brings the simulation current, then calls `dispatch`. Rejected commands preserve input state; accepted commands update state, save and render.
5. `advance` consumes real elapsed seconds through job boundaries. Foreground/support jobs coexist, with deterministic completion order and saved random state. Encounters and active threat alerts hold consequential progression for input.
6. Lifecycle checkpoints and ownership release protect page changes and suspension. Background timers are not assumed reliable. Returning from a choice must not replay elapsed time already accounted for.

A job stores committed duration, costs already spent, rewards, destination and fictional days. Preserve these through reload, definition compatibility and crew casualties. Travel commits fictional calendar time on arrival. Planning reads known effective routes without spending or discovering anything.

## Browser persistence and coordination

`src/browser/controller.ts` is the UI-to-host interface. `runtime.ts` owns time, storage status, sound/motion preferences, save export/import/reset and tab ownership. `storage.ts` performs backup/replacement writes before active-state replacement. `lease.ts` supplies fallback coordination where Web Locks are unavailable.

| Data                   | Far Wake               | Hollowmere               |
| ---------------------- | ---------------------- | ------------------------ |
| Save                   | `far-wake.save.v1`     | `hollowmere.save.v1`     |
| Pre-replacement backup | `far-wake.backup.v1`   | `hollowmere.backup.v1`   |
| Unreadable original    | `far-wake.corrupt.v1`  | `hollowmere.corrupt.v1`  |
| Preferences            | `far-wake.preferences` | `hollowmere.preferences` |
| Runtime namespace      | `far-wake`             | `hollowmere`             |

Command-lock and lease names are derived from the same namespace. Do not infer a save schema from the key suffix: it remains `.v1` while the contained state has migrated to schema 2. Browser local storage is not a cross-device service or guaranteed permanent storage. The checksum is not authentication.

## Library, manifests and build

`index.html` starts `src/picker/main.ts`. The catalog supplies stable game IDs, links, artwork and save keys. Resume detection only checks recognizable envelope/definition metadata; full validation and catch-up happen inside the selected game. A Resume label does not certify checksum validity.

Vite has three HTML inputs. The root service worker precaches all entries and local assets. Both game hosts and the library register it in production. Development helpers and service-worker behavior differ from production; verify offline behavior against `dist/`, not Vite development mode.

Far Wake retains `/manifest.webmanifest`; Vite emits it from `src/game/manifest.json` using `src/picker/manifest.ts`. Its explicit identity is the deployment root (`/explorer/` on Pages), preserving the former start-URL identity. Start URL and install scope are `./far-wake/`. Hollowmere's manifest remains under `public/hollowmere/`. Install scope is distinct from the shared service worker's root scope.

Old standalone installations can still launch the root picker URL; `legacyLaunchTarget` redirects them to Far Wake. All games links use `?games=1` to bypass that compatibility redirect. Normal browser root visits show the library even if saves exist.

The Pages workflow builds with `PAGES_BASE_PATH=/explorer/`. Do not hardcode root-absolute asset or game links that break this subpath. A local default build uses `/`; production offline tests must use the same base as the tested build.

## Adding another game

1. Record its setting, core loop and class/resource mappings in a design document. Mark unimplemented ideas clearly.
2. Implement a deterministic definition factory with stable IDs and generation version. Reuse generic requirements, recruitment and threat definitions; add a generic engine mechanism only when existing contracts cannot express the behavior.
3. Add a themed UI mount and runtime entry with a new namespace/debug name. Keep game-specific narrative and artwork there.
4. Create its HTML page, local icons and independent manifest; include its entry in Vite inputs and the picker catalog. Preserve the shared root service worker.
5. Test its first loop, definitions/references, save export/import, rejection of other games' saves, independent locks, library return and offline navigation. Check phone/tablet/desktop layouts.
6. Update the documentation index, root guide, README, roadmap and physical acceptance steps.

## Future procedural generation

Current factories reconstruct immutable authored catalogs from a saved seed and generation version. Dynamically discovered worlds will need stable instance IDs and either persisted catalogs or retained compatible generator implementations. Do not change factory output for existing generation versions casually: a saved location/job must still resolve to the same content.

Roguelite run state versus persistent profile state has not been designed. Avoid introducing reset, metaprogression or death semantics by implication while extending the generator. These questions are tracked in [ROADMAP.md](ROADMAP.md).
