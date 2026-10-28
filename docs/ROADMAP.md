# Roadmap and status

Baseline: v0.7.0, 2026-10-28. This is a status and design queue, not a release schedule. Requirements and rationale live in [REQUIREMENTS.md](REQUIREMENTS.md) and [DECISIONS.md](DECISIONS.md).

## Active implementation queue

User direction (2026-10-28): keep working through the roadmap, recording decisions and moving to the next item after each verified delivery.

1. **Delivered v0.5: generated exploration sites.** Origin, condition, opportunity and complication affect available approaches, costs, rewards and risks in both games. Preserve old generations; design/acceptance: [SITES.md](SITES.md).
2. **Delivered v0.6: missions derived from discoveries.** Create follow-up work from actual explored sites, factions and consequences, with saved identity, clear goals and hub completion. Design and acceptance: [MISSIONS.md](MISSIONS.md).
3. **Implemented; validating delivery: generated system/realm layouts.** Vary topology and bodies/places while guaranteeing reachable service hubs, introductory goals and recovery. Version/persist generated references. Design and acceptance: [WORLDS.md](WORLDS.md). Generation-4 factories, connected graphs, optional regions/places, dynamic charts and actual-graph campaign simulation are implemented.
4. **Queued: broaden lasting events and crew development.** Build on the earlier event candidates; prioritize opportunities and lasting decisions over repeated penalties.

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

- Roguelite-scale procedural campaigns beyond the active staged queue; sites and discovery-derived missions are delivered; layouts are being validated.
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

Fresh generation-4 expeditions vary region/place counts and travel graphs while protecting first journeys, all authored mission targets, local hubs and recovery. Both charts draw actual links and dynamic counts; Hollowmere explains multi-leg time/cost. Generations 1–3 retain exact full-definition fixtures. Query-string game URLs keep their theme offline. See [WORLDS.md](WORLDS.md); validation passed 120 unit tests, 78 browser cases and 16 production offline cases, plus both campaign simulators. Publication/live checks are in progress.
