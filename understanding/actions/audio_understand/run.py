#!/usr/bin/env python3
"""Query an audio-native model against source audio windows."""

from __future__ import annotations

from astrid.pack_api import guard_canonical_entrypoint

guard_canonical_entrypoint('understanding.audio_understand')

from .src.audio_understand import main


if __name__ == "__main__":
    raise SystemExit(main())
