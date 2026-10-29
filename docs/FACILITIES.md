# Lasting changes at discovered places — next design

Prepared 2026-10-29 under the ongoing roadmap instruction, after destination comparison. **Unimplemented.** This is the next bounded design choice, not a claim that the user specified these exact goods, branches or names. Full procedural campaigns, autonomous factions and roguelite resets remain deferred.

## Goal

Make one discovery/commission family per theme leave a useful, visible change at its actual source. A player should be able to return and use something that exists because of their earlier decision, beyond the existing one-time payment and reputation. Keep exploration, party requirements, explicit travel and safe absence intact.

## Selected first slice

Open a limited resupply point after an exact source-bound commission is **filed**, using its existing claimed receipt as the durable condition. This is an ongoing supply arrangement financed by the patron, not an inexhaustible pile of abandoned salvage or free passive production.

- **Far Wake:** the `distress-beacon` → `relief` response already describes a continuing relief effort. Its existing “Restore the relief relay” commission requires an expedition engineer to install a transponder. Filing that commission opens an independent relief cache at the clinic's actual source, stocking provisions and spare parts at ordinary local prices.
- **Hollowmere:** the `haunted-shrine` → `consecrate` response's existing “Quiet the travelers’ vigil” commission requires a support cleric and incense/herbs. Filing opens a pilgrims' supply point at that shrine's actual source, stocking medicinal herbs and incense at ordinary local prices.

The alternate responses retain their existing benefits and commissions. On new eligible expeditions, describe the prospective supply point before choosing the response and in the commission brief; no benefit is implied before filing. A source badge and short explanation then identify the active local supply point, its patron and available goods. The map/place presentation must show the change only after it is actually earned, without exposing potential facilities at unexplored sites.

Purchases/sales remain explicit using the existing currency, cargo, quantity and local price/market-cycle rules. Only the listed goods gain field-market access. The source remains a field location: normal exploration, gathering, threats and bound work retain their meaning. The supply point does **not** become a full service hub and does not grant recruitment, upgrades, safe hub work, automatic recovery, contract acceptance or filing. Real hubs remain necessary for those services. An active journey/recovery still blocks trading.

No passive income, maintenance drain, stock timers, recurring job queue, free deliveries, territorial simulation or new casualty path. A lasting benefit cannot punish absence or invalidate an order already paid for.

## Generic mechanism and boundaries

Add an optional definition-level facility/resupply contract, with stable identity, location, prerequisite claimed mission and an explicit resource allowlist. Theme recipes own names, descriptions, patrons, source-bound mission selection and resource IDs. A pure engine selector derives active supply points from actual known locations and validated claimed missions. It must check the exact source/mission relationship, not merely an incident kind or similarly named place.

Engine trading uses a shared market-access predicate: existing hubs retain their current full market; a qualifying field supply point permits only its listed goods. Preserve ordinary rejection reasons, current pricing and currency/cargo limits. Do not generalize `LocationDef.station` into a mutable hub flag: that would silently change field activities, recovery destinations, hiring, filing and paid-job validation.

UI status and trade controls use the same selector as dispatch. Show clear stock limits and unavailable reasons; use the existing supplies view/focus conventions and 44px controls. No engine branch on a game ID, hard-coded themed resource or browser state. Never put facilities, narrative or source IDs into telemetry.

Destination comparison remains conservative: it still estimates supplied work and a return to a known real filing hub. It must not count future cache purchases as already owned supplies or call a limited cache a filing hub. Existing committed jobs and receipts keep every paid term, role and reward.

## Compatibility plan

The proposed new definition data and prospective narrative belong in **content generation 8**, retaining the generation-7 world, names, sites, discoveries and commissions before adding this feature. Keep generations 1–7 frozen. A restored older expedition retains its catalogs and outcomes; do not silently upgrade its content generation. New expeditions can default to generation 8 after fixtures and validation exist.

No new saved state is expected: claimed mission IDs already persist and cannot be abandoned. Envelope 1/state schema 5 should remain unchanged if implementation confirms that facility activation is fully derivable. If new state is actually needed, stop treating this no-schema plan as established and design/validate a migration before editing saves. Factory restores must receive the saved generation through every assembly step.

Keep every outstanding job valid when the facility opens, across casualties, reload and offline catch-up. Facility activation occurs at successful filing only; field-work completion alone must not grant access. Rejected filing or purchase, preview, imports of unrelated expeditions and repeated commands must not grant additional rewards or resource access.

## Implementation and acceptance

1. Capture released generation-7 catalogs and paid/complete project fixtures before extending assembly. Inspect current definition/save contracts and existing trade guards; retain older checksums and catalogs unchanged.
2. Add the optional pure facility/market selector with alternate-theme portability tests. Test no condition, wrong branch, unfinished/unfiled work, exact claimed source, hidden source, unknown resource, full hubs and both journey types.
3. Extend trading without changing ordinary hub economics. Cover funds, cargo space, quantity, buy/sell limits, unstocked goods, input immutability, no outcome-RNG changes and no passive effects. Verify paid job completion/practice and one-time filing remain exact.
4. Assemble the two generation-8 recipes after frozen older content. Add stable catalogs, restore/version/reference checks and explicit prospective/earned writing.
5. Add source/map status and local supply controls using the shared predicate. Exercise both themes, keyboard focus, visible reasons, portrait/landscape and real older saves. Opening details or visiting the supply view never purchases automatically.
6. Run unit/type/browser/offline suites, both logistics simulators and an extended mission/source probe: the new capability may improve expedition logistics, so evidence must cover reachability, recovery and unchanged old generations. Publish and verify the actual live activation/purchase/offline flows. Keep physical iPhone acceptance pending until performed on the device.

Following candidate: contextual discovery selection using site traits and expedition history, with bounded weights and introductory protection. That is separate from the resupply mechanism and requires its own version/outcome design.
