#!/usr/bin/env python3
"""Gemini-powered deep scene descriptions for triage survivors."""

from __future__ import annotations

from astrid.pack_api import guard_canonical_entrypoint

guard_canonical_entrypoint('understanding.scene_describe')

from .src.scene_describe import main


if __name__ == "__main__":
    raise SystemExit(main())
