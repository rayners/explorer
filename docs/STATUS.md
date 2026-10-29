# Development handoff

Updated 2026-10-29. Read after [AGENTS.md](../AGENTS.md). Verify current checkout, tools and external workflow state before continuing.

## Current release

- **0.15.0 is published**, feature commit **`77a04f4`**. [Pages workflow 40944395989](https://github.com/rayners/explorer/actions/runs/40944395989) succeeded after all release gates.
- Both games' board/work views have **Work by destination**. It groups only actual discovered contracts, prioritizes accepted work and separates offers, unstarted work, committed jobs and receipts. Shared route/work estimates count travel once, preserve paid terms and leave unknown/transit routes unpriced. Review links focus existing briefs; route links preview without departing. Design and retained phone captures: [BUNDLES.md](BUNDLES.md).
- **175 unit, 117 browser, 12 telemetry and 38 production offline cases** passed locally and in CI, with strict typecheck/Pages build. Output precaches 24 local assets (~289 KiB). No engine, content, logistics or persistence changes required simulator reruns.
- Published iPhone WebKit checks passed both games for offline summary/brief/route navigation without changing orders or inventory, focused headings, completed receipt guidance and explicit exact-once filing/payment after reload. The library remained available offline with Resume labels. These are automated WebKit results, not physical iPhone acceptance.
- PostHog tracking remains as delivered in v0.14: browser-only allowlisted usage/sanitized errors, shared opt-out and privacy signals, no persistent player identity. [TELEMETRY.md](TELEMETRY.md) records its verified project/settings/ingestion evidence. Both public Actions build variables remain configured; no analytics schema change in v0.15.
- Envelope **1**, state schema **5**, content generations **1–7**, fresh default **7**, save/preferences/locks and manifest identities remain unchanged. Physical iPhone checks remain pending in [ACCEPTANCE.md](ACCEPTANCE.md).

## Current priority — recruitment names (v0.15.1, local)

The user reported identical names across hireable roles. Confirmed: all role previews used the same next serial. A shared pure candidate allocator now previews distinct unused serials and the successful hire uses the selected preview. It reuses unselected gaps and protects memorial/survivor identities, without changing frozen grammars/catalogs or saved names. Counter remains a bounded high-water mark; failed commands/previews do not reserve people. No schema/generation/save-key changes or reset required. Local validation passed: **180 unit, 120 browser, 12 telemetry and 40 offline cases**, strict typecheck/Pages build and both campaign simulators. Frozen catalogs and released save checks passed; no new state or content generation. Publication/live verification pending. This bug fix takes priority over facilities.

## Active roadmap

The user explicitly resumed the autonomous roadmap after restart. Tracking and destination comparison are delivered. **Next: implement the bounded lasting-place design in [FACILITIES.md](FACILITIES.md)**: an earned, limited field resupply point per theme, activated by exact source-bound commission filing. This design is written but unimplemented. It proposes content generation 8 while preserving 1–7 and deriving activation from existing claimed missions; confirm that no saved-shape change is needed before implementation.

Contextual discovery selection follows under its own design. Full roguelite campaigns/resets and autonomous factions remain deferred. Keep the full ongoing goal active: a verified release is a milestone, not completion of the entire roadmap.

## Next work

1. Inspect `git status` and current HEAD; verify any follow-up handoff workflow independently. Do not infer publication from a push alone.
2. Read FACILITIES and relevant contracts/content tests before changing mechanics. Capture released generation-7 catalogs and paid/completed project fixtures first. Do not silently upgrade old content generations.
3. Reuse existing trade commands, prices/cargo limits and claimed receipts; keep limited field resupply separate from full-hub services and explicit filing. No passive rewards or automatic commands; preserve paid orders and recovery.
4. Validate unit/type/browser/offline behavior and logistics probes, publish through main/Pages, verify live affected routes, and update the roadmap/handoff evidence.

Temporary `/tmp` scripts are not durable handoff dependencies. Repository tests, fixtures, design documents, retained captures and linked CI runs are the lasting evidence. Current publication's live checks explicitly disabled usage sharing to avoid adding fixture activity to analytics.
