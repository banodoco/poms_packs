# Astrid Video — effect catalogue and integration

A reusable visual language for Astrid demos, creative experiments and technical explainers. Version 0.15.0 is a review candidate, not an admitted production pack.

## Style and themes

See [visual language](visual-language.md), [motion language](motion-language.md) and the [one-page visual grammar](visual-grammar.png) for the visual system. `theme: day` is the default for all ten effects; `night` is optional. Use per-element explicit colour overrides only when the material calls for them. Palette constants and font stacks live in `../../shared/style.ts`. No font binaries are bundled by this pack. Use Astrid's existing local fonts where available and check actual rendering.

## Implemented elements

| Element | Use | Parameters |
| --- | --- | --- |
| `pixel-card-shuffle` | Rapid near-full-frame image/video montages | `cards`, `direction`, `directions`, `transitionSeconds`, `transitionDurations`, `crawlStyle`, `crawlStyles`, `randomness`, `pixelSize`, `sparkDensity`, `seed`, `inset`, `drift`, `fit`, palette |
| `pixel-arm-display` | Present several media items on connected living arms | `cards`, per-card `layout` and `grip`, `armRoot`, `restJitter`, `edgeReveal`, `arrivalSeconds`, `staggerSeconds`, `organismIntensity`, `organismPixelSize`, palette |
| `chapter-card` | Concise section openings | `series`, `chapter`, `titleLines`, `subtitle`, `entranceSeconds`, `seed`, palette |
| `pixel-network` | Explain several inputs contributing to a result | `heading`, `nodes` (1–8), `output`, `buildSeconds`, `showGrid`, palette |

The latter two are generated hold effects: no media dependencies. Each animation uses clip-relative frames and deterministic geometry; the settled state holds until the clip ends. Make text short, review the actual canvas, and avoid embellishing every beat. The network is a one-output explanatory schematic, not a general graph editor.

## Shuffle settings

`cards` is an ordered list of `{asset, kind, weight?, sourceStart?, label?}`. `asset` is a logical slot, either an immutable declared pack asset or a `mediaBindings` entry when the host supports generic managed media. It is never a filesystem path, URL or arbitrary project media ID. The optional `weight` divides the hold proportionately and `sourceStart` is in seconds. Keep video source durations sufficient for their assigned spans. Deck order is authored; the pixel texture and small position variation are seeded. A one-card deck has no reveal. An unconfigured generated clip displays a select-cards placeholder. A single bound managed asset can use card framing only.

Example for four cards (three transitions):

```json
{
  "transitionSeconds": 0.42,
  "transitionDurations": [0.24, 0.48, 0.34],
  "direction": "left-to-right",
  "directions": ["left-to-right", "top-to-bottom", "right-to-left"],
  "crawlStyle": "ragged",
  "crawlStyles": ["clean", "noisy", "chunky"],
  "randomness": 0.82,
  "pixelSize": 16,
  "sparkDensity": 0.1,
  "seed": 17,
  "cards": [
    {"asset": "room", "kind": "image"},
    {"asset": "storyboard", "kind": "image"},
    {"asset": "mink", "kind": "image"},
    {"asset": "landscape", "kind": "image"}
  ]
}
```

The three override arrays are independently indexed: entry 0 controls the reveal into card 2, entry 1 into card 3, and so on. Short arrays fall back to their scalar setting; excess entries are unused. `alternate` starts right-to-left into card 2 and alternates horizontally. Durations are in seconds (0–1.2); zero is a hard cut, and the incoming card's hold caps the effective duration. `randomness` is 0–1.5, default 0.70. At zero the front is straight; at higher values it grows increasingly irregular, without revealing and then hiding tiles. `seed` makes the pattern repeatable. `pixelSize` is a nominal tile size scaled from a 720px short edge.

| Style | Look |
| --- | --- |
| `clean` | Narrow, restrained wavefront with sparse accents. |
| `ragged` | Organic, meandering front with coherent branches; preferred Astrid default. |
| `noisy` | Finer tiles with a broader, scattered edge. |
| `chunky` | Larger, more architectural square steps. |

Use 0.2–0.35 seconds for rapid montage, 0.4–0.6 seconds for a more noticeable reveal. Reserve stronger texture for distinct conceptual changes. The old card remains visible until replaced; its last frame is held through the overlap. Mix narration and sound effects separately, as deck media audio is muted.

