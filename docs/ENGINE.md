# Exploration engine integration

The engine implements deterministic journeys, activities, inventory and capacity, equipment condition, teams, objectives, relationships, and encounters. It does not know what a ship, planet, detective, or castle is.

## Public interface

```ts
import type { GameDefinition, Command } from '../src/engine/types';
import { createState, dispatch, advance, view } from '../src/engine/simulation';
import { encodeSave, decodeSave, reconcile } from '../src/engine/save';

const definition: GameDefinition = buildYourDefinition(123);
let state = createState(definition, 123);
const result = dispatch(definition, state, { type: 'travel', target: 'docks' });
if (result.error) showMessage(result.error);
else state = result.state;
state = advance(definition, state, 30); // real elapsed seconds
const screen = view(definition, state);
```

`GameDefinition` is the content contract. A definition factory `DefinitionFactory = (seed: number, generationVersion?: number) => GameDefinition` may use authored data, seeded generation, or a mixture. Keep the same generation version and factory behavior for existing saves. Generated instances belong in saved state when future generation becomes dynamic; immutable authored catalogs remain definitions.

`GameState` contains the seed, PRNG state, timers, location, inventory, discoveries, team assignments, condition, reputation, mission progress, upgrades, capped events, and milestones. Inputs are not mutated by public operations. State is JSON-serializable; definitions may also supply deterministic code hooks.

`dispatch` returns `{ state, error? }`. A failed command returns the unchanged input. UI rendering must remain separate from command validation. Commands cover travel, activities, trading, missions (accept/claim/abandon), crew assignment, equipment upgrades, recovery, data licensing, aid, and encounter choices.

`advance` processes timer boundaries rather than sampling a random event each frame. Foreground and support jobs can coexist. Randomness is consumed only when an outcome is resolved, and its new state is saved. Completing a job clears it before rewards are applied. Simultaneous completions resolve in foreground/support order. An encounter stops all consequential time until a decision is made.

An optional `hooks.afterActivity(state, activity)` can return an extended state transition. It must be deterministic, preserve the core state invariants, return serializable state, and avoid wall-clock reads, ambient random numbers, DOM access, or network calls. Custom resource-based mechanics usually need only an activity definition. If adding a new state shape, extend validation and add a save migration.

## Content authoring

A minimal game supplies:

- A stable game ID and generation version; a list of regions and locations, with stable IDs.
- Undirected routes with real duration, fictional days, resource costs, and incident risk.
- Resources with prices and cargo mass. Currency has zero mass.
- Activities with duration, team slot, costs, rewards, skill, and location restrictions.
- Mission objectives that match activity IDs or built-in events (`travel`, `sellData`, `aidDelivered`, `combatWon`).
- Factions, initial inventory/team state, optional upgrades, data-defined milestone thresholds, and rule IDs mapping generic mechanisms to this game's content.

For example, a Victorian game maps `travelResource` to carriage fares, `surveyActivity` to investigate, and `combatSkill` to deduction. A fantasy game could use roads, rations, dungeon expeditions, adventurers, relics, and guilds. The `station` boolean means a service hub; it does not require a space station. The initial integration fixture is `tests/victorian.test.ts`.

Game events carry `key` and `params`, never rendered narrative. The application maps them to localized or themed writing. Current human-readable validation errors use shared, setting-neutral English; another language can introduce error codes without altering the simulation mechanisms.

Time has two units: real seconds for waiting and fictional days recorded by journeys. Travel commits its calendar duration on arrival; the in-transit UI previews the arrival year. Market-cycle rules optionally vary prices with fictional elapsed years. This is compressed logistics, not an orbital dynamics or relativistic physics simulator.

## Browser integration and saves

The host supplies elapsed time to the engine and owns storage. `encodeSave(state, timestamp)` creates an inspectable checksummed JSON envelope. `decodeSave(text, definitionFactory)` validates its format, checksum, state shape, IDs, and generation compatibility before returning state. `reconcile(definition, loadedSave, now)` advances at most 24 hours, prevents time reversal, and updates the checkpoint even when waiting at an encounter. Do not reapply an old checkpoint.

Keep browser timestamps monotonic when the system clock moves backward. Save on commands, periodic checkpoints, `visibilitychange`, and `pagehide`. Background browser timers are not a reliable simulation clock. The host may use Web Locks to ensure exactly one writing tab; other tabs only display saved updates. HTTP LAN previews use a checked, renewable storage lease as a best-effort fallback; HTTPS Web Locks provide the atomic guarantee.

