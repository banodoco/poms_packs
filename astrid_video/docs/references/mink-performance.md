# Mink Performer

The mascot inhabits the editorial world, while the living-pixel colony operates it. This small frame-driven performer is a transparent overlay by default. Author a series of poses and movements using normalized coordinates or named anchors, rather than a new video per gesture.

## Sources and first library

The existing [11-frame run strip](https://github.com/banodoco/astrid-app/blob/e0da794ac9d26a808ab4082b29f60408b66b3a4c/src/shared/components/MinkRunner/astrid-mink-run.png), blob `8196435068d7d6d7e99b3402167b6d4ce7e6f377`, is 891 × 44, eleven 81 × 44 cells at 70 ms per frame. The three-pose [Plan 84 juggler sheet](https://github.com/banodoco/astrid-dev/blob/main/plans/84-living-planet-on-the-vision-page/assets/astrid-juggler-mink-poses.png), blob `e2a0f019c33e3f0b2351bb1a8806fd83652c912b`, provides the presenting silhouette and exact palette. Both original bytes are retained beside the derived assets. Use [the Plan 84 art direction](https://github.com/banodoco/astrid-dev/blob/main/plans/84-living-planet-on-the-vision-page/art-direction.md) and [canonical character guide](mink-character-guide.jpg). Keep its long body, slender neck, cream underside and dark tail tip. Do not generate a new mascot identity.

Initial library: `run` (11 original poses padded to the common cell, 770 ms cycle); `idle` (one planted presenting pose); `wave` (10 candidate frames derived from the presenting sheet; the near forepaw raises and lowers while the other remains visible in a relaxed forward-down position; both attach to the body, and the fixed sprite-cell placement prevents shifting the head or feet); `settle` (three stepped candidate poses to land on the planted pose, not a hand-finished continuous anatomical transition). GIFs are review copies, not render inputs. `jump` uses the runner pose with a procedural arc; `peek` uses the idle pose moved behind a foreground panel. These are simple choreography commands, not dedicated jump/peek sprite cycles. Add more approved poses only as needed.

## Authoring

See [the run-wave example](example-mink-performance.yaml). `start` and `anchors` are normalized coordinates; x/y may be outside the canvas (-.5 to 1.5). Each `cue` has an absolute clip-local `at`, `action`, `duration`, optional `to` (anchor name or coordinate), `size` (cell height as fraction of canvas height), `rate` (sprite speed independent of travel), `facing` and `depth` (front/behind). Consecutive cues must not overlap. Travel uses ease-in/out; run faces travel direction unless overridden. `settle`, `idle` and `wave` hold the anchor. A gap after a completed action holds the idle pose at the destination; `hide` stays hidden until a later action. The default is transparent so it can sit over any ordinary layer. `depth` is honored inside Agent at Work, where the same performer is composited behind the panel or above it; separate overlay clips use ordinary timeline layer order. For a peek, locate an anchor partly outside a panel, set `depth: behind`, and use `peek` to emerge. No arbitrary collision/physics solver. Continuous positions are independent of the discrete crisp sprite frames.

## Register a reviewed animation

For the actual creative and review workflow, follow [Creating mink animations](../skills/creating-mink-animations/SKILL.md); for selecting and placing gestures, follow [Performing with Astrid's mink](../skills/performing-with-astrid-mink/SKILL.md). This reference is the technical contract.

Use 96×88 transparent cells with anchor (48,80), packed horizontally without margins. Register the name, exact frame count, milliseconds per frame and loop/one-shot behavior in `shared/mink/model.ts:SPRITES`, and update `assets/sprite-registry.json`. Add `mink-<name>` as a declared immutable asset in each effect that uses it; copy the same small PNG into each consumer's asset directory. Extend the `SpriteName`/cue schema/dispatch only for new registered actions, not for ordinary changes to position or timing. Keep runtime and reference metadata consistent; update source fingerprints and validate assets, frame counts and schema. Do not author URLs or replace a previously admitted revision's bytes. The original runner and juggler source bytes remain intact. New wave/idle/settle are hand-refined review candidates, not additional generated cycles.

### Import a generated sheet for review

The development archive (and `tests/packs/astrid_video/tools/` in poms_packs) includes `tools/import_mink_sheet.py`. After checking the source has a real alpha channel, an exact regular grid, and one consistent foot anchor, use (illustrative values for 256×256 input cells):

```sh
python tools/import_mink_sheet.py generated.png --cols 4 --rows 2 --frames 8 \
  --anchor 128 224 --scale 0.3125 --name peek --frame-ms 100 --loop \
  --out review/peek-candidate
```

The importer keeps each whole input cell aligned, never recenters based on individual silhouettes, uses nearest-neighbour pixels and refuses edge-touching/opaque/empty cells or normalized clipping. It writes a horizontal transparent strip, a registry record and a review GIF, without modifying a live pack. Adjust the input anchor/scale for the actual artwork; inspect the source and the normalized result at intended size. Only promote a reviewed candidate and update the sprite registry, descriptor assets and schemas intentionally.
