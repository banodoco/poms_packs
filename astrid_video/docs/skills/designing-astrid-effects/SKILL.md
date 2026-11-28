---
name: designing-astrid-effects
description: Create or refine reusable, deterministic Astrid Remotion elements with an editorial static composition and crisp pixel-based movement.
---

# Designing Astrid effects

Read [visual language](../../references/visual-language.md), [motion language](../../references/motion-language.md), [living pixels](../../references/living-pixels.md), the [visual grammar](../../references/visual-grammar.png), and [effect catalogue](../../references/effect-catalogue.md). If the effect uses the mink, also read [mink character](../../references/mink-character.md).

## Creative contract

Design the settled composition first: spacious paper, ink, readable type, meaningful hierarchy, pristine media and a small number of well-aligned objects. Move these objects smoothly when the spatial relationship changes. Let crisp square pixels describe a boundary, transform an object, signal an action, or act as a small companion to the main motion. Never globally pixelate a UI, face, subtitle or ordinary footage merely to brand it. Avoid generic glitch, neon, and futuristic dashboard tropes. Not every entrance needs an effect.

## Make the pixels act alive

Treat the pixels as an adaptable organism, not a particle preset. Define its task, contact points, effort, destination and rest before designing the motion. It may become a colony of workers supporting an object, flexible arms holding several objects, a membrane revealing content, or a new living form. A visible part of the organism should appear to cause the movement. For transport, imagine a card lying on thousands of ants: build a dense body under its **entire footprint**, then occlude it with pristine content. Let small asymmetric lobes, a trailing wake and scouts swim out on any side. Do not draw a fringe of ants under an edge or a decorative halo. Other organic forms can be flowing streams, membranes or growth; they still have material, contact and purpose. Preserve attachment as objects move; use coherent seeded currents and continuous trajectories (quantized at draw time), not per-frame random flicker. Let the body flex and catch up while the media remains readable. Inspect the underlying body with the load removed and the final occluded composite before accepting a colony. Use the shared living primitives in `shared/organism.ts` where appropriate. The detailed [colony reference](../../references/living-pixels.md#colony-a-living-shadow-not-a-border) defines occlusion, flow, wake, rest and review criteria. A new visual form must obey the same behavioural rules, not simply repeat the same silhouette.

**Borrow behaviour, never anatomy.** An arm is a temporary concentration of the same swimming cells, not a literal pixel-art arm. Keep it porous, fluid and ethereal: cells circulate through shifting volumes, then merge into the concealed colony beneath the load. Do not render a solid spline, an outline, a palm or fingers. Compare the moving result directly with the established colony. See [currents, not anatomy](../../references/living-pixels.md#limbs-currents-not-anatomy).

Author independent normalized final rectangles for the content; don't assume full screen. Provide meaningful controls for timing, direction, intensity and deterministic variation. Reveal masks, contact positions and media placement must agree throughout the effect. Design the settled frame first and leave deliberate whitespace for the organism.

Use the shared tokens and font stacks in `shared/style.ts` (day default, optional night). Expose content and meaningful artistic controls rather than hard-coding one project. Reuse common frame-pure motion geometry. When building a new pixel primitive, specify what starts, what changes and where it rests; account for duration, canvas, seed, clipping, transparency and completion. Keep pixels square and edges crisp; movement must be deterministic on seek. Do not add an arbitrary dependency or a one-off host resolver.

## Authoring contract

Follow Astrid Agent's current Pack Builder and project-owned effect authoring guides linked in the catalogue. Inspect the actual pack and timeline; preserve existing owner, element IDs and selected revisions. Declare ordinary `component.tsx`, `element.yaml`, resources and helper imports in the V3 manifest. Use React/Remotion and declared relatives only for project-pack admission. Descriptor defaults and schema must agree with implementation. Never put executable JSX into timeline data or author `__astridAssets` manually. Use supported asset bindings; the prototype deck requires declared media. Add no product-specific registry fork.

Test the pure logic and boundary cases: zero/short/normal durations, first and last frames, repeated seeks, landscape/portrait, edge clipping, content overflow, multiple instances, and preview/export parity. Review actual rendered frames. A standalone preview is not the live host; validate, admit, place and verify with the real pack and runtime before claiming editor support. Do not silently change a creator's existing settings.

## Separate choreography from the organism

A new effect should describe a distinct creative task, not another pile of particles. Reuse the shared tissue, contact and media primitives. For a group presentation, use [Pixel Arm Display](../../references/arm-display.md) rather than duplicating its implementation or adding unrelated modes to the shuffle. Build from independently authored load rectangles, shared flow origin and per-load contact regions. Reach and take the load's weight before lifting; let the streams pool behind the load as it moves. The shared geometry plan drives all layers.

Treat **internal flow, cargo rest and reveal** as separate decisions. Resting motion is optional: use a seeded continuous bounded drift (`restJitter`), not independent random values per frame. Zero must lock the load, and the authored endpoint must remain exact. A reveal is optional too: `edgeReveal: false` moves clean intact objects and removes the reveal-front effects, not the support organism or timing. Test arrival, readable holds and off-screen departure separately. Keep exact declared resources and a thin public element contract; common primitives belong under `shared/`.

## Extend Living Composition first

Author destinations, not fixed animations. For a sequence, use [the choreography skill](../choreographing-astrid-compositions/SKILL.md). For a missing capability, follow the [extension contract](../../references/extension-contract.md): recipe → layout → behaviour → accent as appropriate. Keep geometry, time, pixel material and media separate. Extend the registry instead of creating another animation engine. Inspect the real authored poses and transitions. Preserve stable IDs, scene-wide clocks, square cells and the organism’s established character.

## Native extension check

Keep every relative source import declared. Recompute `metadata.sourceClosureSha256` using the distribution's `tools/source_closure.py --write` after shared implementation changes; native element revision must change when its transitive shared source changes. Do not invent new global asset staging, duplicate the editor, or place user media in executable pack snapshots. Reuse the [native integration contract](../../references/native-integration.md), the existing host's managed media authority, and actual exact-head publication.

## Specialized asset authoring

If the gap is a mink gesture rather than a visual capability, use [creating mink animations](../creating-mink-animations/SKILL.md) and reuse the existing performer and immutable sprite declaration. If a layout can be composed from the existing output modes in [showing agent work](../showing-agent-work/SKILL.md), prefer that over another terminal renderer.
