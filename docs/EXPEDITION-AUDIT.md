# Expedition value and session cadence audit

Engine/definition audit completed 2026-10-28 under the ongoing roadmap instruction, following [readability](READABILITY.md) and the [independent design review](reviews/DESIGN-REVIEW-2026-10-28.md). Human play observations remain pending.

## Question and method

Before changing rewards or introducing longer orders, compare recovery wages with selected return-to-source contracts and same-destination bundles. Use current generation 7 and the eight campaign-simulator seeds. Measure actual graph travel time/supplies, skill-adjusted work duration and mission payment; keep ordinary follow-ups and response-bound project catalogs separate.

Benchmark a fully charted, already-discovered expedition. Compare departure/return from the initial hub with the closest service hub by round-trip time. Use a healthy, unpracticed matching specialist on each required team, reporting additional recruitment costs separately. Include both currency-only net returns and optimistic sale value of physical payment at the arrival calendar/neutral standing. Model up to three ordinary source contracts together, honoring the active-contract limit and sequential primary work. Project branches are potential offers, not a claim they all occur or can be accepted together.

For cadence, dispatch an actual hub shift and advance it by five minutes, one hour and eight hours. Record the result rather than assuming an automatic work queue. Separately report the observed scale of local/interregional route timers. This is an engine/definition audit, not a human playtest or retention study.

## Limits and safeguards

Exclude first-discovery rewards, data sales, intrinsic exploration value, faction access/standing benefits, practice value, optional parallel support earnings, market speculation, hazards/maintenance and intermediate resupply delays. These omissions mean a low cash/time result does not prove an expedition is dominated or uninteresting. Fully known routes, ideal staffing and sellable rewards are optimistic assumptions, not guaranteed player circumstances. Buying all supplies before departure is a common comparison baseline; gather/refine opportunities can change opportunity cost.

Keep guaranteed wages and recovery, explicit orders, consequential-choice pauses, safe absence and frozen catalogs. This audit does not approve numerical rebalancing, automatic dispatch, new passive upkeep or a new save/generation version. Player observation and physical iPhone testing remain separate pending work. Record findings and a bounded next design after collecting evidence.

## Reproducible result

Run `npm run audit:expeditions`, or `node --import tsx scripts/audit-expeditions.ts --json` for the structured report. The [retained report](analysis/expedition-audit-2026-10-28.json) uses v0.12 definitions at `c0f91d1`, eight seeds and neutral standing. It reproduces the review's seed-1701 introductory return trips: 31.96 credits/minute for Far Wake and 53.77 crowns/minute for Hollowmere, versus 102.63 currency/minute for a healthy specialist's 38-second hub shift.

These are **potential catalog benchmarks**, not probability-weighted offers from real campaigns. Each ordinary site is measured separately; project branches are mutually exclusive candidates and are never summed into one campaign. Bundles contain up to three ordinary contracts at one destination, with sequential field work. The prepared roster can reassign between jobs; assignment/trade/dialog interactions are excluded from command counts. Additional recruitment cost is reported separately rather than amortized into every trip. Optimistic reward liquidation assumes cargo can hold the payment.

| Median over sampled catalogs                  | Far Wake cash/min | Hollowmere cash/min | Interpretation                                                                                                           |
| --------------------------------------------- | ----------------: | ------------------: | ------------------------------------------------------------------------------------------------------------------------ |
| One ordinary commission, initial hub          |              −2.4 |                13.1 | Repeatedly crossing back to the starting hub can consume the payment. This is not a first-discovery profitability claim. |
| One ordinary commission, nearest hub          |              32.0 |                44.3 | Local staging helps substantially.                                                                                       |
| Up to three ordinary commissions, nearest hub |              74.0 |                85.1 | Bundling amortizes travel; it still trails active wages at the median.                                                   |
| One potential faction project, nearest hub    |              34.7 |                48.4 | Material/standing/branch value needs separate judgment.                                                                  |

The sample includes 393 ordinary Far Wake offers/131 destination bundles and 222 Hollowmere offers/74 bundles. Project catalogs contribute 4,797 and 1,980 potential branches respectively; these large numbers **do not describe actual discoveries available in one expedition**. Liquidating physical rewards changes median bundle rates to 74.2 and 89.2 respectively. A local single order bundle typically needs five simulation commands (accept, depart, work, return, file); the three-contract bundles have a median eleven. Currency/minute excludes attention/interaction time and optional support earnings.

Across both themes, a single actual hub shift pays exactly 65 at five-minute, one-hour and eight-hour checks, with no subsequent job queued. Raw generated route edges span 60–90 seconds locally and 900–1,500 seconds across Far Wake systems; Hollowmere spans 45–75 seconds locally and 180–240 seconds across realms. Effective transfers/multi-leg routes are included in the trip calculations rather than inferred from those edge ranges. This confirms the contrast between short orders and long waits; it does not establish a preferred cadence for players.

## Design implications and next work

1. Preserve recovery wages. The evidence points toward making expeditions worth pursuing through useful discoveries/consequences and better bundling, rather than cutting the safe recovery path.
2. Make nearer hubs and same-destination work easier to compare. Players need not return every commission to the launch hub; the current planning selector already supports any reachable known hub. A future destination summary can expose this advantage without accepting or dispatching automatically.
3. Design an explicitly chosen longer safe order as the next cadence experiment, with committed terms, bounded returns, no automatic chaining and no unattended casualties. Decide eligibility, duration/reward tradeoffs, practice credit and compatibility in writing before implementation. This is a candidate design, not a specified reward multiplier or a reason to silently alter old catalogs.
4. Follow with one visible changed-place outcome per theme and contextual discovery selection. These address purpose and coherence, which the financial model cannot measure.

Pending human evidence: observe a short active session and lunch/overnight returns, ask what the player expected to accomplish, and check whether the result motivates another expedition. Physical-device/readability acceptance remains pending. The audit and typecheck run successfully; its assertions check route existence, contract limits, starting accommodation and immutable definitions. No balance, engine, save or generated catalog changed.
