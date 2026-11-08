#!/usr/bin/env python3
"""Guarded entrypoint for understanding.video_understand; the implementation lives in src/video_understand.py."""

from __future__ import annotations

from astrid.pack_api import guard_canonical_entrypoint

guard_canonical_entrypoint('understanding.video_understand')

from .src.video_understand import main  # noqa: E402


if __name__ == "__main__":
    raise SystemExit(main())
