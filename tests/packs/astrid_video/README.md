# Astrid Video v0.18 — process choreography and image handoff

Extends v0.17 with optional `pixel-link.route.bend` (0.05–0.95) for persistent horizontal–vertical–horizontal routing, `processStages` to author ordinary Living Composition poses and links from explicit input/process/result rows, and `handoffToTimeline` to resolve fully revealed image geometry at the composition boundary and verify the destination clip ID and asset binding. Timeline Assembly accepts normalized `entryRect` on incoming image clips, plus `entryChromeSeconds` for a short chrome fade while incoming cards hold. Existing rough tracks remain docked. Current bridge is image/contain-only, uses the same canvas dimensions in the authored demo, and is an author-time helper, not native runtime object sharing. Video source-clock and actual audio handoffs are not implemented. The graph is illustrative, not a scheduler. See `preview/test-handoff.cjs` for the model regression. Native install/export and real Remotion dependency compilation remain unverified.

# Astrid Video v0.17 — readable persistent links

The Living Composition extension adds `pixel-link`, a deterministic, edge-to-edge connector that grows and remains visible through its authored duration. Existing effects, skills, pixel-connect and timeline revision are retained. Offline model and descriptor checks only; native integration remains unverified.

# Astrid Video v0.16 — Continuous Visual Choreography

New: one optional `continuous-sequence` effect with deterministic camera pan/zoom/follow/cut, persistent panels, independent world/screen performer, panel-relative anchor destinations, and suggested footstep cues. The corrected mink head outline is used by all three performer consumers; the original running strip is unchanged. Start with the [sequence skill](astrid_video/docs/skills/choreographing-continuous-sequences/SKILL.md) and [contract](astrid_video/docs/references/continuous-sequence.md). See TEST_RESULTS.txt for current checks. Other effects and skills are retained; older release notes below are historical. Native host installation, Remotion dependency compilation and media projection remain unverified.

# Astrid Video v0.14 — corrected mink performance and composable skills

v0.14 retains the nine effects from v0.13 and the original running cycle, refines the wave/idle/settle sprite family so both forepaws read clearly, and fixes the pose origin across the wave. Three focused skills make the creative workflow composable: [perform with the mink](astrid_video/docs/skills/performing-with-astrid-mink/SKILL.md), [create mink animations](astrid_video/docs/skills/creating-mink-animations/SKILL.md), and [show agent work](astrid_video/docs/skills/showing-agent-work/SKILL.md). Start with the [root skill](astrid_video/docs/SKILL.md); direct the story, choose a composition, apply a performance, create an asset only if needed. Keep actual technical contracts in the references.

