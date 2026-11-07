#!/usr/bin/env python3
"""event_talks orchestrator — plan v2 emission + direct step execution."""

from __future__ import annotations

from astrid.pack_api import guard_canonical_entrypoint

guard_canonical_entrypoint('video_editing.event_talks')

from .event_talks_core import main


if __name__ == "__main__":
    raise SystemExit(main())
