# Crew proficiency and lasting opportunities

Implemented for v0.8, 2026-10-28, after generated layouts. Delivery status is in [ROADMAP.md](ROADMAP.md). The ongoing roadmap authorizes lasting events and crew development; the exact rules below are implementation choices.

## Goal

Give an expedition a lasting personnel history through useful work and occasional discoveries. Preserve meaningful specialties, accommodation, safe absence and recovery. Proficiency improves a member's existing specialty; rescue and knowledge discoveries offer lasting benefits or faction alternatives. No automatic work queue, resource-drain timer or mandatory roster grind is added.

## Proficiency

A member earns one practice point when completing an activity that uses their specialty on their assigned team. Primary and support work count; resting members, unrelated specialties and dead members do not. Travel, rescue, idle time and rendering award nothing. Injury does not erase points. Memorials retain them.

Activity dispatch records eligible participant IDs, including the activity specialty and explicit role requirements on that team for the chosen site approach. Completion credits only surviving committed participants once. A casualty does not invalidate a paid order, and a later hire receives no credit for it. All paid activities, as well as journeys, now survive losing a team's last member. New orders still require living staff. Progress or training never recomputes another order's committed time, reward, risk or destination.

Practice is capped at 30. At 4 points a member becomes Practiced, adding 0.03 to their skill contribution; at 12 points they become Veteran, adding 0.06. This combines with the existing 0.18 healthy/0.06 injured contribution and equipment upgrades. The engine's existing specialty calculations use the bonus for work, gathering and applicable combat/threat checks. Existing role/headcount requirements remain; a veteran mage cannot replace a required fighter. Roster rows show points, the next threshold and actual specialty bonus; help explains earning it. Memorials retain the final record.

## Discovery opportunities

New generation-5 expeditions receive two additional once-only opportunities per theme. Both use the existing selector, durable ledger, introductory protection, two-site cooldown and pending-choice suppression. Choices wait without expiring and do not interrupt ordinary travel/work. Responses require a service hub and explicit confirmation.

| Opportunity         | Far Wake                                            | Hollowmere                                      | Choices                                                                                                                    |
| ------------------- | --------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Stranded specialist | A berth outside the manifest: a cryopod engineer    | The lantern beyond the trees: a lost pathfinder | Join free, resting, using one accommodation place; or resettle for 70 currency and +8 local allied-faction standing        |
| Recovered knowledge | Maintenance beyond the manual: engineering practice | Annotations in the old tongue: mage practice    | Add 4 points to each living matching specialist, capped at 30; or release for 120 currency and +10 allied-faction standing |

A full roster gives a visible reason to wait for accommodation or choose resettlement. Capped/absent specialists give a visible training reason and a useful release alternative. Resting or working members may receive knowledge training; dead members cannot. Choices preview the joining person's name/role or each trainee's before/after points. No new opportunity causes permanent loss, creates a surprise curse or bypasses capacity. Hollowmere's explicit White Guest investigation remains separate.

Far Wake keeps its 35% eligible-site event chance; its expanded catalog has four event IDs, with existing site-context weights. Hollowmere's first random opportunity catalog uses 30%. Both protect every introductory-location site and require at least four total explored sites. Quiet returns remain possible; neither game guarantees every opportunity. A pending event or active threat suppresses another selection, and each ID occurs once. Older catalogs keep their original probabilities, eligibility and event IDs.

## Stable survivor identity

A committed rescue discovery reserves one recruitment serial at onset and stores it in its incident record. This is an actual discovery transition, not a preview or failed command. Other hires skip that serial, so the survivor's generated name stays stable through reloads, purchases and upgrades. Joining uses the reserved serial without consuming another; resettlement leaves the reservation unused. Preview and joining use the same seeded name function. Roster archive/serial limits remain enforced.

Shared recruitment checks handle service hubs, accommodation, emergency eligibility and archive limits. The response creates an ordinary resting recruit using its referenced offer, with no fee. A response receipt must match the resulting member's serial/offer; pending/resettled reservations cannot already have been used by another hire. Duplicate or invented reservations fail import validation.

## Engine and persistence

- `src/engine/proficiency.ts`: bounded skill contribution, participant selection and once-only completion credit.
- `Member.experience`: required numeric integer 0–30 in running schema-4 states; optional in the definition type so frozen initial catalogs remain unchanged.
- `Job.participants`: required unique matching-specialist IDs for activity jobs; absent for journeys/recovery. Casualties remain valid committed references.
- `DiscoveryChoice.recruit` / `.training`: typed offer reference or bounded skill/point grant. No arbitrary mutation callback or setting-ID branch.
- `IncidentRecord.recruitSerial`: required for rescue opportunities and checked against the roster, serial counter and durable choice receipt.
- Themed `opportunities.ts` data and `content/opportunities.ts` build generation-5 catalogs; shared panels preview effects in both games.

State schema 4 verifies the original checksum, migrates schemas 1/2 to 3 as before, validates schema 3 before adding fields, initializes all experience to zero and infers activity-specialty/requirement participants for paid legacy activities from the current roster. Old saves did not store an approach ID, so migration conservatively credits the base activity roles; new orders also commit chosen-approach specialists. It preserves old timers, costs, returns, risk, destinations, RNG state, crew/memorials, threats, discoveries and receipts. No retroactive practice is awarded for historical completed work. Envelope 1, storage namespaces and manifest identities remain stable.

New definitions use generation 5. Generations 1–4 retain exact full-definition fixtures. Generation 5 reuses frozen v4 layouts, v2 naming and v3 sites/contracts, then adds opportunities. Existing expeditions gain ordinary proficiency through state migration without rerolling maps; the expanded event catalog belongs to new generation-5 expeditions. Vocabulary or generator changes require another compatible version.

## Verification and evidence

`tests/fixtures/schema3-before-proficiency.json` captures eight valid schema-3 scenarios from `fc5a4f0`: generations 3/4 in both themes, four simultaneous paid primary/support orders with injury/memorials, and four completed/filed discovery-contract receipts. Compatibility tests compare every old field while excluding only schema version, experience and participant additions; they separately verify zero initialization and correct first completion credit. Frozen full catalogs guard generations 1–5.

Behavior tests cover thresholds/caps, actual specialty contribution, injured/dead/resting members, committed participants, parallel/offline exact-once credit, real threat-caused last-member loss, unchanged paid terms, role requirements, failed-command immutability, malformed saves, stable rescue identities through other hiring/upgrades, capacity, resettlement, training alternatives and durable receipts after narrative-log removal.

Browser journeys in both themes cover rescue confirmation/join/reload, knowledge previews/training, actual activity-earned practice and mobile labels. Production offline tests settle both kinds in both games once, including tagged URLs and no development helpers. Frontier simulation remains under 200 minutes (192–196 in eight legacy-map samples). Generated campaigns complete all fields, reach charter goals and preserve safe crews/stock; the bot now replenishes at intermediate hubs instead of chaining crossings through arbitrary field waypoints. Generation-5 Far Wake samples take 160–274 minutes for all 14–20 fields, with ten-survey milestones at 103–136 minutes; Hollowmere takes 47–97 minutes for 6–11 fields.

Physical iPhone acceptance remains pending in [ACCEPTANCE.md](ACCEPTANCE.md). WebKit emulation is not a physical-device result. Personal traits, obligations, repair projects, additional ships and roguelite progression remain future candidates.
