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

# Installed in dependency order: each pack's dependencies.packs are installed first (see install()).
PACK_IDS = (
    "blender", "capture", "foley", "media", "moirae", "discord_local",
    "seedance_local", "chiptune", "music", "editorial",
    "iteration", "stream_content", "video_editing", "astrid_motion",
    "fal", "pixel", "typed_timeline", "understanding",
)
# A named, reasoned deferral from the install gate (lead ruling, 19:12Z). The pack stays in the repo with its tests.
# Its upload action imports the private banodoco_social package (a sibling workspace checkout), which the strict
# import scan refuses for an ordinary install. Unblock: publish banodoco-social, or rewrite upload against its HTTP endpoint.
DEFERRED = {
    "youtube": "upload imports the private banodoco_social package; the import scan refuses it (see the PK-16 ledger)",
}
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


def _install_chain(pack_id, pack_test_root):
    """Install pack_id and its dependencies.packs (depth first) from this checkout into a fresh home and packs root."""
    binary = Path(os.environ["ASTRID_AGENT_BIN"]).resolve()
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
    return binary, revision, packs, env


@pytest.mark.parametrize("pack_id", PACK_IDS)
def test_install_each_pack(pack_id, pack_test_root):
    """Installing the pack from this checkout writes its PIN and the pack is discovered from the selected root."""
    source = REPO / pack_id
    assert (source / "pack.yaml").is_file(), f"Pack has not yet been migrated: {pack_id}"
    assert not (source / "PIN").exists(), "PIN belongs to the installed copy"
    binary, revision, packs, env = _install_chain(pack_id, pack_test_root)
    installed = packs / pack_id
    assert (installed / "pack.yaml").is_file()
    pin = json.loads((installed / "PIN").read_text())
    assert pin["commit"] == revision and pin["origin"] == "user"
    listing = json.loads(_run([str(binary), "packs", "list", "--json", "--pack-root", str(packs)],
                              env=env, cwd=REPO).stdout)
    assert any(row.get("id") == pack_id and Path(row.get("root", "/")).resolve() == installed.resolve()
               for row in _rows(listing)), f"{pack_id} not discovered from selected root: {listing!r}"


@pytest.mark.parametrize("pack_id", PACK_IDS)
def test_pack_tests_collect(pack_id, pack_test_root):
    """The pack's own tests (tests/<id>) collect with no errors against the installed pack."""
    tests = REPO / "tests" / pack_id
    assert tests.is_dir() and any(tests.rglob("test_*.py")), f"No pack-owned tests for {pack_id}"
    _binary, _revision, packs, env = _install_chain(pack_id, pack_test_root)
    env["ASTRID_PACKS_PATH"] = str(packs)
    env["ASTRID_INSTALLED_PACK_ROOT"] = str(packs / pack_id)
    _run([str(Path(os.environ.get("ASTRID_AGENT_PYTHON", sys.executable)).absolute()), "-m", "pytest",
          "--collect-only", "-q", "-p", "no:cacheprovider", str(tests)], env=env, cwd=REPO)


def test_deferred_packs_are_named_and_still_present():
    """The gate is every pack in PACK_IDS plus the named deferrals; nothing is silently skipped."""
    assert set(PACK_IDS).isdisjoint(DEFERRED)
    for pack_id, reason in DEFERRED.items():
        assert reason.strip(), f"deferral of {pack_id} needs a reason"
        assert (REPO / pack_id / "pack.yaml").is_file(), f"deferred pack {pack_id} must stay in the repo"
        assert (REPO / "tests" / pack_id).is_dir(), f"deferred pack {pack_id} keeps its tests"
