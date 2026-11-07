---
name: youtube
description: >
  YouTube pack — acquire YouTube media (audio MP3 / video MP4 via yt-dlp).
---

# YouTube

The YouTube pack acquires source media. It does not edit, render, or publish
media.

## Actions

| Action | Use it for |
|---|---|
| [`youtube.youtube_audio`](../actions/youtube_audio/STAGE.md) | Acquire an MP3 or MP4 from a search query or a direct URL supplied through `query`. |

## When to use

- Use `youtube.youtube_audio` for source audio or video needed by downstream
  editing, understanding, or Training workflows.
Do not use this pack to edit, render, publish, or analyze media. Use the media,
video-editing, rendering, or understanding pack as appropriate.

## SDK quick-start

The v3 public SDK uses `kind="action"`. Outputs are Runtime-managed; do not
pass a local `out=` path or a made-up `url` input.

```python
import astrid.sdk as sdk
from astrid.sdk import AstridClient

with AstridClient.open_from_launcher() as client:
    result = sdk.invoke(
        "youtube.youtube_audio",
        kind="action",
        project="demo",
        client=client,
        inputs={"query": "cool synthwave mix", "mode": "audio"},
        wait=True,
    )
    if not result.ok:
        raise RuntimeError(result.error)
    outputs = client.tasks.list_managed_outputs(result.kernel_task_id)
    if not outputs.ok:
        raise RuntimeError(outputs.error)
    print(outputs.data)
```

Pass a direct URL through `query`, without changing the input shape:

```python
result = sdk.invoke(
    "youtube.youtube_audio",
    kind="action",
    project="demo",
    client=client,
    inputs={"query": "https://www.youtube.com/watch?v=...", "mode": "video"},
    wait=True,
)
```

`mode="video"` produces the named managed MP4 media output required by
Training. Audio mode produces MP3. Both modes retain the named
`media_manifest` receipt with the target, mode, actual output path/extension,
hash, bytes, and acquisition provenance. Callers should consume the returned
managed output records instead of assuming a local filename.

## Boundaries and requirements

- Acquisition uses `yt-dlp`; audio extraction also requires `ffmpeg`.
- YouTube acquisition stays behind the host-managed `youtube-media` broker;
  the pack does not change host policy, credentials, or workspace
  dependencies.
- The cache policy is `none`; failed or cancelled actions are not successful
  media results.

Read the linked action guide before admission and follow YouTube's terms and
copyright requirements.
