# Project documentation

Start with [AGENTS.md](../AGENTS.md) for repository working rules and [README.md](../README.md) for running and playing the games.

| Document                           | Purpose                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------- |
| [REQUIREMENTS.md](REQUIREMENTS.md) | User goals, requested scope and acceptance intent                       |
| [DECISIONS.md](DECISIONS.md)       | Chosen behavior, rationale, tradeoffs and compatibility constraints     |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Module boundaries, execution flow, hosting and extension checklist      |
| [ENGINE.md](ENGINE.md)             | Engine integration API, content contracts, time and save semantics      |
| [DESIGN.md](DESIGN.md)             | Far Wake setting, gameplay loop, pacing and internal threat             |
| [HOLLOWMERE.md](HOLLOWMERE.md)     | Fantasy setting, party roles, curse and recovery                        |
| [MISSIONS.md](MISSIONS.md)         | Discovery-derived contracts, accepted field work and payment accounting |
| [SITES.md](SITES.md)               | Generated site traits, approaches, compatibility and follow-up work     |
| [NAMES.md](NAMES.md)               | Seeded name generation, compatibility and future generator extension    |
| [EVENTS.md](EVENTS.md)             | Discovery events, implemented consequences and future candidates        |
| [ROADMAP.md](ROADMAP.md)           | Implemented milestones, deferred scope and unresolved design questions  |
| [ACCEPTANCE.md](ACCEPTANCE.md)     | Automated checks and pending physical iPhone acceptance                 |
| [SOURCES.md](SOURCES.md)           | Requirements provenance, inspirations, reference code and evidence      |

Requirements describe what was requested. Decisions describe the implementation chosen to satisfy it. Roadmap entries describe future possibilities unless explicitly marked implemented. Keep these distinctions when updating the documents.

Documentation baseline: v0.6.0, updated 2026-10-28. Source and tests govern executable behavior; reconcile documentation when that behavior changes. Historical commit references remain useful after later versions ship.
