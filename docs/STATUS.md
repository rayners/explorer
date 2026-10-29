# Development handoff

Updated 2026-10-29. Read after [AGENTS.md](../AGENTS.md). Verify current checkout, tools and external workflow state before continuing.

## Current release

- **0.15.1 is published**, final implementation **`38f47f5`**, following the recruitment-name fix **`c3028f0`**. [Final Pages workflow 40951200516](https://github.com/rayners/explorer/actions/runs/40951200516) succeeded; the earlier [workflow 40950355182](https://github.com/rayners/explorer/actions/runs/40950355182) also succeeded.
- The user reported every hireable role showing the same name. Shared recruitment now allocates distinct deterministic candidates and hires exactly the displayed identity. The UI binds the selected serial and rejects stale offers before payment. Existing crew, memorials and reserved survivors keep their names. Unselected gaps remain reusable and free emergency recovery has priority near the archive bound. No reset is needed. [NAMES.md](NAMES.md) records the design and compatibility details.
- Final local validation: **181 unit, 120 browser, 12 telemetry and 40 production offline cases**, strict typecheck/Pages build and both campaign simulators. Final CI passed all gates. The telemetry harness drains mocked requests before closing contexts and verifies names/command arguments remain excluded on hiring. The production build precaches 24 assets (~291 KiB).
- Live iPhone WebKit checks passed both games with generation-1 and generation-7 saves: four distinct visible candidates, explicit preview serials, a non-first hire matching its displayed name after offline reload, unchanged existing crew and unchanged outcome RNG, with no portrait overflow. Usage sharing was disabled for live fixtures. This is automated WebKit evidence, not physical-device acceptance.
- v0.15 destination comparison remains published and tested: [BUNDLES.md](BUNDLES.md). v0.14 tracking retains its documented privacy contract and verified project configuration: [TELEMETRY.md](TELEMETRY.md).
- Envelope **1**, state schema **5**, content generations **1–7**, fresh default **7**, save/preferences/locks and manifest identities remain unchanged. `recruitSerial` is a bounded high-water mark; saved shapes and frozen name functions/catalogs are unchanged. Physical iPhone checks remain pending in [ACCEPTANCE.md](ACCEPTANCE.md).

## Active roadmap

The user explicitly resumed the autonomous roadmap after restart. Tracking, destination comparison and the reported recruitment-name correction are delivered. **Next: implement the bounded lasting-place design in [FACILITIES.md](FACILITIES.md)**: an earned, limited field resupply point per theme, activated by exact source-bound commission filing. This design is written but unimplemented. It proposes content generation 8 while preserving 1–7 and deriving activation from existing claimed missions; confirm that no saved-shape change is needed before implementation.

Contextual discovery selection follows under its own design. Full roguelite campaigns/resets and autonomous factions remain deferred. Keep the full ongoing goal active: a verified release is a milestone, not completion of the entire roadmap.

## Next work

1. Inspect `git status` and current HEAD; verify any follow-up handoff workflow independently. Do not infer publication from a push alone.
2. Read FACILITIES and relevant contracts/content tests before changing mechanics. Capture released generation-7 catalogs and paid/completed project fixtures first. Do not silently upgrade old content generations.
3. Reuse existing trade commands, prices/cargo limits and claimed receipts; keep limited field resupply separate from full-hub services and explicit filing. No passive rewards or automatic commands; preserve paid orders and recovery.
4. Validate unit/type/browser/offline behavior and logistics probes, publish through main/Pages, verify live affected routes, and update the roadmap/handoff evidence.

Temporary `/tmp` scripts are not durable handoff dependencies. Repository tests, fixtures, design documents, retained captures and linked CI runs are the lasting evidence. Current publication's live checks explicitly disabled usage sharing to avoid adding fixture activity to analytics.
