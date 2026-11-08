#!/usr/bin/env python3
"""Guarded entrypoint for editorial.script_pipeline; the implementation lives in src/script_pipeline.py."""

from __future__ import annotations

from astrid.pack_api import guard_canonical_entrypoint

guard_canonical_entrypoint("editorial.script_pipeline")

from .src.script_pipeline import main  # noqa: E402


if __name__ == "__main__":
    raise SystemExit(main())