The new wave is a pixel-level refinement of the exact existing Plan 84 presenting sprite, not a new generative character. The running sheet is unchanged; new poses remain candidates for creator review. The attempted image generation returned an infographic, not registered transparent cells, so it was not used in the runtime assets. Agent at Work keeps its accepted layout and model. Native Astrid admission/editor/export remain outstanding (#1870 for general media projection).

---

# Astrid Video v0.13 — Agent at Work and Mink Performer

v0.13 extends the previous seven effects with two reusable effects: `mink-performer` (frame-driven sprite cues, aligned source strips, transparent overlay) and `agent-at-work` (terminal-style event replay, flexible text/image/video cards or timeline assembly with a continuous full-screen handoff). The existing v0.12 timeline engine is reused, not replaced. Read `astrid_video/docs/references/mink-performance.md` and `agent-at-work.md` for authoring, source provenance, adding sprites and actual limitations.

The original runner strip is byte-identical to Astrid App. The wave and settle are initial hand-adjusted/procedural candidate poses derived from the Plan 84 juggler strip, not final generated character animation. The first image-generation attempt produced a concept board, not production cells; it was not used in the pack. Peek/jump are positional staging of existing poses, not new sprite cycles. The activity examples are authored illustrative replays of an actual synthetic demo edit. Native Astrid admission/editor/export remain unverified and arbitrary project-media bindings still depend on #1870.

Reproduce locally: `tsc --target es2020 --module commonjs --strict --rootDir astrid_video --outDir preview astrid_video/shared/activity/model.ts astrid_video/shared/mink/model.ts`; `node preview/test-activity.cjs`; `python tools/test_mink_assets.py`; `python preview/render_activity.py preview/mink-performance.json <output.mp4> 1280 720 24`; substitute `preview/agent-at-work.json` or `preview/agent-cards.json` for the other examples. Use `tools/import_mink_sheet.py` to align an additional candidate sprite sheet before adding it to the registry.

---

# Astrid Video v0.11.0 — Native integration candidate

A native-integration candidate for Astrid’s general video-production pack. Builds on v0.10’s Living Composition engine and adds native scalar parameter controls, guarded project-pack installation, preparation/inspection tools, a source-closure revision fingerprint and a common media-slot consumer. Previous effects remain available. The user authors visual destinations; the program choreographs movement.

## Start here

- [Native integration guide](astrid_video/docs/references/native-integration.md)
- [Remaining host contract and reference tests](integration/README.md) · [astrid-dev #1870](https://github.com/banodoco/astrid-dev/issues/1870)

From this distribution, with the authenticated native Astrid Python/environment, start with a disposable project:

```sh
python tools/install_astrid_video.py --realm REALM_ID --project PROJECT_ID
python tools/install_astrid_video.py --realm REALM_ID --project PROJECT_ID --apply
```

The first command only inspects; the second requests validation and admission through the existing host. It will not overwrite unrelated or edited pack source. The resulting exact refs are not a timeline placement. Follow the actual host's supported placement path, then test the text-only smoke scene:

```sh
python tools/prepare_composition.py preview/examples/native-smoke.json --out review/prepared/native-smoke
```

Use the prepared `params.json` with the ordinary element hold (6s). Native validation/admission/preview/export remain unverified; the inspected host cannot resolve the generic managed media contract yet. See the issue and guide rather than adding a workaround.

- [Main skill](astrid_video/docs/SKILL.md)
- [Choreographing Astrid compositions](astrid_video/docs/skills/choreographing-astrid-compositions/SKILL.md)
- [Composition contract](astrid_video/docs/references/composition-contract.md)
- [Extension contract](astrid_video/docs/references/extension-contract.md)
- [Effect catalogue](astrid_video/docs/references/effect-catalogue.md)
- [Visual grammar](astrid_video/docs/references/visual-grammar.png) and [mink appearance guide](astrid_video/docs/references/mink-character-guide.jpg)

The three example wrappers are in `preview/examples/` (JSON) and the pack's `docs/references/` (YAML). `composition` is the actual element parameter payload; `duration` is the effect hold in seconds. The example media is illustrative and declared in the element, not actual production footage. The supplied mink sheet remains a visual reference, not an animation sprite sheet.

## Reproduce or author a new example

Requires Node, TypeScript (`tsc`), Python with OpenCV, NumPy, Pillow, PyYAML, jsonschema and FFmpeg. No external media or network calls are required for the sample renders. Run from this README's directory:

```sh
# Strict compile of the pure code used by both preview and Remotion element.
tsc --target es2020 --module commonjs --strict --rootDir astrid_video --outDir preview astrid_video/shared/composition/engine.ts astrid_video/extensions/recipes.ts astrid_video/shared/deck/living-motion.ts astrid_video/shared/visuals.ts astrid_video/rendering/elements/effects/pixel-arm-display/preset.ts
node preview/test-motion.cjs
node preview/test-living.cjs
node preview/test-composition.cjs
python preview/validate_pack.py
node preview/check-source.cjs

# Inspect resolved geometry and frame timing without rendering.
node preview/composition-plan.cjs preview/examples/journey.json 960 540 24 inspect

# Render a video, its actual destination storyboard, midpoint frames and JSON timing/geometry.
python preview/render_composition.py preview/examples/journey.json review/Astrid_Living_Journey.mp4
python preview/render_composition.py preview/examples/exchange.json review/Astrid_Three_Carrier_Exchange.mp4
python preview/render_composition.py preview/examples/extension.json review/Astrid_Layout_and_Accents.mp4
```

The last command accepts optional width, height, fps after output path. To author a sequence, copy an example, edit its `composition`, and repeat inspection and rendering. The wrapper may also be YAML. The compiler rejects impossible overlapping transition windows and invalid rectangles; intentional destination overlaps are reported for creative review. Preview supports declared demo PNG/MP4 assets; extend its media lookup if you add different types. The inspection output is generated from the same compiler as final frame plans. The sample videos are standalone raster previews of the shared TypeScript geometry, not actual Astrid renders. They are silent; timing uses authored arrival seconds, not automatic transcript alignment. Fonts are referenced by stacks; the standalone preview uses local substitute faces.

## Architecture

`shared/composition/compile.ts` validates semantics and resolves normalized geometry, exact arrival/start frames, persistent IDs and media appearance runs. `engine.ts` generates a seekable frame plan. The engine invokes `extensions/layouts.ts`, `behaviours.ts`, `accents.ts` and `recipes.ts` through static registrations. The existing `shared/organism.ts` and `shared/deck/motion.ts` supply full-footprint tissue, porous streams and pixel reveals. The new element consumes this frame plan with React/Remotion. The standalone compositor consumes the same plan with OpenCV/Pillow. Layouts, behaviours and accents can be combined; recipe helpers generate ordinary composition specs. Text, stills and video are supported, with explicit bounded source ranges for video; audio is muted for a separately authored mix.

The original shuffle and arm display retain their motion engines, with the shared media consumer updated. New recipes cover their core sequential and simultaneous choreography; migration of those legacy effect renderers to the new engine is not yet done. Extension modules are in one pack, not separately installable sub-packs. Scene-wide material grid, seed and flow are fixed for consistent seekable movement. The compiler infers action staging, but it is not a collision-solving simulation or particle conservation engine: geometry and seeded tissue fields may change as a load resizes. Complex path crossings and aesthetics still require review.

## Integration path and verification boundary

The pack declares five native elements under the V3 project-owned pack contract. Source closure fingerprints make shared implementation edits affect exact element revision calculation. The guarded installer and preparation tools live outside the executable pack. The common scalar settings are exposed through the inspected catalog's top-level parameter schema, while nested poses remain structured editable data. Real inspector widget presentation is not proven.

The shared media consumer supports declared pack assets and the proposed generic managed-media projection. Native worker/browser/composed-frame integration, retention/remapping of bound media, generic browser pack-asset projection, exact native placement and receiving compiler/admission proof are outstanding. The host reference adapters and tests are supplied in `integration/`, not shipped as production host code. See [tracking issue #1870](https://github.com/banodoco/astrid-dev/issues/1870).

The local tests include all previous motion/composition regressions, strict pure TypeScript compilation, local schema/import checks, syntax-only TSX checks, 6 local installation/preparation/source-closure tests and 11 shared host-projection fixtures. All four example wrappers prepare successfully. Existing v0.10 sample videos are standalone raster previews, not native exports. No Astrid runtime or Remotion installation is available in this sandbox; the actual native receiving compiler, editor and worker tests were not run. No product or release branch changes, no live project mutation, no independent cold-agent trial. The tracking issue is the only repository write.

## v0.16 incremental timeline revision

Retain earlier track blocks via `initiallyDocked`; animate new clips via the existing assembly choreography, then supply one bounded, grouped `revision` to move/trim and replace selected clips. Playback starts after this depicted revision. The existing Living Composition stable-media replacement and `pixel-connect` accents cover progressive inputs and branching dispatch without a new effect. See [timeline visualizers](astrid_video/docs/references/timeline-visualizers.md) and [composition recipes](astrid_video/docs/references/composition-recipes.md). All previous primitives remain available. Native rendering remains unverified.
