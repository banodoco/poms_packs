"""Argument parser for video_editing.cut."""

from __future__ import annotations

import argparse
from pathlib import Path

from astrid.pack_api import add_choice_arg


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Plan or render a hype cut from scene, shot, and transcript inputs.")
    parser.add_argument("--scenes", type=Path, help="Path to scenes.json.")
    parser.add_argument("--timeline", type=Path, help="Existing hype.timeline.json to resume from.")
    parser.add_argument("--assets", type=Path, help="Asset registry to use with --timeline (defaults to <timeline_dir>/hype.assets.json).")
    parser.add_argument("--video", type=str, help="Source video file.")
    parser.add_argument("--audio", type=str, help="Optional rant audio file for audio-backed pure-generative mode.")
    parser.add_argument(
        "--out",
        type=Path,
        required=True,
        help=(
            "Output directory. Writes hype.edl.csv, hype.timeline.json, "
            "hype.assets.json, and hype.metadata.json."
        ),
    )
    parser.add_argument("--transcript", type=Path, help="Transcript JSON used for arrangement metadata.")
    parser.add_argument("--shots", type=Path, help="Optional shots.json for future enrichment.")
    parser.add_argument("--arrangement", type=Path, help="Arrangement JSON for pool-based multitrack assembly.")
    parser.add_argument("--pool", type=Path, help="Pool JSON used with --arrangement.")
    parser.add_argument("--brief", type=Path, help="brief.txt used with --arrangement.")
    parser.add_argument(
        "--theme",
        help="Explicit absolute path to a runtime-materialized theme.json file.",
    )
    parser.add_argument("--asset", action="append", default=[], help="Additional source asset mapping in KEY=PATH form.")
    parser.add_argument("--verbose", action="store_true", help="Print ffprobe cache activity.")
    parser.add_argument(
        "--primary-asset",
        help=(
            "Asset key that the --scenes / --transcript / --shots CLI inputs describe. "
            "Defaults to main when that key exists (single-source and plain-text picks). "
            "For multi-source JSON picks without a main key, this flag is required."
        ),
    )
    add_choice_arg(
        parser,
        "--renderer",
        values=("rendering.remotion",),
        default="rendering.remotion",
        help="Qualified rendering backend id.",
    )
    return parser
