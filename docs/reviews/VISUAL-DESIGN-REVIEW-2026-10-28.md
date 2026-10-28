# Independent visual design review — Explorer

Reviewed 2026-10-28 against v0.11.0, commit `5d7813c`. Requested by the user and performed by a separate agent. **Recommendations are proposals, not approved specifications.** No gameplay or visual implementation was changed.

## Assessment

The library and both games already have a coherent visual voice: muted industrial colors, restrained gold accents, crisp pixel scenes and an unusually calm presentation. Far Wake's observation console is convincing; Hollowmere's forest, gate and lanterns establish a distinct mood. Preserve that work. The main weakness is information hierarchy as the game grows: important instructions use very small type or compete with decorative framing and long operational prose.

The best next visual slice is **readability and action hierarchy**, rather than a replacement art style or more decoration.

## Method and evidence

I inspected the documentation, mounted UI, artwork and styles, then captured 45 local-development browser views using existing Playwright: Chromium at 1440 × 1000 CSS pixels; WebKit with the iPhone 15 Pro Max profile at 430 × 739 portrait and 932 × 430 landscape. Captures cover the library, both opening views, crew/assignment screens, accepted support commissions, navigation charts and offers. Focused follow-up captures remove the temporary import notice and bring maps into view.

Populated states use `supportVarietyFixture` at seed 1701/generation 7: actual discovery response and contract acceptance, a prepared support specialist, all locations known/surveyed, and positioning at the source. This is a deliberate information-density stress case, not an ordinary first session or full human playthrough. Fresh openings use the normal default seed. Screenshots do not include Safari's physical browser chrome, notch or real-device behavior. No physical iPhone, tablet, low-vision user test, comprehensive contrast audit, zoom/reflow audit or screen-reader test was performed. No document horizontal overflow was measured in the captured matrix; that does not prove every possible state fits.

Four retained viewport captures:

| Evidence                                                                                | What it shows                                                                       |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| [Far Wake portrait opening](visual-2026-10-28/portrait-far-wake-initial.png)            | Strong scene, small resource labels, next actions below the initial usable viewport |
| [Far Wake accepted support work](visual-2026-10-28/portrait-far-wake-project-clean.png) | Long title, prose, repeated supplies and preparation before the action              |
| [Hollowmere desktop opening](visual-2026-10-28/desktop-hollowmere-initial.png)          | Strong theme/art, similar panel hierarchy, introductory goal below the scene        |
| [Hollowmere landscape opening](visual-2026-10-28/landscape-hollowmere-initial.png)      | Desktop-style sidebar and substantial header area on a short phone viewport         |

Raw captures/measurements remain in `/tmp/explorer-visual-review/` for this working session; they are not durable repository links. Capture scripts are `/tmp/explorer-visual-review-capture.mts` and `/tmp/explorer-visual-review-focus.mts`. Reproduction without those temporary files: start Vite on port 5211, follow [scripts/screenshots.ts](../../scripts/screenshots.ts) for browser profiles, capture the three routes, and navigate via the four main tabs. For the populated views, encode the state returned by [supportVarietyFixture](../../e2e/variety-fixture.ts) with `encodeSave`, import through Settings → Save JSON → Import pasted save → Confirm order, wait at least 6.5 seconds for the notice to clear, then open Operations/Company and scroll to `.follow-up-work`. Use viewport captures for mobile; very long full-page screenshots become unreadable at document scale.

## Strengths to preserve

- **Atmosphere without visual noise.** Teal/copper sci-fi and olive/gold fantasy palettes, generous outer spacing and fine borders create related but distinguishable settings. The library communicates the two choices clearly; its large Play/Resume bars are easy to find.
- **Crisp, original pixel scenes.** Far Wake's ship scale against the station/planet and Hollowmere's tiny travelers beneath the gate/forest make the exploration feel larger than its spreadsheet mechanics. Pixelated artwork can coexist with clear ordinary text; a pixel font is unnecessary.
- **Predictable navigation and controls.** Four persistent destinations, a clear selected state, labeled actions and native assignment selects are a sound base. Buttons generally have comfortable visual height; CSS provides 44px minimum buttons, visible focus outlines and reduced-motion handling.
- **Useful information is present.** Resources, condition, roles, costs, next steps and disabled-action reasons are available. The task is to establish priority and reduce repetition, not remove the safeguards or hide costs.

