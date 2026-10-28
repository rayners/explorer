# Crew development and lasting opportunities

Next roadmap item, design started 2026-10-28 after generation-4 layouts. This is the implementation plan for the next slice; none of the mechanics below are shipped in v0.7. The active roadmap authorizes work on lasting events and crew development; exact rules here are implementation choices.

## Goal

Give an expedition a lasting personnel history through useful work and occasional discoveries. Preserve meaningful specialties, accommodation, safe absence and recoverability. Begin with bounded proficiency in a member's existing specialty, a rescued specialist opportunity, and a knowledge discovery that can improve the company. Avoid creating another resource-drain timer or a mandatory roster grind.

## Planned crew proficiency

A member earns one experience point when completing an activity that uses their specialty while they participate on that activity's assigned team. Primary and support work both count; resting members, unrelated specialties and dead members do not. Travel, rescue, idle time and rendering award nothing. No automatic repeating work is added. Injury does not erase experience. Memorial records retain it.

Commit eligible participant IDs when dispatching an activity. Credit only surviving committed participants once, at completion. A casualty must not invalidate a paid order; a later replacement must not inherit its credit. Experience gained by finishing one concurrent order must not alter another already committed order's time/reward/risk. Activities that do not involve a specialist remain available under their existing rules.

Cap experience at 30. At 4 points a member gains +0.03 skill contribution; at 12 points it becomes +0.06. This adds to the current 0.18 healthy contribution, or 0.06 while injured, and combines with existing equipment upgrades. It affects the engine's existing skill calculations rather than adding game-specific checks. UI labels can describe these tiers as Practiced and Veteran, showing points, the next threshold and the actual bonus. Existing role/headcount requirements remain; proficiency never turns a mage into a fighter or bypasses accommodation.

These bounds keep basic recruitment useful and progression optional. Evaluate campaign pacing before release; adjust the planned thresholds before they become a published save/balance contract. Do not promise exact numerical balance from this planning document alone.

## Planned discovery opportunities

Both settings should use the existing once-only site-event selector and durable incident ledger. Keep introductory protection, cooldown, pending-choice suppression, seeded outcome randomness and explicit confirmation. Discoveries wait without expiring or killing anyone while away.

1. **Survivor / lost specialist.** Exploration finds a stranded person. At a service hub, offer a berth/place using the existing role, generated name sequence, serial and accommodation checks, or help them resettle for a smaller standing benefit. A full roster produces a visible reason and allows waiting for an upgrade or selecting resettlement. Joining starts resting; no automatic assignment or capacity bypass. Keep the new person's identity stable through reload and choice preview. Never spend a name serial on an uncommitted preview or failed choice.
2. **Recovered methods / forgotten instruction.** Exploration recovers useful technical or ritual knowledge. At a hub, retain it to train living specialists (bounded experience), or release it to a faction for payment/standing. Show exactly who would benefit and what changes before confirmation; allow a useful alternative when no matching specialist is present. Apply the chosen effect once and retain a durable history entry.

Far Wake supplies its rescue/technical fiction, resource/faction/role IDs and source eligibility. Hollowmere supplies its ally/lore equivalents and its first random opportunity catalog. This does not make its optional curse a surprise trigger; keep that as an independent future decision. No new event inflicts permanent loss or an unrecoverable subsystem penalty.

## Engine and version plan

Use typed effects in the discovery content contract: a recruitment offer reference and a bounded training effect, with normal precondition validation. Do not add arbitrary state-mutation callbacks or branch on setting IDs. Choice preview and dispatch must share validation, including capacity, archive limit, living eligibility, costs if any, and pending-choice identity. Resource/standing effects retain their existing accounting.

Experience and committed activity participants change saved shape. Plan state schema 4 with checksum-first migrations from schemas 1/2/3; envelope stays 1, browser namespaces/manifests remain stable. Migration initializes experience to zero and infers eligible participants for paid legacy activity jobs from the current roster without changing any timer, return, risk, destination or RNG state. Preserve any valid memorials, threats, discoveries, accepted work and event receipts. Validate finite bounded integer experience and unique known participant IDs; casualties remain valid committed references.

Keep content generation separate from state schema. New event catalogs require generation 5 for fresh expeditions; preserve generation-1/2/3/4 definitions exactly. Generation 5 should reuse the frozen generation-4 layout algorithm and v2 names/v3 sites, then add the new discovery recipes. Existing expeditions can gain ordinary proficiency through migrated state without rerolling their maps or altering already committed jobs; the new event opportunities belong to the new catalog. This boundary must be verified with released fixtures before code changes and documented if implementation evidence requires a different approach.

## Implementation order and acceptance

1. Capture released schema-3 saves with simultaneous paid primary/support work in both themes, plus completed follow-up receipts and casualty records. Preserve generation-4 complete-definition fixtures.
2. Add schema migration/validation and committed participant accounting, then skill contribution and roster UI. Test exact-once completion, failed commands, frame/offline equivalence, injuries, casualties, new hires and parallel jobs.
3. Add typed discovery recruitment/training validation and effects. Test full accommodation, stable preview/name serial, neutral alternatives, pending choices, repeated responses and history survival beyond the narrative-log cap.
4. Add versioned themed event catalogs and shared UI in both games, then complete browser/offline journeys through discovery, hub response, roster change/proficiency and reload/import.
5. Run both campaign simulators, all required checks and inspect mobile layouts. Publish and verify live routes. Keep physical iPhone checks explicitly pending until performed on the device.

Later possibilities include personal traits, obligations, faction-sponsored development, repair projects and additional ships. They remain candidates rather than requirements for this slice. Roguelite resets and metaprogression remain deferred.

## Preparation evidence

`tests/fixtures/schema3-before-proficiency.json` captures eight valid schema-3 saves directly from commit `fc5a4f0`, before any proficiency implementation: generations 3/4 in both themes, simultaneous paid primary/support work, an injured participating specialist and a retained casualty. Four scenarios retain parallel work; four retain completed or already filed discovery-contract receipts. Each includes the old engine's exact completion state. `tests/proficiency-compatibility.test.ts` verifies the baseline before migration. Migration work must preserve paid job fields/outcomes while initializing new personnel data; do not overwrite these expected legacy outcomes to hide a change.
