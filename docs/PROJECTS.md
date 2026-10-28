# Faction projects shaped by discovery choices

Implemented for v0.9 on 2026-10-28 after crew proficiency and lasting opportunities. It follows the user's ongoing instruction to work through and extend the roadmap, and the original interest in indirect faction engagements. Exact project structures are implementation choices; no territory simulation or roguelite system is implied.

## Goal

A political or personnel discovery should influence later work, rather than ending with its immediate payment or standing change. Generate optional faction projects from the expedition's actual settled discovery and source site. Different responses should lead to different patrons, preparations and work, while preserving a neutral/recovery path and readable consequences.

## Implemented first slice

Implement in both themes using the existing accepted-field-work and one-time hub-filing loop. Begin with Far Wake's settlement charter and engineering/rescue records, and Hollowmere's pathfinder/lore records. A faction-backed report, material relief effort or technical/ritual restoration should have a concrete source location, role/supply requirements and patron. Branches differ in their field work, costs and recipient, rather than only their names. All remain optional.

Surveying a site is insufficient. The relevant incident must have occurred at that exact site and been settled with the matching response. Show its resulting project only then, at a hub; record the link to the original decision in its brief. Acceptance, primary/support staffing, paid duration/cost, retained completion receipts and single filing use existing mechanisms. Releasing unstarted work is allowed; committed/completed work retains the existing anti-replay protection.

Start with one bounded follow-up per qualifying settled incident; avoid multiplying visible boards with every theoretical branch. No repeated event roll, mission expiry, passive faction attack, mandatory hostile standing or resource drain is introduced. Existing station work, markets, emergency recruitment, threat purge and recovery remain available. Explain the patron, required work and standing reward before accepting. Optional specialist paths must not obstruct the introductory journey.

## Catalog and state contract

The implementation uses deterministic definitions over possible source sites, with stable IDs such as `project:<site>:<incident>:<choice>`. A typed mission prerequisite identifies the incident, choice and source site; the engine reads the durable incident ledger to determine availability. This permits state-dependent offers without per-render random generation or arbitrary callbacks. Only the existing accepted mission IDs/progress and ordinary committed jobs are saved. State schema remains 4 and envelope remains 1; no migration is needed. Save validation uses the same exact-ledger prerequisite as visibility and acceptance.

The project generator lives at the engine/content boundary with separate setting recipes for event IDs, factions, roles, writing, costs and work profiles. It must not branch on game ID. Fresh expeditions default to generation 6 for the expanded catalog while retaining generation-1–5 definitions; preserve v4 topology, v2 names and v3 sites. Existing expeditions remain playable with their original catalogs. Full procedural campaigns, dynamic unbounded mission instances and roguelite progression stay deferred.

Gate both offer visibility and acceptance. Validate accepted project references against the actual saved incident/response/source. Work dispatch still requires the accepted unfinished contract at its source. A project cannot grant immediate rewards, count as a combat victory, or pay more than once through abandonment, reload, offline completion or import. Preserve paid work through roster changes.

## Verification contract

1. Capture generation-5 saves containing all relevant settled discovery responses, with their source references and committed work, before changing the generator.
2. Add and test typed discovery prerequisites: hidden before response, exact-site/choice matching, acceptance rejection, malformed save references, old-catalog compatibility and portable definitions.
3. Generate themed project branches with distinct measurable work/resource/role/patron outcomes. Check every source/resource/faction/activity reference and freeze new IDs/catalog fixtures.
4. Complete both browser flows: discovery response → project briefing → hub acceptance → actual field work → reload/offline completion → one-time filing. Check full active-contract limits and visible unavailable reasons.
5. Run unit/type/build/browser/offline checks and both campaign simulators; inspect phone/tablet/desktop layouts. Publish and verify affected live routes. Physical iPhone checks remain explicitly pending until performed on the device.

This design is the next bounded step toward a campaign shaped by exploration history. Broader diplomacy, autonomous factions, territory, personal obligations and ships remain separate candidates.

## Preparation evidence

`tests/fixtures/generation5-before-projects.json` captures 11 validated saves from released v0.8 commit `c538a6f`: all settlement-charter, survivor and knowledge responses relevant to both themes, with actual source site/incident/choice identities and a paid station job. `tests/projects-compatibility.test.ts` verifies the saved response/source and exact completion state. Keep these fixtures unchanged when adding project offers; generation-5 catalogs and receipts remain a compatibility contract.

## Branches and preparation

All work uses the primary expedition team, requires one matching living specialist, costs supplies on dispatch and pays nothing until filed. Durations below are base real seconds, before existing crew/condition modifiers. Standing is awarded to the named patron on filing. Generated faction/place names resolve from stable IDs.

