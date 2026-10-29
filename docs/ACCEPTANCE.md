# Browser and device acceptance

## Destination planning (v0.15) — physical checks pending

- In both games on the iPhone 15 Pro Max, open the board and work views after exploring a site or settling a faction discovery. Expand Work by destination in portrait and short landscape. Accepted destinations should come first, with readable shared travel/work estimates and visible supply/team gaps.
- Review an offer, accepted work and a completed receipt by touch and keyboard. Focus must land on the matching existing brief; no contract, inventory, team or order should change from review. Plot source/filing routes and verify that departure still needs its own explicit order.
- Compare two accepted contracts at one source: travel should count once, offers should not join the accepted-work total, and all accepted contracts/receipts should count against the three-slot limit. Missing routes must remain unpriced; in-transit summaries must wait for arrival.
- Restore a released expedition and reopen offline. A paid job must retain its supplies/participants/pay and complete once, while a receipt can be filed at a hub without returning to its source. No reset or new seed is needed for this UI.

Automated Chromium/WebKit checks do not substitute for these physical-device results.

## Usage/error reporting (v0.14) — physical checks pending

- In Safari and both installed games, find the sharing checkbox in Settings; toggle it with touch/keyboard, rotate and confirm readable text and scroll access. Verify the library footer and other game reflect the same preference after navigation/reload.
- With sharing disabled, play and export/import a backup as usual. Reopen offline; play and settings must work without waiting for analytics. Reconnect without replaying offline telemetry.
- Check Safari privacy/storage restrictions and enabled browser privacy signals: sharing should stay off and gameplay remain available. Network failures must not replace game/save warnings or block orders.
- Automated payload tests use Chromium and WebKit against a production build served under canonical-origin routing. They do not constitute physical-device acceptance or prove live ingestion by themselves.

## Longer hub work (v0.13) — physical checks pending

- On the iPhone 15 Pro Max in each game, open the ordinary work card at a hub and expand the longer-shift/duty choices. Read all three fixed durations, gross pay, debt repayment, take-home pay and cancellation terms in portrait/landscape. Check long labels, keyboard focus and scroll access above fixed navigation.
- Start an order explicitly, lock/force-close Safari, and return. Verify remaining time and committed pay/debt, then one payout/practice point at completion and no automatically queued work. Repeat from both installed Home Screen games and offline.
- Cancel a partly completed watch, first keeping current orders, then confirming. Verify no partial earnings, repayment or practice; support work must remain. Check that departure becomes possible after support finishes. Encounters/revealed threats still require their own response.
- Restore an older save with a paid journey/support job and debt. The schema-5 upgrade must preserve the original job and outcome; older games/catalogs gain the new work option without resetting progress. Export a backup before manual migration checks.

Automated Chromium/WebKit checks do not substitute for these physical-device results.

## Readability and action hierarchy (v0.12) — physical checks pending

- On the iPhone 15 Pro Max, confirm the opening directive's acceptance action is readable above the scene in portrait and landscape, including Safari chrome and safe areas. Accept the first contract/oath and follow travel, survey and filing guidance.
- Check larger stock labels/units and wrapping resources. Visit every tab with long generated names; rotate, enlarge text/zoom, and confirm scrolling reaches actions above the fixed phone navigation.
- Review accepted primary/support work with missing supplies and a wrongly assigned specialist. Those blockers must remain visible with story/estimates collapsed. Expand both sections by touch and keyboard; no resources or orders should change.
- Dispatch explicitly, suspend/reopen, and confirm paid terms and completed receipts remain intact. Repeat offline/from Home Screen in both games. Native details expansion is temporary view state and may reset after a simulation transition.

Automated browser emulation does not close these physical-device checks.

Automated coverage uses Chromium desktop and actual WebKit with iPhone 15 Pro Max and iPad viewport/touch settings. It does not substitute for a physical iPhone Safari run.

## Automated checks

