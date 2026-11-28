# Living pixels — the organism

**The mink inhabits the world. The pixels operate the world.**

Astrid's pixels are a living, adaptive material. They behave as though they have collective intelligence: finding an object, gathering, taking its weight, moving it, presenting it, releasing it. The content remains editorial, crisp and readable. The pixels do not become a filter over the content. A viewer should be able to infer what the organism is doing even with the sound off.

## One organism, many forms

| Form | Behaviour | Good for |
| --- | --- | --- |
| Colony | A dense, two-dimensional shoal occupies the entire footprint beneath a load. Thousands of little workers flow in coherent currents; only irregular spillover, the wake and scouts are visible on all sides. | Carrying media, arranging cards, moving windows. |
| Limbs | A shared colony temporarily concentrates into porous, flowing streams. They curl, branch and pool behind the objects. The stream is made of moving workers, not a solid limb. | Holding several references, comparing options, presenting a collection. |
| Membrane | A cohesive, irregular pixel front travels along a surface. Its little workers or feelers emerge at the edge, exposing the clean content behind. | Reveals, transformation, selective before/after. |
| Growth | A network grows towards a meaningful destination, branches at a decision, joins another part of itself, then rests. | Connections, timelines, illustrating relationships. |

These are behavioural inspirations, not an obligation to draw literal ants, octopuses or other animals. Colony, limbs and local reveal-front workers are implemented in the shuffle and shared with the dedicated arm display; growth as a general organism primitive is a future direction. New forms should share the same visual DNA: square cells, Astrid orange with restrained warm shade/highlight, coherent grouping, purposeful movement, and a clear relationship to the content.

## Choreograph a task, not a particle effect

Before implementing an effect, write down five things:

1. **Intent:** what is the organism trying to do for the viewer? Carry, reveal, connect, lift, hold, divide, protect, transform, or clear away something specific.
2. **Contact:** where is it touching the object? Put the actual body behind or beneath the entire load, not a decorative row along its edge; let the load occlude most of it. Expose workers or scouts only where the body naturally extends past the silhouette. Show contact before or during movement. Let the organism follow the object, never drift independently as decoration.
3. **Effort:** what changes as it takes the weight? Gather and anticipate, flex or compress, move with the load, vary gait and direction coherently. A heavy or large item can recruit more workers; several objects may need several coordinated limbs. Use seeded irregularity, not per-frame noise.
4. **Destination:** where do the objects belong? Author readable final rectangles before animating. They can occupy any sensible part of the canvas, not just full-screen. Preserve the media's fidelity and the hierarchy between objects. Smooth movement for the object, stepped movement for the tissue.
5. **Rest and release:** the objects arrive exactly at their authored endpoints. Give them time to be read. The organism may keep a little life at the edges, hold the load, or visibly let go and withdraw. Never continue noisy motion over important information.

A good transition can be described with an action verb and a target: 'the colony carries the storyboard left', 'three arms raise the references', 'a living edge pulls back the mask'. If the description is merely 'some orange pixels fly across the screen', design it again.

## Colony: a living shadow, not a border

Imagine a card lying on the back of thousands of ants, or swimming on a shoal. The visible pixels are merely the portion of a much larger organism that sticks out from behind the card. If the card were lifted away, a whole moving body should be underneath it. This is the preferred mental model for transport effects.

- **Volume before visibility.** Build a two-dimensional population in cargo-local space that fills its footprint. The load determines size and geometry; do not place the population exclusively along the bottom, trace all four edges, or emit generic particles at the perimeter. The hidden body can be computationally culled only where the media actually occludes it.
- **Motion through material.** Give individual workers persistent seeded positions and bounded trajectories inside a shared flow field. Nearby workers should move in related currents with distinct rhythms. Use gentle eddies, shifting pockets of density and changes of direction, not frame-random sparkle, jitter or a mechanical conveyor belt.
- **Cause and consequence.** Gather beneath the load before moving it; transport with it; allow a slight trailing wake and catch-up when it settles. Shape the exposed apron into asymmetric lobes and thin places, with a few scouts ahead or beside the load. Reveal more of the body where the media is still uncovered. Let settled content stay exactly in its authored rectangle while the colony swims quietly underneath, unless a deliberate bounded resting motion is requested. The last held frame always returns to the authored rectangle.
- **Occlusion sells the illusion.** Composite body behind, pristine content above, and only a rare grip or contact pixel in front. Never treat the visible outline as the organism itself. If a card is full-bleed it may hide almost everything; leave deliberate space around a card when the colony should be visible.
- **Tune the scale.** Use small square cells; choose a dense but not solid body, irregular tapering edges and sparse peripheral scouts. `organismSpread` changes how far the body extends beyond the card; `organismFlow` changes its internal motion speed. `organismIntensity` controls density. A different visual form (limb, membrane, branching growth) should follow the same principle of actual living material and purposeful contact, without requiring this exact implementation.

