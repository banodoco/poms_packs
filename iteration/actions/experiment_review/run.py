#!/usr/bin/env python3
"""experiment_review — Render deterministic HTML review page."""

from __future__ import annotations

from astrid.pack_api import guard_canonical_entrypoint

guard_canonical_entrypoint('iteration.experiment_review')

from .src.experiment_review import main


if __name__ == "__main__":
    raise SystemExit(main())
