# Sources and provenance

Recorded 2026-10-27. This repository is the durable record of the design. The user conversation supplied the requirements below; it was not stored as a source file. These summaries preserve meaning without pretending to be a complete transcript or an original formal plan.

## Restart handoff and pending analytics (2026-10-28)

The user requested PostHog usage/error tracking following clicker, with no personally identifiable data. Clicker's local adapter, telemetry helpers and privacy documentation were inspected; no analytics code, dependency or project configuration was changed. The available PostHog skill required pausing until its app/tools were connected; repeated checks found no PostHog tools. Plugin discovery did not establish a usable connection. The user then paused the ongoing roadmap and requested that development state be written into the docs before a possible restart. [STATUS.md](STATUS.md) preserves that handoff; [TELEMETRY.md](TELEMETRY.md) distinguishes requested scope, inspected references, unverified privacy assumptions and pending implementation.

## Primary direction

| User direction                                                                                                        | Repository record                                                                      |
| --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Browser casual/idle-ish exploration; iPhone 15 Pro Max Safari plus desktop/tablet; pixel art                          | [Requirements](REQUIREMENTS.md), [acceptance](ACCEPTANCE.md)                           |
| Retro-futuristic hard-ish science fiction inspired by Alien, long journeys, cryosleep, corporations                   | [Far Wake design](DESIGN.md)                                                           |
| Separate core mechanisms from theme so other games can reuse them; see `../clicker`                                   | [Engine guide](ENGINE.md), [architecture](ARCHITECTURE.md)                             |
| Travel, maintenance, gathering, exploration/discovery, stations/missions and possible faction conflict                | [Requirements](REQUIREMENTS.md), [design](DESIGN.md)                                   |
| Eventual roguelite/procedural systems and missions can wait                                                           | [Roadmap](ROADMAP.md)                                                                  |
| Push to `rayners/explorer` and publish its Pages site like clicker                                                    | [Working guide](../AGENTS.md), [Pages workflow](../.github/workflows/pages.yml)        |
| "No direct route" confusion and objection to requiring a particular departure planet                                  | [Decisions](DECISIONS.md), navigation tests and commits below                          |
| Independent usability/QA review                                                                                       | Corrective commits/tests below; no standalone original review transcript is retained   |
| Additional specialist crew, accommodation upgrades, sneaking threat with casualties, darker fantasy/class-based party | [Far Wake design](DESIGN.md), [Hollowmere](HOLLOWMERE.md), [engine guide](ENGINE.md)   |
| Main game-selection page like clicker                                                                                 | [Architecture](ARCHITECTURE.md), picker tests and v0.2.1 implementation                |
| Write decisions, goals, sources and architectural notes into the repo, including AGENTS.md, following clicker         | [Documentation index](README.md), [AGENTS.md](../AGENTS.md) and this documentation set |

The conversation also referenced a proposed plan, but its complete text is not available as a separate repository artifact. Do not reconstruct unknown steps as approved requirements. The current code, recorded goals and explicitly marked decisions are the available baseline.

## Reference project and creative inspiration

The local sibling `../clicker` is the organizational reference, not a dependency. In this checkout it has **CLAUDE.md**, not AGENTS.md. Files consulted for this documentation pass:

- `../clicker/CLAUDE.md`: working guide, code map, invariants, commands and read-before-changing links.
- `../clicker/docs/DESIGN.md`: durable premise, loop and design rationale.
- `../clicker/docs/ROADMAP.md`: built versus planned status and deliberate deviations.

