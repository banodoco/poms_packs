#!/usr/bin/env python3
"""Guarded entrypoint for video_editing.vary_grid; the implementation lives in src/vary_grid.py."""

from __future__ import annotations

from astrid.pack_api import guard_canonical_entrypoint

guard_canonical_entrypoint('video_editing.vary_grid')

from .src.vary_grid import main  # noqa: E402


if __name__ == "__main__":
    raise SystemExit(main())
