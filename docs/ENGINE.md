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

`GameDefinition` is the content contract. A definition factory `(seed: number) => GameDefinition` may use authored data, seeded generation, or a mixture. Keep the same generation version and factory behavior for existing saves. Generated instances belong in saved state when future generation becomes dynamic; immutable authored catalogs remain definitions.

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
- Mission objectives that match activity IDs or built-in events (`travel`, `sellData`, `aid`).
- Factions, initial inventory/team state, optional upgrades, data-defined milestone thresholds, and rule IDs mapping generic mechanisms to this game's content.

For example, a Victorian game maps `travelResource` to carriage fares, `surveyActivity` to investigate, and `combatSkill` to deduction. A fantasy game could use roads, rations, dungeon expeditions, adventurers, relics, and guilds. The `station` boolean means a service hub; it does not require a space station. The initial integration fixture is `tests/victorian.test.ts`.

Game events carry `key` and `params`, never rendered narrative. The application maps them to localized or themed writing. Current human-readable validation errors are shared English; another language can introduce error codes without altering the simulation mechanisms.

Time has two units: real seconds for waiting and fictional days recorded by journeys. Travel commits its calendar duration on arrival; the in-transit UI previews the arrival year. Market-cycle rules optionally vary prices with fictional elapsed years. This is compressed logistics, not an orbital dynamics or relativistic physics simulator.

## Browser integration and saves

The host supplies elapsed time to the engine and owns storage. `encodeSave(state, timestamp)` creates an inspectable checksummed JSON envelope. `decodeSave(text, definitionFactory)` validates its format, checksum, state shape, IDs, and generation compatibility before returning state. `reconcile(definition, loadedSave, now)` advances at most 24 hours, prevents time reversal, and updates the checkpoint even when waiting at an encounter. Do not reapply an old checkpoint.

Keep browser timestamps monotonic when the system clock moves backward. Save on commands, periodic checkpoints, `visibilitychange`, and `pagehide`. Background browser timers are not a reliable simulation clock. The host may use Web Locks to ensure exactly one writing tab; other tabs only display saved updates. HTTP LAN previews use a checked, renewable storage lease as a best-effort fallback; HTTPS Web Locks provide the atomic guarantee.

Storage format and definition generation version are independent. This initial release has no older formats to migrate. Before changing either, retain old generator behavior or migrate generated content and provide explicit save migrations with old-save fixtures. Rejection is safer than silently regenerating a different universe for an old seed.

## Verification contract

New mechanics need behavior tests that show costs, completion, rejection conditions, and offline equivalence. Catalog changes need reference and reachability checks. Generator changes need reproducibility and compatibility checks. Theme portability is covered separately from the science fiction UI: the Victorian fixture runs travel, investigation, missions, and save restoration without importing `src/game`.

## Route planning

`planRoute(definition, state, destination)` from `engine/navigation` returns the shortest itinerary by real travel time through known locations. Legs are oriented in travel order, including reverse traversal of undirected routes. Unknown or disconnected destinations return an empty itinerary. Planning does not reveal destinations, spend supplies, or queue commands: the host previews the itinerary and issues each travel order explicitly.