Their relative paths are local references; explorer builds do not need the sibling repository. Its public source is [rayners/clicker](https://github.com/rayners/clicker). Clicker's feature list and project-specific policies do not automatically transfer here.

The Alien films are a tonal reference requested by the user, not a source of copied names, dialogue, logos or visual assets. Far Wake and Hollowmere use original setting names and code-generated artwork. No claim of film-franchise affiliation is intended. There is no external image-generation or asset service in the implemented rendering path.

## Implementation and verification evidence

Historical commits (GitHub links remain usable without the sibling project):

- [Initial playable Far Wake and Pages](https://github.com/rayners/explorer/commit/9b68cdf).
- [Itinerary explanation](https://github.com/rayners/explorer/commit/2af0c8c) and [system-wide interstellar departures](https://github.com/rayners/explorer/commit/8c287b1).
- [Save, mission and touch QA fixes](https://github.com/rayners/explorer/commit/e6756a8).
- [Recruitment, threats and Hollowmere](https://github.com/rayners/explorer/commit/f5806a0).
- [Committed journeys through casualties](https://github.com/rayners/explorer/commit/8e9d33b).
- [Game-selection homepage](https://github.com/rayners/explorer/commit/f6f375b) and its [successful Pages workflow](https://github.com/rayners/explorer/actions/runs/40595448714).

Tests are the executable evidence for current behavior: `tests/navigation.test.ts`, `mission-outcomes.test.ts`, `storage.test.ts`, `crew.test.ts`, `threats.test.ts`, `fantasy.test.ts`, `save.test.ts`, `victorian.test.ts` and `picker.test.ts`; browser flows are in `e2e/`. They provide regression evidence, not a reconstructed original agent review. See [ACCEPTANCE.md](ACCEPTANCE.md) for physical-device limits.

## Standards and technical sources

Use primary documentation when changing platform behavior:

- [Web App Manifest specification](https://www.w3.org/TR/appmanifest/) — application identity, start URL and scope. Consulted for preserving Far Wake's previous root-start installation identity when moving its page.
- [Vite configuration](https://vite.dev/config/) — build base and multi-page configuration.
- [Vite PWA documentation](https://vite-pwa-org.netlify.app/) — generated service-worker integration.
- [Playwright device emulation](https://playwright.dev/docs/emulation) — emulation capabilities; physical device testing remains separate.
- [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) — static artifact publication.

The latter links are maintenance references, not claims that each was consulted for every earlier implementation. Dependency versions are defined by `package-lock.json`; current code and configuration take precedence over examples from newer documentation.

## Later direction: surprise incidents (2026-10-27)

The user said a creature getting loose aboard ship should sometimes be a surprise and suggested random events with long-term effects, noting the connection to procedural generation. [EVENTS.md](EVENTS.md) records that direction. On 2026-10-28 the user approved the recommended first slice: surprise stowaways and one beneficial/political event. v0.3 implements those as hidden exposure and a settlement-claim follow-up. Exact odds, ledger architecture, balancing safeguards and claim effects are implementation decisions; other candidate events remain deferred.

## Function-based naming (2026-10-28)

The user requested generation functions for crew, faction and location names, permitting larger random-selection lists initially and mentioning Bayesian or other procedural approaches as possible future mechanisms. [NAMES.md](NAMES.md) records the implementation. The indexed sampler, themed parts, independent domains, generation-version selection and compatibility fixtures are implementation choices. No Bayesian model or external generator is used.

## Active roadmap and generated sites (2026-10-28)

After discussing generated sites followed by discovery-derived missions and generated layouts, the user set the active goal to keep working through the roadmap, adding detail as needed and moving to the next item. [ROADMAP.md](ROADMAP.md) records that queue and [SITES.md](SITES.md) records the first task. Exact recipe weights, approach tradeoffs, generation-version choice and preserved Job.site contract are implementation decisions. Released generation-2 compatibility fixtures were captured from the v0.4 source, not reconstructed from desired behavior.

## Discovery-derived missions (2026-10-28)

Continuing the active roadmap goal, the next item implements follow-up work from explored generated sites in both themes. [MISSIONS.md](MISSIONS.md) distinguishes the requested direction from chosen templates, costs, recipient selection, additive compatibility and anti-replay accounting. Paid-site-order fixtures were captured from released v0.5 source before modifying mission catalogs.

## Generated geography (2026-10-28)

The ongoing roadmap goal authorizes the next queued item: varied system/realm layouts. [WORLDS.md](WORLDS.md) records chosen bounded population, protected story anchors, connected-graph construction, version 4, domain separation and pacing budgets. These exact algorithms/numbers are implementation choices, not additional user specifications. Complete generation-1/2/3 definition hashes were captured from the unchanged released v0.6 factories before layout integration. Live mission checks also exposed query-string offline page fallback; v0.7 adds a targeted production regression and static-page cache matching fix.

## Next personnel/event slice (2026-10-28)

The active queue continues from generated layouts to lasting events and crew development. [CREW.md](CREW.md) records an implementation plan, including chosen proficiency bounds, typed rescue/training effects and a schema/content-version split. These are design choices under the ongoing roadmap authorization, not shipped mechanics or separately quoted user specifications. Roguelite progression remains deferred.

Personnel implementation follows the recorded [CREW.md](CREW.md) plan: capped activity-earned proficiency and typed rescue/knowledge effects in both themes. Reservation timing, schema 4, generation 5, thresholds and payment/standing amounts are implementation decisions. Eight pre-change fixture scenarios preserve original old-field outcomes; experience/participants are checked separately rather than rewriting fixtures. Actual threat-casualty testing exposed old last-member activity cancellation, now corrected to retain paid orders.

## Next indirect-faction slice (2026-10-28)

After implementing the queued personnel/events milestone, the ongoing instruction to extend/work through the roadmap leads to [PROJECTS.md](PROJECTS.md): follow-up work shaped by actual settled discoveries. This develops the original indirect-faction direction. Exact prerequisite/catalog design and generation-version proposal are implementation choices and remain unshipped; no separate user approval of those details is claimed.

## Discovery-driven projects, v0.9 (2026-10-28)

The user endorsed the prepared next-step design (“Sounds great”, then “Make it so”). [PROJECTS.md](PROJECTS.md) records the bounded implementation of the ongoing roadmap and earlier indirect-faction interest. Exact patrons, branch economics and generation-6 catalog assembly are implementation decisions. Released v0.8 commit `c538a6f` supplied immutable generation-5 settled-response/job fixtures; new tests check all 11 branches without replacing those fixtures. No territory, autonomous diplomacy or roguelite specification is inferred.

## Planning/readability, v0.10 (2026-10-28)

The user approved the proposal to improve discovery-project visibility, preparation gaps, contract-linked route actions and clear next steps (“Makes sense. Do it”). [PLANNING.md](PLANNING.md) records the inspected UI gaps and bounded design. Choosing fastest known-time routes, estimating a known return hub, retaining completed receipts in the work view and keeping route selection temporary are implementation choices. No automatic dispatch or new procedural content is inferred.

## Discovery variety, v0.11 (2026-10-28)

The user approved proceeding with the next roadmap candidate: more discoveries/missions with different supplies, specialists, rewards and follow-up work (“Go ahead”). [VARIETY.md](VARIETY.md) records the chosen six encounters, twelve branches, team profiles and safe alternatives. These numerical terms and catalog generation 7 are implementation decisions. No unbounded procedural campaign, autonomous faction system or roguelite progression is inferred. Released v0.10 commit `c2723f8` supplies captured generation-6 paid-project fixtures.

## Independent game design review (2026-10-28)

The user requested a separate agent's design review of both games. The [retained review](reviews/DESIGN-REVIEW-2026-10-28.md) records its evidence, limitations and prioritized recommendations against v0.11. This request authorizes review; the recommendations are proposals rather than new user requirements or approved gameplay changes.

The user subsequently requested a visual design review as well. A separate agent's [visual review](reviews/VISUAL-DESIGN-REVIEW-2026-10-28.md) records rendered library/game observations and retained screenshot evidence. Desktop/browser emulation and prepared populated states are identified explicitly; this is not physical iPhone acceptance or approval to implement the proposed changes.

## Readability implementation (v0.12)

The ongoing roadmap instruction authorizes selecting the next bounded improvement after the reviews. [READABILITY.md](READABILITY.md) records that selection: current directives, readable operational text, scannable accepted-work cards and short landscape framing. These are implementation choices informed by review evidence, not a claim that every review recommendation was independently approved. Changes to expedition rewards, longer safe orders, world consequences and contextual generation remain later candidates.

The following [expedition audit](EXPEDITION-AUDIT.md) implements the next evidence-gathering item under the same ongoing instruction. Its eight-seed catalog benchmarks and actual shift catch-up probes are reproducible local measurements, with optimistic staffing/route assumptions and unpriced discovery/faction value explicitly documented. They are not player-retention research or independent approval of a new economy.

## Longer safe orders (v0.13)

Continuing the recorded roadmap, [WATCHES.md](WATCHES.md) selects an explicitly chosen extended hub-work experiment. Duration/payment ratios, specialty-based pay, cancellation, single practice credit and schema-5 watch metadata are implementation choices under the ongoing authorization. Ten actual schema-4 saves/outcomes were captured from released `d69e8e0` before engine changes. No approval of an automatic queue, roguelite reset, passive upkeep or a new generation catalog is inferred.

The following [destination-bundle design](BUNDLES.md) focuses the next ongoing-roadmap item, informed by the audit's local-staging and shared-travel findings. It is an unimplemented planning/UI design, not a claim of new content or batch commands. Its selected boundaries keep actual offers, accepted work, paid terms and receipts distinct.

## PostHog implementation follow-up (2026-10-29)

After restart the connected tools responded and the user explicitly resumed roadmap work. `organizations-get`, `projects-get` and `project-get` resolved the sole project 677229, matched its token/URL to clicker and verified `anonymize_ips: true`. No organization/project settings were changed. Current documentation was consulted through the PostHog app, including the [capture API](https://posthog.com/docs/api/capture), [exception schema](https://posthog.com/docs/error-tracking/capture), [person processing](https://posthog.com/docs/product-analytics/installation/api) and [JavaScript configuration](https://posthog.com/docs/libraries/js/config). The direct capture adapter, memory-only identity and strict allowlists are Explorer implementation decisions under the user's privacy requirement, rather than copied clicker behavior. [TELEMETRY.md](TELEMETRY.md) records the precise contract and validation.

## Destination comparison (2026-10-29)

The user's ongoing instruction to keep working through the roadmap authorizes the next bounded slice after tracking. [BUNDLES.md](BUNDLES.md) was prepared before implementation using the retained expedition audit's same-destination/shared-travel findings. Grouping actual discoveries, conservative serial estimates and navigation-only review controls are implementation choices; this does not approve automatic orders, reward rebalancing, new content catalogs or all independent-review proposals. Local rendered phone/landscape inspection led to accepted-work-first ordering and estimates before long offer labels. Physical iPhone acceptance remains pending.

## Next bounded lasting-place design (2026-10-29)

After verified destination comparison delivery, [FACILITIES.md](FACILITIES.md) chooses a limited resupply point as the first material source change, under the ongoing roadmap instruction. The user did not specify its exact branches/goods. The existing relief-relay/cleric-vigil writing and project roles informed the proposal. It is explicitly unimplemented and proposes generation-8 assembly plus an optional generic market-access contract, without silently turning field locations into full service hubs. These are recorded implementation/design choices, not additional user requirements.

## Duplicate hireable names (2026-10-29)

The user reported that all hireable crew appeared to have the same name. Local reproduction confirmed that all generated roles previewed `recruitSerial` against the shared people domain; some legacy fantasy pools also overlap. The fix allocates distinct free candidate serials without changing grammar, past member identities, saved shape or content catalogs. This report takes priority over the unimplemented facilities design. [NAMES.md](NAMES.md) records the mechanism and compatibility boundary.
