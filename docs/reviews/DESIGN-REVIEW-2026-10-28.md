# Independent game design review — Far Wake and Hollowmere

Reviewed 2026-10-28 against v0.11.0, commit `98f7ced`. Requested by the user and performed by a separate agent. **All recommendations below are proposals, not approved specifications.** No gameplay, balance, dependency or save changes were made.

## Assessment

Both games have a coherent, dependable exploration framework. Far Wake has the stronger distinctive premise: planning a modest survey operation across years of cryosleep. Hollowmere makes party classes more immediately legible and offers a faster expedition rhythm. The largest opportunity now is to deepen the value and consequences of expeditions, rather than increase the number of interchangeable commissions.

I would put an **expedition-value and session-cadence design pass ahead of more content or more elaborate procedural weighting**. Contextual discovery selection is a sensible next implementation candidate, but does not by itself address why players should leave the hub, revisit a discovery, or return tomorrow.

## Method and limits

I read the repository guide/index, requirements, setting designs, current planning/variety/crew contracts and roadmap; inspected the engine, generation recipes, UI writing and campaign simulator policy; and ran targeted deterministic generation-7 engine probes for both themes at seed 1701. Those probes measured hub wages, one representative local follow-up round trip, map/catalog sizes and an overnight single-order outcome. This was **not a browser playtest, physical-device test, retention study or exhaustive economy search**. Existing release validation is useful reliability evidence; it is not evidence that a loop is compelling. `simulateWorld` checks one logistics/recovery policy and does not exhaustively play optional projects.

Observed mechanics are distinguished below from design inferences. Numerical examples use current definitions, neutral standing/initial market cycle, starting healthy crew, no upgrades, no hazards, immediate successive orders and no travel resupply delays. Currency/minute is an opportunity-cost proxy, not a complete measure of exploration's value.

## Strengths to preserve

- **Safe intermittent play.** Explicit dispatch, paid commitments, consequential-choice pauses, permanent-loss warnings and reliable recovery make it possible to close the browser without sacrificing a crew. Keep these safeguards; extra danger is not the solution to weak incentives.
- **A readable logistics identity.** One primary and one support order, cargo limits, field gathering, maintenance and hubs create useful preparation decisions. Support commissions and split-role requirements now connect this structure to mission design.
- **Discoveries have durable identities.** Site/incident/response-bound work and single filing prevent reload farming and let a named finding acquire a history. This is an excellent seam for stronger future consequences.
- **Good thematic separation.** Science-fiction reactions, cryosleep and corporate claims feel different from fighters, wards and refuge roads, despite a shared engine. Seeded names, distinct pixel presentation and original writing support that separation.
- **Planning is helpfully explicit.** Shortages, assignment gaps, source routes and retained work receipts improve the chance a player understands the next action without handing control to automation.

## Prioritized findings

### 1. High: return commissions need a clearer reason to justify another trip

**Observed:** Hub work pays 65 currency without supplies. With one healthy matching primary specialist it takes 38 seconds, about 103 currency/minute before future proficiency gains. For the already-discovered introductory site's ordinary study follow-up (the table uses stable location IDs, not generated display names):

| Seed 1701, generation 7                         | Far Wake / `cinder` ID | Hollowmere / `old-road` ID |
| ----------------------------------------------- | ---------------------: | -------------------------: |
| Filing reward                                   |            150 credits |                 150 crowns |
| Work duration with starting relevant specialist |                   64 s |                       64 s |
| Work supplies at hub buy prices                 |                      6 |                          6 |
| Outbound + return travel                        |                  120 s |                       90 s |
| Travel supplies at hub buy prices               |                     46 |                          6 |
| Reward minus these supplies, per elapsed minute |                    ~32 |                        ~54 |

These examples exclude standing, practice, role access, intrinsic exploration, simultaneous useful support work and first-visit survey/site rewards. They do **not** establish that every mission or exploration strategy is dominated. They do establish that two ordinary return commissions reward money/time substantially less than safe hub work, even before hazards and maintenance.

**Design inference:** A player pursuing upgrades or cash can learn that paid hub chores are the efficient path, while a supposedly significant discovery asks for an unremarkable repeat visit. This tension is sharper in Far Wake because crossings are much longer.

**Proposal:** Audit several local and remote route bundles, including combined contracts and useful support work. Give selected expeditions a distinctive benefit: a newly useful facility, route information, an optional approach, or a named faction service. Better surface the value of combining jobs at one destination. Preserve wages as dependable recovery; do not simply nerf them or turn optional work into a mandatory grind.

