#!/usr/bin/env python3
"""Guarded entrypoint for iteration.assemble; the implementation lives in src/assemble.py."""

from __future__ import annotations

from astrid.pack_api import guard_canonical_entrypoint

guard_canonical_entrypoint('iteration.assemble')

from .src.assemble import main  # noqa: E402


if __name__ == "__main__":
    raise SystemExit(main())
