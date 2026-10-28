# Explorer — working guide

This repository contains two browser exploration games sharing a deterministic engine. Read this file first, then [the documentation index](docs/README.md). Keep decisions and status in the repository; do not rely on prior conversations.

## Product and scope

- **Library**: `/`, `index.html`, `src/picker/`. Links to implemented games; reads checkpoints for Play/Resume labels without starting simulations or writing saves.
- **Far Wake**: `/far-wake/`, `far-wake/index.html`, `src/main.ts`. Original retro-futurist science fiction: exploration, ship logistics, cryosleep, corporate politics, optional stowaway horror.
- **Hollowmere**: `/hollowmere/`, `hollowmere/index.html`, `src/fantasy/main.ts`. Original dark fantasy: exploration, supplies, class-dependent party composition, optional curse.
- Published site: <https://rayners.github.io/explorer/>. Repository: <https://github.com/rayners/explorer>.
- iPhone 15 Pro Max Safari, desktop and tablet are first-class targets. Pixel art; static hosting; no backend required.
- Full procedural campaigns and roguelite progression are deferred. Existing seeded variations are not a complete procedural game.

Read [requirements](docs/REQUIREMENTS.md), [decisions](docs/DECISIONS.md), [architecture](docs/ARCHITECTURE.md), [engine contract](docs/ENGINE.md), and [roadmap](docs/ROADMAP.md) before changing their respective areas. [Sources](docs/SOURCES.md) distinguishes user direction from implementation choices and inspirations.

## Boundaries and invariants

1. `src/engine/` must remain independent of game definitions, theme-specific UI, browser globals, network, wall-clock reads and ambient randomness. Supply elapsed time and seeded randomness explicitly. Public transitions preserve their inputs and return serializable state.
2. Content, names, art, skill IDs, resource IDs and narrative belong in each game. Generalize a mechanism through the content contract rather than branching on a game ID in the engine. Hollowmere and the Victorian test fixture demonstrate portability.
3. Keep one primary order and one support job. Pay costs on dispatch; resolve rewards once at completion. Offline catch-up is capped at 24 hours and stops at consequential choices. Never cause permanent casualties through absence.
4. Permanent crew loss belongs to explicit responses to an internal threat, with casualty risk explained before responding. Surprise onset is allowed by the new design direction; it does not permit offline casualties. Retain memorial records. Preserve recovery: guaranteed purge, encounter surrender, recovery transport and emergency recruitment.
5. Preserve already committed jobs when a casualty changes the roster. Enforce staffing for new orders without invalidating a paid journey already in progress.
6. Saves are a compatibility contract. Envelope format 1, state schema 4 and definition generation versions 1 (legacy names), 2 (generated names) 3 (generated sites) 4 (generated layouts) and 5 (personnel opportunities) are separate versions. Saved-shape changes require validation and migration tests. Generator changes must preserve old seeds/catalog identities or explicitly migrate them. Keep existing storage namespaces and manifest identity stable.
7. Imports/resets must back up and write the replacement before swapping the active simulation. Storage errors leave the current expedition usable with a persistent warning and export available. Check ownership before commands and saves.
8. Both games share browser lifecycle code and the site-root service worker, but have independent saves, preferences, command locks and install manifests. Do not reuse one game's namespace for another.
9. Use visible reasons for unavailable actions; avoid hover-only explanations. Provide touch targets of at least 44px, safe-area padding, reduced motion and keyboard access. Check portrait and landscape overflow.

## Code map

| Path                                                         | Responsibility                                                          |
| ------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `src/engine/types.ts`                                        | Definitions, serializable state and commands                            |
| `src/engine/simulation.ts`                                   | Commands, time boundaries, economy, encounters, objectives              |
| `src/engine/names.ts`, `src/content/names.ts`                | Pure seeded sampling and themed name/reference assembly                 |
| `src/engine/missions.ts`, `src/engine/mission-generation.ts` | Discovery eligibility, bound work and contextual contract generation    |
| `src/content/missions.ts`, `src/ui/mission-panels.ts`        | Additive catalog assembly and shared field-work previews                |
| `src/engine/sites.ts`, `src/engine/site-generation.ts`       | Site choices and deterministic profile generation                       |
| `src/content/sites.ts`, `src/ui/site-panels.ts`              | Themed catalog assembly and shared site controls                        |
| `src/engine/discoveries.ts`                                  | Once-only site events, silent exposure and persistent follow-up choices |
| `src/engine/topology.ts`, `world-generation.ts`              | Connected seeded graphs and bounded world assembly                      |
| `src/content/worlds.ts`, themed `world.ts`                   | Versioned layout recipes and assembly before names/sites/contracts      |
| `src/engine/navigation.ts`                                   | Effective routes and itinerary planning                                 |
| `src/engine/proficiency.ts`, `src/ui/proficiency.ts`         | Committed participant credit, bounded practice and roster writing       |
| `src/content/opportunities.ts`, themed `opportunities.ts`    | Versioned rescue/knowledge choices and stable survivor identity         |
| `src/engine/personnel.ts`, `threats.ts`                      | Recruitment, skills, casualties, internal incidents                     |
| `src/engine/save.ts`, `random.ts`                            | Save validation/migration/reconciliation and seeded RNG                 |
| `src/browser/`                                               | Lifecycle, controller, persistence and tab coordination                 |
| `src/game/`, `src/ui/`                                       | Far Wake definitions/writing and DOM/pixel artwork                      |
| `src/fantasy/`                                               | Hollowmere definitions, UI, art and entry point                         |
| `src/picker/`                                                | Library catalog, UI and Far Wake manifest compatibility                 |
| `tests/`, `e2e/`                                             | Behavior, content, portability, browser and offline checks              |
| `scripts/`                                                   | Frontier simulation, icons and screenshots                              |

