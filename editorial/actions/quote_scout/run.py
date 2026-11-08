#!/usr/bin/env python3
"""Guarded entrypoint for editorial.quote_scout; the implementation lives in src/quote_scout.py."""

from __future__ import annotations

from astrid.pack_api import guard_canonical_entrypoint

guard_canonical_entrypoint('editorial.quote_scout')

from .src.quote_scout import main  # noqa: E402


if __name__ == "__main__":
    raise SystemExit(main())
