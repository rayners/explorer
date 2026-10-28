# Discovery and mission variety

Implemented design for v0.11, approved after the user asked to proceed with broader discoveries and missions. Exact encounters, economics and role combinations are implementation choices. Status and delivery evidence belong in [ROADMAP.md](ROADMAP.md).

## Goal and bounded scope

Add three once-only discoveries per theme, each with two explicit responses and an optional source-bound commission. Use existing resource/standing, training and stable-identity recruitment effects. Add real differences in follow-up work through primary/support slots and explicit role combinations, rather than title/payment variants alone.

Far Wake: derelict salvage (recover materials or preserve the wreck), a distress beacon (offer a medic a berth or coordinate relief), and disputed research (train surveyors or release the record). Hollowmere: a haunted shrine (train clerics or preserve its account), a lost caravan (welcome a fighter or arrange safe return), and a dangerous bargain (take a faction-priced material boon or refuse safely). A bargain does not secretly trigger a lethal threat or incur an unannounced recurring obligation.

## Mechanics and safety

- New generation 7 appends these catalogs after generation-6 projects, retaining frozen v4 geography, v2 naming and v3 sites. Generations 1–6 retain exact definitions and paid outcomes. New/reset expeditions use 7; existing expeditions are not silently upgraded.
- Reuse the durable incident ledger, seeded selector, cooldown 2, introductory location exclusion, pending-choice suppression and no-expiry hub decisions. Salvage/caravan require four explored sites, distress/shrine six and research/bargain eight. No new event is guaranteed in every campaign. Existing stowaway/curse safeguards remain unchanged.
- Every discovery has a response that requires no berth, specialty, payment or threat response. Effects and any standing tradeoff are visible before confirming. Recruitment reserves the name serial only at actual onset, including when the safe response is later chosen. Training remains living-only/capped.
- Each settled response exposes one source/incident/choice-bound project. Acceptance, costs on dispatch, completed receipts, single filing, limit three and standing checks remain unchanged. Projects are optional; recovery and ordinary hub work stay available.
- Extend the generic project recipe with optional slot and requirements fields. Defaults preserve the original primary/single-specialty catalog exactly. Use two support field commissions per theme and at least one primary commission requiring a second specialty on support. Requirements use the existing assignment semantics; only committed matching participants on the work team earn practice. Supplying a required other-team role does not silently award it practice.
- Support field jobs occupy the existing support slot, block departure until finished and carry the existing zero incident risk for support work. They are not a second primary expedition. They can run alongside an existing primary order at the same source. Paid jobs survive roster loss and offline completion resolves once. No state/envelope migration is needed.

## Implementation and verification

Theme-owned recipes supply all event IDs, role/resource/faction IDs, writing and branch terms. Shared assembly resolves name references, appends events and generates only the new source-bound projects. The engine never branches on game ID. The work UI must label support/primary and cross-team requirements explicitly and avoid showing bound support work in the generic unaccepted activity list.

Freeze generation-7 full catalogs and capture generation-6 settled-project/paid-job saves before the extension. Verify all twelve branches, actual onset thresholds, safe alternatives, recruitment identity/capacity, capped training, faction tradeoffs, exact prerequisite gating, mixed-role staffing, support-slot dispatch/parallel work/departure lock, no combat credit and one-time filing. Test reload/offline completion in both themes, run both campaign simulators and required unit/type/build/browser/offline checks. Inspect mobile layouts; physical iPhone acceptance stays pending.

## Versioned content and terms

All discoveries wait safely for a hub decision. Every branch is optional and its filing reward is paid only at a hub after actual source-bound work. Durations below are base seconds before existing crew/condition modifiers. Slot and role requirements are shown before acceptance and on accepted work cards.

