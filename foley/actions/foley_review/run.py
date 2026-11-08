#!/usr/bin/env python3
"""Guarded entrypoint for foley.foley_review; the implementation lives in src/foley_review.py."""

from __future__ import annotations

from astrid.pack_api import guard_canonical_entrypoint

guard_canonical_entrypoint('foley.foley_review')

from .src.foley_review import main  # noqa: E402


if __name__ == "__main__":
    raise SystemExit(main())
