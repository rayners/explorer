# Missions derived from discoveries

Implemented for v0.6 on 2026-10-28, following the generated-site delivery. This is the approved roadmap direction; exact templates and balance below are implementation decisions.

## Goal and loop

A discovery should create work connected to that place and its condition. Explore a generated site, find its follow-up at a service hub, accept the contract, prepare a suitable party and supplies, return to the source location to perform the work, then report to a hub. Payment and standing apply once when filed. Follow-ups are optional and use the existing three-active-contract limit.

## Shared mechanism

Build deterministic mission/activity definitions from each generation-3 site's stable identity and traits. Keep these catalogs additive: previously saved generation-3 expeditions gain eligible follow-ups without changing their sites or committed jobs. Generations 1/2 remain unchanged. Existing MissionState and ordinary activity jobs can store progress, so a new state schema is unnecessary if no extra runtime fields are introduced.

A mission declares its source site; it is offered only after that site was actually explored. Its field-work activity declares its mission and source location. The work requires an accepted, unfinished contract, pays visible resource costs, requires any relevant specialist, and can finish only once per accepted contract. Finishing work advances the objective; it does not pay the mission or grant combat-victory credit. Claiming at a hub applies the reward and recipient faction standing once. Refuse abandonment during committed associated work to avoid losing its accounting; ordinary abandoned contracts can be accepted again.

Initially choose a themed template from the site's actual traits: restore damaged systems/shrines, recover records/lore, deliver replacement stores, assess hostile activity, or conduct a fuller field investigation. Provide stable generated IDs rather than names as objective references. Templates supply all narrative, roles, supply costs, payment and standing. The engine handles source-discovery eligibility and mission/work accounting without knowing repairs, mages or corporations.

Work remains optional: class requirements must not block the introductory journey or require every party to finish every follow-up. Completed follow-ups cannot be abandoned; they remain in the accepted ledger until filed. Contracts cannot be abandoned while their associated work is underway. Unstarted follow-ups can be abandoned and accepted again because no work or payment has occurred. This prevents farming without adding a second completion ledger. A genuine new expedition can repeat the campaign normally.

## Acceptance

- Both settings generate different follow-ups from site context, with readable source/recipient and valid resource, location, activity and mission references.
- Unexplored sites do not leak future missions; completed discoveries unlock eligible offers in existing generation-3 saves.
- Hub acceptance/filing, active-contract limits, faction restrictions, source-location checks, costs and skill requirements remain enforced.
- Reject work without acceptance, concurrent repeats, work after completion and repeated payment.
- Abandon/reaccept, reload/import, offline catch-up and failed commands cannot duplicate rewards or lose committed progress.
- Existing authored contracts and generation-1/2 saves remain compatible; generated sites/names stay frozen.
- Mobile, keyboard, cross-game storage isolation and production offline work/turn-in flows pass.

## Following item

Generated system/realm layouts follow once generated mission references can be checked against guaranteed reachable hubs, introductory destinations and recovery paths. Roguelite run/reset rules remain deferred.

## Implemented catalog

Each generation-3 site yields one deterministic contract and one field-work activity: 36 follow-ups in Far Wake and 18 in Hollowmere. Source traits select the first applicable themed template; the final template is a general investigation. Missions stay hidden until their source site is explored, even if its location was surveyed. Old generation-3 discoveries unlock the same offers on upgrade without rerolling sites or consuming gameplay RNG. Versions 1/2 do not gain generated-site contracts.

Far Wake templates cover damaged-system/access restoration (engineering), archive recovery (survey), replacement stores (any crew), traffic assessment (security) and extended field studies (any crew). Hollowmere has renewed rites (cleric), path restoration (scout), lore recovery (mage), replacement stores (any crew), road watches (fighter) and a general route investigation. Existing exploration leadership rules remain unchanged; follow-up work uses its own stated requirements.

Recipes own all writing, traits, roles, costs and payment. The recipient is the source location's faction (or the game's first faction when no owner is supplied). Common work lasts 75–90 base seconds, costs visible physical supplies, and pays 150–210 currency plus occasional physical stock and 6–9 standing when filed. Skill bonuses affect duration through the existing activity mechanism. Ordinary field hazards still apply; no reconnaissance task claims a combat victory. Source profiles remain the original discovery record; a mission receipt records the later completed work rather than rewriting the frozen profile.

`generateFollowUps` returns additive mission/activity definitions. Mission IDs include source-site and template identity; activity IDs derive from their mission. `MissionDef.sourceSite` gates offers/acceptance, and `ActivityDef.mission` gates accepted unfinished work. The ordinary objective/progress system records one completion. Work has no immediate activity reward: payment is solely the once-only mission claim. The three-active-contract and faction-standing rules still apply. All hubs can clear a completed contract, as with authored missions.

`missionDiscovered` supplies source eligibility to engine validation and both boards. Accepted work appears in Operations/Company with the named destination, supply costs, duration and role requirements, including while preparing at a hub. Completed-site records point to their follow-up status. Completed work is retained until filing; releasing it is disabled with a visible reason. An unstarted follow-up can be released and accepted again without losing paid progress because no work has begun.

Existing state schema 3 stores the accepted/claimed ledger and ordinary jobs, so no schema migration or save-key change is needed. Import validation rejects missing source discoveries, dangling work jobs, and work whose contract is already completed or claimed. Fixtures captured directly from the released v0.5 source prove existing generation-3 paid site orders still complete identically. `tests/fixtures/followups-v1.json` freezes the new additive catalog; future changes must preserve accepted identities/costs or use a compatible new version/migration.

Validation includes behavior tests for eligibility, hub/role/location checks, costs, active limits, standing, exact-once work/payment, release/reaccept protection, offline receipts and malformed imports. Browser coverage exercises complete journeys in both themes on desktop and iPhone/iPad WebKit; production offline coverage separately completes work and files completed receipts. Physical iPhone acceptance remains pending.
