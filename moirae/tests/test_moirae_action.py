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


def test_selected_installed_pack_is_visible_to_agent_index():
    """The real discovery surfaces must use the selected installed collection."""
    import subprocess

    root = Path(os.environ["ASTRID_INSTALLED_PACK_ROOT"]).resolve()
    assert (root / "PIN").is_file()
    env = os.environ.copy()
    env["ASTRID_PACKS_PATH"] = str(root.parent)
    binary = os.environ["ASTRID_AGENT_BIN"]
    index = subprocess.run([binary, "packs", "agent-index", "--pack-id", "moirae", "--json"],
                           env=env, text=True, capture_output=True, check=True)
    entry = json.loads(index.stdout)
    assert entry is not None, "agent-index omitted selected installed moirae"
    assert entry["pack_id"] == "moirae"
    assert "moirae.moirae" in entry["normal_entrypoints"]


def test_selected_installed_pack_skill_role():
    import subprocess

    root = Path(os.environ["ASTRID_INSTALLED_PACK_ROOT"]).resolve()
    env = os.environ.copy()
    env["ASTRID_PACKS_PATH"] = str(root.parent)
    result = subprocess.run([os.environ["ASTRID_AGENT_BIN"], "skills", "list", "--json"],
                            env=env, text=True, capture_output=True, check=True)
    skills = json.loads(result.stdout)["packs"]
    assert any(row["pack_id"] == "moirae" and row["role"] == "main" for row in skills)
