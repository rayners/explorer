# Roadmap and status

Baseline: v0.13.0, 2026-10-28. This is a status and design queue, not a release schedule. Requirements and rationale live in [REQUIREMENTS.md](REQUIREMENTS.md) and [DECISIONS.md](DECISIONS.md).

## Active implementation queue

**Delivered: privacy-conscious usage/error tracking (v0.14).** The user resumed work after restart. Shared browser-only reporting, sanitized errors, ephemeral page identity and cross-game/library opt-out are published. [Pages workflow](https://github.com/rayners/explorer/actions/runs/40939176487) passed 167 unit, 111 browser, 12 telemetry and 34 offline cases; live routes, opt-out and the six known verification records' ingestion/privacy fields were checked. See [TELEMETRY.md](TELEMETRY.md) and [STATUS.md](STATUS.md). **Current work: destination bundles** (implemented locally, validation pending), then changed-place consequences and contextual discovery selection under their own designs.

**Delivered after the reviews: readability and action hierarchy (v0.12).** [READABILITY.md](READABILITY.md) records early overview directives, scannable accepted-work cards, readable stock/decision text and short-height landscape layouts. Pages deployment and live checks passed. This uses the ongoing roadmap authorization; it does not adopt every review proposal.

**Following evidence item completed: expedition value/session cadence.** [EXPEDITION-AUDIT.md](EXPEDITION-AUDIT.md) and its retained report compare eight-seed return commissions, same-destination bundles, nearby hubs and actual single-shift catch-up. It is a reproducible optimistic benchmark, not player research or a reward rebalance.

**Delivered: explicitly chosen longer safe orders (v0.13).** [WATCHES.md](WATCHES.md) records one 15-minute, one-hour or eight-hour hub job, bounded pay/debt terms, one completion/practice credit, cancellation without partial payout and schema-5 migration. Local suites, both simulators, cadence probes, Pages deployment and live checks pass. Short active work, recovery wages, explicit journeys and safe absence are preserved. Feature `7eed06e`; [Pages workflow](https://github.com/rayners/explorer/actions/runs/40749394417). Physical iPhone acceptance remains pending.

**Next design prepared: destination bundles.** [BUNDLES.md](BUNDLES.md) focuses comparison of actual discovered/accepted work at a destination and known nearby hubs, using existing route/stock/role estimates. Keep offers separate from aggregate accepted-work estimates and respect contract capacity, paid commitments and receipts. No automatic acceptance, resupply or dispatch is implied. One changed-place consequence per theme and contextual discovery selection remain following candidates, without passive upkeep or roguelite resets.

User direction (2026-10-28): keep working through the roadmap, recording decisions and moving to the next item after each verified delivery.

1. **Delivered v0.5: generated exploration sites.** Origin, condition, opportunity and complication affect available approaches, costs, rewards and risks in both games. Preserve old generations; design/acceptance: [SITES.md](SITES.md).
2. **Delivered v0.6: missions derived from discoveries.** Create follow-up work from actual explored sites, factions and consequences, with saved identity, clear goals and hub completion. Design and acceptance: [MISSIONS.md](MISSIONS.md).
3. **Delivered v0.7: generated system/realm layouts.** Vary topology and bodies/places while guaranteeing reachable service hubs, introductory goals and recovery. Version/persist generated references. Design and acceptance: [WORLDS.md](WORLDS.md). Generation-4 factories, connected graphs, optional regions/places, dynamic charts and actual-graph campaign simulation are implemented.
4. **Delivered v0.8: broaden lasting events and crew development.** Design: [CREW.md](CREW.md). Begin with bounded specialty proficiency, rescued-specialist opportunities and knowledge choices; preserve committed work, accommodation and safe absence. Schema-4 migration, participant accounting, roster progress and generation-5 opportunities are implemented in both themes. Release checks, Pages deployment and live offline checks passed.

5. **Delivered v0.9: faction projects shaped by settled discoveries.** Exact incident/choice/source prerequisites unlock one optional branch per settled incident. Both themes have distinct patrons, field supplies and specialists; existing accepted-work receipts and neutral recovery remain intact. Generation 6 adds catalogs, preserving generations 1–5 and state schema 4. Design: [PROJECTS.md](PROJECTS.md). Pages deployment and live offline/compatibility checks passed; evidence is recorded below.
6. **Delivered v0.10: expedition planning and project readability.** Review how players find unlocked work, compare preparation needs and plan multi-leg journeys to source sites. Shared preparation guidance, visible discovery-work summaries, completed receipts and explicit contract-linked route previews are implemented; local checks, Pages deployment and live offline/compatibility checks passed; evidence follows below. Design: [PLANNING.md](PLANNING.md). Avoid automatic dispatch, new mandatory chores or expanding faction simulation without a separate design.

7. **Delivered v0.11: broader discovery and mission variety.** Six new discoveries, twelve response-bound commissions, support field work and cross-team role preparation in new generation-7 expeditions. Reuse existing effects/receipts, keep generations 1–6 frozen and safe alternatives available. Design/evidence: [VARIETY.md](VARIETY.md). Local checks, Pages deployment and live offline/compatibility checks passed; evidence follows below.

Full procedural campaigns are a staged direction now; this queue supersedes the earlier blanket deferral for these specific steps. Roguelite resets/metaprogression remain deferred. Physical iPhone checks still require the real device and remain explicitly pending; they do not block independent implementation.

## Implemented

| Milestone                 | Result / evidence                                                                                                                                                            |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Initial exploration game  | Far Wake: four systems, sixteen locations, surveys/sites, resources, maintenance, stations, contracts, factions, encounters, recovery and original pixel console. `9b68cdf`. |
| Reusable core             | Deterministic engine, seeded definitions, portable state/save contracts; Victorian integration fixture and later Hollowmere consumer.                                        |
| Reliable browser play     | Local checkpoint/backup/export/import, 24-hour catch-up, single-writer coordination, offline PWA, mobile/desktop browser coverage.                                           |
| Interstellar usability    | Route explanation followed by departure from any location in a charted connected system. `2af0c8c`, `8c287b1`.                                                               |
| QA corrections            | Failed save replacement protections, outcome-based mission accounting, touch explanations and crew reassignment checks. `e6756a8`.                                           |
| Crew and internal threats | Recruitment, accommodation upgrades, skills, medical support, memorials, optional stowaway and recovery. `f5806a0`.                                                          |
| Separate fantasy game     | Hollowmere, meaningful fighter/mage/cleric/scout composition, forest/ruin exploration and the White Guest using shared mechanics. `f5806a0`.                                 |
| Casualty/job consistency  | Committed journeys survive threat-caused crew changes. `8e9d33b`.                                                                                                            |
| Multi-game library        | Root Play/Resume cards, separate game URLs, return links, stable old saves and Far Wake installation identity. v0.2.1, `f6f375b`.                                            |

The v0.2.1 baseline passed 67 unit tests, 60 browser cases and 6 production offline cases. Published library navigation, both games, resume labels and offline navigation were also checked with iPhone WebKit emulation. This is historical evidence, not a claim that later changes are verified automatically.

## Implemented in v0.4: generated names

Both settings generate initial/recruit crew, factions, regions and location names from larger themed vocabularies. Identity-based narrative references keep briefs and choices consistent. Generation-1 saves retain original names and future recruit selection; new expeditions use generation 2. Naming streams do not affect events or combat. [NAMES.md](NAMES.md) records the versioning contract, fixtures and later conditional-generation possibilities. Full procedural geography and missions remain deferred. Validation: 90 unit tests, 69 browser cases, 8 production offline cases, and unchanged frontier outcomes across eight seeds. Physical iPhone checks remain pending.

Site delivery: commit `91f2e59`; [Pages workflow](https://github.com/rayners/explorer/actions/runs/40637906138) succeeded. Live iPhone WebKit checks passed for both games, including selected-site catch-up and offline exact-once rewards.

## Implemented in v0.5: generated sites

Both games have weighted site origins, conditions, opportunities and complications; direct, cautious and optional specialist approaches affect costs, effort, returns and ordinary incident risk. Surveys reveal selectable registries; chosen sites complete once and out of order. Generation 3 retains v2 names while generations 1/2 keep old sites and exact committed-job outcomes. Site-context discovery weights vary opportunities. The simulator sells surplus stock before resupply and all eight seeds stay under 200 minutes. Validation: 100 unit tests, 72 browser cases and 10 production offline cases; physical-device checks remain pending. See [SITES.md](SITES.md).

## Implemented in v0.6: missions from discoveries

Generation-3 site traits derive one optional follow-up contract and field-work activity per site in both games. Actual exploration unlocks the offer; hub acceptance enables role/cost/location-checked work, followed by hub filing for one payment and standing change. Completed work cannot be released or repeated. Existing generation-3 saves gain offers without changing sites or committed jobs; generations 1/2 remain unchanged. See [MISSIONS.md](MISSIONS.md).

Validation: 110 unit tests, 75 browser cases and 14 production offline cases. Released-v0.5 job fixtures verify exact compatibility; site/name/catalog fixtures guard identities. Physical-device acceptance remains pending.

## Required manual validation still pending

Run [ACCEPTANCE.md](ACCEPTANCE.md) on the physical iPhone 15 Pro Max, especially suspension/force-close, Add to Home Screen, separate game installation and upgrade of an existing root-launch Far Wake icon. Emulated WebKit coverage does not close these items.

## Implemented in v0.3: surprise and lasting events

The user wants surprise shipboard intrusions sometimes and is interested in random events with long-term consequences. [EVENTS.md](EVENTS.md) records the approved first slice: silent stowaways from ordinary exploration and a recovered settlement claim with a station-based faction choice. The shared selector uses seeded RNG, introductory protection, cooldown and a durable once-only ledger. Schema 3 migrates existing saves without rerolling past sites. Additional event types remain candidates.

Validation for v0.3: 82 unit tests, 66 browser cases and 8 production offline cases; frontier simulation completes all eight baseline seeds. The final compact reminder flow also has targeted browser coverage. Physical-device checks remain pending.

This can precede a procedural galaxy; full procedural campaigns and roguelite progression remain deferred.

## Deferred at the user's request

- Roguelite-scale procedural campaigns beyond the active staged queue; sites, discovery-derived missions and layouts are delivered; proficiency and lasting opportunities are delivered.
- Roguelite run boundaries, loss/recovery policy and any persistent progression.

Before implementation, settle generation-version compatibility, stable instance identity, saved generated content, guaranteed reachability and recoverability. Define how a new run differs from import/reset and what survives. No reset currency, unlock ladder or permadeath campaign has been approved.

## Possible extensions, not committed work

- Richer crew progression, additional ships and accommodation choices.
- More faction politics, mission variety and discovery consequences.
- More scenes and event-specific art.
- Additional settings built on the engine.

These are possibilities from the design notes. Do not import clicker's Boardroom, act pacing, prestige, telemetry or game queue as explorer requirements. Design requested changes in writing before implementing them, keeping the game casual and the engine setting-independent.

Mission delivery: commit `4e1ba25`; [Pages workflow](https://github.com/rayners/explorer/actions/runs/40640654891) succeeded. Canonical live game URLs passed iPhone WebKit checks for offline work receipts and one-time filing/payment in both themes. Query-string offline navigation exposed a separate service-worker issue addressed in v0.7.

## Implemented in v0.7: generated layouts

Fresh generation-4 expeditions vary region/place counts and travel graphs while protecting first journeys, all authored mission targets, local hubs and recovery. Both charts draw actual links and dynamic counts; Hollowmere explains multi-leg time/cost. Generations 1–3 retain exact full-definition fixtures. Query-string game URLs keep their theme offline. See [WORLDS.md](WORLDS.md); validation passed 120 unit tests, 78 browser cases and 16 production offline cases, plus both campaign simulators. [Pages workflow](https://github.com/rayners/explorer/actions/runs/40642900647) succeeded for `fc5a4f0` (following layout commit `2715c97`). Live iPhone WebKit checks passed for both themes and generations 3/4, including actual chart links, tagged offline URLs and exact-once arrival.

## Implemented in v0.8: proficiency and lasting opportunities

Living matching specialists earn bounded practice through completed work; Practiced/Veteran tiers improve their specialty. Paid activities survive crew loss and grant no practice to memorials or replacements. New generation-5 expeditions add stable-identity rescue and knowledge decisions in both settings; accommodation, neutral alternatives, one-time effects and safe absence remain enforced. Schema 4 migrates existing saves without changing paid terms; generations 1–4 retain full catalogs. Design/evidence: [CREW.md](CREW.md). Local validation: 133 unit tests, 81 browser cases, 18 production offline cases, frozen generation-1–5 catalogs and both campaign simulators pass. [Pages workflow](https://github.com/rayners/explorer/actions/runs/40690435083) succeeded for `c538a6f`. Live iPhone WebKit verified both choices in both themes, real schema-3 migration, offline practice and durable exact-once receipts. A subsequent preparation test freezes 11 generation-5 responses for project work.

## Implemented in v0.9: discovery-driven faction projects

Eleven themed response branches generate optional commissions at actual discovery sources. A matching settled choice is required for visibility, acceptance and save validation. Work requires the displayed specialist/supplies, retains paid terms, completes once and pays only at hub filing. New generation-6 expeditions reuse frozen geography/names/sites; older catalogs remain intact. Discovery previews explain the resulting patron/project, and briefs show origin and preparation. See [PROJECTS.md](PROJECTS.md). Local validation passed 138 unit tests, 84 browser cases, 22 production offline cases, typecheck/Pages build and both campaign simulators. Mobile project briefs were visually inspected. Physical iPhone acceptance remains pending.

Project delivery: commit `89306ad`; [Pages workflow](https://github.com/rayners/explorer/actions/runs/40695337794) succeeded (84 browser cases and 22 production offline cases). Live iPhone WebKit checks passed for fresh generation-6 defaults, project completion and one-time filing offline in both themes, released generation-5 settled-choice/paid-work compatibility, and the library routes. The local suite passed all 138 unit tests and both campaign simulators. These checks do not replace pending physical iPhone acceptance.

## Implemented in v0.10: expedition planning

Both games surface unlocked faction projects before ordinary board offers and expose active discovery work/receipts through a shared summary. Preparation compares stock, travel/work/return supplies and living assigned specialists, while committed work retains its paid terms. Contract route actions open the correct region with focused multi-leg previews and explicit next-leg orders. Completed receipts guide return to a known hub and filing. This is a shared UI improvement for existing saves; all generations 1–6, state schema 4 and envelope 1 remain unchanged. Design and checks: [PLANNING.md](PLANNING.md). Local checks passed: 143 unit tests, 90 browser cases, 24 production offline cases, typecheck and Pages-base build. Published live verification passed; physical iPhone acceptance remains pending.

## Implemented in v0.11: discovery and mission variety

New generation 7 retains previous geography/names/sites and adds three discoveries per theme with material, personnel, knowledge and faction consequences. Twelve distinct source-bound commissions include four support field jobs and three mixed-team preparations. Original defaults/paid jobs remain frozen; state schema 4/envelope 1 stay unchanged. Captured generation-6 paid-project saves and generation-7 full-definition fixtures guard compatibility. Both campaign simulators pass. Design: [VARIETY.md](VARIETY.md). Local checks passed: 150 unit tests, 96 browser cases, 28 production offline cases, typecheck/Pages build and both campaign simulators. Published live verification passed; physical iPhone acceptance remains pending.

Later design candidate, not an approved specification: contextual discovery selection, using site traits and expedition history to vary the mix of event families and useful clues. Define bounded weights, onboarding protection and version compatibility before changing the generator. Full procedural campaigns, roguelite progression and autonomous factions remain deferred.

The user-requested [independent design review](reviews/DESIGN-REVIEW-2026-10-28.md) recommends auditing expedition value and session cadence before further content expansion, then prototyping one visible changed-place consequence per theme. These are review proposals; this note does not approve them or replace the implementation queue. The review includes evidence, limitations and theme-specific findings.

The follow-up [visual design review](reviews/VISUAL-DESIGN-REVIEW-2026-10-28.md) examines desktop and phone presentation, with retained screenshots and explicit browser-emulation limits. Its typography, hierarchy and responsive-layout recommendations are also proposals, not an approved implementation slice.

Planning delivery: feature `1e7d9e6`; [Pages workflow](https://github.com/rayners/explorer/actions/runs/40704011179) succeeded. Published iPhone WebKit verified old/current discovery contracts, offline return planning, explicit departure, durable saves, current project visibility/preparation/source routes and library navigation in both themes. Lockfile-only correction `e340498` restores dependency labels to their existing downloaded versions. See [PLANNING.md](PLANNING.md); physical iPhone acceptance remains pending.

Variety delivery: `245124a`; [Pages workflow](https://github.com/rayners/explorer/actions/runs/40722555654) succeeded. Published iPhone WebKit verified fresh generation-7 defaults, all six new discovery interfaces with durable offline effects, parallel primary/support completion and single filing in both themes, released generation-6 paid outcomes and the library. Physical iPhone acceptance remains pending; local totals are 150 unit tests, 96 browser cases and 28 production offline cases, with both campaign simulators passing.
