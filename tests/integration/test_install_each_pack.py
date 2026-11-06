"""Real CLI installation of each external pack from the committed repository.

Run against a PK-15 Agent with its locked dependencies already provisioned.
This source-checkout test is not the installed-wheel PK-17 journey.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
import subprocess
import sys

import pytest
import yaml

PACK_IDS = (
    "blender", "capture", "foley", "media", "moirae", "discord_local",
    "seedance_local", "youtube", "chiptune", "music", "editorial",
    "iteration", "stream_content", "video_editing", "astrid_motion",
    "fal", "pixel", "typed_timeline", "understanding",
)
REPO = Path(os.environ.get("ASTRID_POMS_ROOT", Path(__file__).resolve().parents[2])).resolve()


def _run(command, *, env, cwd):
    result = subprocess.run(command, cwd=cwd, env=env, text=True, capture_output=True, timeout=300)
    assert result.returncode == 0, f"{command!r}\n{result.stdout}\n{result.stderr}"
    return result


def _rows(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from _rows(child)
    elif isinstance(value, list):
        for child in value:
            yield from _rows(child)


@pytest.mark.parametrize("pack_id", PACK_IDS)
def test_install_each_pack(pack_id, pack_test_root):
    source = REPO / pack_id
    assert (source / "pack.yaml").is_file(), f"Pack has not yet been migrated: {pack_id}"
    assert not (source / "PIN").exists(), "PIN belongs to the installed copy"
    binary = Path(os.environ["ASTRID_AGENT_BIN"]).resolve()
    python = Path(os.environ.get("ASTRID_AGENT_PYTHON", sys.executable)).absolute()
    revision = _run(["git", "rev-parse", "HEAD"], env=os.environ.copy(), cwd=REPO).stdout.strip()
    assert len(revision) == 40
    home, temp, packs = (pack_test_root / name for name in ("home", "tmp", "packs"))
    home.mkdir(); temp.mkdir()
    env = os.environ.copy()
    env.pop("PYTHONPATH", None)
    env.pop("ASTRID_PACKS_PATH", None)
    env.update(HOME=str(home), TMPDIR=str(temp))
    visiting, installed_ids = set(), set()

    def install(current):
        if current in installed_ids:
            return
        assert current not in visiting, f"Pack dependency cycle at {current}"
        manifest = REPO / current / "pack.yaml"
        assert manifest.is_file(), f"Missing required pack: {current}"
        visiting.add(current)
        data = yaml.safe_load(manifest.read_text())
        for dependency in data.get("dependencies", {}).get("packs", []):
            if dependency in PACK_IDS:
                install(dependency)
        visiting.remove(current)
        _run([str(binary), "packs", "add", REPO.as_uri(), "--revision", revision,
              "--pack-id", current, "--subpath", current, "--packs-root", str(packs), "--yes"],
             env=env, cwd=REPO)
        installed_ids.add(current)

    install(pack_id)
    installed = packs / pack_id
    assert (installed / "pack.yaml").is_file()
    pin = json.loads((installed / "PIN").read_text())
    assert pin["commit"] == revision and pin["origin"] == "user"
    listing = json.loads(_run([str(binary), "packs", "list", "--json", "--pack-root", str(packs)],
                              env=env, cwd=REPO).stdout)
    assert any(row.get("id") == pack_id and Path(row.get("root", "/")).resolve() == installed.resolve()
               for row in _rows(listing)), f"{pack_id} not discovered from selected root: {listing!r}"
    tests = installed / "tests"
    assert tests.is_dir() and any(tests.rglob("test_*.py")), f"No pack-owned tests for {pack_id}"
    _run([str(python), "-m", "pytest", "--collect-only", "-q", "-p", "no:cacheprovider",
          str(tests)], env=env, cwd=REPO)
