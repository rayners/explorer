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
| [VARIETY.md](VARIETY.md)           | Versioned encounter variety, team roles and safe alternatives           |
| [PLANNING.md](PLANNING.md)         | Expedition preparation, next steps and contract-linked routes           |
| [READABILITY.md](READABILITY.md)   | Current directives, accepted-work hierarchy and responsive readability   |
| [PROJECTS.md](PROJECTS.md)         | Implemented faction projects linked to settled discovery choices        |
| [CREW.md](CREW.md)                 | Crew proficiency, lasting opportunities and migration contract          |
| [WORLDS.md](WORLDS.md)             | Generated layouts, reachability guarantees and version compatibility    |
| [MISSIONS.md](MISSIONS.md)         | Discovery-derived contracts, accepted field work and payment accounting |
| [SITES.md](SITES.md)               | Generated site traits, approaches, compatibility and follow-up work     |
| [NAMES.md](NAMES.md)               | Seeded name generation, compatibility and future generator extension    |
| [EVENTS.md](EVENTS.md)             | Discovery events, implemented consequences and future candidates        |
| [ROADMAP.md](ROADMAP.md)           | Implemented milestones, deferred scope and unresolved design questions  |
| [ACCEPTANCE.md](ACCEPTANCE.md)     | Automated checks and pending physical iPhone acceptance                 |
| [SOURCES.md](SOURCES.md)           | Requirements provenance, inspirations, reference code and evidence      |

Requirements describe what was requested. Decisions describe the implementation chosen to satisfy it. Roadmap entries describe future possibilities unless explicitly marked implemented. Keep these distinctions when updating the documents.

Documentation baseline: v0.12.0, updated 2026-10-28. Source and tests govern executable behavior; reconcile documentation when that behavior changes. Historical commit references remain useful after later versions ship.

Independent reviews:

- [Game design review, 2026-10-28](reviews/DESIGN-REVIEW-2026-10-28.md): exploration, pacing, rewards, crew choices and theme identity in both games. Recommendations are proposals, not approved specifications.
- [Visual design review, 2026-10-28](reviews/VISUAL-DESIGN-REVIEW-2026-10-28.md): rendered desktop and phone layouts, typography, hierarchy, artwork and theme presentation. Recommendations are proposals, not approved specifications.