| Theme / response               | Work and required team                                   | Base seconds | Dispatch cost                 | Filing reward / patron standing             |
| ------------------------------ | -------------------------------------------------------- | ------------ | ----------------------------- | ------------------------------------------- |
| Far Wake / salvage recover     | Hull recovery: expedition engineering + support security | 110          | 2 parts, 2 ammo, 2 provisions | 280 credits, 4 ore / combine +9             |
| Far Wake / salvage preserve    | Refuge approaches: expedition survey                     | 80           | 2 provisions, 1 fuel          | 180 credits, 2 fuel / independent +10       |
| Far Wake / beacon berth        | Clinic handover: support medical                         | 100          | 4 provisions, 2 parts         | 240 credits, 2 provisions / independent +11 |
| Far Wake / beacon relief       | Relief relay: expedition engineering                     | 95           | 3 parts, 3 provisions         | 230 credits, 2 fuel / independent +10       |
| Far Wake / research study      | Calibration: expedition survey + support engineering     | 125          | 3 parts, 2 provisions         | 270 credits / combine +8                    |
| Far Wake / research publish    | Public relay: support engineering                        | 105          | 4 parts, 1 provisions         | 230 credits, 1 parts / independent +12      |
| Hollowmere / shrine consecrate | Quieting vigil: support cleric                           | 110          | 3 incense, 2 herbs            | 240 gold / covenant +12                     |
| Hollowmere / shrine record     | Ward boundaries: expedition mage                         | 90           | 2 incense, 2 rations          | 200 gold / wardens +8                       |
| Hollowmere / caravan welcome   | Wagon escort: expedition fighter                         | 95           | 3 rations, 2 bolts            | 220 gold, 2 wood / wardens +9               |
| Hollowmere / caravan return    | Relief wagons: support scout                             | 105          | 3 wood, 4 rations             | 230 gold, 2 bolts / wardens +10             |
| Hollowmere / bargain accept    | Court marker: expedition mage + support fighter          | 130          | 4 incense, 2 bolts, 2 rations | 300 gold, 1 relics / court +12              |
| Hollowmere / bargain refuse    | Sealed warning: expedition cleric                        | 85           | 2 incense, 2 wood             | 190 gold, 2 herbs / covenant +10            |

Immediate discovery effects differ from these filing rewards. Salvage gives 3 parts/2 ammo and combine +5, or independent +7 without taking stores. The beacon offers a free resting medic or 4 provisions/independent +8. Research grants survey practice +4 or 100 credits/independent +10/combine −6. The shrine grants cleric practice +4/covenant +6 or 3 herbs/wardens +5. The caravan offers a free resting fighter or 70 gold/wardens +8. The bargain grants 80 gold/4 incense/court +10/wardens −6 or 2 herbs/covenant +4. Training caps at 30; both rescues reserve stable serial identities at actual onset. Full accommodation can always be bypassed by the safe response.

## Evidence and limits

`tests/fixtures/generation6-before-variety.json` captures actual settled generation-6 projects and paid jobs in both themes from released v0.10 commit `c2723f8`. They retain exact outcomes; all full-definition fixtures for generations 1–6 remain unchanged. `worlds-v7.json` freezes the new catalogs across six seeds per theme. The new tests exercise all twelve branch transitions, safe alternatives with no crew/stock, thresholds/protected journeys, exact prerequisite checks, failed choices, capped training, rescue identity through hiring/upgrades, cross-team requirements, practice, casualties during committed support work, parallel completion, departure locking and no combat credit.

The world simulator retains its legacy response preferences, then chooses an available non-recruit/training response without negative standing where possible, otherwise an available response. All eight Far Wake baseline seeds and eight generated seeds per theme pass existing logistics/recovery budgets. New-generation selection weights change which incident occurs; no new incident is promised for every seed/playthrough. This remains a finite seeded catalog, not an unbounded campaign or roguelite system.

## Local verification

Passed: 150 unit tests, 96 browser cases, 28 production offline cases, typecheck, Pages-base build, both campaign simulators, local documentation links and `git diff --check`. New browser cases exercise all six discovery interfaces and both themes’ support commissions alongside primary work, reload, real return travel and single filing. Production offline cases verify recruitment/training/faction receipts, parallel job catch-up and filing. Inspected phone screenshots show readable team requirements and standing tradeoffs; physical iPhone acceptance remains pending.

## Delivery evidence

Released in `245124a` through successful [Pages workflow 40722555654](https://github.com/rayners/explorer/actions/runs/40722555654). Published iPhone WebKit checks verified both fresh generation-7 defaults, all six new discovery interfaces and durable offline effects, both themes’ parallel primary/support completion and one-time filing, captured generation-6 paid-project outcomes and library routes. Physical Safari/Home Screen checks remain pending.