## Prioritized findings

### 1. High: essential text is too small relative to its importance

**Observed:** Shared body copy is mostly 12px; descriptions often become 11px on phones. Resource labels shrink to 7px at the portrait breakpoint; navigation labels, badges and chart labels commonly use 8–9px. The library also uses 8–11px metadata/descriptions. Wide letter spacing and uppercase treatment help the console aesthetic, but do not make tiny letters easier to read. High device pixel density makes edges sharp without increasing their physical size.

**Impact:** Reading stock names, travel details, specialty/proficiency and availability reasons requires more visual effort than the large atmospheric headings suggest. This matters most during preparation, where a small label changes the meaning of a large number.

**Proposal:** Establish a semantic type scale: trial 14–16px for decision prose, 12–13px for essential metadata and reserve smaller text for truly decorative coordinates. Give resource cells room to wrap or use fewer columns rather than compress their labels. Keep cost/risk/assignment reasons legible and near their controls. Check actual iPhone reading comfort and zoom before settling exact sizes; these are design starting points, not measured accessibility thresholds.

**Evidence:** [Shared styles](../../src/ui/styles.css), especially `p`, `small`, `.resource small`, `.star-button small` and the 640px breakpoint; [fantasy overrides](../../src/fantasy/styles.css); [library styles](../../src/picker/picker.css). Retained portrait opening.

### 2. High: the opening composition emphasizes the place before the immediate goal

**Observed:** At 1440 × 1000, both introductory goal panels begin near or below the bottom edge, after the scene. In the 430 × 739 Far Wake opening, the location/action area reaches the fixed bottom navigation before its buttons can be read. The action remains reachable by scrolling; this is a below-the-fold hierarchy finding, not evidence of a permanently blocked control. The title, subtitle and five-cell stock strip occupy substantial space on every main tab.

**Impact:** A new player sees an attractive console but can miss the first instruction. Returning players repeatedly pass through the same framing before the useful work, map or crew information.

**Proposal:** Show a compact current directive with its one next action before the scene on phones, and near the top of the desktop overview. Reduce repeated page framing on work-focused tabs rather than shrinking operational text. Keep a welcoming scene on the overview; do not solve this by removing the art. Check that one meaningful next action is visible in the initial usable portrait and landscape viewport.

**Evidence:** Both retained opening views; [Far Wake overview](../../src/ui/app.ts) and [Hollowmere chronicle](../../src/fantasy/app.ts).

### 3. High: commission cards lack a strong visual distinction between story, requirements and action

**Observed:** The accepted Far Wake support commission combines a two-line generated title, a paragraph covering purpose/source/patron/dispatch policy, supply lines, team lines, another next-step/supply breakdown and explanatory caveats before its dispatch control. In portrait, the card's action is outside the focused screenshot even though its preparation is ready. Most lines use the same small monospaced treatment; accent color is used for several different meanings. Hollowmere uses the same shared preparation structure. In the populated fixture, the offers views exceed 10,000 CSS pixels in portrait; this is stress-state evidence, not the expected length of every expedition.

**Impact:** Players must read rather than scan. The visual cost grows faster than the number of meaningful choices, and long generated names make cards taller.

**Proposal:** Lead with purpose, location and a short status such as Ready / Needs supplies / Work complete. Follow with a compact role-and-supply group and an obvious next-action row. Put narrative detail, provenance and the full estimate behind an explicit expandable section. Preserve visible payment timing, casualty risks and unavailable reasons. Group routine offers by destination or use compact summaries so several full essays do not compete equally.