Vite + TypeScript, hand-written DOM/CSS, Vitest and Playwright. Match surrounding style; avoid adding a framework or dependency without a concrete need. Artwork is currently code-native pixel art; no external fonts or image services are needed.

## Commands and validation

```sh
npm ci
npm run dev -- --host
npm test
npm run typecheck
npm run test:e2e
PAGES_BASE_PATH=/explorer/ npm run build
PAGES_BASE_PATH=/explorer/ npm run test:offline
npm run simulate
npm run simulate:world
```

Playwright requires Chromium and WebKit (`npx playwright install chromium webkit`) and their platform libraries. The browser suite uses desktop Chromium and actual WebKit with iPhone/iPad settings. Offline tests serve an existing production build on port 5200; ordinary browser tests use Vite on 5199. Match the build and offline test base paths.

Add behavior tests for mechanics, regressions, save migrations and lifecycle changes; use invariant/reference checks for content. Use the frontier simulator when changing costs, timing or recoverability. For documentation-only work, check factual accuracy, local links and formatting; avoid unnecessary game tests. A WebKit emulation pass is not a physical-device result; keep pending checks explicit in [ACCEPTANCE.md](docs/ACCEPTANCE.md).

`npm run icons` regenerates icons. `npm run screenshots` captures the library and both games; inspect `scripts/screenshots.ts` for server expectations. Development-only `?speed=60`, `window.__farWake` and `window.__hollowmere` helpers must remain absent in production.

## Adding a game or changing behavior

[Crew development](docs/CREW.md) defines schema-4 practice/participant accounting and generation-5 rescue/training opportunities. Preserve activity participant IDs and paid terms through casualties. Practice only surviving matching participants once; train neither resting members through work nor the dead. Rescue identities reserve a serial at onset, never on preview/failed commands. Keep generations 1–4 frozen and validate/migrate original checksums before adding personnel fields.

[Generated layouts](docs/WORLDS.md) defines frozen generation-4 recipes and world assembly before naming/sites/contracts. Generations 1–3 retain their exact geography and catalogs. Keep protected first routes, connected local/region graphs and a service hub per region. Use actual definition graphs/counts in charts; run `node --import tsx scripts/simulate-world.ts` when changing layouts or logistics.

[Discovery missions](docs/MISSIONS.md) documents the additive generation-3 contract catalog. Keep source discoveries, mission/activity IDs and accepted work compatible. Bound work requires an accepted unfinished contract; completed work is retained until filed and cannot be abandoned/replayed. No payment occurs at work completion. Existing generations 1/2 stay unchanged.

[Generated sites](docs/SITES.md) defines the version-3 catalog and committed approach contract. Keep generations 1/2 unchanged. Use stable site IDs, preserve Job.site and its paid duration/risk/reward, and do not reroll site profiles during rendering or loading. Follow the active queue in [ROADMAP.md](docs/ROADMAP.md).

[Name generation](docs/NAMES.md) documents the versioned vocabulary contract. New games default to generation 5, retaining version-2 naming; restores must pass the saved generation version through every definition-factory call. Keep naming independent of outcome RNG. Use stable-ID references in narrative rather than hard-coded display names.

[Discovery events](docs/EVENTS.md) documents surprise stowaways and the settlement-claim follow-up, implemented in v0.3. New sites can select a once-only incident; preserve the durable incident ledger and cooldown. Keep onset surprises separate from explicit casualty-risk decisions.

Write its goal and design first. Reuse generic mechanisms, create a stable definition ID and distinct browser namespace, add a themed mount and HTML entry, configure its manifest and Vite build input, then add the implemented game to the picker. Cover save isolation, its introductory journey, library return, mobile layout and offline access. See [architecture](docs/ARCHITECTURE.md).

Update the relevant design, engine contract, decision record and roadmap when behavior changes. Record pending ideas as pending, not approved specifications. Update acceptance steps when a new user flow needs a real-device check.

## Publishing

Pushes to `main` trigger `.github/workflows/pages.yml`: unit tests, Pages-base build, browser and offline checks, then GitHub Pages deployment of `dist/`. The configured base is `/explorer/`. The user has requested ongoing publication to this repository and Pages; follow the current session's scope and authorization. Verify the workflow and live affected routes after publishing. Do not report publication before deployment succeeds.

This guide follows the organization of `../clicker/CLAUDE.md`; clicker's game rules, strict TDD policy and other project-specific features are not requirements of explorer.
