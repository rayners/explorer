# Seeded names and content generation

Implemented in v0.4, 2026-10-28; requested by the user as the next procedural-content step. Start with functions sampling larger themed vocabularies for crew, factions and locations. Bayesian or other conditional generation is a future possibility, not a dependency for this slice.

## Behavior

### Recruitment preview correction (v0.15.1)

The user reported identical names on all hireable roles. Every role was previewing the same global next ordinal. Fix the live candidate allocation, not the frozen name grammar: derive a distinct unused serial for each visible offer, and hire exactly its displayed candidate. Unselected previews reserve nothing. Browser hire commands include the displayed serial; if intervening work/rescue changes the candidate, reject the stale choice without charging for someone else. Reuse gaps left by unselected candidates so previews cannot prematurely exhaust the 1,000-serial archive. The existing counter becomes a high-water mark; roster and durable survivor records identify consumed/reserved serials.

Keep `recruitName(offer, seed, serial)`, all generation-1–7 definitions, stored member IDs/names and save validation unchanged. Ordinary hiring and new survivor onset allocate only free serials; an already discovered survivor retains its reserved serial regardless of other hiring. Legacy finite name lists remain frozen: prefer unused display names and distinct simultaneous previews where their vocabulary permits, without inventing or renaming archived people. No outcome-RNG draw, schema migration, content-generation bump or save reset is needed. Failed commands and previews must preserve their inputs.

The frozen version-2 naming algorithm is used by generation-2 through generation-7 expeditions. New expeditions default to generation 7, assembling layouts before names/sites/contracts, then opportunities and choice-driven projects. Generations 2–6 retain their exact catalogs. They generate initial crew and recruits, faction names, region names and location names. Names remain display values over stable identities; generation 4 adds geography through the separate [world generator](WORLDS.md). Text referring to places or factions must resolve their display names rather than silently retaining the old names.

Generation-version-1 saves continue using their original names and recruit pools. Factories accept an optional generation version, and all browser restore/import/backup/secondary-tab paths must rebuild that saved version. A fresh expedition or reset uses the latest version. Save envelope 1 remains unchanged; state schema 4 adds personnel practice separately: the existing saved seed and generation version identify the vocabulary/algorithm, and crew names are already stored.

## Mechanism

A shared pure name function composes parts sampled from theme-owned vocabularies. Each naming domain has a seed-derived stream independent of gameplay randomness. Its indexed sequence traverses the combinations without repeats before exhaustion, so initial members and later recruits can reserve distinct ordinals across roles, including memorials. World names use deterministic allocation in stable ID order with collision checking.

The initial vocabulary and algorithm for generation version 2 become a compatibility contract. Changing either requires a new supported generation version or a migration/persisted name catalog. Generation 3 deliberately reuses that vocabulary and algorithm. Adding names must not silently rename old saves. No ambient randomness, network or per-frame generation is allowed.

Theme data supplies people, faction styles and location-kind patterns separately from the shared function. This is an extension point for contextual grammars or conditional/Bayesian models later; those must keep deterministic inputs, compatibility and stable identity. No statistical generation model is implemented in the first slice.

## Validation goals

- Same seed/version returns identical names across factory calls, reload, import and offline play.
- Different seeds vary all requested categories; output is readable, unique within relevant catalogs and setting-appropriate.
- Initial crew and the supported recruit sequence avoid duplicate names without consuming outcome RNG.
- Old checked-in save fixtures retain crew, recruitment behavior, factions, locations, jobs and progress.
- Missions, guidance, faction choices and other narrative references match generated display names.
- Unknown generation versions fail safely; both games and secondary-tab restoration honor the requested version.
- Browser flows work with generated labels and actual mobile layouts, rather than depending on old fixed names.

## Authoring and extension contract