**Evidence:** [simulation.ts](../../src/engine/simulation.ts) (`activityDuration`, `price`, activity completion); themed `work` definitions; [mission-generation.ts](../../src/engine/mission-generation.ts); [navigation.ts](../../src/engine/navigation.ts). Reproduce by constructing seed 1701, pricing the Cinder/Old Road `study` follow-up, and summing the shortest known outbound/return legs. The wage comparison reassigns Far Wake's engineer to primary; Hollowmere's initial fighter is already there.

### 2. High: choose the intended casual session rhythm explicitly

**Observed:** Orders do not repeat or chain. Advancing a fresh hub work order by 24 hours yields exactly 65 currency and no pending primary job in either game. Most local actions are around a minute; Far Wake generated interregional routes in the sampled seed take 900–1,500 seconds, versus Hollowmere's 180–210. `advance` safely catches up the committed work, then there is no next order.

**Design inference:** This is closer to short appointment-based expeditions than an accumulating idle game. The contrast between frequent local dispatches and a largely inactive interstellar wait may make Far Wake feel either pleasantly leave-and-return or unexpectedly stalled. Hollowmere has a more consistent short-session cadence, but an evening away can still resolve little work. Actual player preference needs testing.

**Proposal:** Test a five-minute session, a lunch-break return and an overnight return in both themes. Consider an explicitly chosen longer safe work/gathering order, represented by one paid job with bounded terms, if players want useful absence. Keep voyages separately ordered and choices interruptible. Do not add automatic mission acceptance, risky queues, absence casualties or passive upkeep merely to create activity.

**Evidence:** [simulation.ts](../../src/engine/simulation.ts) (`advance`, `OFFLINE_CAP`); [world recipes](../../src/game/world.ts), [fantasy world recipes](../../src/fantasy/world.ts); [design](../DESIGN.md).

### 3. High: accomplishments mostly change the ledger, not the explored world

**Observed:** Current follow-ups and projects use one source-bound activity followed by hub filing. Completion updates progress/practice; filing grants supplies/currency and standing. The generated definitions do not add a distinct restored-facility, route-access or local-condition effect. Neither theme currently supplies an `afterActivity` hook to create one. Milestones principally count travel/surveys: Far Wake rewards its first long journey and ten surveys; Hollowmere's charter milestone is six surveys. At the sampled seed, Hollowmere has seven fields and twenty-one sites, so charter progress can run ahead of deep site investigation.

**Design inference:** “Restore,” “preserve,” “consecrate” and “publish” have different roles and preparation, but may converge into a receipt rather than a memorable changed place. Survey-count milestones provide completion measures, but little direction about what the expedition is trying to accomplish after the opening contract.

**Proposal:** Design one bounded expedition chapter per theme with a named aim, an intermediate consequence and a satisfying completion summary. Prototype one lasting, visible outcome per theme before expanding the event list again: for example a functioning rescue relay or a safer refuge path. A claimed mission can potentially serve as the durable condition; do not introduce a large territory simulation. Show what changed and why it matters on the map/journal.

**Evidence:** [project-generation.ts](../../src/engine/project-generation.ts), [mission-generation.ts](../../src/engine/mission-generation.ts), [simulation.ts](../../src/engine/simulation.ts) (`complete`, claim handling), themed milestone definitions and [variety recipes](../../src/content/variety.ts).

### 4. Medium: contextual discovery selection should improve coherence and anticipation

**Observed:** Generation-7 variety assembly gives every new discovery the same nonhub/nonintro location pool. Thresholds, once-only history, cooldown and pending choices gate selection. Existing site weights contextualize some earlier Far Wake incidents, but the new event IDs have no additional trait weights in the frozen site recipes. One pending hub choice suppresses later incident selection, and no event is promised in a campaign.

**Design inference:** A clinic, salvage claim or caravan can feel loosely attached to the site description. Long field trips also have a quiet narrative ceiling once a choice is pending. New event volume alone does not ensure a varied expedition, especially in Hollowmere's smaller worlds.

**Proposal:** Proceed with the roadmap's bounded contextual-selection design after the value/cadence pass, or in parallel with its measurements. Link event families to plausible site traits and provide useful, non-spoiling clues. Measure first meaningful discovery and variety across seeds and different hub-return habits. Preserve quiet trips and surprise intrusion; avoid guaranteed jackpots, repeated ledger events or compulsory immediate return.

**Evidence:** [variety.ts](../../src/content/variety.ts), [discoveries.ts](../../src/engine/discoveries.ts), both themed `sites.ts` files, [VARIETY.md](../VARIETY.md).

### 5. Medium: approach and horror responses favor optimization more than different play styles

**Observed:** Specialist site approaches generally improve reward to 130%, duration to 80% and ordinary risk to 60%, sometimes with an extra supply requirement. Cautious approaches take 135% time, retain 85% rewards, add supplies and reduce ordinary risk to 35%. These approach modifiers do not themselves change the site's hidden-discovery event weights. Threat purge always ends the incident without casualties, loses 20% of physical cargo and preserves currency; stopping a threat progresses the same objective regardless of purge or confrontation.

