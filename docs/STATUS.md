# Development handoff

Updated 2026-10-29. Read after [AGENTS.md](../AGENTS.md). Verify current checkout, tools and external workflow state before continuing.

## Current release

- **0.14.0 is published**, feature commit **`3228b9c`**. [Pages workflow 40939176487](https://github.com/rayners/explorer/actions/runs/40939176487) succeeded after all release gates. The follow-up handoff commit records evidence and clarifies one settings sentence; inspect its workflow separately if checking latest HEAD.
- Both games and the library have limited PostHog usage/sanitized-error tracking, a shared opt-out, browser privacy-signal support and failure isolation. [TELEMETRY.md](TELEMETRY.md) records the exact payload, limitations and build configuration.
- CI passed **167 unit tests**, **111 game browser cases**, **12 production telemetry cases**, **34 production offline cases**, strict typecheck/Pages build. Local game run passed 110 initially; one tablet case interrupted by navigation passed its targeted rerun, and CI subsequently passed the entire suite cleanly. Final output precaches 24 local assets (~282 KiB). No balance/logistics changes required simulator reruns.
- Live iPhone WebKit verification passed library/both game routes, successful commands, sanitized exception capture, readable settings/no portrait overflow and cross-game/library opt-out. Six known verification events returned HTTP 200 and were found through a narrow PostHog lookup. Stored records had no IP/GeoIP enrichment and person processing disabled. Exception metadata contained the sanitized value only, with no sources/functions/stack. This is automated WebKit evidence, not a physical iPhone result.
- PostHog active project **677229** matches clicker's public configuration. `anonymize_ips: true` was verified again before inspecting our own release-check events. Both public repository build variables are configured. No organization/project settings changed; no SDK dependency remains. Taxonomy discovery returned an internal UNAVAILABLE error; schema metadata and a narrow point lookup of only the known test-page IDs succeeded instead. This did not block ingestion verification.
- Envelope **1**, state schema **5**, content generations **1–7**, fresh default **7**, save/preferences/locks and manifest identities remain unchanged. Both games retain 15-minute/one-hour/eight-hour safe work. Physical iPhone checks remain pending in [ACCEPTANCE.md](ACCEPTANCE.md).

## Active roadmap

The user explicitly resumed the autonomous roadmap after restart. Tracking is delivered. **Next: implement the prepared read-only destination bundles in [BUNDLES.md](BUNDLES.md)**, using actual discovered/accepted contracts, shared route costs and known filing hubs. The design is written; no destination-bundle code exists yet. Changed-place consequences and contextual discovery selection follow as design candidates. Full roguelite campaigns/resets remain deferred. Keep the full ongoing goal active: this release is a milestone, not completion of the entire roadmap.

## Next work

1. Inspect `git status` and current HEAD; finish any pending follow-up deployment verification. Do not infer publication from a push alone.
2. Read BUNDLES, PLANNING and relevant selectors/tests. Current preparation lives in `src/ui/expedition-planning.ts`; route/card presentation in `src/ui/planning-panels.ts`. Start with a pure selector and behavior tests before both themed mounts.
3. Preserve discovery/choice gating, old catalogs, paid jobs, receipt-only return guidance, transit deferral, three-contract capacity and explicit acceptance/dispatch. No batch commands or saved view state.
4. Validate unit/type/browser/offline behavior, publish through main/Pages, verify live affected routes, and update the roadmap/handoff evidence.

Temporary `/tmp` scripts/screenshots are not durable handoff dependencies. Repository tests, fixtures, design documents and linked CI runs are retained evidence. Do not rely on temporary anonymous verification IDs for future tasks.
