#!/usr/bin/env python3
"""Repair weak-mic speech using hotter pre-lift, LavaSR, and loudness mastering."""

from __future__ import annotations

from astrid.pack_api import guard_canonical_entrypoint

guard_canonical_entrypoint('media.speech_repair_lavasr')

from .src.speech_repair_lavasr import main


if __name__ == "__main__":
    raise SystemExit(main())
