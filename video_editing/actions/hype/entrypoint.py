#!/usr/bin/env python3
"""Guarded entrypoint for video_editing.hype; the implementation lives in src/hype.py."""

from __future__ import annotations

from astrid.pack_api import guard_canonical_entrypoint

guard_canonical_entrypoint('video_editing.hype')

from .src.hype import main  # noqa: E402


if __name__ == "__main__":
    raise SystemExit(main())
