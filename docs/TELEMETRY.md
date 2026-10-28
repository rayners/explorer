# PostHog usage and error tracking — pending implementation

User request, 2026-10-28: add PostHog tracking to the games following the clicker examples, limited to usage data and error capture, with no personally identifiable data. **Nothing in this document describes shipped telemetry.** Current release v0.13 has no PostHog integration. Connection/handoff status is in [STATUS.md](STATUS.md).

## References inspected

The local sibling repository is a reference, not a runtime dependency:

- `../clicker/src/engine/posthog.ts`: lazy SDK loading, usage/error listeners and a gated sink.
- `../clicker/src/engine/telemetry.ts`: state-diff events, bounded buffering, device-wide opt-out and production gating.
- `../clicker/docs/TELEMETRY.md`: collected data, project privacy assumptions and event catalog.
- `../clicker/package.json`: its PostHog SDK dependency. Explorer has not added one.

Clicker's adapter uses PostHog US cloud (`https://us.i.posthog.com`) and a public ingestion key in its source. The key was inspected but is not duplicated here. Confirm the intended project before configuring Explorer; no project, dashboard or account changes have been made.

## Privacy boundary to preserve

The user's requirement is stricter than merely disabling autocapture. Clicker's implementation is a starting pattern, **not proof that copying it meets this request**:

- Keep telemetry outside `src/engine/`; derive bounded usage events in the browser layer. Never spread a game state, command payload, event parameters, browser storage or DOM content into analytics.
- Exclude crew/location/faction names, seeds, save/import/export contents, free-form input, filenames supplied by players, and user/account identifiers. Plan a small allowlist of event names, low-cardinality game/view/activity categories and coarse numeric usage measures.
- Disable automatic DOM/page/click collection, session replay, surveys, feature-flag loading and unrelated remote behavior. Verify actual SDK/network behavior rather than relying on configuration names alone.
- Review SDK-added identity, URLs, query strings, fragments, referrers, device metadata and IP/GeoIP handling before enabling delivery. A persistent random ID can link visits; choose and document the minimum identity strategy rather than assuming it is anonymous.
- Raw error messages/rejection values and stack metadata may contain arbitrary or user-derived text. Design sanitized error capture and inspect the final outgoing payloads; do not forward arbitrary errors unchanged.
- Clicker's documentation says its project discards client IP data. That setting, its current state and its applicability to Explorer are **unverified**. Confirm appropriate server-side privacy settings with the connected project; distinguish transport visibility from stored event properties.
- Never put personal API keys or OAuth credentials in source or the client bundle. A public ingestion key alone does not configure server-side privacy settings.

These are implementation review constraints under the user's privacy requirement. Exact SDK settings, event schema, identity/persistence policy and target project remain to be established and tested.

## Intended implementation work

1. Verify the PostHog app/tools and project under the current skill; consult current primary documentation for SDK behavior and privacy controls.
2. Record an explicit event/property allowlist and sanitized error schema. Cover both games; library usage may follow clicker's visit pattern as a deliberate documented choice. Do not report historical imports or secondary-tab updates as newly played milestones.
3. Add a shared browser adapter with production/canonical-host gating, development/test exclusion, player opt-out and failure isolation. Keep rendering, commands, saves, offline play and library read-only behavior usable when telemetry is blocked or unavailable.
4. Test the **actual serialized network payloads**, including SDK defaults and malicious/free-form error/query/import text. Check opt-out before buffered sends and errors; check independent game saves, single-writer/lifecycle behavior, offline operation and no development traffic.
5. Update player-facing privacy/settings text, README claims about outbound traffic, architecture, sources and this document with exactly what is sent. Retain state schema 5, envelope 1, generation catalogs and browser namespaces unless a separately justified change is needed.
6. Run appropriate unit/type/build/browser/offline checks, publish through the existing authorized GitHub/Pages workflow, and verify affected live routes. Do not claim successful ingestion or no stored personal data without evidence from the configured project and inspected payloads.

No SDK version, dashboard, live ingestion verification, event schema or project privacy configuration has been selected/validated yet. The autonomous roadmap remains paused; this checklist is restart preparation, not permission to resume it automatically.