| Theme / settled choice           | Patron ID   | Field work / skill               | Base seconds | Supply cost                   | Filing reward / standing  |
| -------------------------------- | ----------- | -------------------------------- | ------------ | ----------------------------- | ------------------------- |
| Far Wake / charter company       | combine     | Concession beacons / engineering | 110          | 4 parts, 1 provisions         | 280 credits / +10         |
| Far Wake / charter commons       | independent | Communal reserve / security      | 95           | 5 provisions, 2 ammo          | 240 credits, 2 fuel / +12 |
| Far Wake / charter archive       | independent | Charter verification / survey    | 80           | 2 provisions                  | 160 credits / +6          |
| Far Wake / survivor join         | combine     | Cryopod telemetry / engineering  | 100          | 2 parts, 2 provisions         | 230 credits / +7          |
| Far Wake / survivor resettle     | independent | Rescue approaches / survey       | 85           | 3 provisions                  | 190 credits, 1 fuel / +10 |
| Far Wake / knowledge study       | combine     | Repair trial / engineering       | 120          | 4 parts                       | 260 credits, 1 parts / +8 |
| Far Wake / knowledge release     | independent | Public service cache / security  | 90           | 2 parts, 3 provisions, 1 ammo | 220 credits / +11         |
| Hollowmere / pathfinder join     | covenant    | Shelter consecration / cleric    | 105          | 3 incense, 2 herbs            | 220 gold / +9             |
| Hollowmere / pathfinder resettle | wardens     | Wayfarer caches / fighter        | 90           | 4 rations, 3 wood             | 200 gold, 1 herbs / +11   |
| Hollowmere / lore study          | court       | Elder ward trial / mage          | 120          | 4 incense, 1 rations          | 250 gold / +8             |
| Hollowmere / lore release        | wardens     | Boundary markers / fighter       | 85           | 2 wood, 3 rations, 1 bolts    | 210 gold / +11            |

These are optional faction commissions. Recruiting a survivor does not obligate that person personally or guarantee their participation: the living matching expedition specialists do the work. A cleric initially assigned to support must be reassigned for the consecration; existing assignment checks remain authoritative. A neutral charter filing endorses no property owner and its later verification is optional.

`engine/project-generation.ts` builds bounded definitions; `content/projects.ts` appends only at generation 6, after frozen opportunities. Themed `projects.ts` files own all roles, factions, writing and economics. `MissionDef.discoveryChoice` stores incident/choice IDs beside `sourceSite`; no state field is added. `missionDiscovered` matches the ledger ID, settled choice, site, site location and actual exploration. `save.ts` already calls it for every accepted/completed/filed mission, rejecting forged branch/source references.

Discovery response cards preview the optional project and patron. Contract briefs identify the original response, source, patron, real preparation cost, specialist and standing. Only matching projects appear; maximum three active contracts and standing below −40 refusal apply. New expeditions get projects; generations 1–5 keep their catalogs and are not silently upgraded. Back up/export an existing expedition before using Settings to start a fresh one.

`tests/projects.test.ts` exercises all 11 branches, exact-site/choice gating, malformed saves, costs, specialists, acceptance limits, release protection, offline completion and single filing. `tests/fixtures/worlds-v6.json` freezes full definitions across six seeds per theme; all older full-definition and paid-job fixtures remain unchanged. Browser coverage runs the discovery decision, acceptance, actual outbound/return travel, work, reload and filing in both games on desktop Chromium, iPhone WebKit and tablet WebKit. Production offline coverage checks pending work and separate completed receipts in both themes. Physical-device steps remain pending in [ACCEPTANCE.md](ACCEPTANCE.md).

## Delivery evidence

Released in `89306ad` through successful [Pages workflow 40695337794](https://github.com/rayners/explorer/actions/runs/40695337794). Validation: 138 unit tests, 84 browser cases, 22 production offline cases, Pages-base build and both campaign simulators. Published iPhone WebKit checks verified fresh generation-6 defaults, both games’ offline completion/filing receipts, released generation-5 paid-work/choice compatibility and library routes. Physical iPhone Safari/Home Screen checks remain pending.

## Finding and preparing projects (v0.10)

A shared discovery-work summary exposes unlocked projects, active field work and receipts. Eligible unaccepted faction projects appear before ordinary board offers in both games. Their briefs show stock/assignment gaps and known outbound/work/return supply estimates, plus source/hub route actions. This UI applies to existing generation-6 projects without changing definitions, choices or payment. Older discovery contracts get the same preparation/receipt guidance. See [PLANNING.md](PLANNING.md).
