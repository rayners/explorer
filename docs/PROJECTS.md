# Faction projects shaped by discovery choices

Next roadmap design, started 2026-10-28 after crew proficiency and lasting opportunities. This is a plan, not shipped behavior. It follows the user's ongoing instruction to work through and extend the roadmap, and the original interest in indirect faction engagements. Exact project structures are implementation choices; no territory simulation or roguelite system is implied.

## Goal

A political or personnel discovery should influence later work, rather than ending with its immediate payment or standing change. Generate optional faction projects from the expedition's actual settled discovery and source site. Different responses should lead to different patrons, preparations and work, while preserving a neutral/recovery path and readable consequences.

## First slice

Implement in both themes using the existing accepted-field-work and one-time hub-filing loop. Begin with Far Wake's settlement charter and engineering/rescue records, and Hollowmere's pathfinder/lore records. A faction-backed report, material relief effort or technical/ritual restoration should have a concrete source location, role/supply requirements and patron. Branches differ in their field work, costs and recipient, rather than only their names. All remain optional.

Surveying a site is insufficient. The relevant incident must have occurred at that exact site and been settled with the matching response. Show its resulting project only then, at a hub; record the link to the original decision in its brief. Acceptance, primary/support staffing, paid duration/cost, retained completion receipts and single filing use existing mechanisms. Releasing unstarted work is allowed; committed/completed work retains the existing anti-replay protection.

Start with one bounded follow-up per qualifying settled incident; avoid multiplying visible boards with every theoretical branch. No repeated event roll, mission expiry, passive faction attack, mandatory hostile standing or resource drain is introduced. Existing station work, markets, emergency recruitment, threat purge and recovery remain available. Explain the patron, required work and standing reward before accepting. Optional specialist paths must not obstruct the introductory journey.

## Catalog and state plan

Use deterministic definitions over possible source sites, with stable IDs such as `project:<site>:<incident>:<choice>`. A typed mission prerequisite identifies the incident, choice and source site; the engine reads the durable incident ledger to determine availability. This permits state-dependent offers without per-render random generation or arbitrary callbacks. Save only the existing accepted mission IDs/progress and ordinary committed jobs; assess validation before deciding that no new state schema is needed.

Add the project generator in the engine/content boundary with separate setting recipes for event IDs, factions, roles, writing, costs and work profiles. It must not branch on game ID. Use generation 6 for the expanded catalog while retaining generation-1–5 definitions; preserve v4 topology, v2 names and v3 sites. Existing expeditions remain playable with their original catalogs. Full procedural campaigns, dynamic unbounded mission instances and roguelite progression stay deferred.

Gate both offer visibility and acceptance. Validate accepted project references against the actual saved incident/response/source. Work dispatch still requires the accepted unfinished contract at its source. A project cannot grant immediate rewards, count as a combat victory, or pay more than once through abandonment, reload, offline completion or import. Preserve paid work through roster changes.

## Implementation and acceptance

1. Capture generation-5 saves containing all relevant settled discovery responses, with their source references and committed work, before changing the generator.
2. Add and test typed discovery prerequisites: hidden before response, exact-site/choice matching, acceptance rejection, malformed save references, old-catalog compatibility and portable definitions.
3. Generate themed project branches with distinct measurable work/resource/role/patron outcomes. Check every source/resource/faction/activity reference and freeze new IDs/catalog fixtures.
4. Complete both browser flows: discovery response → project briefing → hub acceptance → actual field work → reload/offline completion → one-time filing. Check full active-contract limits and visible unavailable reasons.
5. Run unit/type/build/browser/offline checks and both campaign simulators; inspect phone/tablet/desktop layouts. Publish and verify affected live routes. Physical iPhone checks remain explicitly pending until performed on the device.

This design is the next bounded step toward a campaign shaped by exploration history. Broader diplomacy, autonomous factions, territory, personal obligations and ships remain separate candidates.

## Preparation evidence

`tests/fixtures/generation5-before-projects.json` captures 11 validated saves from released v0.8 commit `c538a6f`: all settlement-charter, survivor and knowledge responses relevant to both themes, with actual source site/incident/choice identities and a paid station job. `tests/projects-compatibility.test.ts` verifies the saved response/source and exact completion state. Keep these fixtures unchanged when adding project offers; generation-5 catalogs and receipts remain a compatibility contract.
