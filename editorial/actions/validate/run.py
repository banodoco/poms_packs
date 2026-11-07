#!/usr/bin/env python3
"""Validate that a rendered hype.mp4 matches the captions in hype.metadata.json.


Runs a fresh Whisper transcription on the output video, then for each clip in
hype.timeline.json, compares the audio transcript in that clip's timeline range
against the `source_transcript_text` recorded in hype.metadata.json.

Usage:
  python validate.py --video runs/<id>/hype.mp4 [--threshold 0.5] [--env-file .env]

Writes validation.json next to the video with per-clip results and a summary.
Exits non-zero when any non-skipped clip fails the similarity threshold.
"""

from __future__ import annotations

from astrid.pack_api import guard_canonical_entrypoint

guard_canonical_entrypoint('editorial.validate')

from .src.validate import main


if __name__ == "__main__":
    raise SystemExit(main())
