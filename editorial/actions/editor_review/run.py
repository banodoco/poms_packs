#!/usr/bin/env python3
"""Guarded entrypoint for editorial.editor_review; the implementation lives in src/editor_review.py."""

from __future__ import annotations

from astrid.pack_api import guard_canonical_entrypoint

guard_canonical_entrypoint('editorial.editor_review')

from .src.editor_review import main  # noqa: E402


if __name__ == "__main__":
    raise SystemExit(main())
