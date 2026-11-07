#!/usr/bin/env python3
"""Search GIPHY for GIF/sticker assets and optionally download one result."""

from __future__ import annotations

from astrid.pack_api import guard_canonical_entrypoint

guard_canonical_entrypoint('media.gif_search')

from .src.gif_search import main


if __name__ == "__main__":
    raise SystemExit(main())