**Design inference:** Once a fitting specialist is available, that site option is often the obvious efficiency choice. Cautious work may look like a poor trade against relatively recoverable ordinary hazards, and a rational player may purge rather than risk named crew for the same threat completion. These are hypotheses about preference, not proof from a solver. Safe purge is an essential recovery tool and should remain.

**Proposal:** Distinguish approach goals, such as intact evidence versus bulk salvage, rather than require every specialist option to improve all three axes. Make clear that ordinary risk reduction is not a promise against surprise exposure. Give voluntary investigation a modest, visible information/character benefit if desired, while retaining guaranteed purge and explicit casualty-risk choices. Test whether players actually use cautious work or threat investigation before rebalancing.

**Evidence:** [site-generation.ts](../../src/engine/site-generation.ts), [threats.ts](../../src/engine/threats.ts), [simulation.ts](../../src/engine/simulation.ts), [CREW.md](../CREW.md).

### 6. Medium: theme-specific promises need one more layer of consequence

**Far Wake:** Years of cryosleep are strong fiction, but currently the clearest systemic calendar consequence is a repeating market multiplier. Faction choices primarily affect standing, prices and work access; safe medical treatment and cheap replacement hires keep crew recovery sound. A future bounded arrival report, changed recipient or contract response would make lost years and corporate patronage feel more consequential without punishing absence. Keep open-space departures and do not reintroduce a mandatory launch planet.

**Hollowmere:** Class gates, shared rations and shorter roads communicate party exploration well. However, special actions such as Unravel the ward and Consecrate the shrine are repeatable resource conversions, while the supported dungeon structure is still places with site lists, not a connected room crawl. More dungeon length or harsher death is unnecessary. One short sequence with a revealed clue, a class-dependent optional route and a meaningful return would better express a dark-fantasy expedition.

**Both:** Practice has bonuses at 4 and 12 points but no additional bonus from 12 to the cap of 30. Names, assignment and the memorial are a useful beginning of attachment, yet personal histories/roles have little differentiation. First try a small journal of notable contributions and explicit mastery status, not a large character-trait or relationship simulation.

**Evidence:** [Far Wake rules](../../src/game/definition.ts) (`marketCycle`), [Hollowmere activities](../../src/fantasy/definition.ts), [proficiency.ts](../../src/engine/proficiency.ts), [threats.ts](../../src/engine/threats.ts).

### 7. Medium: more offers and release resets can dilute player goals

**Observed:** The sampled Far Wake world contains 54 sites and 54 ordinary site follow-ups; Hollowmere has 21 of each. These are potential catalogs, not all immediately visible. Actual site discoveries unlock offers, while only three contracts can be active. Summaries and prioritized faction projects help, but lengthy descriptions repeat origin, patron, work terms and preparation in each card. New generation-7 content requires a fresh expedition; previous generations intentionally retain their catalogs.

**Design inference:** Repeated delivery paperwork and resets to see additions may compete with continuity and investment in a casual expedition. The current compatibility policy is reliable and should not be casually weakened, but frequent content-only generations have a player-facing cost.

**Proposal:** Prefer a few location bundles and concise purpose summaries over more full-length cards. Add visible chapter/expedition goals and let the player deliberately defer routine work. Explain new-content availability without pressuring a reset. For future additions, evaluate an explicit opt-in compatible catalog extension only where old identities, paid work and reserved names can be preserved; otherwise retain current freezing and acknowledge that limitation.

**Evidence:** [mission-generation.ts](../../src/engine/mission-generation.ts), [planning-panels.ts](../../src/ui/planning-panels.ts), both mounted UIs, [NAMES.md](../NAMES.md), [VARIETY.md](../VARIETY.md).

## Suggested next slices — proposals only

1. **Expedition value and cadence audit.** Compare a handful of local/remote contract bundles against recovery wages, and observe three return schedules with a small player test. Include intrinsic discovery/standing/class value, not only cash. Decide what a satisfying short session and an overnight return should achieve.
2. **One changed place per theme.** Design a small chapter and one visible persistent consequence, with safe alternatives and reliable return. Evaluate whether players remember the outcome and voluntarily pursue the next expedition.
3. **Contextual discovery selection.** Apply bounded trait/history weights and clues, then test event variety and pacing across several hub-return policies. This supports the existing roadmap candidate without pretending to be a full procedural campaign.

These can be designed without adding roguelite resets, autonomous factions, forced casualties, an automatic travel queue or a new game. Before implementation, record the chosen scope, version/save implications and acceptance steps in the normal design/decision/roadmap documents.
