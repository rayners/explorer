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

Command-lock and lease names are derived from the same namespace. Do not infer a save schema from the key suffix: it remains `.v1` while the contained state has migrated to schema 4. Browser local storage is not a cross-device service or guaranteed permanent storage. The checksum is not authentication.

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

Current factories reconstruct authored geography and versioned display names from a saved seed and generation version. Dynamically discovered worlds will need stable instance IDs and either persisted catalogs or retained compatible generator implementations. Do not change factory output for existing generation versions casually: a saved location/job must still resolve to the same content.

Roguelite run state versus persistent profile state has not been designed. Avoid introducing reset, metaprogression or death semantics by implication while extending the generator. These questions are tracked in [ROADMAP.md](ROADMAP.md).

## Discovery events (v0.3)

`src/engine/discoveries.ts` selects from an optional `GameDefinition.discoveryEvents` catalog after a new site completes and existing threats develop. `incidents` is a durable, once-only ledger separate from the 100-entry narrative log; `discoveryCooldown` counts subsequent newly explored sites. Locations, minimum total sites and weights filter selection. No eligible entry consumes no randomness; an eligible opportunity rolls for an event, then its weighted type. There are no per-frame or retroactive site rolls.

Exposure entries create a hidden threat and share `threatHistory` with authored exposure. No onset event or UI card reveals them. Choice entries log a discovery and remain visible as nonurgent follow-ups; their catalog may require a service hub. The `discovery` command validates location/choice, marks the ledger resolved, applies rewards and standing once, and records a structured event. Pending follow-ups do not stop time but prevent more random discoveries until settled. Active threats also prevent selection.

Schema 3 initializes an empty ledger and cooldown when loading schema 2, after checksum validation; the existing schema-1 migration runs first. World generation remains version 1 because existing world IDs, deposits, sites and committed jobs remain intact. Hollowmere receives the schema migration and generic mechanism but has no random discovery catalog yet.

## Name generation (v0.4)

`src/engine/names.ts` supplies deterministic domain-separated sampling and collision-checked allocation. Each theme owns its vocabulary; `src/content/names.ts` builds display names and resolves stable-ID references in authored text. Generation 1 keeps the original names/pools; generation 2 uses the new sampler. `decodeSave` and all browser restoration paths pass the saved generation version to the factory, including secondary-tab updates. A new/reset game uses the current default. State schema 3 and envelope 1 remain unchanged; see [NAMES.md](NAMES.md) for the compatibility contract and frozen fixtures.

## Generated sites (v0.5)

`src/engine/site-generation.ts` composes weighted, theme-owned trait components in an independent seeded stream per site/axis. `src/content/sites.ts` installs the resulting catalog only for generation 3 and replaces LocationDef.sites with stable site IDs. Versions 1/2 return their original lists. Names still use the frozen v2 algorithm.

`explorationPlan` validates site/approach selection without mutation. Dispatch combines the chosen profile with the existing activity/team checks and commits the existing Job.site, timer, reward and risk fields. Completion uses those committed values and selected identity. Save validation rejects foreign/completed/missing generated-site job references. No new state fields or schema migration are needed; compatibility tests compare exact released v0.4 outcomes.

`src/ui/site-panels.ts` renders both themes' surveyed registries and approach controls. The quick exploration cards preview the same default plan as dispatch. Narrative logs and incident histories render names through the generated catalog rather than exposing IDs. See [SITES.md](SITES.md).

## Discovery-derived missions (v0.6)

`src/engine/mission-generation.ts` selects themed follow-up templates from site traits and returns mission/activity definitions with stable source-derived IDs. `src/content/missions.ts` appends them for generation 3 only. Existing catalogs/IDs remain present, and frozen site profiles are untouched. The new contracts are additive for existing generation-3 saves.

`MissionDef.sourceSite` gates offer visibility and acceptance through `missionDiscovered`. `ActivityDef.mission` binds work to an accepted unfinished contract. Ordinary activity jobs pay costs and resolve an activity-ID objective once; their immediate reward is empty. Mission claiming is the sole payment. Bound work cannot be abandoned underway, and completed work remains in the mission ledger until claimed. This reuses state schema 3 rather than introducing a parallel receipt store.

`src/ui/mission-panels.ts` supplies actual work-cost/role previews and accepted-work sections to both themes. Save validation checks source discoveries and rejects dangling/already-completed bound jobs. Released v0.5 fixtures preserve old paid orders; the new follow-up catalog has its own frozen fixture. See [MISSIONS.md](MISSIONS.md).

## Generated worlds (v0.7)

Factories assemble authored story anchors, then generation-4 layouts (`engine/world-generation.ts`, `content/worlds.ts`, themed `world.ts` recipes), then names, sites and contextual missions. Pure graph/population algorithms remain inside the engine; theme vocabulary/resource IDs remain outside it. Versions 1–3 skip layout assembly entirely. Both charts draw actual interregional links through `ui/world-map.ts`; campaign simulation navigates known routes rather than fixed destination lists. See [WORLDS.md](WORLDS.md) for frozen catalog identities and guarantees.

## Personnel progression (v0.8)

The engine commits activity participants and grants bounded practice only at completion. Typed discovery effects reuse shared recruitment and proficiency functions, with themed generation-5 opportunity recipes assembled after the existing world/name/site/contract pipeline. Both mounts use shared effect previews and proficiency writing. State-schema migration and definition-generation compatibility remain independent; see [CREW.md](CREW.md) for reservation identity, roster/casualty guarantees and released fixtures.
