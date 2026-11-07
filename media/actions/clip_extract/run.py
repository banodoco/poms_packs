#!/usr/bin/env python3
"""Extract a clip segment from a video using ffmpeg stream copy.

Invoked by the Astrid runtime per command.argv in executor.yaml.
Parses --input, --start, --dur, --output from argv, validates them,
and shells out to ffmpeg.
"""

from __future__ import annotations

from astrid.pack_api import guard_canonical_entrypoint

guard_canonical_entrypoint('media.clip_extract')

from .src.clip_extract import main


if __name__ == "__main__":
    raise SystemExit(main())
