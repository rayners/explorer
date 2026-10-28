# Development handoff

Updated 2026-10-28. Read this after [AGENTS.md](../AGENTS.md) when restarting a session. This is a handoff snapshot; verify the current checkout, tools and external workflow state before continuing.

## Current release

- Version **0.13.0**, on `main`; latest implementation commit **`a94b016`**. The checkout was clean before this documentation-only handoff.
- Both games have explicit 15-minute, one-hour and eight-hour hub work, fixed committed pay/debt terms, cancellation without partial credit, safe absence and schema-5 migration. [WATCHES.md](WATCHES.md) records the design and fixtures.
- `a94b016` fixes Hollowmere's long countdown (`479m 60s`) through shared hour-aware formatting and prepares [BUNDLES.md](BUNDLES.md). Its [Pages workflow 40751150926](https://github.com/rayners/explorer/actions/runs/40751150926) succeeded; status and commit were rechecked for this handoff. Both live game routes were previously checked after deployment, including corrected watch timers.
- Last release validation: **164 unit tests, 111 browser cases, 34 production offline cases**, typecheck/Pages build, both logistics simulators and the cadence audit. These game suites were not rerun for this docs-only handoff. Physical iPhone Safari/Home Screen checks remain pending in [ACCEPTANCE.md](ACCEPTANCE.md).
- Save envelope **1**, state schema **5**, independent content generations **1–7**, fresh-game default **7**. No save keys or manifest identities changed.

## Latest requested task — pending

The user asked to add PostHog usage tracking and error capture to the games, following `../clicker`, with **no personally identifiable data**. This takes priority over destination bundles when the user resumes work. [TELEMETRY.md](TELEMETRY.md) records the request, inspected references, privacy review and implementation checklist.

**No tracking implementation exists yet.** No PostHog dependency, telemetry module, settings control, event submission or project configuration was added. No analytics code/dependency edits are waiting in the worktree.

The PostHog skill is available, but **no PostHog tools were exposed in the session**, including the last handoff check. Plugin discovery was attempted; it did not establish a usable connection. Do not infer connection status from an installed skill or a generic tool success response.

The installed `posthog:posthog` skill's Step 0 requires: “If PostHog tools are unavailable, pause and ask the user to connect the PostHog app.” Work stopped at that prerequisite, not because of a game-code failure or an automatic approval rejection. The session's skill was at `/home/rayners/.codex/plugins/cache/openai-curated-remote/posthog/2.0.2/skills/posthog/SKILL.md`; rediscover its current location/instructions after restart.

## Resume procedure

1. Read this handoff, [TELEMETRY.md](TELEMETRY.md), the working guide and relevant architecture/save/browser contracts. Check `git status` and current HEAD; do not assume this snapshot is still the latest commit.
2. Discover the PostHog tools and read the current skill. The user may need to enable the bundled app, complete OAuth, and restart the session for tools to appear. Verify availability rather than repeating connection requests without checking.
3. Resolve the intended organization/project. Clicker's project is the reference/candidate, but Explorer's target project and current server privacy settings have **not** been verified. Never treat a public ingestion key as an administrative credential or proof of project identity/privacy settings.
4. Complete the privacy/event design and implementation using current official documentation/tools, then test payloads, failure/offline behavior and production gating. Follow the repository's normal reviewable-change, validation and publication workflow.
5. The ongoing autonomous roadmap goal is **paused at the user's request**. This documentation task does not resume it. Resume that goal only on explicit user direction. Destination bundles are designed but unimplemented; they follow the tracking task if roadmap work resumes. Changed-place consequences and contextual discovery selection remain later candidates; roguelite resets remain deferred.

Temporary `/tmp` live-check scripts/screenshots may not survive restart or transfer; they are not required inputs. Repository tests, captured fixtures, design documents and linked CI runs are the durable evidence.
