# Development handoff

Updated 2026-10-29. Read after [AGENTS.md](../AGENTS.md). Verify current checkout, tools and external workflow state before continuing.

## Current release and work

- Published baseline is **0.13.0**, latest implementation `a94b016`. Docs handoff `08901db` [Pages workflow](https://github.com/rayners/explorer/actions/runs/40753141182) succeeded, rechecked on resuming work.
- **0.14.0 is implemented locally, not yet published.** Shared usage/sanitized-error tracking and opt-out are in [TELEMETRY.md](TELEMETRY.md); full release validation and live verification are in progress. Do not claim live tracking yet.
- PostHog tools respond after restart. Sole accessible project **677229** matches clicker's configuration and has **anonymize_ips: true**, verified through `project-get`; no project settings changed. Explorer uses a direct capture API adapter rather than the SDK after privacy/lifecycle review. Build configuration is in ignored `.env.local`; both repository Actions variables are configured and their names verified before publication.
- Local validation: **167 unit tests**, strict typecheck/Pages build and **12 production telemetry cases** pass. The game suite passed 110/111 initially; one tablet case was interrupted by a navigation while evaluating overflow and passed its targeted rerun. **34 offline cases** passed before the final typography-only adjustment; CI will run all suites on the final commit. Final output precaches 24 assets (~282 KiB). Physical-device checks remain pending.
- Envelope **1**, state schema **5**, content generations **1–7**, fresh default **7**, storage namespaces and manifest identities remain unchanged. Both games retain 15-minute/one-hour/eight-hour safe work. Physical iPhone checks remain pending in [ACCEPTANCE.md](ACCEPTANCE.md).

## Active roadmap

The user explicitly resumed the autonomous roadmap after restart. Complete tracking validation, docs, publication and live payload/ingestion verification first. Then implement the prepared read-only destination bundles in [BUNDLES.md](BUNDLES.md). Changed-place consequences and contextual discovery selection follow as design candidates. Full roguelite campaigns/resets remain deferred. Keep the full ongoing goal active until its actual scope is satisfied; a release is a milestone, not completion of the entire roadmap.

## Next verification steps

1. Inspect `git status` and pending diff; finish expanded payload tests and any privacy/lifecycle fixes. Keep telemetry out of engine/state and preserve ordinary gameplay even when storage/network/analytics fails.
2. Preserve the configured public `VITE_POSTHOG_TOKEN` / `VITE_POSTHOG_HOST` repository build variables, referenced by Pages workflow. No admin/OAuth credentials belong in source or bundle.
3. Run `npm test`, `PAGES_BASE_PATH=/explorer/ npm run build`, `npm run test:telemetry`, `npm run test:e2e`, `PAGES_BASE_PATH=/explorer/ npm run test:offline`. Tests intercept telemetry; no synthetic private data should enter PostHog.
4. Update release evidence, push main under ongoing authorization, wait for Pages success, verify live library/game routes and sanitized payloads plus narrowly scoped ingestion/privacy evidence using PostHog tools. Do not report publication before deployment succeeds.
5. Record pending physical-device checks honestly; browser WebKit is emulation. Proceed to destination bundles after verified delivery.

Temporary `/tmp` scripts are not durable handoff dependencies. Repository tests/fixtures/designs and CI links are authoritative retained evidence.