## Living deck settings (v0.8)

The same `pixel-card-shuffle` element now accepts `presentation: classic | carry | hold`. Classic retains the original v0.5 full-canvas shuffle. If no presentation is supplied, any explicit card `layout` selects carry; otherwise classic is used. In living modes each card may supply a `layout: {x, y, width, height}`. All four values are normalized canvas fractions, with x/y measured from the upper left. Require `x + width <= 1` and `y + height <= 1`; invalid rectangles fail explicitly. This is the final settled rectangle, with no random placement error. A card-specific `fit: cover | contain` overrides the deck fit in living modes. With no rectangle, carry gives a large inset card with space beneath it; hold uses a responsive grid. Reserve room for the organism around the load.

| Setting | Meaning |
| --- | --- |
| `presentation: carry` | One item arrives at a time, the previous item is carried away during the reveal. The previous video's final allocated frame freezes during its exit. The first arrival uses `arrivalSeconds`; later transitions use the existing `transitionSeconds` / `transitionDurations`. |
| `presentation: hold` | Cards arrive in a stagger and stay together on screen; `arrivalSeconds` applies to each and `staggerSeconds` separates starts. Provide sufficiently long sources for video holds. Per-transition duration overrides and weights are carry/classic controls, not hold timing. |
| `organism` | `swarm` (carry default), `tendrils` (hold default), or `none`. Either living form can be used with either living presentation. |
| `organismIntensity` | 0–1, default .85; density of the living support. Zero removes living cells but retains the underlying crawl. |
| `organismPixelSize` | 3–18, default 3 for living tissue; nominal square cell size at a 720px canvas short edge. Independent of the reveal's tile size. |
| `organismSpread` | 0–1, default .62; swarm apron and scout reach past all edges of the load. |
| `organismFlow` | 0–2, default 1; speed of internal swarm currents, independent of transport timing. |
| `arrivalSeconds` | 0–1.8, default .8; capped by available frames. Zero is immediate. |
| `staggerSeconds` | 0–1.2, default .24; hold only, capped so the final load has time to settle. |

| `restJitter` | 0–1, default 0 on shuffle; controls a small seeded, smooth drift of the load while resting. Zero locks it; internal swarm flow is independent. The last held frame returns exactly to target. |
| `edgeReveal` | Boolean, default true on shuffle. False carries intact cards on/off screen without crawl, sparks or frontier workers; arrival and exit timing remains. Applies to living modes; when presentation is omitted, false selects carry. |

Existing direction and crawl-style settings determine both the reveal and the transport direction. `directions[0]` still selects card 2. The first card uses `direction`. Reveal randomness and the organism share the seed, without per-frame random flicker. `drift` controls classic framing; living modes use their authored rectangle and only add optional bounded `restJitter`. In living modes one card is a valid load; a hard cut remains valid. The organism is not a new host capability, but a reusable geometry layer within the same rendering element.

```json
{
  "presentation": "hold",
  "organism": "tendrils",
  "arrivalSeconds": 1.1,
  "staggerSeconds": 0.38,
  "organismIntensity": 0.9,
  "organismPixelSize": 7,
  "direction": "bottom-to-top",
  "randomness": 0.83,
  "cards": [
    {"asset":"room","kind":"image","layout":{"x":0.055,"y":0.22,"width":0.27,"height":0.27}},
    {"asset":"storyboard","kind":"image","layout":{"x":0.34,"y":0.09,"width":0.32,"height":0.32}},
    {"asset":"landscape","kind":"image","layout":{"x":0.69,"y":0.27,"width":0.255,"height":0.255}}
  ]
}
```

See [living pixels](living-pixels.md) for the creative contract. The source examples in the review package demonstrate both carry and hold.

## Pixel Arm Display (v0.8)

Use `pixel-arm-display` for an actual multi-item presentation, rather than treating it as a montage setting. One to eight items (normally two to four) rise on porous currents flowing from a common `armRoot`. Author each final `layout` and optional `grip` (0.12–0.88 across the load), or let the layout helper arrange a responsive grid. The effect reaches then lifts; the streams pool behind the actual moving cargo. Cards remain visible together until the clip ends. `arrivalSeconds` defaults to 1.15, `staggerSeconds` to .18, `edgeReveal` to false, and `restJitter` to .18. You can set zero stagger for simultaneous lifting, and zero jitter for readable comparisons. Release/lowering at clip end is a future option, not implemented. See [arm display design](arm-display.md) for a three-item example and how the shared components fit together.

