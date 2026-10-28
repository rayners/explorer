# Generated exploration sites

Implemented for v0.5, 2026-10-28. Goal: generated places should change player decisions, not just their names. Implement in both games using the same setting-independent mechanisms.

## Scope and design

Generation 3 adds a reproducible site catalog over the current authored geography. Each site has a stable identity independent of its display name, source location, and four themed traits: origin, condition, opportunity and complication. Theme-owned weighted components determine descriptions and mechanical effects. Location kind filters appropriate origins. Separate seeded domains generate each site without consuming gameplay RNG.

Every site offers a direct approach and a slower cautious approach, plus an optional specialist approach when a relevant skill is supplied by the selected components. Costs, expected rewards, real duration, risk and staffing requirements are visible before ordering. Condition modifies effort/yield; origin and opportunity affect returns; complications affect risk and specialist choices. Where the game defines random discoveries, site context can alter their eligible weights without revealing a hidden passenger. No approach causes unattended permanent casualties.

Survey reveals the catalog. Players may select any unfinished site and approach. The ordinary exploration activity remains a quick order for the next unfinished site's direct approach, with an accurate preview. Completed sites remain recorded and cannot be farmed. Tutorial locations have gentle direct approaches; a general approach remains available without specialist hires or upgrades (existing fantasy fighter leadership still applies).

The engine commits duration, risk and rewards at dispatch, using the existing Job fields and `site` identity. Completion resolves that committed site exactly once. Definition generation version 3 preserves the version-2 names but supplies generated site identities/profiles. Versions 1 and 2 keep their authored site lists and legacy exploration mechanics. State schema 3 and envelope 1 need no migration because Job.site already exists; validation and compatibility tests must cover its now-active use. Future generator changes must preserve version 3.

## Acceptance

- Meaningful trait combinations and site choices in both settings; no setting IDs in the engine.
- Reproducible catalogs across factory calls, reload and import, with bounded costs/risks and valid resource/skill references.
- Selected sites and approaches have distinct measurable costs, duration, returns or requirements.
- Out-of-order site exploration, completed-site rejection, exact-once rewards, failed-order immutability and cargo limits.
- Committed choices survive reload/catch-up and roster changes; no per-render generation or outcome rerolls.
- Versions 1/2 retain saved discoveries, jobs, names and outcomes. Frozen catalog fixtures guard future generation compatibility.
- Mobile/desktop site cards show costs, risks and unavailable-action reasons; keyboard/touch and offline completion work.
- Frontier simulator remains recoverable within the established casual pacing range; document any justified balance adjustment.

## Following tasks

Discovery-derived missions follow this slice. Their design should use stable site identities and traits, durable outcomes, recipient factions and hub turn-in, rather than random objectives disconnected from discoveries. Generated region/system layouts follow once mission references and reachability can be checked against them. Roguelite resets and metaprogression remain separate deferred design work.

## Implemented contract

`GameDefinition.sites` is optional. `SiteDef` holds a stable `site:<location-id>:<ordinal>` identity, source location, readable name/description, four traits and two or three approaches. Theme-owned `SiteRecipe` components are weighted and origin eligibility is filtered by location kind. Generation 3 generates 36 Far Wake sites and 18 Hollowmere sites. Tutorial sites use the first gentle component on each axis. Names preserve the generation-2 vocabulary and streams.

Direct exploration uses its displayed costs/returns and the ordinary activity skill for duration bonuses. Cautious exploration takes 35% longer, costs one extra ration/provision, returns 85% of the direct findings rounded down, and has 35% of the ordinary incident risk. Specialist recovery requires one relevant expedition member, takes 80% of the time, returns 130% of findings rounded down and has 60% of direct risk, with any extra tool/ammunition/incense cost displayed. These risks govern ordinary field incidents; they do not guarantee protection from hidden passengers.

The quick exploration activity defaults to the next unfinished site's direct approach. Explicit commands use `{ type: "activity", id: rules.exploreActivity, site, approach }`. Dispatch validates both ordinary activity and approach requirements, pays the chosen costs, and commits Job.site, total/remaining, reward and risk. Completion uses that site, without re-deriving costs or paying the old legacy 25-currency addition. Ordinary field incidents still injure/damage or create an encounter; they never kill through absence.

In Far Wake, contextual multipliers affect discovery eligibility/weights. Research and uncertain seals favor a passenger opportunity, archives/contested sites favor claims, and natural formations exclude the claim. This preserves the overall discovery chance/cooldown and introductory protection. The UI never reveals which site actually introduced a hidden passenger. Hollowmere retains its authored curse and has no new random-curse catalog.

Surveyed site registries expose native expandable approach cards in Operations/Company, including visible reasons for unavailable actions. Completed records remain readable. All profile generation is definition-time and independent of outcome RNG. The full catalog is reproduced by saved seed/generation; `tests/fixtures/sites-v3.json` guards it. Released generation-2 exploration fixtures were captured directly from the v0.4 source using `git archive`, including their exact expected completion outcomes.

The frontier simulator now sells surplus physical stock above its preparation reserves before buying supplies. This supports variable site rewards without overflowing the hold. All eight baseline seeds remain recoverable within the existing 200-minute target; no pacing threshold was relaxed.

Working teams still follow the existing casualty-abandonment rule: an explicit threat attack that removes the last surviving member of a working activity team abandons that activity and logs it. Paid journeys remain committed. Ordinary absence cannot cause such a loss. Returns remain subject to cargo capacity and ordinary encounter choices.

Validation baseline: 100 unit tests, 72 browser cases across desktop/iPhone/iPad projects, and 10 production offline cases. Visual inspection covers expanded approach cards in both settings on desktop and iPhone WebKit. Physical-device checks remain pending.
