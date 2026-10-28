# Generated system and realm layouts

Implemented for v0.7, 2026-10-28, following generated sites and discovery-derived missions. Delivery checks are recorded in [ROADMAP.md](ROADMAP.md).

## Goal and scope

Seeds now vary the actual travel graph and population of worlds/places, alongside names and site details. Each expedition retains a coherent first journey, service hubs and recovery. Both games use the same generic graph builder with setting-owned recipes. This is a bounded generated world with an authored spine; full procedural campaigns, unbounded growth and roguelite progression remain separate work.

## Generation 4

Generation 4 introduced generated layouts. Fresh expeditions now use generation 5, reusing this frozen layout algorithm and adding [personnel opportunities](CREW.md). All authored region/location IDs remain, protecting base mission targets and original threat investigations. Add zero to two regions, each with one hub and two or three field locations; each original region may gain one field location. Far Wake therefore has four to six systems; Hollowmere has three to five realms. Counts and connections vary by seed.

Each region's local graph is a connected spanning tree plus optional links. The interregional graph is another connected tree with optional links. Protected introductory routes are retained exactly: Anchor–Cinder and Cinder–Pale in Far Wake; Mournwatch–Old Road and Old Road–Lantern Camp in Hollowmere (display names are generated). All other links are regenerated. Extra crossings connect a field departure to a service hub. Far Wake keeps region-wide space departures; Hollowmere retains actual roads/passages between locations.

A graph connection does not reveal a destination immediately. Surveying resolves the current region and outbound endpoints at that location; reaching a new hub resolves local places and outbound endpoints at that hub. Exploring all available places and visiting newly discovered hubs can uncover the entire map. No resource-free rescue route depends on knowing or affording a travel path: the existing recovery command selects a service hub within the current region.

Every added place has theme-owned kind, description, color, yields and danger. The ordinary naming/site/mission pipeline then gives it stable names, three site profiles and one discovery-derived contract per site. Existing eligible Far Wake discovery events also include new field locations. Hollowmere retains its existing explicit curse investigation; this milestone does not add new random curse events.

## Mechanisms and boundaries

- `src/engine/topology.ts`: pure seeded undirected graph construction, retaining required edges and joining components before adding optional edges. Sorted identities make graph construction independent of input ordering.
- `src/engine/world-generation.ts`: pure bounded population and topology assembly. It copies inputs and returns region/location/route catalogs; it knows no game ID, themed resource or browser API.
- `src/game/world.ts`, `src/fantasy/world.ts`: frozen generation-4 recipes, containing kinds, descriptions, resource costs, physical yields, danger and time scales.
- `src/content/worlds.ts`: version guard and theme assembly, before names, sites and follow-up contracts.
- `src/ui/world-map.ts`: shared drawing of real interregional links; both game UIs derive chart/body counts from definitions. Hollowmere's multi-leg itineraries now show total and next-leg costs/times.

Generation domains separate population, places, local graphs, regional graphs, gateways and route estimates. They do not consume the saved outcome RNG or naming streams. IDs use `generated-region-<index>`, with `-hub` and `-generated-<index>` location suffixes; additions in authored regions use `<region>-generated-<index>`. Never change these algorithms/recipes in place once published: advance generation or supply explicit compatibility.

Local Far Wake routes take 60–90 real seconds; new interstellar crossings take 15–25 minutes and four to eight fictional years. Fantasy local paths take 45–75 seconds; crossings take three to four minutes. The two protected introductory routes retain their original times/costs/risks. Each chart uses two columns and up to three rows with room for touch targets and labels. Coordinates are diagrammatic, not orbital distances.

## Save compatibility

The layout release kept envelope 1/state schema 3 unchanged; v0.8 migrates state to schema 4 for personnel, independently of map generation. Seed plus generation version reconstruct the immutable catalog; existing job fields retain the paid destination, duration, fictional days, risk and reward. Versions 1–3 keep their complete previous definitions, including geography, names, site profiles and contracts. Full-definition hashes captured before implementation guard four seeds per old generation/theme; generation-4 hashes freeze six seeds per theme. Existing released job fixtures also remain in force.

Existing expeditions keep their maps. A new seed/expedition through Settings uses the current generation (5), with these same layout rules; import/backup/read-only-tab paths continue to use the saved version. Reset still requires confirmation and writes a backup first. No automatic replacement or reset is introduced.

## Verification

Property checks cover 100 seeds per theme for deterministic catalogs, connected local graphs, global reachability, hubs, protected routes, bounded costs/times/risks and valid place/site/mission references. The existing graph primitive also verifies no-extra-link trees, required links, complete optional graphs and invalid inputs. Save tests commit a journey to an optional place, reconstruct it, reconcile offline time, survey/explore it and request recovery without supplies.

`scripts/simulate-world.ts` explores the actual known graph using real travel, surveys, expeditions, gathering, station work, maintenance, markets and survey licensing. It visits newly known hubs when no known field remains, avoiding omniscient navigation. Eight seeds per theme test full-world completion, valid stock/cargo, safe crew and charter milestones. Far Wake's ten-survey milestone takes 104–138 simulated minutes in these samples; all-field campaigns take 162–277 minutes for 14–20 field locations. Hollowmere takes 46–96 minutes for 6–11 locations. Generated-world tests require charter/ten-survey milestones below 200 minutes and full-world time below `18 × field locations + 30` minutes. These are bounded regression budgets for these samples, not a claim about every seed's pacing. The released generation-3 frontier simulation remains independently checked under its original 200-minute budget.

Browser cases cover imported generated maps, actual chart edges, non-overlapping 44px targets, portrait/landscape overflow, optional-place journeys and reloads in both themes. Production offline cases cover committed generated journeys and query-string URLs; the service worker ignores query parameters when selecting a precached static page, so a tagged game URL cannot fall back to the library.

Physical iPhone acceptance remains pending; WebKit device emulation is not a physical-device result. See [ACCEPTANCE.md](ACCEPTANCE.md).