- `npm test`: deterministic time advancement, save validation, references, resources, maintenance, objectives, relationships, recoverability, alternate-genre integration, and complete-frontier simulations across eight seeds.
- `npm run build`: strict TypeScript and static PWA production output.
- `npm run test:e2e`: recruitment/capacity and roster persistence, legacy save migration, hidden threats and purging, fantasy class requirements, cross-game save/lock isolation, and the original accept/travel/survey/file journey, reload restoration, save import/export, keyboard dialog dismissal, portrait and landscape overflow, competing-tab ownership, failed import/reset writes, touch-visible cargo explanations, and valid crew reassignment during independent work.
- `npm run test:offline` after build: a saved voyage catches up on launch; production service worker then serves the app after an offline reload for both Far Wake and Hollowmere in Chromium and WebKit. Development helpers must be absent.
- `npm run test:telemetry` after a Pages-base build with public configuration: actual serialized capture requests, opt-out, private error/query text, anonymous page IDs, request failures, local suppression, browser signals, storage denial and read-only tabs. Requests are intercepted; no test traffic enters PostHog.
- `npm audit`: dependency advisories.

## Physical iPhone 15 Pro Max — pending

Use Safari at https://rayners.github.io/explorer/far-wake/ for Far Wake installation/offline tests. The site root is the game selector. A LAN HTTP URL is useful for gameplay testing but does not enable phone service workers.

1. Accept First light, depart for Cinder, rotate the device, survey, and file the contract at Anchor Station.
2. Check safe-area padding, text readability, native select controls, touch targets, scroll behavior, and keyboard access to save text. Nothing should require hover.
3. Start a journey, lock the phone, wait, and reopen Safari. Confirm one arrival and no duplicate resource spending or reward.
4. Force-close Safari during a journey, reopen, and verify recovery from the last checkpoint.
5. Start an interstellar voyage; check the real timer, fictional arrival year, cryosleep status, and safe return after absence.
6. Enable sound through a tap. Disable it and enable reduced motion. Reload and confirm preferences remain set.
7. Export, copy/download, and reimport a save. Confirm replacement is intentional and invalid imports leave the current expedition intact.
8. Open a second tab. It must be read-only. Close the commanding tab, reload the second, and confirm command ownership transfers.
9. Add to Home Screen. Launch once online, enable airplane mode, then reopen and navigate all four console sections.
10. Enter an encounter, leave the app, and return. The choice must remain pending without additional losses.

No physical-device result is claimed until this checklist is run on the actual phone.

## v0.2 physical-device additions — pending

- Recruit a specialist at a station, assign them to a team, upgrade accommodation, and reload.
- Start the optional Morrow specimen investigation; leave during incubation and verify that detection waits for your response without casualties.
- Confirm the creature can be safely purged and casualty records survive reloads.
- Open Hollowmere from Far Wake Settings. Complete its first oath, change class assignments, and return to Far Wake with the original save intact.
- Install Hollowmere separately from its own page; verify that its icon opens the fantasy game while the Far Wake icon still opens the ship game.

## Game-library checks

- Open the site root: both games appear without creating or advancing a save.
- Resume a pre-move Far Wake save through its card; resources and progress remain intact.
- Use All games from either game, then resume either game again.
- Verify selector and game links without horizontal overflow on desktop, phone and tablet.
- Load the selector online once, then open both games and reload their pages offline.
- Existing Far Wake installations retain their manifest identity and receive the new start URL. A standalone root launch redirects to Far Wake, while an explicit All games link opens the selector.
- On the physical iPhone, verify that an existing home-screen icon opens Far Wake after update and that both games can return to the selector. This physical install-upgrade check remains pending.

## v0.3 discovery additions

Automated coverage checks ordinary exploration triggering a silent passenger, delayed threat revelation, safe unattended holds, guaranteed purging, settlement-claim docking requirements, confirmation, persistent standing/history and production offline settlement. Unit tests cover quiet outcomes, weights, introductory protection, uniqueness, cooldown, portable definitions, frame/offline equivalence and schema-2 migration with existing jobs/threats.

