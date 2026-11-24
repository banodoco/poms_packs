# Astrid Video v0.12.0 — Timeline visualizers

A native-integration candidate for Astrid’s general video-production pack. Builds on v0.10’s Living Composition engine and adds native scalar parameter controls, guarded project-pack installation, preparation/inspection tools, a source-closure revision fingerprint and a common media-slot consumer. Previous effects remain available. v0.12 adds two shared-model timeline visualization elements. The user authors visual destinations; the program choreographs movement.

## Timeline assembly and synchronized players

The [timeline visualization contract](astrid_video/docs/references/timeline-visualizers.md) describes `timeline-assembly` and `timeline-player-visualizer`. Supply actual track and clip metadata, media slots, and independently rendered video outputs. Up to eight tracks and three players are supported. The first effect carries items into precise timeline slots; the second immediately plays one or more video outputs with a synchronized playhead and active-track highlights. These are non-interactive explanatory visual elements; they never write the host timeline.

```sh
tsc --target es2020 --module commonjs --strict --rootDir astrid_video --outDir preview astrid_video/shared/timeline/model.ts
python preview/make_timeline_examples.py
node preview/test-timeline.cjs
python preview/render_timeline.py preview/timeline-assembly.json review/assembly.mp4 1280 720 24
python preview/render_timeline.py preview/timeline-player.json review/players.mp4 1280 720 24
```

The source edit is actually composed from the depicted source clips, so both preview players have truthful component timing. The standalone preview does not prove native Astrid export or generic managed-media support.

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
