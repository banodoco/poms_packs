#!/usr/bin/env python3
"""Snap a managed image onto a logical pixel grid (pixel.snap).

Invoked by the Astrid runtime from the pack's V3 action declaration. The heavy
lifting lives in ``astrid.packs.pixel.actions._common``.
"""

from __future__ import annotations

from astrid.pack_api import guard_canonical_entrypoint

guard_canonical_entrypoint('pixel.snap')

from .src.snap import main


if __name__ == "__main__":
    raise SystemExit(main())