## Integration with Astrid

This source uses the V3 pack manifest, schema-declared effects, ordinary TSX entry points, shared deterministic TypeScript functions, and only React/Remotion plus declared relative imports. No new renderer, editor-specific component registration or dependency should be needed for the ordinary rendering-element path, subject to admission and render verification.

1. Inspect the target project's actual pack and placement context; initialise a named collection (`astrid_video`) only if needed, using the returned canonical source path. Copy the source files, not preview build products. Preserve any existing element identities, code, and settings. If incorporating into another owner pack, update descriptor owner and merge declarations/resources; do not overwrite the target manifest.
2. Run `python3 -m astrid.core.pack.cli validate <pack-root> --json`, then use the documented project-pack admission command with the real realm/project and collection. Do not invent an admitted revision or edit derived registries.
3. Use the owner-qualified admitted element refs and exact expected head to place or update a generated hold effect with the documented host route. Author the parameters separately; inspect the saved timeline. First project-pack placement was restricted to an `am-discord` occurrence clip in the inspected Agent source. Existing generated hold effects have the same-placement update path.
4. For production decks, use the [native integration contract](native-integration.md). Astrid injects `__astridAssets` for immutable declared pack assets during render preparation; never author that map by hand. Generic managed-media slots are implemented at the pack consumer boundary, but require native host projection. Do not repackage production footage to bypass missing host support. The existing fixed six-card resolver is not a general mechanism and should not be copied or extended one effect at a time.
5. Smoke-test the selected effects and the relevant existing regression cases through the real editor and Remotion render, including image→video→image, per-transition timing, seeks, portrait and landscape, export/reopen and two simultaneous effect occurrences. Verify that source video decoding, freeze, SVG clipping, font rendering, parameter validation and injected asset binding agree in preview and export.

See [project-owned effects](https://github.com/banodoco/astrid-agent/blob/c0ad6b54aadd21630d98bb5039613e37efe92a8f/astrid/packs/rendering/docs/references/generated-elements-authoring.md) and [Pack Builder](https://github.com/banodoco/astrid-agent/blob/c0ad6b54aadd21630d98bb5039613e37efe92a8f/astrid/packs/_core/docs/pack-builder/SKILL.md) for the inspected contract. Verify against the installed release before adopting.

## Roadmap, not implemented

Dedicated source/mask/result comparison and additional mascot performances beyond the current cue library. Add one independently configurable element at a time, reuse existing capabilities, and validate the real render rather than inventing special-case renderer branches. For frictionless decks, add a general, bounded, revision-aware binding for a list of managed media handles, then test the same editor/render/cache path for every effect. Keep creative assets in the project media system wherever the supported host binding allows.

## Living Composition (v0.10)

Use `living-composition` for several timed destinations with retained item identities. See the [contract](composition-contract.md), [extension guide](extension-contract.md) and [journey example](example-journey.yaml). Layouts: hero, columns, comparison, centre-emphasis, grid, timeline, diagonal and custom. Behaviours: carry, present, none. Accents: pulse, underline, connect. Legacy effect IDs are unchanged. All actual new-source media must be declared and staged.

## Timeline assembly and player visualizer

`timeline-assembly` transports media into proportional track blocks, then plays supplied video(s). `timeline-player-visualizer` begins with the completed edit and synchronizes players with its track clock. Both share the timeline model and existing managed-media adapter. See [timeline-visualizers.md](timeline-visualizers.md) for the structured parameters, scope and supported usage.

## Agent activity and mascot performance (v0.13)

- `agent-at-work`: bounded terminal replay with actual artifact reveals and flexible card or existing timeline output. See [contract](agent-at-work.md).
- `mink-performer`: transparent frame-driven run/settle/wave/idle performer, with named movement anchors. See [guide](mink-performance.md).

## Continuous Sequence

`continuous-sequence`: optional camera/actor choreography over title or media panels, with `world`, `panels`, `camera`, `actor` and logical `mediaBindings`. See [contract](continuous-sequence.md), [skill](../skills/choreographing-continuous-sequences/SKILL.md) and [asset-free example](example-continuous-sequence.json). Use original editable effect outputs as managed media and ordinary cuts between islands. Native integration remains unverified.
