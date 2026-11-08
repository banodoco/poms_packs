#!/usr/bin/env python3
"""Guarded entrypoint for understanding.understand; the implementation lives in src/understand.py."""

from __future__ import annotations

from astrid.pack_api import guard_canonical_entrypoint

guard_canonical_entrypoint('understanding.understand')

from .src.understand import main  # noqa: E402


if __name__ == "__main__":
    raise SystemExit(main())
