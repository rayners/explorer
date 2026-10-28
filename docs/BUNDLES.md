# Destination-based expedition comparison

Next bounded design, 2026-10-28, under ongoing roadmap authorization, after [explicit hub work](WATCHES.md). The [audit](EXPEDITION-AUDIT.md) shows that nearby hubs and same-destination work can materially improve return-trip efficiency. This document focuses implementation; no destination-group UI is shipped yet.

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

## Acceptance and next implementation

Start with a pure destination selector and behavior tests for discovery gating, real chosen projects, contract capacity, unknown routes, nearby hubs, mixed primary/support roles, paid jobs after roster loss, completed receipts and transit. Then add shared summary markup and navigation-only brief links to both mounts. Browser checks must prove opening a group/brief/route neither accepts nor dispatches nor spends, retains keyboard focus, and fits older/current saves. Production offline checks should restore summaries and preserve exact paid outcomes. Physical iPhone acceptance remains pending.

After verified delivery, design one visible changed-place consequence per theme, then contextual discovery selection. These later mechanics need their own compatibility/outcome designs; they are not implemented by grouping existing offers.