Storage format and definition generation version are independent. State schema 4 migrates legacy version-one, version-two and version-three states after verifying their original checksum. Schema 2 adds personnel/threat fields; schema 3 adds the incident ledger and discovery cooldown. The envelope format remains 1. Before changing either, retain old generator behavior or migrate generated content and provide explicit save migrations with old-save fixtures. Rejection is safer than silently regenerating a different universe for an old seed.

## Verification contract

New mechanics need behavior tests that show costs, completion, rejection conditions, and offline equivalence. Catalog changes need reference and reachability checks. Generator changes need reproducibility and compatibility checks. Theme portability is covered separately from the science fiction UI: the Victorian fixture runs travel, investigation, missions, and save restoration without importing `src/game`.

## Route planning

`planRoute(definition, state, destination)` from `engine/navigation` returns the shortest itinerary by real travel time through known locations. Legs are oriented in travel order, including reverse traversal of undirected routes. Unknown or disconnected destinations return an empty itinerary. Planning does not reveal destinations, spend supplies, or queue commands: the host previews the itinerary and issues each travel order explicitly.

Interregional connections default to location-specific endpoints, suitable for roads, passes, or gates. A game can opt into `rules.interregionalTravel: "region"` to connect all locations in neighboring regions. Far Wake uses this policy for open-space travel; estimates include local transfers. `routesAt` supplies the same effective connections to planning and command validation. Destination knowledge and supply checks still apply, and existing travel jobs keep their saved duration and costs.

Mission outcome objectives use `combatWon` for actual combat victories and `aidDelivered` for completed relief deliveries. These are separate from activity IDs such as `raid` and `aid`, so starting an encounter or completing a single activity cannot count twice.

## Recruitment, casualties and threats

`GameDefinition.recruitment` supplies a base accommodation limit and recruit offers (role, costs, name pool, and optional emergency eligibility). Accommodation upgrades use `crewCapacity`. `hire` creates a reproducible identity and increments `recruitSerial`; the member starts resting. `living(state)` and `crewCapacity(game,state)` provide the current roster and capacity. Dead members remain in `crew` with `life: "dead"`, provide no skills, and cannot be assigned or healed. The engine retains the initial cast so memorial records and legacy saves remain valid.

Activities may declare `requirements` by skill, count, and assignment; they may also restrict availability to particular location IDs. Both games use these checks for medical care and class-dependent expeditions. Settings supply skill IDs; the engine has no engineer, fighter, mage, or cleric branches.

Optional `ThreatDef` catalogs configure skills, response costs, evasion, detection pacing, and cargo loss. An `expose` activity starts one hidden incident, recorded in `threatHistory`. Activity-boundary transitions reveal it. `threatAlert` pauses all consequential time; contained threats permit operations. Only the explicit `threat` commands can cause casualties. Search, containment, confrontation, and guaranteed purging all use saved random state and emit structured events. A `threatStopped` objective can award a mission independently of ordinary combat outcomes.

`src/browser/runtime.ts` accepts a definition factory, namespace, debug namespace and UI mount. The settings-specific content is supplied by the mount; saves, preferences, lease keys and Web Locks are isolated by namespace. Both games share the site-root service worker while exposing independent installation manifests. Never reuse a namespace for a different definition.

## Game library and entry pages

`src/picker/catalog.ts` contains the implemented game cards and their save-key metadata. The library reads recognizable checkpoints only to select Play/Resume labels; it imports neither game definitions nor simulations and never changes a save. Each game has an independent HTML entry page, build input, manifest and namespaced runtime.

Far Wake’s historical manifest URL is retained at the site root. `farWakeManifest` emits an ID matching its former root start URL for the configured deployment base, with its new start and scope at `far-wake/`. Legacy standalone root launches redirect to that page unless `?games=1` explicitly requests the library. Root service-worker registration precaches the selector and both game pages for offline navigation.

## Site discovery catalogs

`GameDefinition.discoveryEvents` is optional: `{ chance, cooldown, entries }`. Entries have stable unique IDs, positive weights, `minimumSites` (including the site just completed), optional location restrictions and either `kind: "exposure"` with a threat ID, or `kind: "choice"` with choices and `at: "station" | "any"`. Choice definitions supply resource rewards and faction-standing deltas. Each entry can be selected once per expedition. Keep IDs and recorded choices compatible with existing saves.

