# Explicit longer hub work

Implemented and published for v0.13, 2026-10-28, under the ongoing roadmap instruction. The [expedition audit](EXPEDITION-AUDIT.md) found that a single short shift produces the same return after five minutes or overnight. This slice gives intermittent players a useful explicitly chosen commitment without a repeat queue. The exact terms below are implementation choices, not quoted user requirements. Deployment verification follows below.

## Orders and tradeoffs

Both games retain their existing short recovery work, costs, duration and payment. At a service hub, a player can choose one longer primary work order:

| Order           | Fixed real duration |             Base payment | Maximum debt repayment |
| --------------- | ------------------: | -----------------------: | ---------------------: |
| Short watch     |          15 minutes | 2 ordinary work payments |                     40 |
| Long watch      |              1 hour | 4 ordinary work payments |                     80 |
| Overnight watch |             8 hours | 8 ordinary work payments |                    160 |

Multiply the base payment by `1 +` the work team's existing specialty bonus, rounded to an integer with a minimum of one unit. Starting with a healthy matching specialist and a 65-unit ordinary payment, these pay 153, 307 and 614 respectively, before debt. Durations stay fixed; skills, proficiency and equipment improve the committed payment instead. More frequent short work remains more profitable per minute. The extra time is an attention tradeoff, not a mandatory productivity upgrade.

No supplies are required. Pay once at completion, subtract the committed debt repayment once, and award one practice point to surviving committed matching specialists. A long watch is one activity completion, not multiple training/reveal/mission ticks. No automatic repeat, journey, recruitment, acceptance, filing or gathering follows it. Existing support work can coexist. Departure waits for primary completion or explicit cancellation.

Cancellation ends only the chosen extended work order and forfeits all its pay, debt repayment and practice. There is no partial payout/refund; no supplies were spent. Explain this before confirmation. Ordinary paid activities, voyages and bound contracts are not cancellable through this command. Cancellation still respects encounter/threat decision holds and browser ownership.

## Generic mechanism and compatibility

The existing `rules.workActivity` maps the mechanism to themed recovery work. Offer longer watches only when it is repeatable primary hub work, without costs, effects, a mission, survey dependency or hooks, and with a positive currency-only reward in a zero-mass currency. Its ID must be distinct from other built-in activity mappings. Games without a qualifying mapping keep ordinary behavior. No engine branch uses a game/skill/resource ID or narrative name.

`work` gains an optional stable watch ID (`15m`, `1h`, `8h`); ordinary `work` and activity dispatch are unchanged. A new cancellation command requires the active extended job's ID, preventing stale confirmations from cancelling another watch. Commit the existing duration/reward/participants and optional `Job.watch = { id, debtPayment }`. Debt repayment is capped at the debt owed on dispatch and the committed gross pay, so it never spends the existing wallet. Do not recompute payment, duration or staffing after roster/injury/proficiency changes. Preserve paid watches through casualties. Freeze the ID/duration/repayment policy for existing jobs; future choices require distinct IDs or migration.

State schema 5 adds the optional watch metadata. Validate schema 4 before migrating its version; do not touch any old job or personnel fields. Verify original checksums before migration and reject forged legacy watch metadata. Schema-5 watch validation requires qualifying hub work, valid ID/fixed duration, zero risk/calendar days, currency-only positive committed reward, a bounded debt commitment, no site and a local primary job. Validate committed terms structurally, rather than recalculating current crew bonuses. Save envelope 1, generations 1–7, namespaces, manifests and catalogs remain unchanged. Existing expeditions gain the option without reset. Earlier apps reject schema 5 rather than silently applying old repayment rules.

## Presentation and checks

Keep short work's existing action. A labelled expandable choice shows each duration, gross pay, current debt/net pay, single-completion practice, safe absence and no repetition. Expanding/previewing spends nothing. Active job panels show the selected duration, committed gross/debt/net terms and cancellation. Theme-owned copy calls these station shifts or refuge duties. Use readable labels, 44px targets, native keyboard expansion, portrait/landscape safe areas and visible unavailable reasons.

Before changing the engine, `schema4-before-watches.json` captured ten released `d69e8e0` scenarios: both themes, generations 1/3/7 work with debt, parallel travel/support, and actual generation-7 bound support work. Compare every old field before/after completion, normalizing only the migrated version. Retain earlier fixtures unchanged.

`npm run audit:expeditions` now includes explicit watch probes; the [retained watch cadence report](analysis/watch-cadence-2026-10-28.json) records actual dispatch/advance outcomes. With one healthy matching specialist and no debt, the 15-minute/hour/eight-hour orders return 153/307/614 at completion, respectively. Checking a longer order early grants neither partial pay nor practice; a completed order does not repeat. Ordinary benchmark results remain unchanged. These measurements do not replace pending human observations.

Test previews/rejections without mutation or RNG draws; every duration/payment/debt combination; specialist/upgrade effects; work/travel/field/mission safety gates; cancellation and no partial credit; support concurrency; explicit threat holds; casualty-preserved commitments; one-time offline completion/practice; old migrations/checksums and malformed watch data; alternate-theme portability. Browser/offline checks cover both games and older catalogs, visible terms, choosing/cancelling, reload, tab ownership and production helper absence. Run required suites, both logistics simulators and the cadence audit. Physical iPhone Safari/Home Screen/suspension remains pending.

## Local evidence

164 unit tests, 111 browser cases and 34 production offline cases pass, with typecheck and Pages-base build. The ten new released-save scenarios retain every old field/outcome except the validated schema version; earlier fixtures/catalog hashes remain unchanged. The Victorian consulting fixture also exercises a different currency, lower wage and repayment limited to that job's pay. Both logistics simulators pass with their unchanged short-work policy (legacy Far Wake 192–196 minutes across eight seeds; generated campaigns remain recoverable).

Chromium/iPhone/iPad WebKit checks cover real previews/orders, cancellation confirmation, retained support jobs, a read-only second tab, single payment/practice and older/current catalogs. Production offline checks finish all three durations in both themes and verify cancellation without partial credit. Phone choice panels were visually inspected and landscape overflow checked. These results are emulation, not physical-device acceptance. No new dependency, asset service, manifest or browser namespace was added.

## Delivery evidence

Feature `7eed06e` passed [Pages workflow 40749394417](https://github.com/rayners/explorer/actions/runs/40749394417) and deployed successfully. Live iPhone WebKit checked both canonical game routes and the library: explicit eight-hour dispatch and committed terms, offline reload/cancellation preserving support, actual offline import/catch-up for all three durations with one payment/practice credit, released generation-3/schema-4 short-work outcomes after migration, independent saves and no production development helpers. Active watch screens were visually inspected. Physical Safari/Home Screen acceptance remains pending.

The final visual pass exposed Hollowmere's old minute-only countdown (`479m 60s` near eight hours). Both mounts now share whole-remainder rounding and hour-aware formatting, with fractional boundary regressions; no job timing or pay changed.
