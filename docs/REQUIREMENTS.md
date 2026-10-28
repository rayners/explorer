# Goals and requirements

These requirements summarize user instructions in the development conversation. They are not a verbatim transcript. Their traceability is recorded in [SOURCES.md](SOURCES.md); implementation choices are in [DECISIONS.md](DECISIONS.md).

## Experience

Create a casual, idle-ish browser game focused on exploration, playable on iOS Safari (specifically iPhone 15 Pro Max), desktop and tablet browsers. Use pixel art. Waiting and preparation should support intermittent play.

The first setting should be retro-futuristic, relatively hard science fiction inspired by the Alien films: long travel times, cryosleep and megacorporations. Use original setting content. The core engine must be separate from display text, art and setting details so another game can use it. `../clicker` is the reference for repository/site organization and reusable game mechanisms.

The requested loop includes:

- Traveling between worlds and systems, with travel time accounted for.
- Ship maintenance and resource gathering for fuel, repairs and ammunition.
- Exploring planets, moons and asteroids; discovering systems and celestial bodies.
- Station refueling, resupply, missions and goals.
- Faction conflict through direct pirate/faction encounters and indirect political choices.

Faction depth was exploratory ("probably some kind"); the implemented reputation, encounters, relief and licensing layer is a first slice rather than a complete political simulation.

## Navigation feedback

The user could not plot an interstellar course because the original direct-route requirement was unclear. After explanation, they found it odd that leaving a system required going to a particular planet unless there were an external launch mechanism. The chosen Far Wake implementation therefore permits departure anywhere within a charted neighboring system connection. No external launch installation has been specified. Other settings may retain location-specific exits.

## Requested extensions

The user requested these in any order; all have a playable first implementation:

- Hire additional crew with engineering, medical, security and other specialties. Capacity can depend on vessel accommodation and upgrades.
- An Alien-like stowaway scenario: a threat comes aboard after planetary exploration, evades security and can kill crew.
- A separate darker fantasy game exploring realms, forest and/or dungeons, with meaningful fighters, mages, clerics and party composition.

The optional trigger, casualty safeguards, exact roles, capacity limits, setting names and balance numbers are implementation decisions, not quoted user specifications.

## Site and delivery

Push code to `rayners/explorer` and publish its GitHub Pages site, like clicker. The main page should select among implemented games. Each game must remain accessible on its own page. Preserve existing progress when changing entry points.

The user also requested an independent agent usability/QA review. A review and corrective work occurred during development; surviving regression evidence and commits are listed in [SOURCES.md](SOURCES.md). Do not infer that every future change requires delegation.

## Deferred direction

The user eventually wants roguelite and procedural systems/missions, and explicitly allowed that to wait. Keep architectural seams for it, without inventing permanent progression, reset rules or an endless generator as settled requirements.

## Acceptance intent

A player should be able to select a game, understand the first goal, prepare and travel, discover and exploit a location, return to a service hub, turn in work and prepare for farther travel. Crew composition must affect real available actions or outcomes. The optional internal threat must be resolvable without permanently stranding the save. Each game needs independent progress, mobile usability and reliable resume after absence.

Offline PWA support, 24-hour catch-up and the detailed recovery/save protections were chosen to support this experience. See [ACCEPTANCE.md](ACCEPTANCE.md) for concrete verification and physical-device checks still pending.