Physical iPhone checks remain pending: encounter the new discovery card, verify readable choice effects and visible docking reasons, return to a station, confirm a recipient and reload offline. Verify a surprise passenger stays hidden through reload, then reveals and waits safely when the phone is locked. Export/import existing schema-2 progress into v0.3 and confirm its jobs and crew survive.

## v0.4 generated-name checks

Automated coverage checks seeded variation, distinct roster/catalog names, preview/hire agreement, stable IDs/geography, unchanged outcome RNG, released generation-1 fixtures, generation-2 name snapshots and narrative references. Browser coverage uses generated labels for journeys, crew assignments and faction choices, and verifies legacy imports, read-only-tab updates and reloads retain original names.

Physical iPhone checks remain pending: read longer generated names in the roster, chart, faction headers and choice cards; start another seed through the existing backup/confirmation flow; reload and export/import it offline; restore an old expedition and confirm its names and directions stay consistent.

## v0.5 generated-site checks

Automated checks cover weighted trait generation, stable IDs, valid resources/skills, protected introductory profiles, direct/cautious/specialist tradeoffs, out-of-order exploration, exact costs/returns, rejection reasons, committed save/offline completion and frozen generation-3 catalogs. Released v0.4 job fixtures prove generation-2 exploration outcomes remain unchanged. Browser cases exercise both games on all device projects; production offline checks finish selected sites exactly once without development helpers.

Physical iPhone checks remain pending: survey a location, expand an approach card by touch, read costs/risks/requirements, start a selected site, lock/force-close the app and return. Confirm the selected site completes once, its name is readable, the registry fits portrait/landscape, and completed records cannot be farmed.

## v0.6 discovery-contract checks

Automated checks cover contextual catalogs, valid references, hidden offers before exploration, source eligibility, acceptance/field-role/location/cost checks, active limits, standing, committed work, retained completed receipts, release/reaccept behavior, exact-once filing, offline work/filing, and invalid import references. Fixtures from released v0.5 preserve paid orders and discoveries. Full browser journeys run in both games across all device projects.

Physical iPhone checks remain pending: discover a site, find its follow-up at a hub, read the work supplies and required roles, accept it, navigate back and perform the work, lock/close during the timer, then return to file. Check long generated headings and visible unavailable-action reasons in portrait/landscape.

## v0.7 generated-world checks

Release validation: 120 unit tests, 78 browser cases and 16 production offline cases passed locally and in CI. Live iPhone WebKit checks also passed for generations 3/4 in both games, including chart links and tagged offline journeys. A subsequent compatibility-preparation test covers eight captured schema-3 scenarios; no new personnel mechanic is shipped.

Automated coverage freezes complete old/new catalogs, checks 100 layouts per theme for connected graphs/hubs/valid content, preserves intro routes, saves optional-place travel and explores full campaigns across eight seeds per theme. Browser checks cover real chart edges, 44px non-overlapping targets, imported generated maps, optional destinations, reloads and portrait/landscape overflow. Production cases verify generated travel catches up once and query-string game URLs retain the correct theme offline.

Physical iPhone checks remain pending: export current progress before trying a fresh seed; verify different charts and optional places, first-goal completion, intermediate routes with visible time/cost, recovery from a new place, suspension during travel, and offline reload of a bookmarked URL with a query string. Check names and chart targets in both orientations. Restore an older backup and confirm its map is unchanged.

## v0.8 personnel/opportunity checks

Release validation: 133 unit tests, 81 browser cases and 18 production offline cases passed locally and in CI; targeted checks additionally cover full accommodation, resettlement and new panels in landscape.

