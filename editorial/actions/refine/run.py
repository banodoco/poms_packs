#!/usr/bin/env python3
"""Guarded entrypoint for editorial.refine; the implementation lives in src/refine.py."""

from __future__ import annotations

from astrid.pack_api import guard_canonical_entrypoint

guard_canonical_entrypoint('editorial.refine')

from .src.refine import main  # noqa: E402


if __name__ == "__main__":
    raise SystemExit(main())
