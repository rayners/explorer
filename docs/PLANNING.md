# Expedition planning and discovery-work guidance

Implemented design for v0.10, approved by the user's “Makes sense. Do it” after the proposed planning/readability slice. Implementation and publication status are tracked in [ROADMAP.md](ROADMAP.md).

## Goal and observed gaps

The v0.9 UI puts faction projects after the long ordinary board. Work briefs list supply costs but do not compare them with stock or assigned specialists. Accepted work is below ordinary activities/site registries, and its source must be found manually in a separate map. Existing map itineraries already show travel costs but are not connected to contracts. These observations come from inspecting both mounts and shared panels; physical iPhone acceptance is still pending.

## Bounded design

- Surface counts of unlocked faction projects, accepted discovery work and completed receipts near the top of both games, with links to the board/work view. Put unlocked faction projects before ordinary board offers. Do not describe old offers as newly discovered after every reload: counts are derived from current eligibility, without a new unread ledger.
- Give all bound discovery contracts (including generations 3–5) a next step: accept at a hub, prepare, travel to source, perform work, wait for committed work, return to a hub or file. Authored contracts without bound field work retain their existing objective guidance.
- Compare required work supplies and assigned living specialists with current availability. Distinguish missing specialties from existing specialists on another team. Show outbound/work/return supply estimates separately and an aggregate shortage checklist. Use the shortest known-time route and nearest reachable known service hub for return estimates. A missing route is explicitly unpriced, never treated as free or ready. Hazard losses, future market stock and optional activities are outside the estimate.
- Already committed work must never be labelled as needing payment/staffing again, including after casualties. Completed receipts need only return travel/filing. Show encounters and other current order restrictions using authoritative engine dispatch errors. Injury is not a new staffing restriction.
- “Plot route to source” / “Plot route to hub” opens the proper map region and an accessible focused route preview. The preview shows total time, fictional days, supplies, shortages and the next leg. Only an explicit next-leg command spends supplies. Every leg remains separately ordered. During transit/recovery, wait for arrival before calculating remaining routes from the old location.
- Planning selections are temporary view state, cleared when an import leaves the target invalid, or on ordinary region selection. No automatic purchases, reassignment, acceptance, departure or filing. No new content generation, save schema, namespace, browser preference or migration. Existing generations 1–6 stay frozen.

## Architecture and checks

Shared pure selectors in `src/ui/expedition-planning.ts` derive preparation/phase information from definitions/state and existing navigation; shared panels render it for both mounts. Engine dispatch remains the authority for commands. No engine/theme IDs or outcome RNG change.

Test phase transitions, simultaneous stock/assignment gaps, missing/dead specialists, unknown/disconnected paths, aggregate travel/work/return stock, committed casualties and retained receipts. Browser checks cover both themes, project visibility, shortages, correct-region route opening, no dispatch from plotting, explicit multi-leg navigation, reload and phone/tablet/desktop layouts. Production offline checks cover route opening and durable save behavior. Run frozen catalogs/save fixtures and required build/browser checks; physical iPhone Safari/Home Screen checks stay explicitly pending.

## Implementation notes

`expeditionPlan` derives phases, current dispatch restrictions, simultaneous resource/staffing gaps and complete known-route estimates. `knownHubRoute` chooses the fastest reachable known hub, never an uncharted destination. Completed work excludes all already-paid supplies and staffing. In-transit views wait for arrival rather than estimating from the departure location. The definition/state inputs and outcome RNG remain unchanged.

`planningSummary` links to boards and accepted work; `projectOffers` places optional faction commissions first. `preparationPanel` shows checklists inside both contract and activity cards. Ordinary unaccepted follow-ups keep their detailed preparation collapsed so larger boards remain scannable. Completed receipts are retained in the work view until filed. Existing mission acceptance, command checks and replay protection remain authoritative.

`routePlanPanel` opens above the existing map and focuses its heading. Each mount selects the target region, retains that target across arrivals, and recalculates the remaining itinerary after each separately ordered leg. Ordinary region selection clears the temporary target; reload does not persist it. Review-team/supplies controls move keyboard focus to the appropriate existing controls. Plotting and reviewing never issue commands. Existing cryosleep confirmation remains required.

No game definitions, engine costs/timing, content generation, save state/envelope, manifests or browser namespaces changed. All generation-1–6 full catalog fixtures and released save outcomes remain compatibility checks. The existing campaign simulators need no new balance assumptions because simulation behavior is unchanged.

## Local verification

143 unit tests, 90 browser cases and 24 production offline cases passed, together with typecheck, Pages-base production build, local documentation links and `git diff --check`. Browser coverage includes multi-leg Far Wake cryosleep confirmation, fantasy recruitment/assignment, correct-region focused previews, no dispatch on plotting, preparation gaps, retained receipts and reload in Chromium/iPhone WebKit/tablet WebKit. Production offline tests cover generations 3 and 6 in both themes. Phone route/work screenshots were inspected; this remains emulation, with physical Safari checks pending. Frozen generation-1–6 catalogs and released save fixtures pass unchanged.

## Delivery evidence

Feature commit `1e7d9e6` passed [Pages workflow 40704011179](https://github.com/rayners/explorer/actions/runs/40704011179) and deployed successfully. Published iPhone WebKit checks passed in both games for generations 3 and 6: offline receipt guidance, focused hub routes, no departure on plotting, explicit travel costs and durable saves after reload. Current project checks also verified prioritized offers, simultaneous preparation gaps, correct-region source routes and no automatic dispatch; the library routes passed. Physical iPhone checks remain pending.

Follow-up `e340498` restores two dependency version labels to their unchanged locked downloads (`regjsgen` and `source-map`, both 0.8.0). No dependency payload, integrity hash or gameplay changed. Future release bumps must edit only the root package version fields.
