# Far Wake v0.4 design

Generation-1 names below describe the authored setting. Fresh generation-2 expeditions use seeded names for people, factions, regions and locations while keeping the same roles, routes and mechanics; see [NAMES.md](NAMES.md).

The player is the captain of the survey vessel Kestrel, operating under an Orison Combine charter in 2186. The tone is industrial, dryly bureaucratic, and occasionally unsettling. Exploration and logistics lead; supernatural explanations and franchise characters are absent.

The loop is: accept work → check supplies and condition → travel → survey → explore or extract → process supplies and repair → return to a hub → file work and choose who owns discoveries → prepare for a longer voyage.

Local trips take roughly one minute. Surveys take about forty seconds with the starting specialist. Expeditions and resource gathering take roughly one to two minutes. Interstellar legs take 15–60 real minutes and 4–12 fictional years. The crew is in cryosleep for long voyages. Calendar time changes market prices on arrival; accepted contracts do not expire while asleep.

A single foreground order and a single support job keep the management light. Costs are paid at order time and rewards applied exactly once at completion. Jobs do not repeat automatically. Encounters and revealed internal threats pause consequential time for a choice. Ordinary travel hazards injure rather than kill; permanent casualties are possible only through explicit responses to a revealed internal threat. Its onset can be a surprise. Resource overflow is discarded with a log entry. Cargo capacity and costs are always visible.

Crew specialty assignments affect duration, extraction yield, and combat odds. Injury reduces specialty effectiveness, while station treatment restores it. Rest currently removes a member from work; it does not automatically heal them. Ship wear increases during travel and increases arrival hull damage. Repairs and servicing consume parts. These mechanics reward preparation without requiring frantic tapping.

Faction politics begins with exclusive data licensing, relief deliveries, mission reputation, hostile encounters, trade prices, and access restrictions. It does not simulate faction fleets or autonomous territorial wars. Pirate attacks are resolved in up to two failed firing rounds, or immediately through evasion, bargaining, or cargo surrender. Surrender always provides an escape route without a resource requirement.

Recruitment offers four specialist roles. Four starting berths can become eight through accommodation upgrades. Living members occupy capacity and contribute skills; casualties remain in the roster as memorial records but occupy no berths. An emergency relief hand is free only if no crew survive, preserving recovery from a total loss.

The galaxy has an authored topology so every route and introductory contract can be tested. Seeded frontier yields and site identifiers demonstrate the generation seam. Full procedural campaigns and roguelite rules are deferred.

## Later versions

Status and unresolved design choices are tracked in [ROADMAP.md](ROADMAP.md). These ideas are deferred, not committed releases.

- Generator modules for variable system graphs, celestial bodies, sites, and mission instances with stable instance IDs.
- Generator-version compatibility and saved generated catalogs when worlds grow dynamically.
- Explicit run boundaries, loss/recovery rules, optional persistent unlocks, and roguelite balancing.
- Richer crew development, alternative ships, deeper faction disputes, and additional settings.
- More varied illustrated scenes and event-specific art.

These are extension points rather than promises about reset or reward rules. Existing v1 saves should remain playable when generator capabilities expand.

## The stowaway incident

An ordinary surface expedition can now bring a stowaway back unnoticed. The first three explored sites and every Cinder site are protected. Later sites can produce a once-only discovery event, including either a hidden passenger or a disputed settlement claim. See [EVENTS.md](EVENTS.md) for odds, cooldown and follow-up rules.

Morrow also offers a clearly warned specimen-recovery activity as an authored route into the same incident. Completing it starts a hidden threat. Two subsequent completed activities or journeys reveal the intrusion. It may evade searches, be contained, be confronted after it is located, or be removed by venting cargo. Containment permits other operations to resume without claiming the creature has been killed. Failed explicit responses increase pressure; every second failure provokes an attack. Support medical expertise can turn a casualty into an injury. The stowaway can happen once per expedition, shared across the surprise and authored triggers, with a distinct mission reward.

All randomness is seeded and saved. Revealing a threat during catch-up pauses further consequential time, and never attacks crew. If an external encounter and internal alert coincide, the player can resolve the external encounter first. A purge always works, even with no resources or survivors; it loses a fifth of physical cargo. The captain can request recovery, and emergency recruitment prevents a roster-loss deadlock.

## Shared fantasy implementation

Hollowmere has a separately themed interface, content catalogs and procedural details, with its own save namespace. It uses the same engine, recruitment and threat mechanics, save migration, transaction-safe imports, offline timing, and browser lifecycle. Its fighter/mage/cleric/scout composition is enforced by generic activity requirements, rather than hard-coded fantasy branches in the engine. See [HOLLOWMERE.md](HOLLOWMERE.md).
