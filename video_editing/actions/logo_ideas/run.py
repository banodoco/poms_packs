#!/usr/bin/env python3
"""Guarded entrypoint for video_editing.logo_ideas; the implementation lives in src/logo_ideas.py."""

from __future__ import annotations

from astrid.pack_api import guard_canonical_entrypoint

guard_canonical_entrypoint('video_editing.logo_ideas')

from .src.logo_ideas import main  # noqa: E402


if __name__ == "__main__":
    raise SystemExit(main())