`src/engine/names.ts` exports `generateName`, `allocateNames` and `nameCapacity`. `NamePattern` supplies ordered word arrays and an optional separator; the sampler visits their combinations with a seed-derived offset and coprime stride. `allocateNames` sorts stable IDs and checks actual output collisions.

Both themes supply 32 given names and 32 surnames (1,024 combinations). Initial crew reserve ordinals 0–2 and all recruit roles share the subsequent serial pool, including lost members. This covers the 1,000-entry roster archive. Science-fiction medical recruits add a title. Regions, locations and factions use distinct domain keys and setting/kind-specific patterns. `RecruitDef.nameSource` describes the generic indexed source; legacy `names` arrays remain supported. The candidate allocator selects distinct free serials; preview, hire and validation resolve each selected serial through the same frozen name function.

`src/content/names.ts` assembles themed definitions. Names are display values; `mara`, `cinder`, `combine` and other historical IDs do not change or acquire meaning from the generated spelling. Author narrative with `{location:id}`, `{region:id}` and `{faction:id}` references, resolved after naming. The UI also resolves names in directions, headings, logs and political options. Mission titles and individual site titles remain authored in this slice.

`DefinitionFactory(seed, generationVersion?)` defaults to the newest version only for fresh/reset games. Restore must pass `loaded.state.generationVersion` both to save validation and to the rendered game's factory. This applies to corrupt-save backup restoration, import, command-lease acquisition, secondary-tab storage events and ordinary reload. External engine hosts must do the same.

Fixtures captured from v0.3 before the naming change are `tests/fixtures/*-generation1.json`. A generation-2 name snapshot guards the initial algorithm and vocabularies. Changing sampler behavior, word ordering, prefixes or vocabulary sizes must retain a version-2 implementation for existing saves rather than updating that fixture to hide a compatibility break.

The default seed remains 1701, so first-time players share its generated names. To see another cast and set of names, start an expedition/company with a different seed in Settings. Loading or resetting with the same seed and version intentionally reproduces its names. Existing expeditions keep generation 1 and do not need a reset to remain playable; starting a fresh expedition is optional and uses the existing backup/confirmation flow.

Generation-5 rescue discoveries reserve a serial in their durable incident at onset. The found specialist preview and eventual joining use this serial; ordinary recruits skip it. Resettlement leaves it unused. No name is consumed by preview or a failed choice; this prevents other hiring from changing a survivor's identity. See [CREW.md](CREW.md).

Generation 6 adds discovery-driven project catalogs while retaining version-2 name domains and all prior full-definition fixtures. At its v0.9 introduction, fresh factories defaulted to 6; restoration still uses the saved version. The current fresh default is 7. Project assembly follows naming and uses resolved catalog names, never ambient randomness.

Generation 7 adds discovery variety and reuses all frozen version-2 name domains. Medic/fighter rescue names share normal recruitment serials, reserving one only at actual onset. Restores continue to pass their saved generation version; new/reset expeditions default to 7. Previous full-definition fixtures remain unchanged.

Recruitment correction validation: 181 unit tests, 120 game browser cases, 12 production telemetry cases and 40 offline cases pass locally, alongside strict typecheck/Pages build and both campaign simulators. Regressions cover every released generation in both games, exact selected hires, reload, failed-command immutability, survivor reservations, unused gaps and the complete 1,000-member archive. The telemetry harness now drains in-flight mocked routes before disposing its manually created contexts; the full suite then passed with explicit candidate-name exclusion on hire events. Deployment/live evidence is recorded in [STATUS.md](STATUS.md).

Recruitment correction delivery: `c3028f0`, finalized by `38f47f5`, passed [Pages workflow 40951200516](https://github.com/rayners/explorer/actions/runs/40951200516). Live iPhone WebKit verified four distinct candidates in both games for generations 1 and 7, the explicit preview serial, exact non-first offline hires after reload, and unchanged existing crew/RNG. No save reset or content-generation upgrade is needed. Physical iPhone acceptance remains pending.
