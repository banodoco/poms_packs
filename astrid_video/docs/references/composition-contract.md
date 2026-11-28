# Living Composition v1

One canonical parameter object, three views: actual destination geometry, a timing sheet, and motion. See `rendering/elements/effects/living-composition/element.yaml` for the machine-readable schema. An Astrid effect clip supplies its duration; the example wrappers contain `duration` and `composition` separately.

```yaml
version: 1
items:
  a: {kind: image, asset: room}
  b: {kind: image, asset: storyboard}
  c: {kind: image, asset: mink}
  d: {kind: video, asset: portal, sourceEnd: 2.4}
behaviour: present
transitionDuration: 0.8
transitionSpeed: 1
restJitter: 0.15
restSpeed: 0.5
organismFlow: 1
poses:
  - {at: 1, layout: centre-emphasis, items: [a, b, c]}
  - at: 4
    layout: centre-emphasis
    items: [a, {id: b, media: d}, c]
    transition: {type: replace, duration: 0.6, edgeReveal: true}
  - {at: 6, layout: hero, items: [{id: b, media: d}]}
accents:
  - {at: 4.2, duration: 0.7, target: b, effect: pixel-pulse}
```

`at` is the exact arrival frame rounded from seconds. The transition starts at `at - duration / speed`, bounded by zero for the first pose. An impossible overlap with the previous arrival fails instead of retiming narration. `cut` uses zero duration. At a destination the geometry is exact; bounded resting motion fades in afterwards and settles before the next transition. Stagger is bounded within the window. A pose at 0 is already settled. Hold the last pose until the clip ends. A pose with no items clears the scene.

`items` is the content catalogue. `poses[].items` is a list of stable IDs, or `{id, media, rect, scale}`. The `media` override names a catalogue entry, not a file. Keep `id` for an existing physical carrier; changing media with the same ID retains the organism seed and replaces the payload. New IDs enter; removed IDs leave; reordering retains identity. A video plays relative to its appearance run, not its array position, and holds at its specified `sourceEnd` (exclusive); never supply a sourceEnd beyond the actual source. Audio is muted for separately mixed narration. Images/video use contain by default; aspect defaults to 16:9 (text 1.55); supply actual aspect when needed. Text cards accept `text` and optional `subtitle`. An asset is a logical slot. Immutable demo assets are declared in the element; production slots use `mediaBindings: {slot: registry_key}` when the host supports the proposed generic binding contract. The inspected hosts do not yet provide this projection; see [native integration](native-integration.md). No free-form paths or URLs in authored params.

Layout defaults use normalized `safeArea` (x .065, y .075, w .87, h .75, leaving space below for tissue). Presets fit media aspect; custom rects or overrides are normalized canvas rectangles and may intentionally change framing. `scale` applies to each item around its own centre, then pose `scale` or `compositionScale` scales the arrangement around its bounding centre. Invalid bounds fail; overlapping destination rectangles are warnings, not automatic redesign. Inspect custom overlaps and paths. Hero requires one item, comparison two, centre-emphasis three. Grid and columns support up to twelve; diagonal up to four. Timeline currently shares the columns geometry (not a time axis).

Motion precedence: built-in defaults → legacy nested defaults → top-level composition controls → pose motion → transition fields. Scene-wide seed, organismPixelSize and organismFlow cannot be changed per pose, preserving one material clock/grid. `transitionSpeed` changes movement duration, not narration or the arrival timestamp. `restJitter` is magnitude and `restSpeed` is rate; zero disables cargo motion. `organismIntensity`, `organismSpread`, `organismFlow` and `organismPixelSize` control the living material separately. The four crawl styles, pixelSize and randomness control the membrane. `edgeReveal: false` carries intact objects. `replace` on a retained carrier with changed media explicitly requests a reveal; otherwise `edgeReveal` decides reveal vs transport. `exchange` stages departures before most entrances; `auto` infers the same from the ID diff. `rearrange` retains common objects and infers arrivals/departures (warns on new IDs). `direction` defines entry travel and the opposite exit edge. No arbitrary manual curves are required. This deterministic engine is not a full collision or fluid simulation; review any crossing paths. The existing organism uses seed-derived fields; continuity is visual, not a conserved particle simulation.

Accents: `pixel-pulse`, `pixel-underline`, `pixel-connect` and `pixel-link` (both require `to`), each with start `at`, duration and optional intensity. They follow the named item's actual current rectangle. If a target is absent, nothing is drawn. Preview and inspect to verify the target is visible at the desired beat. `pixel-link` is a quiet, straight pixel-grid connector between facing rectangle edges; it grows over the first eighth of its duration and holds until its authored end. Use up to 30 seconds for a link, and up to 5 seconds for the older transient accents. It does not alter the layout or route actual workflows.

Examples: [journey](example-journey.yaml), [exchange](example-exchange.yaml), [extension](example-extension.yaml). The compiled frame plan is pure, seekable and reused by preview and the TSX component. Real Astrid/Remotion render and editor admission must still be proven; the standalone raster preview is a separate compositor, not proof of host parity.

Rendered inspection examples: [Journey](example-journey-storyboard.jpg) · [Three-carrier exchange](example-exchange-storyboard.jpg) · [Layouts and accents](example-extension-storyboard.jpg). These show actual standalone preview frames and compiled timing, not host exports.

## Process diagrams and object handoff (v0.18)

`pixel-link` accepts `route: {bend: 0.05..0.95}` for an orthogonal channel in the horizontal gap between live card edges. A missing route keeps the legacy straight connector. It does not route around arbitrary obstacles; author separated columns and inspect crossings. `shared/composition/handoff.ts` exports `processStages(base, rows, end, transition)` (explicit placements and reveal times → ordinary poses and paired persistent links) and `handoffToTimeline(compiledSource, timelineSettings, ids)`. The latter uses the exact final frame's fully revealed image bounds and requires matching stable IDs, source asset slots and managed binding keys. Use a common canvas and visual theme, clear unrelated cards before the boundary, and reserve the same result identities as destination timeline clips. This is an author-time bridge; it does not transfer runtime video clocks or audio files. See the timeline reference.
