"""Unavailable thumbnail generation is declared and fails with its stable code."""

import argparse
from pathlib import Path

import pytest
import yaml

from astrid.pack_api import AstridError
from astrid.packs.video_editing.actions.thumbnail_maker.src.thumbnail_maker import (
    _exec_discover_video_evidence,
    _exec_build_reference_pack,
    _exec_generate_thumbnails,
    main,
)


def _dummy_args():
    return argparse.Namespace()


def test_discover_video_evidence_raises():
    with pytest.raises(NotImplementedError, match="thumbnail_maker.discover_video_evidence"):
        _exec_discover_video_evidence(_dummy_args())


def test_build_reference_pack_raises():
    with pytest.raises(NotImplementedError, match="thumbnail_maker.build_reference_pack"):
        _exec_build_reference_pack(_dummy_args())


def test_generate_thumbnails_raises():
    with pytest.raises(AstridError) as exc_info:
        _exec_generate_thumbnails(_dummy_args())
    assert exc_info.value.code == "generation_action_unavailable"


def test_thumbnail_action_declaration_is_shared_and_unavailable():
    from astrid.core.generation.availability import action_availability

    declaration = yaml.safe_load(
        (Path(__file__).resolve().parents[2] / "video_editing" / "pack.yaml").read_text(encoding="utf-8")
    )["extensions"]["astrid"]["generation_availability"]
    record = action_availability("video_editing.thumbnail_maker")
    assert record["available"] is False
    assert record["error"]["code"] == "generation_action_unavailable"
    assert declaration["actions"]["video_editing.thumbnail_maker"] == record


def test_thumbnail_public_action_refuses_before_creating_output(tmp_path, capsys):
    out = tmp_path / "must-not-exist"
    assert main(["generate-thumbnails", "--out", str(out)]) == 2
    assert "code: generation_action_unavailable" in capsys.readouterr().err
    assert not out.exists()