`discoverAtSite` runs only when the configured exploration activity completes a new site. A selected exposure starts hidden with zero signs; existing threats have already developed for that completion. No narrative onset event is emitted. `pendingDiscovery` returns a nonurgent choice record. `dispatch(..., { type: "discovery", id, choice })` resolves it once, requiring docking if configured, and applies rewards/standing. It never consumes random numbers. Encounter/threat holds still take priority over resolving a discovery.

`GameState.incidents` stores `{ id, location, site, at, choice }` records. Exposure choices remain null; threat resolution is tracked by existing threat state/history. Choice outcomes persist even after narrative log truncation. `discoveryCooldown` skips the next N new-site completions after any selection. An unresolved choice or any active threat suppresses additional selection; ordinary work and travel do not roll or decrement cooldown. No world catalogs are regenerated during migration.

## Versioned name generation

Factories for Far Wake and Hollowmere default to generation 7, retain 6 for original project saves, 5 for personnel-opportunity saves, 4 for generated-map saves and 3 for generated-site/authored-map saves and 2 for generated-name/authored-site saves, and accept 1 for released authored-name saves. `decodeSave` passes both the saved seed and generation version to the factory. Hosts must also rebuild the rendered definition with `factory(loaded.state.seed, loaded.state.generationVersion)`. Never reconstruct an old save using the current default version.

`generateName(seed, namespace, pattern, ordinal)` returns an indexed name; `allocateNames` fills a catalog of stable IDs without duplicate display names. Theme-owned `NamePattern` data supplies parts and a separator. A `RecruitDef.nameSource` supplies the pattern, namespace, ordinal offset and optional title; when absent, legacy `names` selection is unchanged. Recruitment previews and save validation use `recruitName` consistently. These functions do not touch `GameState.rng`. See [NAMES.md](NAMES.md) for frozen vocabulary and future extension rules.

## Selectable exploration sites

An optional `GameDefinition.sites: SiteDef[]` supplies profile data. A `SiteDef` references its location, stable identity, display name/description, four traits, approaches and optional discovery-event weight multipliers. Its ID belongs in LocationDef.sites and saved discoveries. No theme identifiers are interpreted by the engine.

`explorationPlan(game,state,site?,approach?)` returns an immutable selection, a setting-neutral rejection, or undefined for legacy activity-only games. `activityDuration` accepts optional site/approach IDs and uses the same selected effort. Explicit activity commands can select any unfinished local site; omission selects the next site's direct approach. Selection does not bypass survey, assignment, existing work, encounter or threat holds.

The chosen profile supplies cost/reward/risk/effort and additional skill requirements. Dispatch pays cost and commits its `Job.site`, timers, reward and risk. Completion records that site and grants the stored return once, without the legacy extra exploration currency. A generated exploration job must have a valid unfinished local site on import. Older generations retain their original no-site job behavior. Profiles are definition data reconstructed by the saved generation version; do not change a released generator to recompute a different catalog for the same seed.

`generateSites(seed,namespace,locations,recipe)` composes weighted components independently of the outcome RNG. Recipe data owns vocabulary, resource/skill references and balance. `SiteDef.eventWeights` multiplies eligible discovery weights at completion; zero excludes that event, while chance/cooldown/uniqueness rules remain unchanged. See [SITES.md](SITES.md).

## Bound field work and discovery follow-ups

`MissionDef.sourceSite` optionally requires an explored site. `missionDiscovered(game,state,mission)` supplies the same check to UI boards, accept validation and imports. `ActivityDef.mission` optionally requires an accepted unfinished mission before dispatch. Both mechanisms use stable identities and apply independently of a theme. Existing authored missions and unbound activities retain their old behavior.

`generateFollowUps(game,recipe)` derives missions and associated activities from site traits using theme-owned templates. Generated objectives reference the work activity ID and source location. Ordinary completion progresses them; it grants no combat-win credit. Work activities have empty immediate rewards, and filing pays their mission once. Existing active-contract limits, hub requirements and faction restrictions still apply.

Abandonment is rejected while associated work is committed, and completed bound work is retained until filed. Unstarted contracts may be released/reaccepted. Claimed IDs remain in state and cannot be accepted again. Import validation checks source discoveries and accepted unfinished work references, avoiding a second saved completion ledger. Preserve the generated catalog for already accepted IDs when updating templates. See [MISSIONS.md](MISSIONS.md).