**Evidence:** Retained accepted-work capture; [planning panels](../../src/ui/planning-panels.ts), [mission panels](../../src/ui/mission-panels.ts), both mounted UIs. The existing shared structure is an opportunity to improve both games together.

### 4. Medium: phone landscape needs a height-aware composition

**Observed:** At 932 × 430, the width breakpoints restore the desktop-style sidebar and two-column overview. The sidebar takes 180px horizontally; the topbar, page title and resource strip leave only the upper edge of the scene/condition panels in the initial viewport. The portrait bottom navigation is absent. No horizontal overflow was measured, and topbar settings remain available; this is inefficient use of a short screen, not a claim that the application is unusable.

**Proposal:** Add a short-height layout rule: compact the title/header, reduce decorative sidebar branding and prioritize the current action. Consider a compact navigation rail or horizontal navigation treatment while retaining labels. Judge portrait and landscape independently; a width-only desktop layout is not automatically a good phone landscape view. Verify safe areas and actual Safari chrome on the physical device.

**Evidence:** Retained landscape Hollowmere view; shared 1150/900/640px media rules in [styles](../../src/ui/styles.css).

### 5. Medium: the chart is atmospheric but offers limited visual explanation of route state

**Observed:** Region charts use small star-like symbols, colored names, dashed links and a selected outline. Route cards below carry the detailed current location, itinerary, next leg, costs and unavailable reasons. The map itself communicates less of that distinction, and its labels remain small on portrait. In a populated view the discovery-work summary pushes the chart farther down. Existing instructions and route cards do explain the mechanics; this is a visual scanning issue.

**Proposal:** Distinguish current, selected destination, known reachable and uncharted with both shape/line treatment and text. When a contract route is focused, visually connect its next leg and destination to the itinerary card; keep explicit dispatch on the existing action. Add a compact visible legend and consider larger names or a selected-place label instead of making every map annotation tiny. Test long generated names before adding more decorative markers.

**Evidence:** [Map drawing](../../src/ui/world-map.ts), chart markup in both apps, `.map`/`.star-button` shared styling. Focused raw captures: `portrait-far-wake-map-focus.png` and `portrait-hollowmere-map-focus.png` in the temporary evidence directory. No new route or auto-travel mechanism is proposed.

### 6. Medium: strengthen character and theme identity in operational screens

**Observed:** The overview art and library cards distinguish the games well, while many operational cards share the same rectangular grid, monospaced prose and generic borders. Far Wake has small crew portraits; Hollowmere's company rows are primarily name, class, proficiency and a large select. Fantasy navigation uses simple Unicode symbols, while Far Wake uses a consistent outline SVG set. These are functional, but class/person identity is visually weaker than the setting scenes.

**Proposal:** Give each class/specialty a small consistent icon plus text, and reuse it in assignments, requirements and mission summaries. Consider compact original fantasy portraits/silhouettes and a little stronger variation in scene/section framing. Keep the recognizable shared interaction structure; a distinct type accent, border motif and role imagery can do more than another overall palette. Avoid replacing readable controls with ornamental fantasy fonts or relying on color alone for role/status.

**Evidence:** [Crew controls and portraits](../../src/ui/app.ts), [fantasy company/navigation](../../src/fantasy/app.ts), [Far Wake art](../../src/ui/art.ts), [Hollowmere art](../../src/fantasy/art.ts). This is a lower priority than readable text and actionable cards.

## Suggested next visual slice — proposal only

Prototype the opening directive and one accepted-work card in both themes, using a larger decision-text scale and clearer Ready/Blocked/Complete status. Compare fresh and populated views at the three captured sizes. Retain costs, explicit orders, disabled reasons and the existing save/engine behavior. Acceptance should include readable generated names, keyboard focus, no horizontal overflow, deliberate scroll access above the fixed navigation and a physical iPhone check with Safari chrome. Then apply the successful hierarchy consistently to the map, roster and board. More artwork can follow once the key information is easy to find.
