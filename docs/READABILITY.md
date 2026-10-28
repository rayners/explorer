# Readability and action hierarchy

Implemented for v0.12, 2026-10-28, under the ongoing roadmap instruction. The independent [visual review](reviews/VISUAL-DESIGN-REVIEW-2026-10-28.md) supplies evidence; its recommendations were proposals. This document selects a bounded first slice, rather than treating every recommendation as approved scope. Publication evidence is tracked below and in the roadmap.

## Goal

Make the next meaningful action easy to find in both games, while preserving their pixel scenes, atmosphere and explicit orders. Improve existing expeditions without resetting their catalogs or changing economy, timers, participants or saves.

## Chosen scope

- Place each overview's current directive before its scene. Preserve Far Wake's existing guidance; give Hollowmere state-aware guidance for its first oath, travel, survey and filing, then ordinary exploration. Directives navigate to existing controls or issue an explicitly labelled existing acceptance command.
- Give accepted bound work a shared compact card: title and source, readable status, exact work supplies/team, next step, visible blockers and the existing dispatch action. Keep paid work/receipts visible without asking for costs or staffing again. Put narrative/provenance and full route estimates in a native expandable section; missing supplies, staffing and unknown-route warnings stay visible.
- Increase decision prose and essential metadata sizes. Let the five-resource strip wrap into fewer columns on narrow phones instead of shrinking stock labels. Preserve all resource names and units, visible unavailable reasons, keyboard focus, 44px controls and safe-area padding.
- Compact repeated headings on operational tabs. Add a short-height landscape composition that retains labelled navigation and makes useful content reachable, without forcing all information into one screen.
- Retain the library/artwork and map mechanisms. New portraits/icons, chart redesign, economy/session-cadence changes and lasting world effects remain later design candidates.

## Boundaries and verification

This is a browser presentation change. Engine, generation versions 1–7, state schema 4, save envelope 1, identities, paid jobs, storage namespaces, manifests and RNG stay unchanged. Existing dispatch checks remain authoritative; expanding a brief, following guidance or opening a route must not spend resources or start work.

Verify directive transitions and accepted-work ready/blocked/committed/completed states in both themes, with special attention to wrong-team requirements and paid jobs after roster changes. Browser checks cover initial viewport action visibility, readable labels, expanded details and explicit dispatch, portrait/landscape overflow and keyboard access. Run unit/type/build, existing browser/offline suites and inspect screenshots at desktop, phone portrait and phone landscape sizes. Layout changes do not require a new logistics simulator policy; retain existing balance fixtures. Physical iPhone Safari/zoom/safe-area acceptance remains pending.

After this slice, design an expedition-value/session-cadence audit, then consider one visible changed-place consequence per theme and contextual discovery selection. These later candidates require their own bounded designs and compatibility decisions.

## Implementation and validation

`boundWorkCard` in the shared mission panels renders existing planning phases, with requirements and dispatch before expandable narrative. `preparationPanel` keeps gaps/order restrictions visible and collapses the full itinerary/supply estimate. Completed receipts retain their return/filing controls; paid work shows its commitment without asking for supplies or replacement staff. Expanding a brief is temporary native DOM state and may reset on a simulation transition.

Far Wake retains its existing guidance; `fantasyGuidance` follows the first oath and prioritizes actual encounters/revealed threats without exposing hidden onset. Both overview directives precede the scenes. Shared styles enlarge prose/metadata, balance the phone stock strip into three then two cells, retain labelled navigation and compact short-height framing. The library and artwork are unchanged; current game screenshots have been refreshed.

Local validation: 154 unit tests, 105 browser cases and 30 production offline cases, typecheck and Pages-base build passed. The final resource-row adjustment also passed the focused browser checks. Existing catalog/save compatibility fixtures remain unchanged. Phone portrait/work cards and both short landscape openings were visually inspected. These are Chromium/WebKit emulation results, not physical iPhone acceptance. Costs/timing/engine behavior did not change, so no new logistics simulator policy was required.

Delivery: feature `c0f91d1` passed [Pages workflow 40743930314](https://github.com/rayners/explorer/actions/runs/40743930314) and deployed successfully. Canonical live iPhone WebKit checks verified the library, both portrait/landscape directives, readable stock labels, offline brief expansion without spending, explicit support-job costs and the same paid job/inventory after offline reload. Production development helpers remain absent. Physical iPhone checks remain pending.
