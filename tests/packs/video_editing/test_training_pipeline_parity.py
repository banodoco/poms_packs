"""Cross-pack parity for the installed video and core training providers."""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

import pytest

from astrid.packs.training import pipeline
from astrid.packs.video_editing.actions.hype import steps as hype


@pytest.mark.parametrize("theme", [False, True])
def test_training_commands_match_retained_hype_provider(tmp_path, theme):
    installed = Path(os.environ["ASTRID_INSTALLED_PACK_ROOT"]).resolve()
    assert (installed / "PIN").is_file()
    assert Path(hype.__file__).resolve().is_relative_to(installed)
    args = argparse.Namespace(out=tmp_path, python_exec=sys.executable, source_slug="source",
                              theme_explicit=theme, theme=tmp_path / "theme",
                              extra_args={"pool_build": ["--extra"], "pool_merge": ["--more"]})
    old = {step.name: step for step in hype.build_pool_steps()}
    for step in pipeline.build_pool_steps():
        assert step.build_cmd(args) == old[step.name].build_cmd(args)
        assert (step.sentinels, step.always_run) == (old[step.name].sentinels, old[step.name].always_run)
