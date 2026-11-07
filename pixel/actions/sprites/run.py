#!/usr/bin/env python3
"""Turn one generated sheet into separate native RGBA sprites."""

from __future__ import annotations

from astrid.pack_api import guard_canonical_entrypoint

guard_canonical_entrypoint('pixel.sprites')

from .src.sprites import main


if __name__ == "__main__":
    raise SystemExit(main())
