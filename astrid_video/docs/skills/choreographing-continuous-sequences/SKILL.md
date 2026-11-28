---
name: choreographing-continuous-sequences
description: Connect related story beats through deliberate camera framing, persistent media panels and an independently choreographed performer; keep ordinary cuts where they tell the story better.
---

# Choreographing continuous sequences

A continuous sequence is an optional island in the normal Astrid timeline. Do not turn an entire video into a travelling camera. Begin with the spoken beat, its visual evidence and a static destination that reads well. Use a cut when footage, a joke, a change of place or an emotional beat needs it; use a pan when movement actually explains a spatial relationship. A camera can follow a guide briefly and then settle on the work. Let the audience read the destination before moving again.

1. Choose a few named panels and define their positions in viewport units. Prefer existing Living Composition, Agent at Work and Timeline Visualizer outputs; keep each source and its settings editable. Use their actual managed rendered media as panels where needed. Do not duplicate their internal render engines. See [continuous-sequence contract](../../references/continuous-sequence.md).
2. Author camera destinations at the relevant narration beats. Hold, move/pan/zoom, follow an optional world actor, or cut. Keep world objects and their clocks independent from the camera. Move an object's rectangle only when the object itself must travel.
3. If a mascot appearance serves the story, use [performing with the mink](../performing-with-astrid-mink/SKILL.md) and the optional actor cues. Resolve named panel-relative anchor positions at the cue arrival. An independent performer can be layered in front of or behind a named panel. For a mascot unrelated to the camera, use an ordinary transparent Mink Performer overlay instead. Avoid continuous activity. Never add an actor merely because the engine supports one.
4. Compile and inspect the actual frames and cut boundaries. Check for accidental blank space, premature reveals, unstable handoffs, unreadable text, unwanted camera movement, sprite distortion, wrong source frames and clipping. Keep the frame plan seekable. When the presenter moves, derive suggested footsteps from the same run timing; place them as normal editable audio clips. Do not embed an irreversible mix in the visual effect.
5. Review an audiovisual low-fidelity sequence against the narration before changing the renderer. Give feedback in terms of destinations, pacing, readability and the intended focus. Preserve approved source panels, unchanged timings and the existing narrative. If a capability is absent, add the smallest missing primitive rather than another one-off renderer. Use [reviewing Astrid videos](../reviewing-astrid-videos/SKILL.md).

See [asset-free example](../../references/example-continuous-sequence.json) for an ordinary editorial sequence without a mink. This is a pack-level candidate: native host qualification and managed input projection are still required. Do not treat an offline preview as a saved Astrid timeline or native export.
