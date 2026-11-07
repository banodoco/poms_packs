#!/usr/bin/env python3
"""Tile a video into an MxN grid of overlapping spatial crops."""

from __future__ import annotations

from astrid.pack_api import guard_canonical_entrypoint

guard_canonical_entrypoint('foley.tile_video')

from .src.tile_video import main


if __name__ == "__main__":
    raise SystemExit(main())
