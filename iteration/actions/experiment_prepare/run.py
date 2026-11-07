#!/usr/bin/env python3
"""experiment_prepare — Normalize experiment manifests into review model."""

from __future__ import annotations

from astrid.pack_api import guard_canonical_entrypoint

guard_canonical_entrypoint('iteration.experiment_prepare')

from .src.experiment_prepare import main


if __name__ == "__main__":
    raise SystemExit(main())
