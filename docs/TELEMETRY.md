# PostHog usage and error tracking (v0.14)

## Active implementation design (2026-10-28)

The user resumed roadmap work after restart. PostHog tools now respond. The sole accessible project, **677229**, matches clicker's public token and configured clicker URL; its `anonymize_ips` setting is **true**, checked through `project-get`. No project settings were changed. Explorer will use that project with a distinct `app: explorer` property.

Use PostHog's documented capture HTTP API with memory-only identity, no person processing, no GeoIP, and a final event/property allowlist. Never identify players. Identity resets on page load; cross-session retention and unique-player counts are deliberately unavailable. Network transport necessarily exposes IP/user agent to the receiving server; neither belongs in our event payload. Suppress referrers and credentials in fetch configuration. The verified project setting discards client IP data from stored events.

Events: `explorer_opened`, successful `explorer_order` (command type only), `explorer_progress` (allowlisted completion kind only), `explorer_sitting` (whole visible minutes capped at 1,440), and sanitized `$exception`. Common fields are fixed app/surface, release and telemetry schema version. Errors carry only a standard error class, error/rejection origin and bounded line/column; arbitrary messages, stacks and filenames are excluded. This trades diagnostic detail for the requested privacy boundary. Imported/restored/offline history and secondary-tab updates do not generate progress. No saved gameplay data changes.

Enable only production HTTPS canonical `/explorer/` routes with build-time configuration, excluding debug queries. Drop offline events without queuing or retries, cap page volume, recheck sharing immediately before transmission, and isolate failures from gameplay. Honor browser DNT/GPC. A persistent device preference shared by library and games permits opt-out; storage access failure disables sharing. Expose the same accessible privacy control in both settings dialogs and library footer. Keep saves/preferences/locks otherwise independent.

The public token/host are build configuration, with ignored `.env.local`, blank `.env.example` and GitHub repository build variables. No personal/admin API credentials enter the bundle. Validate real serialized requests in production browser tests, including malicious URL/error text, failed requests, opt-out, reload, read-only tabs and offline play, before release.

The latest browser SDK (1.441.2) was inspected and removed before implementation. Its automatically enriched properties and retry queue add avoidable privacy/lifecycle complexity for this narrow request. Direct capture follows the same gated browser-adapter pattern as clicker while allowing explicit `credentials: omit`, `referrerPolicy: no-referrer`, no retry queue and no remote feature requests. This is an intentional implementation choice, not a copy of clicker's SDK integration. References: [capture API](https://posthog.com/docs/api/capture), [anonymous events](https://posthog.com/docs/data/anonymous-vs-identified-events), [exception schema](https://posthog.com/docs/error-tracking/capture), [JavaScript configuration](https://posthog.com/docs/libraries/js/config).

User request: usage tracking and error capture following clicker, without personally identifiable data. Implemented in the browser layer; see [STATUS.md](STATUS.md) for validation/publication evidence. No engine, save or generator changes.

## Active implementation design (2026-10-28)

The user resumed roadmap work after restart. PostHog tools now respond. The sole accessible project, **677229**, matches clicker's public token and configured clicker URL; its `anonymize_ips` setting is **true**, checked through `project-get`. No project settings were changed. Explorer will use that project with a distinct `app: explorer` property.

Use PostHog's documented capture HTTP API with memory-only identity, no person processing, no GeoIP, and a final event/property allowlist. Never identify players. Identity resets on page load; cross-session retention and unique-player counts are deliberately unavailable. Network transport necessarily exposes IP/user agent to the receiving server; neither belongs in our event payload. Suppress referrers and credentials in fetch configuration. The verified project setting discards client IP data from stored events.

Events: `explorer_opened`, successful `explorer_order` (command type only), `explorer_progress` (allowlisted completion kind only), `explorer_sitting` (whole visible minutes capped at 1,440), and sanitized `$exception`. Common fields are fixed app/surface, release and telemetry schema version. Errors carry only a standard error class, error/rejection origin and bounded line/column; arbitrary messages, stacks and filenames are excluded. This trades diagnostic detail for the requested privacy boundary. Imported/restored/offline history and secondary-tab updates do not generate progress. No saved gameplay data changes.

Enable only production HTTPS canonical `/explorer/` routes with build-time configuration, excluding debug queries. Drop offline events without queuing or retries, cap page volume, recheck sharing immediately before transmission, and isolate failures from gameplay. Honor browser DNT/GPC. A persistent device preference shared by library and games permits opt-out; storage access failure disables sharing. Expose the same accessible privacy control in both settings dialogs and library footer. Keep saves/preferences/locks otherwise independent.

The public token/host are build configuration, with ignored `.env.local`, blank `.env.example` and GitHub repository build variables. No personal/admin API credentials enter the bundle. Validate real serialized requests in production browser tests, including malicious URL/error text, failed requests, opt-out, reload, read-only tabs and offline play, before release.

The latest browser SDK (1.441.2) was inspected and removed before implementation. Its automatically enriched properties and retry queue add avoidable privacy/lifecycle complexity for this narrow request. Direct capture follows the same gated browser-adapter pattern as clicker while allowing explicit `credentials: omit`, `referrerPolicy: no-referrer`, no retry queue and no remote feature requests. This is an intentional implementation choice, not a copy of clicker's SDK integration. References: [capture API](https://posthog.com/docs/api/capture), [anonymous events](https://posthog.com/docs/data/anonymous-vs-identified-events), [exception schema](https://posthog.com/docs/error-tracking/capture), [JavaScript configuration](https://posthog.com/docs/libraries/js/config).

