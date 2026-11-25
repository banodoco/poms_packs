# Native Astrid use — integration candidate

This is an ordinary V3 rendering-elements pack. Use the authenticated local Astrid installation and its documented project-pack interface; do not install a new renderer, write timeline JSON to a local database, embed JSX in timeline documents, copy managed footage into executable source or paste resolved URLs into saved settings.

## Install and select exact revision

The distribution's `tools/install_astrid_video.py` is a native-host helper, not a tool shipped into the project pack. Run it with the existing Astrid Python and environment. It reads the canonical realm and project supplied by the caller, inspects the dedicated `astrid_video` collection, validates the source with the actual native pack validator, initializes the binding if needed, copies only into the returned pack root (refusing unrelated source), admits using the configured receiving compiler, and reads back exact refs. Without `--apply` it only inspects. It does not mutate a timeline.

```sh
python tools/install_astrid_video.py --realm REALM_ID --project PROJECT_ID
python tools/install_astrid_video.py --realm REALM_ID --project PROJECT_ID --apply
```

If the target already contains a prior unmodified release, supply `--replace-from /path/to/exact/previous/astrid_video`; otherwise merge changes deliberately. No forced overwrite. On failure, inspect host output and stop; do not change compiler configuration or fabricate a receipt. Existing pinned effects are not upgraded automatically. The host owns old immutable snapshots. Re-run the native validation/admission and verify an actual saved placement after changing source. If shared code is edited, run `python tools/source_closure.py --write` before admission (then `python tools/source_closure.py` to check). The fingerprint is generated descriptor metadata to make shared imports visible to the inspected element-revision calculation; it does not replace the native full snapshot hash.

Use `astrid-tools timelines elements --project PROJECT_ID TIMELINE_ID` to inspect existing clips, actual schema and exact head. Use the supported current placement surface for admitted effects (the inspected first-placement route accepts an `am-discord` occurrence clip; use the supported exact-head placement command or current UI). Existing generated parent effects can use the exact-head `update-element` route when its preconditions hold. Follow the actual host's reported command, never guess a clip id, fabricate a revision or convert an occurrence into a parent clip. If a route refuses, preserve the user's edit and report the reason. Do not use a second overlay to hide failure.

## Normal use

The user directs a sequence in ordinary language. Resolve the real media/shot identifiers, author the destinations, prepare/inspect, then make the smallest supported native timeline change. `tools/prepare_composition.py` in the distribution converts a YAML/JSON wrapper to schema-checked `params.json` and resolved timing/geometry. It uses the exact compiled TypeScript motion compiler. It does not publish changes. `at` is the destination arrival in clip-local seconds; the wrapper `duration` is the ordinary clip `hold`. A compiled storyboard must not create a second durable timeline. Use Astrid's own timeline and audio tracks for editing and narration.

Scalar controls are declared at top level because the actual catalog projects numeric/boolean/select/color settings there. `compositionScale`, `transitionDuration`, `transitionSpeed`, `restJitter`, `restSpeed`, `organismFlow`, `organismIntensity`, `organismSpread`, `organismPixelSize`, `edgeReveal`, `randomness`, `direction`, `crawlStyle`, `stagger` and `behaviour` can be authored and edited independently. Legacy nested `defaults` are normalized by the preparation tool; an explicitly authored top-level scalar wins over legacy defaults, then per-pose motion and explicit transition settings override the scene setting. Keep arrival times unchanged when adjusting transition speed. Keep the host's ordinary `clip.speed`, opacity, crop and entrance/exit separate from internal choreography. Do not promise a specific widget style before the installed inspector is inspected.

## Media boundary

There are three supported modes at different stages of integration:

- Text-only compositions and asset-free chapter/network effects require no media. The Living Composition default is now an asset-free title; `native-smoke.yaml` exercises three text cards, rearrangement, timing and an accent.
- Declared immutable pack assets use the existing worker `__astridAssets` projection. The inspected App has bespoke preview asset adapters for some built-ins, not a general project-pack preview asset projection. Therefore a demo using those assets is not proven in editor preview. Do not fall back to raw file paths or `staticFile` on arbitrary authored keys.
- Proposed generic managed-media slots: each logical content `asset` is a stable slot name, with `mediaBindings: {slot: verified_registry_key}` at the effect param root. The exact selected schema declares this map. Both native hosts must resolve it through the authenticated, verified registry of the same frozen timeline and inject transient `__astridMedia` entries `{src, kind, duration?}`; the pack-side consumer is implemented and tested. **The currently inspected hosts do not implement that projection.** A managed binding without it fails explicitly, even if a demo pack asset has the same slot. There is no automatic staging workaround, duplicate source import, raw URL fallback, cross-project lookup or hidden download. `__astridMedia` and `__astridAssets` are host-derived and must never enter saved parameters. Require verified media kind and duration for video, and explicit source ranges for Living Composition. Legacy deck media clocks clamp to the last verified frame if needed.

The integration reference in the distribution provides tested worker/browser resolver candidates and the exact host work still needed, tracked in [astrid-dev #1870](https://github.com/banodoco/astrid-dev/issues/1870). No new host parameter is claimed available until landed and proven. Use normal preview/export and actual local host reports as the source of truth.

## Native acceptance

1. Install in a disposable test project, get all nine exact admitted refs; preserve a pre-existing user pack and verify failed source edits cannot replace its prior admission.
2. Place the asset-free Living Composition through the supported exact-head route and set `native-smoke.yaml` parameters using its actual saved clip. Obtain the accepted `new_head`. Inspect the editor at destination arrivals and during changes. Change scale, transition speed and rest/flow using the native inspector, confirm durable head and preserved arrival times; reload and inspect again.
3. Run the normal native visualize/render path on the exact saved revision. Compare actual destination and midpoint frames to editor preview, in landscape and portrait. Check font loading, clip-local clocks, performance, transparency, and media readiness. No claim of native success from the standalone compositor.
4. Once the generic host binding is implemented, use real project-managed stills and a video with source ranges; test missing/cross-project refs, removal/pruning, occurrence expansion, reuse of the same asset in several slots, export/import to another authorized realm, and exact native preview/worker export. Replace media and timing without readmitting source. Check old pinned revisions and copy/export retain the correct media closure.
5. A fresh agent should make an unseen narrated sequence using only the pack skill and supported host tools. Return genuine artistic decisions to the creator, not routine implementation details.

Inspected sources: Agent `c0ad6b54aadd21630d98bb5039613e37efe92a8f`, App `e0da794ac9d26a808ab4082b29f60408b66b3a4c`. The commands and receipt shapes above follow their project-pack and timeline authoring contracts. On any newer installed build, inspect its actual help and source. Native validation/admission, Remotion bundling/rendering, inspector UX and cross-realm tests were not executable in the review sandbox; the installer has local fixture tests only.
