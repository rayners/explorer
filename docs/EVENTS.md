# Discovery events and lasting consequences

Design direction recorded 2026-10-27. **Proposed; not implemented.** The current game still starts its stowaway through the explicit specimen activity. This document separates the user's new direction from candidate implementation details.

## Goal

The user wants a creature getting loose aboard ship to sometimes be a surprise, and is interested in other random events with long-term effects. This moves toward procedural play without requiring a procedural galaxy first.

An expedition should acquire a history through discoveries and their consequences. Events should change what the player prepares for or chooses next, rather than only granting or removing a resource bundle.

The earlier explicit specimen mission remains one authored route into an incident. It should no longer be the only possible route once discovery events are implemented. Exact event odds, timing and scope are not yet selected.

## Surprise and player decisions

Surprise belongs in the onset: a routine-looking expedition can bring something back, and the significance can become clear later. Avoid labelling every relevant site as a creature encounter or logging the exact hidden incident as soon as it starts. Ordinary exploration text can establish that unknown environments have risks without spoiling a particular outcome.

Keep the consequences legible after discovery. When the threat is revealed, pause for orders and explain available responses, costs and casualty risk. A surprise onset does not authorize deaths during offline simulation. Permanent casualties still require explicit responses; guaranteed purging remains available. Existing journeys remain committed if the roster changes.

Events may develop or reveal while catching up after absence. Stop at the first consequential choice and retain the remaining situation for the player. Never repeatedly roll an event because a browser renders, reloads or wakes in the background.

## Candidate first event set

These are design candidates, not approved content or a release commitment:

| Event                  | How it could begin                                      | Lasting effect / follow-up                                                                                                                          |
| ---------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unseen passenger       | A surface expedition or salvage return                  | A hidden intrusion later reveals itself; containment, search and confrontation create an ongoing shipboard problem. Reuse current threat responses. |
| Damaged subsystem      | Recovery of hazardous salvage or an expedition accident | A specific repair project occupies supplies and support time; normal operations remain recoverable. Avoid an unrepairable permanent penalty.        |
| Survivor or specialist | A distress signal, wreck or isolated outpost            | A decision about rescue, accommodation and loyalties; a possible recruit or obligation, respecting capacity limits.                                 |
| Contested discovery    | Valuable survey data or an unusual artifact             | A faction claim, new mission or licensing decision changes relationships and future opportunities.                                                  |

Not every event needs a negative outcome. Persistent discoveries, allies and opportunities should matter alongside threats. Prefer consequences with follow-up actions and eventual resolution to accumulating opaque modifiers.

## Proposed shared mechanism

Keep eligibility and event selection generic, with themed content in each game. A shared event definition could supply stable IDs, qualifying completion kinds/locations, prerequisites, weight, repeat policy and a consequence descriptor. Far Wake could turn a hidden exposure into a creature; Hollowmere could use the same mechanism for a curse or something following the company. Fantasy event content is a possible later consumer, not an automatic addition to this scope.

Resolve an opportunity at a defined engine boundary, such as the first successful exploration of a site. Use saved seeded randomness and consume a roll exactly once. Exclude ineligible entries before selection. Consider safe introductory content, cooldowns and a no-event outcome so random incidents do not overwhelm the exploration loop. Thresholds, weights and a guarantee/mercy policy still need balancing decisions.

A durable event instance needs a stable identity and recorded outcome. Store hidden onset, revealed state, chosen response and any unresolved effect that cannot be reconstructed safely. Do not use the capped narrative log as the authoritative event history. Prevent duplicate unique incidents and contradictory simultaneous effects; start with one consequential unresolved incident rather than an unbounded event queue.

Use declarative effects and existing mechanics where possible. Avoid arbitrary theme code mutating state through an unrestricted event callback. Extend generic engine contracts only for effects the first actual events need. Visible narrative and art stay outside the engine.

## Persistence and compatibility

A new persistent event ledger/effect shape requires a state-schema migration and updated validation, not an unexplained change to existing saved data. Preserve the save envelope and namespaces. Existing hidden/active/resolved threats must retain their status; never reroll or duplicate them when adding the new mechanism.

Definition generation compatibility is a separate concern. Keep existing seeded world identities and committed jobs intact. Old saves should begin eligible future opportunities after upgrade, without retroactively rolling all previously explored sites.

Determinism means the same saved state and commands produce the same event outcome. It need not mean every player gets the same narrative regardless of route and decisions. Save/import must preserve the selected outcome, hidden information and consequences.

## Proposed implementation order

1. Specify the first surprise exposure source, eligibility, frequency and introductory protection. Decide how the authored specimen mission and random exposure share one-incident history.
2. Build the minimal reusable selection/history mechanism with save migration. Add surprise exposure using current threat responses.
3. Add one positive or political event with a lasting follow-up to prove the system supports more than creature variants.
4. Assess pacing, readability and event repetition before adding more effects or procedural systems/missions.

Do not treat this sequence as permission to implement every candidate event. The user's direction is surprise incidents and interest in lasting random events; these mechanics are proposed choices.

## Verification goals

- Reproducible selection, no duplicate outcomes on reload/import, and equivalent foreground versus offline results.
- No event rolls on failed/cancelled commands or rendering; no ambient randomness.
- Eligibility, no-event, uniqueness, cooldown and introductory-protection behavior.
- Safe migration of existing saves, including hidden/active/resolved stowaways and committed jobs.
- No permanent offline casualties; explicit casualty-risk disclosure at response time and guaranteed recovery remain intact.
- Lasting consequences survive saves and have a usable resolution path without negative inventories or roster-capacity violations.
- Themed text does not expose hidden event IDs or spoil an undiscovered intrusion through the UI.
- Mobile event discovery/response flows and production offline behavior remain usable.

See [ENGINE.md](ENGINE.md) for current contracts, [DECISIONS.md](DECISIONS.md) for implemented safeguards and [ROADMAP.md](ROADMAP.md) for the wider procedural direction.
