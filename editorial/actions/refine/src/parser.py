"""Argument parser for editorial.refine."""

from __future__ import annotations

import argparse
from pathlib import Path

from astrid.pack_api import TRIM_BOUND_EXTENSION_SEC


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Refine arrangement dialogue trims before Remotion render.")
    add = parser.add_argument
    add("--arrangement", type=Path, required=True)
    add("--pool", type=Path, required=True)
    add("--timeline", type=Path, required=True)
    add("--assets", type=Path, required=True)
    add("--metadata", type=Path, required=True)
    add("--transcript", type=Path, required=True)
    add("--primary-asset")
    add("--out", type=Path, required=True)
    add("--max-iterations", type=int, default=3)
    add("--min-nudge-sec", type=float, default=0.08)
    add("--max-nudge-sec", type=float, default=TRIM_BOUND_EXTENSION_SEC)
    add("--similarity-threshold", type=float, default=0.85)
    add("--skip-whisper", action="store_true")
    add("--env-file", type=Path)
    return parser