Review a full-body diagnostic with the load removed as well as the composed result. If the diagnostic shows only edge pixels, or the composed result reads as a decorated frame rather than a moving colony, redesign the body. Check all four sides, transitions, settled frames and phone-sized playback. A visible wake must respond to movement rather than remain permanently on one side.

## Limbs: currents, not anatomy

An octopus is a reference for the *choreography* of reaching, lifting and holding, not the anatomy of the organism. A limb is a temporary concentration of the same mobile pixel tissue as the colony. It has no skin, outlined contour, solid fill, palm, fingers or anatomical joints. Never render the underlying guide path as a solid shape, even if it is pixelated.

- Draw thousands of individually moving square cells in coherent, porous currents; vary density and cross-section along the path and over time. Prefer fluid, ethereal movement over a literal pixel-art animal appendage. Individual cells should flow through the silhouette, not travel as a rigid block.
- Let streams split, swell, curl, thin and reconnect. They converge from an irregular gathering of workers, not a solid anatomical trunk. Maintain readable direction and apparent support, not random confetti.
- At a load, the stream disperses into a full-footprint colony behind the media; the card conceals the junction. A few cells may escape around all four sides. Do not draw an orange hand or a grip-shaped cap at the bottom edge.
- The stream and colony use the same material vocabulary, square-pixel scale, colour palette and internal-flow control. The supported content remains sharp and moves smoothly. A different silhouette should still look like the same organism.
- Review a moving sample next to the established colony: would they be understood as two behaviours of one living material, without a label? A solid pixel-art octopus fails that review even if it carries objects convincingly.

## Composition, occlusion and timing

- Keep the primary editorial composition intact: real footage and interface, clean type, paper or night palette, clear margins. Give the organism room to be seen. A full-bleed card can deliberately conceal it.
- Use a rear tissue layer, clean media layer and a sparse foreground contact layer. Foreground pixels belong at an edge or intentional reveal boundary, not on faces, captions or unrelated content. Use the actual card bounds and mask; hold a moving video's last frame when carrying it away.
- Maintain coherent flowing streams and clusters on a single square grid. The tissue can change topology deliberately (split, merge, branch), but don't use arbitrary flicker, confetti, random particles or unmotivated glitch. Preserve the seed and frame-pure motion when seeking.
- A 0.25–0.5 s action is a good quick accent; a 0.65–1.1 s transport or a staged multi-item presentation gives more time for character. Use the narration to determine timing and reserve a real readable hold. These timings are suggestions, not mandatory.
- New effects need parameterized destinations, timing, intensity, direction and seed where they are meaningful; do not force every primitive to expose every possible knob. Reuse `shared/organism.ts` and the existing reveal geometry instead of making disconnected visual systems. Keep the pixel form abstract enough to belong beside the canonical mink.

## Review questions

- Can I tell what the organism is doing and what it is touching? Does the content seem moved or revealed by the organism rather than by an unrelated animation?
- Does it feel like one living system: shared direction, purposeful timing, flex and response, small irregular details? Is there a readable action/rest contrast?
- Are the settled positions exact? Do limbs stay attached and does a whole colony occupy the load footprint, with visible swimmers on multiple sides? Are the pixels square, media pristine and foreground incursions restrained?
- Could the same effect work with a different number, size or position of objects, with a different seed and at a different aspect ratio?

## First working examples

[Colony: same-frame body-only and occluded diagnostic](living-colony.jpg) · [Limbs: a settled three-card frame](living-limbs.jpg). Both are actual standalone prototype renders using placeholder media. Study the contact with the object, not the demo imagery.


`pixel-card-shuffle` supports `presentation: carry` with the swarm, and retains `presentation: hold` with multiple arms. Use the separate [Pixel Arm Display](arm-display.md) for a shared-body lift with independently placed cards and grip points. See [the effect catalogue](effect-catalogue.md) for the parameters. These are first prototypes, not the only acceptable expressions of the organism. The original classic crawl is still available. The organism may carry intact media with the crawl disabled; movement, internal flow, rest and reveal are independent controls. The chapter and network effects have not yet been rechoreographed as living organisms; use this reference when extending or replacing their motion.
