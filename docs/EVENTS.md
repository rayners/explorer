# Discovery events and lasting consequences

Direction recorded 2026-10-27; first slice approved and implemented in v0.3 on 2026-10-28. This adds procedural events over authored worlds, not a procedural galaxy or roguelite campaign.

## Goal

The user wants a creature getting loose aboard ship to sometimes be a surprise, and is interested in other random events with long-term effects. An expedition should acquire a history through discoveries and their consequences. Events should change what the player prepares for or chooses next, rather than only granting or removing supplies.

In generation-2 expeditions (v0.4), place/faction names are generated and references resolve to those names. Cinder here means the protected tutorial planet with stable ID `cinder`; the Combine and Free Habitats describe faction roles whose display names now vary.

## Implemented selection rules

An opportunity occurs only when a surface expedition successfully explores a new site. The first three explored sites and every Cinder site are protected. Later qualifying site completions have a 35% chance of an event. Eligible entries have equal weight in the initial catalog: when both qualify, each has a 17.5% unconditional chance, and quiet returns remain most likely. When only one qualifies it receives the full 35% chance. There is no guarantee or mercy counter.

An event skips the next two newly explored sites before another can occur. Each event ID can occur once per expedition. Any active threat, including hidden/contained threats, or an unsettled discovery prevents another random selection. Existing incident history filters unique entries before weighting. Ordinary travel, extraction, support work and rendering do not roll for discoveries or consume site cooldown.

All selection uses saved seeded randomness. Failed orders, loading, importing, idle time and revisiting completed sites cannot reroll an opportunity. Ordinary field hazards remain separate and may occur alongside a discovery. Their RNG outcomes after a discovery roll can differ from an older version; existing saved jobs retain their committed timers, costs and destinations.

## Unseen passenger

An ordinary expedition can bring back a passenger without selecting a labelled creature encounter. The onset has no notification, discovery card or explicit anomaly log. The first sign can arrive later; the player is not told which site has introduced the intrusion. Raw JSON saves remain inspectable rather than encrypted.

A selected passenger starts the current stowaway engine hidden with zero signs. Two subsequent completed activities or journeys reveal it. Existing threats develop before a new discovery is selected, so the introducing expedition does not also count toward that delay.

The Morrow specimen activity remains an explicitly warned, authored route into the same stowaway. Both sources share `threatHistory`: there is at most one stowaway per expedition, whether hidden, contained or already stopped. The existing Unmanifested cargo contract can recognize a threat stopped before contract acceptance.

When revealed, the threat pauses consequential time for orders. Response costs and permanent-casualty risk are visible; medical/security/engineering assignments matter. A guaranteed purge remains available at the cost of 20% of physical cargo. No threat response or crew death occurs through absence. Committed journeys survive roster changes.

## A claim without an owner

An expedition can recover an old settlement charter and coordinates of an abandoned reserve. Its compact follow-up stays visible across console sections and reloads; Review discovery opens the full choices in Contacts without crowding navigation or operations. It does not stop ordinary work or travel, and it does not expire. Bring it to any station to settle; visible disabled-button explanations identify the docking requirement. Another random discovery cannot begin until it is settled.

| Choice                       | Payment     | Standing                      |
| ---------------------------- | ----------- | ----------------------------- |
| License to the Combine       | 180 credits | Combine +14, Free Habitats −8 |
| Release to the Free Habitats | 90 credits  | Free Habitats +14, Combine −8 |
| Archive without a claim      | None        | No change                     |

Effects and narrative tradeoffs appear before a final confirmation. Settlement applies once and leaves a permanent discovery record in Contacts. Standing persists, changing port prices and eventual mission access according to the existing faction rules. It is not a separate territory simulation or a repeatable source of income. The neutral option closes the matter without a political penalty.

## Shared architecture and persistence

`GameDefinition.discoveryEvents` supplies chance, cooldown and a catalog of weighted exposure or choice entries. Entries carry stable IDs, location eligibility, a minimum total site count, and themed presentation. Exposures refer to generic threat IDs. Choices declare resource rewards and faction-standing changes with an optional service-hub requirement. The engine does not branch on setting or event names and has no unrestricted event-mutation callback.

`GameState.incidents` is the durable event ledger, independent of the capped narrative log. It records source location/site, onset time and choice. A once-only definition ID is also its instance ID in this slice. Hidden exposure records stay out of the UI; their resolution is tracked by the existing threat state/history. `discoveryCooldown` persists the remaining skipped sites.

State schema 3 migrates schemas 1 and 2 after verifying the original checksum. Migration initializes an empty incident ledger and cooldown without rerolling prior sites or changing hidden/active/resolved threats. The save envelope, namespaces, generation version, world identities and committed jobs remain compatible. Hollowmere uses the shared schema but has no random discovery catalog yet; its authored curse is unchanged. Tests demonstrate the mechanism using fantasy resources and factions independently of Far Wake IDs.

## Deferred candidate events

These remain ideas, not a release commitment:

- **Damaged subsystem:** salvage creates a repair project needing supplies and support time. Keep a viable recovery path rather than an unrepairable penalty.
- **Survivor or specialist:** distress/wreck exploration creates a rescue or recruitment decision, respecting accommodation and possible obligations.
- **More contested discoveries:** faction claims create new work or access choices rather than only standing deltas.
- **Fantasy equivalents:** curses, relic obligations or allies can reuse the selector with their own content.

Evaluate pacing and repetition before expanding the catalog. More complex effects will need typed engine contracts, save validation and migrations. Dynamic worlds additionally need stable generated instance IDs and compatible persisted catalogs. Roguelite loss/reset progression remains undecided.

## Verification

Unit coverage exercises introductory protection, quiet outcomes, weighted selection, uniqueness, cooldown, pending-event suppression, hidden onset, delayed reveal, no offline casualties, guaranteed recovery, one-time political effects, portable definitions, frame/offline equivalence and malformed-history rejection. Schema-2 migration fixtures retain existing threats, discoveries and committed jobs; the existing schema-1 migration remains covered.

Browser tests exercise normal expedition onset without an exposure confirmation, hidden reload, delayed reveal/purge and the claim's field-to-station/confirmation/history flow on desktop, iPhone WebKit and tablet WebKit. Production offline tests settle a saved claim and verify effects persist exactly once without development helpers. Physical iPhone checks remain pending in [ACCEPTANCE.md](ACCEPTANCE.md).

See [ENGINE.md](ENGINE.md) for API contracts, [DECISIONS.md](DECISIONS.md) for safeguards and [ROADMAP.md](ROADMAP.md) for future procedural direction.
