# Pixel Arm Display — lifting and presenting media

The organism operates the world; it does not decorate it. Use this element to let a viewer compare several references, see a set of generated results, or understand a group of inputs. Think a swimming colony temporarily forming several ethereal currents, not a solid octopus or three animated cables.

## Choreography

1. Begin with a diffuse gathering of cells near the bottom or another deliberately chosen root. Reach towards each load. A short reach precedes the lift; initially the media is outside the frame.
2. Each current flows into a contact region behind its card, where it disperses into a full-footprint swimming colony. Move the whole, pristine media rectangle smoothly towards its own destination. Porous streams extend, curl and breathe on the shared square-pixel grid. The path is invisible; individual cells move along and across it. No solid contours, palms or fingers. Arms can arrive together or stagger.
3. On arrival, hold the layout. The organism keeps swimming and reforming; optional bounded cargo motion (`restJitter`) makes the load feel balanced rather than bolted in place. Set it to zero for text-heavy references or direct comparisons. The final held frame is exact.
4. When the edge effect is enabled, a living frontier reveals the incoming media as it moves. When disabled (the default here), the whole object moves into frame. Do not use a reveal if lifting alone communicates the action. A planned future release phase would lower the objects back out, then retract the arms; the current effect holds through its end.

## Parameters

`cards` defines the number of arms (1–8); use two to four for most compositions. Each item can be a still or a sufficiently long video and can specify independent normalized top-left x/y, width/height, `fit`, and a horizontal `grip` fraction selecting a contact region within the card. `armRoot` locates the shared body. `arrivalSeconds`, `staggerSeconds`, `restJitter` (0–1), `edgeReveal`, `organismIntensity`, `organismPixelSize`, `organismSpread`, `organismFlow` and seeded reveal controls set timing, movement and texture. Card layouts should not overlap unless deliberate; leave room beneath them for their arms. Use stable seeds and no wall-clock state. The public schema and actual preset own the defaults.

```json
{
  "theme": "day",
  "armRoot": {"x": 0.51, "y": 0.94},
  "arrivalSeconds": 1.25,
  "staggerSeconds": 0.22,
  "restJitter": 0.32,
  "edgeReveal": false,
  "cards": [
    {"asset":"room","kind":"image","layout":{"x":0.055,"y":0.22,"width":0.27,"height":0.27},"grip":0.60},
    {"asset":"storyboard","kind":"image","layout":{"x":0.34,"y":0.09,"width":0.32,"height":0.32},"grip":0.47},
    {"asset":"landscape","kind":"image","layout":{"x":0.69,"y":0.27,"width":0.255,"height":0.255},"grip":0.39}
  ]
}
```

All assets in this example are declared sample files, not arbitrary timeline media bindings. Replace or extend the declaration and readmit for other sources. See [effect catalogue](effect-catalogue.md) for host limitations and admission steps.

## Architecture

`rendering/elements/effects/pixel-arm-display/` contains the descriptor, the thin component and its presentation preset. It uses the same `shared/organism.ts` Tissue, tendril and nest routines as the shuffle. `shared/deck/motion.ts` owns layout types, direction and deterministic pixel masks; `shared/deck/living-motion.ts` owns the geometry plan, arrival/hold/transport and resting offsets; `shared/deck/living-deck.tsx` renders rear tissue, native media, and sparse foreground contact. `shared/style.ts` owns common colours and type. Both public effects depend on shared primitives, not each other's public components. The shuffle's original `presentation: hold` remains supported; use the new effect by name for a purpose-built presentation. A new choreography may share the geometry/render primitives without exposing all of another effect's parameters.

## Review

Verify that streams originate in the same living colony, individual cells keep swimming, each stream pools beneath its actual load, no solid anatomical surface is visible, positions stay within the frame when at rest, the clean media is readable, and movement stops exactly at the authored endpoint. Test 1, 3 and 8 items, varied sizes, unusual aspect ratios, simultaneous and staggered arrival, no-reveal transport, locked and drifting holds, deterministic seeking and the real editor/export path. The sample reel is a standalone raster preview, not evidence of Astrid admission.
