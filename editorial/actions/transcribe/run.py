#!/usr/bin/env python3
"""Guarded entrypoint for editorial.transcribe; the implementation lives in src/transcribe.py."""

from __future__ import annotations

from astrid.pack_api import guard_canonical_entrypoint

guard_canonical_entrypoint('editorial.transcribe')

from .src.transcribe import main  # noqa: E402


if __name__ == "__main__":
    raise SystemExit(main())
