"""Guarded entrypoint for video_editing.thumbnail_maker; the implementation lives in src/thumbnail_maker.py."""

from __future__ import annotations

from astrid.pack_api import guard_canonical_entrypoint

guard_canonical_entrypoint('video_editing.thumbnail_maker')

from .src.thumbnail_maker import main  # noqa: E402


if __name__ == "__main__":
    raise SystemExit(main())
