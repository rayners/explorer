# Destination-based expedition comparison

Next bounded design, 2026-10-28, under ongoing roadmap authorization, after [explicit hub work](WATCHES.md). The [audit](EXPEDITION-AUDIT.md) shows that nearby hubs and same-destination work can materially improve return-trip efficiency. Implemented and published in v0.15; release evidence is recorded below and in [STATUS.md](STATUS.md).

## Goal

Help a player answer “What useful work can I do here, and where can I stage or file it?” from actual discoveries and accepted contracts. Compare destinations without reading every long offer or assuming all potential projects occur. Retain individual preparation, exact choice/source eligibility and explicit commands.

## Selected first slice

- Add a shared compact destination overview to the board/work views, grouping only discovered, unclaimed bound contracts by their actual source. Distinguish available offers, accepted unfinished work, committed jobs and completed receipts. Never expose an unselected project branch or an unexplored source.
- Let each group show concise contract purposes and link to the existing individual brief. Opening a brief changes view/focus only. Reuse ordinary acceptance/field-work/filing controls rather than adding a batch command.
- Compare the current known route to that source and a reachable known nearby hub. Label travel-only estimates distinctly from work costs. Show missing/unknown routes without pricing them as free. Use actual effective routes, not authored endpoints or geographic distance.
- Show aggregate unstarted work/supply estimates only for actual accepted unfinished work at that destination. Count shared outbound/return travel once rather than summing each contract's individual round trip. Exclude already-paid costs/staffing and completed receipts; display committed remaining work separately without repricing it. State that unstarted durations are conservative serial estimates: support/primary scheduling and reassignment stay explicit. Unaccepted offers are possibilities, not an automatically selected bundle.
- Show the three-contract capacity in context, counting authored contracts and receipts too. A destination with many offers must not imply they can all be accepted together. Filing remains available at any service hub; the nearby-hub suggestion does not become a mandatory recipient.
- During travel/recovery, defer route estimates until arrival. Keep paid-watch/work terms and receipts readable without asking to fund or staff them again. Do not calculate a new journey from an in-transit departure location.
- A completed receipt needs a route from the current location to a known filing hub, never a trip back to its source. If a group contains only receipts, omit the source expedition estimate and show filing guidance. Use stable contract/location IDs for links; generated display names are labels, not identity.

## Boundaries

This is a read-only planning/UI slice, not a new mission lifecycle. Reuse `missionDiscovered`, existing accepted-work state, `expeditionPlan`, `planRoute` and `knownHubRoute`. Preserve state schema 5, envelope 1, generations 1–7, namespaces, manifests, catalogs and outcomes. New discovery content, changed-place effects, automatic scheduling, recommended purchases and reward rebalancing are separate work.

Keep a small player-facing summary; do not introduce scoring formulas or display hypothetical catalog totals as available content. Existing full cards remain accessible, with visible unavailable reasons, safe alternatives and payment/risk terms. Use readable type, keyboard focus and 44px controls; verify phone portrait and short landscape.

## Acceptance contract

Implementation choices (2026-10-29): keep the pure selector in the UI planning layer. Entries use stable mission/activity/source IDs and one of offer, unstarted, committed or receipt. Only known, discovered sources participate. Combine accepted unstarted work costs and conservative serial durations; expose a shared total only when both source and nearby-hub routes are known. Unknown travel stays unpriced, with work supplies still shown separately. Receipts always have separate current-to-filing-hub guidance; receipt-only groups have no source journey. Paid job remainders use existing slot timers. Brief controls focus the existing board/work card; they carry no engine command. Capacity counts every unclaimed contract, including authored work and receipts. Destinations with accepted work appear before offers-only destinations; within them, accepted/committed work and receipts precede offers. Expanded groups put cost/readiness/filing information before long review labels, following the existing readability hierarchy.

Start with a pure destination selector and behavior tests for discovery gating, real chosen projects, contract capacity, unknown routes, nearby hubs, mixed primary/support roles, paid jobs after roster loss, completed receipts and transit. Then add shared summary markup and navigation-only brief links to both mounts. Browser checks must prove opening a group/brief/route neither accepts nor dispatches nor spends, retains keyboard focus, and fits older/current saves. Production offline checks should restore summaries and preserve exact paid outcomes. Physical iPhone acceptance remains pending.

Following design: one visible changed-place consequence per theme in [FACILITIES.md](FACILITIES.md), then contextual discovery selection. Those later mechanics need their own compatibility/outcome designs; they are not implemented by grouping existing offers.

## Implementation (v0.15)

`src/ui/destination-planning.ts` derives stable-ID groups using `missionDiscovered`, existing accepted work, `expeditionPlan`, `activityDuration`, `planRoute` and `knownHubRoute`. It never mutates definitions/state or consumes outcome randomness. Offers, unstarted accepted work, committed jobs and receipts remain distinct. Only accepted unstarted work contributes to the combined supply/time estimate; the shared journey is counted once. Missing routes yield no priced total. Receipts retain independent current-to-hub filing guidance; receipt-only groups omit source journeys. Travel/recovery defers route estimates. Capacity includes all unclaimed contracts, including authored contracts and completed receipts.

`src/ui/destination-panels.ts` renders shared native details groups on both board/work screens. Accepted destinations come first and estimates precede long review labels. Individual review controls switch the themed view and focus an existing stable-ID brief heading; route controls reuse the existing chart preview. No review control carries an engine command. Committed job remainders use the existing primary/support timer updates. Existing full preparation cards, authoritative dispatch errors and paid receipts remain accessible.

No save envelope/state schema, generator version, catalog, outcome, namespace, manifest, cost/timing or telemetry schema changes. Physical iPhone acceptance remains pending.

## Rendered checks

Retained final production-preview captures: [Far Wake phone](screenshots/destinations-far-wake-phone.png) and [Hollowmere phone](screenshots/destinations-hollowmere-phone.png). Both portrait and 932×430 landscape were inspected without horizontal overflow. The captures show shared estimates before individual review controls and actual staffing gaps. These are automated iPhone WebKit previews, not physical-device acceptance.

## Local validation

175 unit, 117 browser, 12 telemetry and 38 production offline checks passed, together with strict typecheck/Pages build, formatting and documentation links. Coverage includes exact discovery choices, shared route costs, capacity, unknown/transit routes, paid work after casualties, receipt-only groups, generations 1–7/save restoration, navigation-only focus, old/current offline summaries and unchanged committed terms. No engine, content, balance or persistence changes; the logistics simulators need no new assumptions. [Pages workflow 40944395989](https://github.com/rayners/explorer/actions/runs/40944395989) passed all suites and published feature `77a04f4`. Live iPhone WebKit checks passed both games for offline review/route focus with unchanged orders/supplies, receipt guidance, one explicit filing/payment and durable reload, plus the offline library Resume link. Physical-device checks remain pending.
