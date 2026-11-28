# Native host integration: proposed generic managed-element media contract

Tracking: [astrid-dev #1870](https://github.com/banodoco/astrid-dev/issues/1870). This is an integration reference, not an installed host plugin or a native render receipt.

## Ownership and boundary

Use the same frozen, authorized timeline registry and exact selected element schema that the existing native editor and worker use. Opt in through the element's `mediaBindings` schema property. A logical slot maps to an existing registry key. Resolve only from verified runtime-owned objects, never from authored paths or arbitrary URLs. Validate the authored values and scope in the native command/registry owner before publication. Keep the binding in saved settings, but keep the derived `__astridMedia` map only in render props. Do not write resolved src values to the timeline, pack source or exportable authoring state. Treat derived projections as reserved, not caller authority.

The reference Python and TypeScript resolvers in `reference/` exercise shape checking and identical projection semantics. They deliberately take an already verified/resolved registry and an already selected schema; they do not authenticate a request, freeze a timeline, resolve URLs, check pack revisions or implement a runtime media service. Those are existing host responsibilities. Native wiring must preserve scope, media lifetime and exact selection, including failure paths.

## Required host seams

- Agent: generalized staging after resolving exact admitted descriptors and verified registry. See [Remotion run.py](https://github.com/banodoco/astrid-agent/blob/c0ad6b54aadd21630d98bb5039613e37efe92a8f/astrid/packs/rendering/rendering/renderers/remotion/run.py) and [composed frame capture](https://github.com/banodoco/astrid-agent/blob/c0ad6b54aadd21630d98bb5039613e37efe92a8f/astrid/packs/rendering/actions/timeline_visualize/composed_frame.py). Keep the older six-card contract compatible; do not add an Astrid Video-only branch. Use the same verified derived parameters for renderer and visualizer.
- App: [config-utils.ts](https://github.com/banodoco/astrid-app/blob/e0da794ac9d26a808ab4082b29f60408b66b3a4c/src/tools/video-editor/lib/config-utils.ts) and [element components](https://github.com/banodoco/astrid-app/blob/e0da794ac9d26a808ab4082b29f60408b66b3a4c/src/tools/video-editor/runtime/astrid-element-components.tsx). Select the same admitted schema; resolve the same logical slots through authenticated media routes. Generic immutable pack asset projection is also needed for browser previews of declared project-pack assets. Keep registry keys distinct from host-derived URLs. Do not embed video data in a TSX bundle or source snapshot to evade that boundary.
- Authoring, registry retention, portable export/import and occurrence expansion: include binding references in dependency collection, pruning and remapping. Preserve stable slot names, remap keys with the normal registry closure, reject foreign media. Changes to a binding must change the saved timeline/relevant cache identity, not the effect source revision. Do not duplicate timeline authority.
- Placement: prove current native exact-head placement/update and actual collection ownership. The inspected first placement surface is restricted to an `am-discord` occurrence. Do not assume arbitrary native placement or simultaneous named collections work without testing the receiving release.

## Shared regression fixtures

Run `python integration/reference/test_reference.py`. The 11 fixtures cover absent and empty maps, mixed media, reused registry keys, invalid/unbound media, forged transient values, incorrect schema opt-in, invalid slots, wrong modality and missing verified video duration. They prove local reference parity only. Native tests must additionally prove authenticated registry scope and authorization, cache and media retention, exact pinned schema selection, persistence, reload, export/import and editor/worker/composed-frame render parity.

## Rollout

Start in a disposable project with the asset-free `native-smoke` sequence and scalar edits. Then complete the generic host binding and run mixed image/video acceptance. A changed source closure must be validated and admitted; a changed creative setting should require only a native timeline edit. Preserve the existing user pack and old admitted revisions. No release assignment or changes to live product source were made here.
