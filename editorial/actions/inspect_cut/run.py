#!/usr/bin/env python3
"""Guarded entrypoint for editorial.inspect_cut; the implementation lives in src/inspect_cut.py."""

from __future__ import annotations

from astrid.pack_api import guard_canonical_entrypoint

guard_canonical_entrypoint('editorial.inspect_cut')

from .src.inspect_cut import main  # noqa: E402


if __name__ == "__main__":
    raise SystemExit(main())