## Generation-4 world assembly

`generateWorld(seed, namespace, {regions, locations, routes}, recipe)` returns independent catalogs; `connectedGraph` builds connected seeded undirected graphs with optional required links. World recipes own kinds, yields, descriptions, factions, costs and time scales. Theme factories apply world assembly before names, sites and derived missions. Generation 4 is retained for generated-map saves; generations 5/6 add opportunities/projects respectively; generations 1–3 reconstruct their frozen definitions. Generation 7 is the current fresh-expedition default, adding discovery variety. No state/envelope shape changes. Keep story-anchor IDs, protected routes, a connected local graph and hub per region, and a connected regional graph. Charts and route planning must use the returned catalogs. Full contract and acceptance: [WORLDS.md](WORLDS.md).

## Practice and personnel opportunities (v0.8)

Schema 4 initializes `Member.experience` (0–30) and commits `Job.participants` for activities. Only surviving matching dispatch participants earn one point when that activity completes. At 4/12 points `proficiencyBonus` adds 0.03/0.06 to existing skill contribution; paid job terms never recompute. All paid activities/journeys survive casualties; new orders validate living staffing. Migration validates old schema-3 state before adding fields; its checksum is verified first.

Generation-5 `DiscoveryChoice` supports `recruit` offer IDs and `training: {skill,points}`. Rescue selection reserves `IncidentRecord.recruitSerial`; preview/normal hiring/joining share the same naming sequence without double spending the reservation. Shared recruitment validation enforces hubs/capacity/archive limits, and save validation checks reservation/choice/member consistency. Training targets living matching specialists with capped gains. Choices apply their effects/receipt once and remain explicit. Content belongs to each theme; see [CREW.md](CREW.md).

## Exact discovery-choice projects (v0.9)

`MissionDef.discoveryChoice?: { incident: string; choice: string }` combined with `sourceSite` requires an actual matching settled incident at that site's location and actual explored source. `missionDiscovered` serves UI visibility, acceptance and accepted/claimed save validation. Surveying alone never qualifies. `generateProjects` takes theme-owned `ProjectBranch` data and builds stable `project:<site>:<incident>:<choice>` mission IDs and bound primary activities. Costs are paid on dispatch, surviving participants gain practice at completion, immediate reward is empty and hub filing alone pays. Existing limits, standing refusal, release/replay protection and casualty preservation apply. Generation 6 appends after opportunities; no new state fields/schema. See [PROJECTS.md](PROJECTS.md).

## Planning host integration (v0.10)

The browser host derives expedition preparation in `ui/expedition-planning.ts` using existing mission definitions, living assignments, inventory, `planRoute` and `dispatch`. These are read-only views; no new engine command/state/catalog is introduced. Estimates use fastest known-time itineraries and a reachable known return hub, excluding uncertain hazards and future resupply. Accepted committed work must not be treated as requiring payment/staffing again; completed receipts require only return/filing. Never dispatch merely to open a route preview. See [PLANNING.md](PLANNING.md).

## Readable work views (v0.12)

Shared accepted-work cards render the existing `expeditionPlan` phases and engine dispatch availability. Story and route estimates can be expanded without issuing commands; current supply/staffing gaps and order restrictions remain visible. Paid jobs retain committed terms and do not regain supply or staffing requirements. Themed overview guidance reads existing mission/job state without changing it or exposing hidden threats. This changes neither engine contracts nor generation/state/envelope versions. See [READABILITY.md](READABILITY.md).

## Project recipe roles (v0.11)

`ProjectBranch.slot?: ActivityDef['slot']` defaults to primary. `requirements?: SkillRequirement[]` defaults to the existing one-specialty requirement on the work team. Explicit requirements can name support/primary assignments; generator output remains unchanged for old recipes. A support field project uses ordinary support jobs: pay at dispatch, remain at the source, block departure while active, preserve committed jobs through roster loss, zero support incident risk, and resolve one objective receipt at completion. Required specialists on another team supply eligibility, but gain no practice through that job unless they are committed matching participants on its own slot. Generation-7 catalog assembly adds content; state schema 4 and envelope 1 remain unchanged. See [VARIETY.md](VARIETY.md).
