# Roadmap and status

Baseline: v0.3.0, 2026-10-28. This is a status and design queue, not a release schedule. Requirements and rationale live in [REQUIREMENTS.md](REQUIREMENTS.md) and [DECISIONS.md](DECISIONS.md).

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

## Required manual validation still pending

Run [ACCEPTANCE.md](ACCEPTANCE.md) on the physical iPhone 15 Pro Max, especially suspension/force-close, Add to Home Screen, separate game installation and upgrade of an existing root-launch Far Wake icon. Emulated WebKit coverage does not close these items.

## Implemented in v0.3: surprise and lasting events

The user wants surprise shipboard intrusions sometimes and is interested in random events with long-term consequences. [EVENTS.md](EVENTS.md) records the approved first slice: silent stowaways from ordinary exploration and a recovered settlement claim with a station-based faction choice. The shared selector uses seeded RNG, introductory protection, cooldown and a durable once-only ledger. Schema 3 migrates existing saves without rerolling past sites. Additional event types remain candidates.

Validation for v0.3: 82 unit tests, 66 browser cases and 8 production offline cases; frontier simulation completes all eight baseline seeds. The final compact reminder flow also has targeted browser coverage. Physical-device checks remain pending.

This can precede a procedural galaxy; full procedural campaigns and roguelite progression remain deferred.

## Deferred at the user's request

- Procedural systems, celestial bodies, routes and missions beyond seeded detail variation.
- Roguelite run boundaries, loss/recovery policy and any persistent progression.

Before implementation, settle generation-version compatibility, stable instance identity, saved generated content, guaranteed reachability and recoverability. Define how a new run differs from import/reset and what survives. No reset currency, unlock ladder or permadeath campaign has been approved.

## Possible extensions, not committed work

- Richer crew progression, additional ships and accommodation choices.
- More faction politics, mission variety and discovery consequences.
- More scenes and event-specific art.
- Additional settings built on the engine.

These are possibilities from the design notes. Do not import clicker's Boardroom, act pacing, prestige, telemetry or game queue as explorer requirements. Design requested changes in writing before implementing them, keeping the game casual and the engine setting-independent.
