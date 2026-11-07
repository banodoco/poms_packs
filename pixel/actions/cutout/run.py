#!/usr/bin/env python3
"""Cut a background out of a managed image into hard-alpha RGBA (pixel.cutout).

Invoked by the Astrid runtime from the pack's V3 action declaration. The algorithm
lives in ``astrid.packs.pixel.actions._common``.
"""

from __future__ import annotations

from astrid.pack_api import guard_canonical_entrypoint

guard_canonical_entrypoint('pixel.cutout')

from .src.cutout import main


if __name__ == "__main__":
    raise SystemExit(main())
