#!/usr/bin/env python3
"""Guarded entrypoint for editorial.arrange; the implementation lives in src/arrange.py."""

from __future__ import annotations

from astrid.pack_api import guard_canonical_entrypoint

guard_canonical_entrypoint('editorial.arrange')

from .src.arrange import main  # noqa: E402


if __name__ == "__main__":
    raise SystemExit(main())
