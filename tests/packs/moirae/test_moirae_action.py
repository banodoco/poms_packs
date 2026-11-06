"""Offline behavior checks for the selected, installed Moirae pack."""
from __future__ import annotations

import importlib.util
import json
import os
from pathlib import Path
from types import SimpleNamespace

import pytest


def _action(monkeypatch):
    root = Path(os.environ["ASTRID_INSTALLED_PACK_ROOT"])
    assert (root / "PIN").is_file(), "test must use the CLI-installed pack"
    monkeypatch.setenv("ASTRID_INTERNAL_INVOCATION", "1")
    spec = importlib.util.spec_from_file_location("installed_moirae_action", root / "actions/moirae/run.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_success_creates_video_manifest_and_compatibility_link(monkeypatch, tmp_path):
    action = _action(monkeypatch)
    screenplay = tmp_path / "screenplay.yaml"
    screenplay.write_text("scenes: []\n")
    output = tmp_path / "render"
    calls = []

    def render(argv):
        calls.append(argv)
        Path(argv[-1]).write_bytes(b"rendered")
        return SimpleNamespace(returncode=0)

    monkeypatch.setattr(action.subprocess, "run", render)
    assert action.main([str(screenplay), "-o", str(output)]) == 0
    assert calls == [[action.sys.executable, "-X", "utf8", "-m", "moirae", str(screenplay), "-o", str(output.with_suffix(".mp4"))]]
    assert output.is_symlink() and output.resolve().read_bytes() == b"rendered"
    manifest = json.loads((tmp_path / "manifest.json").read_text())
    assert any(item["path"] == "render.mp4" and item["is_primary"] for item in manifest["outputs"])


def test_failed_renderer_propagates_status_without_result(monkeypatch, tmp_path):
    action = _action(monkeypatch)
    monkeypatch.setattr(action.subprocess, "run", lambda argv: SimpleNamespace(returncode=7))
    assert action.main([str(tmp_path / "screenplay.yaml"), "-o", str(tmp_path / "render")]) == 7
    assert not (tmp_path / "manifest.json").exists()
    assert not (tmp_path / "render").exists()