Automated coverage verifies schema-1/2/3 migration, all old paid-job fields, zero historical practice, once-only credit to surviving committed specialists, thresholds/caps, injuries/resting/memorials, parallel jobs, actual threat-caused loss, role gates and malformed imports. Opportunity checks cover stable survivor names through other hiring, upgrades/capacity, free resting joins, resettlement, training caps/alternatives, repeated responses and history beyond log truncation. Browser flows cover both themes and device projects; production offline cases settle rescue and training once. Both campaign simulators retain recoverability and pacing.

Physical iPhone checks remain pending: read practice/help on roster rows, finish matching primary/support work while locked and verify one point, import a pre-v0.8 save, find a survivor and hire another specialist before responding, verify the survivor's name stays fixed, fill/upgrade accommodation, confirm join or resettlement, and train/release recovered knowledge offline. Check confirmations, visible unavailable reasons, memorial records and portrait/landscape layout.

Live v0.8 checks passed in iPhone WebKit for both themes: offline rescue joining, knowledge training, durable receipts and real schema-3 parallel-job migration with once-only practice. A following compatibility-preparation test freezes 11 generation-5 discovery responses for future faction projects. Physical-device results remain pending.

## Discovery-driven projects (v0.9) — physical checks pending

- On the physical iPhone 15 Pro Max, use a fresh generation-6 expedition and settle a rescue/knowledge discovery in each game; in Far Wake also check a settlement claim. Confirm the response previews the optional project/patron and the board shows only the actual chosen branch/source.
- Review origin, supplies, required expedition specialist and standing before acceptance. Verify a support cleric must be reassigned for primary consecration work, and disabled actions explain why.
- Accept, travel to the named source, dispatch work, suspend Safari, resume and return to a hub. File once; reload/force-close and verify the receipt/payment remains single. Repeat after installing each game to Home Screen and while offline.
- Check portrait/landscape scrolling, touch controls and long generated names on the project card. Confirm old expeditions retain their catalogs and exports.

Automated browser tests cover desktop Chromium and iPhone/tablet WebKit flows; production offline cases cover completion and filing in both themes. Emulation is not a physical-device pass.

## Expedition planning (v0.10) — physical checks pending

- On the physical iPhone 15 Pro Max, open both a current expedition and an older save with bound discovery work. Use the discovery-work summary to find the board and accepted work. Confirm optional faction projects appear before ordinary offers.
- Review simultaneous missing supplies and specialist assignment gaps. Verify a resting/support specialist is distinguished from an absent/dead specialist and Review team/supplies takes you to usable controls.
- Plot a source route: the correct system/realm and route preview must open, with no supplies spent. Order each leg explicitly, including Far Wake cryosleep confirmation; the remaining route updates after arrival. Check keyboard focus and portrait/landscape scrolling.
- Suspend Safari during paid work. On resume it must not demand the same supplies/staff again; completed receipts must show return-to-hub and filing guidance. Check offline route plotting/explicit travel, reload, and Home Screen launches. Existing saves need no reset.

Automated WebKit emulation does not close these physical-device steps.

## Discovery variety (v0.11) — physical checks pending

- On the physical iPhone 15 Pro Max, use generation-7 expeditions in both games. Review each new discovery’s resources, training/recruitment and standing effects, including the two explicit −6 faction tradeoffs. Confirm safe alternatives remain usable with full accommodation or missing specialists.
- Verify a rescued medic/fighter keeps the displayed name after other hiring, joins resting and cannot join twice. Check training at the cap and the alternative response.
- Accept a support field commission, assign the displayed specialist and travel to the source. Start it beside a primary order; both should retain paid terms after suspension/reload. Departure must wait for support completion, and filing must pay once.
- Try mixed-team work with a required specialist on the wrong team, then reassign correctly. Check role labels and visible reasons in portrait/landscape, offline and from both Home Screen apps. Keep older expedition exports/maps/work unchanged.

Automated iPhone/tablet WebKit coverage remains emulation, not a physical-device result.
