#!/usr/bin/env python3
"""Guarded entrypoint for editorial.boundary_candidates; the implementation lives in src/boundary_candidates.py."""

from __future__ import annotations

from astrid.pack_api import guard_canonical_entrypoint

guard_canonical_entrypoint('editorial.boundary_candidates')

from .src.boundary_candidates import main  # noqa: E402


if __name__ == "__main__":
    raise SystemExit(main())
