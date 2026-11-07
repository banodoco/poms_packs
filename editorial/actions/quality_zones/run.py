#!/usr/bin/env python3
"""Guarded entrypoint for editorial.quality_zones."""

from __future__ import annotations

from astrid.pack_api import guard_canonical_entrypoint

guard_canonical_entrypoint('editorial.quality_zones')

from .src.quality_zones import main


if __name__ == "__main__":
    raise SystemExit(main())
