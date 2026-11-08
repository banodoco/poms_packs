#!/usr/bin/env python3
"""Guarded entrypoint for editorial.triage; the implementation lives in src/triage.py."""

from __future__ import annotations

from astrid.pack_api import guard_canonical_entrypoint

guard_canonical_entrypoint('editorial.triage')

from .src.triage import main  # noqa: E402


if __name__ == "__main__":
    raise SystemExit(main())
