---
name: performing-with-astrid-mink
description: Direct the existing Astrid mink in video compositions; decide when to use it and choreograph run, settle, wave, rest, peek, jump and hide cues without redrawing sprites.
---

# Performing with Astrid's mink

The mink inhabits the world; living pixels operate the world. Use this skill when a mascot appearance serves the story, not whenever a video needs motion. Read the [canonical character guide](../../references/mink-character-guide.jpg) and [character identity](../../references/mink-character.md). Keep the graphic world composed even without the mascot.

## Decide whether to use it

- Introduce the guide: a quick entrance, settle and wave beside a title.
- Accompany real agent activity: travel between a request and its emerging output; briefly inspect, perch or peek. The mink is not itself proof of a successful operation.
- Mark a handoff: lead the eye to an existing composition or exit as the timeline expands. Avoid obscuring text, controls or important visual evidence.
- Leave it out of dense comparisons, sensitive or solemn moments, and uninterrupted film performance unless the script calls for it. Never add continuous mascot activity solely to fill space.

## Compose a performance

1. Read the scene and choose a few meaningful named anchors. Reserve a clear silhouette and a floor/edge; stage it at intended on-screen size. Use `mink-performer` as an ordinary transparent timeline overlay or the optional `mink` field inside `agent-at-work` when it needs panel occlusion. Existing sprites are immutable pack assets, not project-media slots.
2. Author clip-local cue times, durations, destinations, facing and cell-height `size`. Use `run` for travel, `settle` before an upright `wave`, `idle` for planted holds, `jump` for a simple procedural arc, `peek` for motion behind a panel, and `hide` for absence. Use `depth: behind` within Agent at Work or the real timeline layer ordering in separate clips. Movement and pose playback rate are independent. No overlapping cues; leave deliberate rests and keep the attention on the work.
3. Start from [the run-wave YAML](../../references/example-mink-performance.yaml) and the [performer parameter and asset contract](../../references/mink-performance.md). Add a cue instead of making a new animation when an existing sprite suffices. Keep anchors, scale, gaze and direction continuous across shots where the same mink persists. A transition between postures can use a short settle; don't mirror half a face without matching the entire sprite.
4. Preview at intended size, then inspect the turn, landing, wave and hold in slow motion. Both forepaws must read naturally in the presenting pose: one animated, the other visible and resting, with a consistent head, tail and ground anchor. Check the mascot does not appear to float, lose a limb, slide on a planted foot or occlude the output. If feedback concerns placement, timing, size or facing, adjust cues first.
5. Only if the needed gesture genuinely cannot be made using existing poses, call [Creating mink animations](../creating-mink-animations/SKILL.md). This is the asset-authoring workflow, not something to perform on every video. After a reviewed sprite is registered, return here and preview the same scene. Use [reviewing Astrid videos](../reviewing-astrid-videos/SKILL.md) for final scene review and native proof.

See [native integration](../../references/native-integration.md) before admitting and placing. Offline renders are review candidates, not native export receipts.
