#!/usr/bin/env python3
"""Join ordered pixel-art frames into an am-sprite-compatible strip."""

from __future__ import annotations

from astrid.pack_api import guard_canonical_entrypoint

guard_canonical_entrypoint('pixel.strip')

from .src.strip import main


if __name__ == "__main__":
    raise SystemExit(main())
