# Composition recipes

Use these as small building blocks, not mandatory chapters. See the [visual grammar](visual-grammar.png) for the look and [effect catalogue](effect-catalogue.md) for what is implemented. A good video usually alternates the following rather than animating everything.

| Beat | Composition | Motion |
| --- | --- | --- |
| Opening / idea | Large serif statement on paper, one focal image or presenter; small pixel eyebrow | Smooth window expansion or a quiet pixel accent; no long ident |
| Rapid references | One near-full-frame pristine image or clip at a time, with subtle position changes | Pixel Card Shuffle; choose duration/direction to match the spoken rhythm |
| Interconnected problems | Clean typographic cards on paper with quiet outlines and one clear result | Pixel Network; restrained animated connections and pixel signal |
| Chapter | Few words, large serif type, small geometric pixel accent in the margin | Chapter Card; settle and hold |
| Technical example | Source / mask or input / result, aligned; actual tool name only where useful | Reveal the changed region or hard cut; no imaginary logs |
| Feedback | Real first attempt, short quoted instruction, actual revised attempt | Show a meaningful comparison rather than a generic transition |
| Assembly | Real timeline and media, with enough space to read tracks and layers | Smoothly arrange pieces; a small pixel snap at a connection |
| Final reveal | Uninterrupted full-screen creative result | Hard cut or short relevant ident; let the film dictate pacing |

Window expansion, comparison, timeline assembly and mascot-led transitions are design targets unless a live pack catalogue shows their implementation. Prefer existing timeline tools and elements when a new reusable effect isn't necessary. For Into the Minkhole, preserve its project-specific narrative and rough-cut payoff rather than duplicating that script in this general pack.

For a persistent hero with progressive inputs, keep its placement ID and rectangle constant, change `media` in each pose using `transition.type: replace`, and use `pixel-connect` accents from the relevant input card. For branching dispatch, arrange the source, destinations and returned media as ordinary stable objects; multiple `pixel-connect` accents can run concurrently. This is editorial choreography, not a workflow executor. For an edited timeline, use `initiallyDocked` and `revision` rather than redrawing a timeline or recreating all clips.

For a readable dispatch diagram, use `pixel-link` rather than a dense organic `pixel-connect`: stable source IDs, destination IDs, and one accent from each source to its destination lasting until the editorial handoff.