Usage/error tracking shipped in v0.14 under the user’s request for no personally identifiable data. The recruitment-name fix leaves this payload contract unchanged; production regression coverage verifies that hiring sends only its command category, never the selected candidate’s name. Current delivery state is in [STATUS.md](STATUS.md).

## Payload and operational contract

| Event               | Additional properties                                                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `explorer_opened`   | None; one per library/game page load when sharing is allowed                                                                                                        |
| `explorer_order`    | Successful command `kind` from the fixed command-type allowlist; no command arguments                                                                               |
| `explorer_progress` | `kind`: `arrived` or `activityComplete`; only visible owner ticks of at most two seconds                                                                            |
| `explorer_sitting`  | Whole visible `minutes`, 1–1,440; sent once on hide/pagehide                                                                                                        |
| `$exception`        | Standard error class (unknown becomes Error), error/rejection origin, bounded line/column, fixed sanitized value and fingerprint; no raw message, stack or filename |

All events carry fixed `app: explorer`, one of `library`, `far-wake`, `hollowmere`, build release, `telemetry_version: 1`, `$process_person_profile: false`, `$geoip_disable: true`, `$ip: null`. The request envelope carries only the public API key, page-random distinct ID, event and these properties. No account/device identity, URL/query/hash/referrer, generated name, seed, resource quantity, free-form input, DOM, import/export, save, error text, stack or filename is added. Browser network transport exposes IP/user agent to the recipient; the project discards client IP from stored events. This is not a claim that the receiving infrastructure cannot see transport metadata.

Post `text/plain` JSON to `/i/v0/e/?ip=0`, with credentials omitted, referrer suppressed and keepalive. No SDK, cookies, local identity, person creation/identify, replay, autocapture, surveys, flags, external scripts, queue or retries. Local storage contains only `explorer.telemetry.optOut` (`1` disables, `0` allows; absent allows when all other gates pass). At most 200 events per document, including at most 10 exceptions. Blocked/offline attempts are discarded. Opt-out prevents subsequent sends; it cannot recall an already transmitted request. Re-enabling does not replay suppressed events. Error sanitization deliberately limits diagnostic detail; release/class/coordinates remain useful for regression triage. No cross-visit retention or unique-player claims are supported.

Game opens count both commanding/read-only pages. Only the owner can issue orders or emit foreground completion observations. Reconciliation, delayed/hidden ticks, imported saves, resets and secondary-tab storage events produce no historical progress. This is usage sampling, not authoritative economy or campaign accounting.

## Configuration and validation

Copy `.env.example` to ignored `.env.local` for a production build. Set `VITE_POSTHOG_TOKEN` to the verified project's **public ingestion token** and `VITE_POSTHOG_HOST` to its ingestion host. Missing values disable capture. Local/development/preview origins stay silent even when configured. Only canonical HTTPS Explorer entry routes enable delivery; `speed`, `debug` and `__posthog_debug` queries disable it. Public build values are exposed in the bundle by design; never supply OAuth/personal/admin credentials.

Pages reads those names from repository Actions **variables**. They are configuration, not secrets. No project-level settings were modified; clicker's behavior is unaffected. Recheck IP-discard settings if changing project. Tests intercept requests instead of sending synthetic private text to PostHog.

```
npm test
PAGES_BASE_PATH=/explorer/ npm run build
npm run test:telemetry
npm run test:e2e
PAGES_BASE_PATH=/explorer/ npm run test:offline
```

Production telemetry tests serve the build under intercepted canonical-origin routing. They inspect final bodies/headers and exercise private error/query text, identity reset, shared opt-out, network failure, browser privacy signals, storage denial and read-only tabs. Unit tests cover allowed routes/categories, numeric limits, connectivity/sharing checks, failure isolation and volume caps. Existing browser/offline suites cover saves and gameplay. Real device acceptance and successful live ingestion remain distinct checks recorded in [ACCEPTANCE.md](ACCEPTANCE.md) and [STATUS.md](STATUS.md).

## Reference and rationale

Read-only clicker references: `../clicker/src/engine/posthog.ts`, `../clicker/src/engine/telemetry.ts`, `../clicker/docs/TELEMETRY.md`. Their gating/opt-out/failure isolation pattern informed Explorer. Their persistent browser identity, automatic SDK context and raw exception forwarding were not copied because this request asks for no personally identifiable data. Current PostHog docs and project settings are stronger evidence than the sibling's historical privacy notes.

## Release verification (2026-10-29)

Retained [verification report](reviews/TELEMETRY-VERIFICATION-2026-10-29.json) contains event/property names and pass/fail results without raw page identities or transport metadata.

Feature `3228b9c` was published by [Pages workflow 40939176487](https://github.com/rayners/explorer/actions/runs/40939176487): 167 unit, 111 browser, 12 telemetry and 34 offline checks passed. Live iPhone WebKit exercised all three routes and shared opt-out. Six known verification events (three opens, two accepted orders, one deliberately synthetic sanitized TypeError) returned HTTP 200 and were retrieved through a point lookup of only their three ephemeral page IDs within 30 minutes. No private test strings were submitted live.

Stored usage properties matched the declared allowlist; IP/GeoIP were absent and person processing false. PostHog added exception grouping metadata (`$exception_issue_id`, fingerprint record, types/values/handled/source/function arrays); the value remained `Sanitized TypeError`, source/function arrays were empty and no stack appeared. These server-derived fields are not additional browser collection. The synthetic test issue is retained as verification evidence, not a player failure. Active project's IP-discard setting was rechecked. The taxonomy tool was unavailable, so the record lookup used verified table metadata plus exact observed outgoing page IDs/names. This demonstrates those records' stored properties; it is not a blanket audit of all unrelated clicker data or receiving infrastructure logs. Physical-device acceptance remains pending.
