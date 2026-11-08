"""Smoke test: hype verdict step raises NotImplementedError."""

import argparse
import pytest

from astrid.packs.video_editing.actions.hype.src.hype import _verdict_build_cmd


def test_verdict_build_cmd_raises():
    args = argparse.Namespace()
    with pytest.raises(NotImplementedError, match="hype.verdict"):
        _verdict_build_cmd(args)
