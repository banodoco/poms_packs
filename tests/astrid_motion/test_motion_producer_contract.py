"""Producer qualification for the standalone astrid_motion pack.

The rendering-resource closure is deliberately narrower than the full
project-pack API: developer preview programs remain fixture-only resources.
Compiler tests require the selected Agent's actual pinned Remotion toolchain.
"""
from __future__ import annotations

import hashlib
import importlib.metadata
import json
from pathlib import Path
import shutil
import subprocess
import tempfile

import pytest
import yaml

from astrid import pack_api, sdk
from astrid.core.element import project_packs
from astrid.core.element import registry as registry_module
from astrid.core.pack import cli_manage
from astrid.core.pack.identity import pack_digest, read_pin
from astrid.core.pack.release_manifest import install_release_manifest
from astrid.core.pack.transaction import read_group
from astrid.pack_build import compile_element_module
from astrid.pack_imports import ImportContract, check_pack_imports

from test_astrid_motion_pack import EXPECTED_EFFECTS, PACK_ROOT, RENDERING_ROOT, REPO_ROOT

CONTRACT = RENDERING_ROOT / "shared" / "element_contracts.ts"
ELEMENTS = "rendering/elements/effects"
MISSING_RESOURCES = (
    ("am-footage", "volume.ts"),
    ("am-snap-plate", "surface.ts"),
    ("am-snap-plate", "scene.ts"),
)


def _resource_union(root: Path):
    entry, resources = project_packs._resources(root, expected_pack_id="astrid_motion")
    declarations = entry.definition.rendering
    names = {row["path"] for row in declarations.values()}
    names.update(resource["path"] for row in declarations.values() for resource in row.get("resources", ()))
    return entry, resources, {name: resources[name] for name in sorted(names)}


def _source_inventory(root: Path):
    return {
        path.relative_to(root).as_posix(): hashlib.sha256(path.read_bytes()).hexdigest()
        for path in root.rglob("*")
        if path.is_file()
    }


def test_canonical_rendering_resource_union_and_install_import_policy():
    entry, resources, rendering = _resource_union(PACK_ROOT)
    assert set(entry.definition.rendering) == {"effects/" + name for name in EXPECTED_EFFECTS}
    assert all(row["type"] == "element" for row in entry.definition.rendering.values())
    assert len(_source_inventory(PACK_ROOT)) == 64
    assert len(rendering) == 56
    for name, filename in MISSING_RESOURCES:
        path = f"{ELEMENTS}/{name}/{filename}"
        assert {"kind": "implementation", "path": path} in entry.definition.rendering[f"effects/{name}"]["resources"]
        assert rendering[path].sha256 == hashlib.sha256((PACK_ROOT / path).read_bytes()).hexdigest()
    project_packs._check_imports(PACK_ROOT, rendering)
    import_contract = ImportContract(
        facade_exports=frozenset(pack_api.__all__),
        facade_version=pack_api.VERSION,
        sdk_names=frozenset(sdk.__all__),
    )
    assert check_pack_imports(PACK_ROOT, contract=import_contract, manifest=entry.definition.to_dict()) == []
    assert not [v for v in entry.definition.ui.values() if v["type"] == "editor"]
    assert cli_manage._editor_build(PACK_ROOT) is None
    builds, toolchain = cli_manage._build_inputs(str(REPO_ROOT), None, {"astrid_motion": "astrid_motion"}, None)
    assert builds == {}
    assert toolchain is None
    # The separate full project-pack API still rejects the real preview runner.
    assert "preview/render.mjs" in resources
    with pytest.raises(ValueError, match=r"Unsupported dynamic import/code loading in preview/render\.mjs"):
        project_packs._check_imports(PACK_ROOT, resources)


@pytest.mark.parametrize("element,filename", MISSING_RESOURCES)
def test_missing_declared_helper_fails_the_actual_closure(element, filename):
    _, _, rendering = _resource_union(PACK_ROOT)
    del rendering[f"{ELEMENTS}/{element}/{filename}"]
    with pytest.raises(ValueError, match="Undeclared or escaping dependency"):
        project_packs._check_imports(PACK_ROOT, rendering)


@pytest.mark.parametrize(
    "source,reason",
    [
        ("import type {ComponentCapabilityContext} from '@banodoco/timeline-composition/evaluation';", "Unsupported dependency"),
        ("import '../../../../../../outside';", "Undeclared or escaping dependency"),
        ("import './not-declared';", "Undeclared or escaping dependency"),
        ("const invalid = import('react');", "Unsupported dynamic import/code loading"),
    ],
)
def test_rendering_import_policy_still_refuses_unsupported_sources(tmp_path, source, reason):
    # Mutate only a private negative-test copy; success always uses the real pack.
    root = tmp_path / "astrid_motion"
    shutil.copytree(PACK_ROOT, root)
    path = root / f"{ELEMENTS}/am-sprite/component.tsx"
    path.write_text(path.read_text(encoding="utf-8") + "\n" + source + "\n", encoding="utf-8")
    _, _, rendering = _resource_union(root)
    with pytest.raises(ValueError, match=reason):
        project_packs._check_imports(root, rendering)


def test_selected_feature_descriptors_and_preview_fixture_routes_remain():
    manifest = yaml.safe_load((PACK_ROOT / "pack.yaml").read_text(encoding="utf-8"))
    assert manifest["pack_api"] == "2.0"
    assert manifest["dependencies"]["python_requirements"] == ["Pillow"]
    assert {p["id"] for p in manifest["permissions"]} == {"project_files"}
    fixture_routes = manifest["extensions"]["astrid"]["generation_availability"]["fixture_only_routes"]
    assert fixture_routes == {
        "astrid_motion:preview/" + path: True for path in (
            "scenes.json", "render.mjs", "make_art.py",
            "src/Preview.tsx", "src/Root.tsx", "src/index.ts",
        )
    }
    for route in fixture_routes:
        assert (PACK_ROOT / route.split(":", 1)[1]).is_file()
    sprite = yaml.safe_load((PACK_ROOT / ELEMENTS / "am-sprite/element.yaml").read_text(encoding="utf-8"))
    properties = sprite["schema"]["properties"]
    assert properties["frameOffset"]["minimum"] == 0
    assert properties["frameOffset"]["maximum"] == 10000000
    assert set(properties["sourceClock"]["required"]) == {"offsetFrames", "speed"}
    assert properties["sourceClock"]["properties"]["speed"]["exclusiveMinimum"] == 0
    typography = yaml.safe_load((PACK_ROOT / ELEMENTS / "am-type/element.yaml").read_text(encoding="utf-8"))
    assert typography["defaults"]["color"] == "#FAFAFA"
    component = (PACK_ROOT / ELEMENTS / "am-type/component.tsx").read_text(encoding="utf-8")
    assert "const DEFAULT_COLOR = '#FAFAFA';" in component
    assert "params.color ?? DEFAULT_COLOR" in component


@pytest.fixture(scope="module")
def actual_compiler():
    node, api = project_packs._renderer_compiler()
    # The rendering registry and compiler must be the same real Agent source.
    agent_root = Path(registry_module.__file__).resolve().parents[3]
    assert CONTRACT.is_file()
    assert CONTRACT.resolve().is_relative_to(agent_root)
    assert api.resolve().is_relative_to(agent_root / "remotion")
    assert subprocess.check_output([str(node), "--version"], text=True).strip() == "v20.19.4"
    assert subprocess.check_output(
        [str(node), "-e", "process.stdout.write(require(process.argv[1]).version)", str(api)],
        text=True, env=project_packs._node_env(),
    ) == "0.27.7"
    return node, api


def _compile(effect, actual_compiler):
    node, api = actual_compiler
    entry, _, rendering = _resource_union(PACK_ROOT)
    project_packs._check_imports(PACK_ROOT, rendering)
    definitions = {
        definition.id: definition for definition, _ in project_packs._definitions(PACK_ROOT, entry)
    }
    assert set(definitions) == EXPECTED_EFFECTS
    component = definitions[effect].component.resolve(strict=True).relative_to(PACK_ROOT).as_posix()
    assert component in rendering
    before = _source_inventory(PACK_ROOT)
    digest = pack_digest(PACK_ROOT)
    contract_before = hashlib.sha256(CONTRACT.read_bytes()).hexdigest()
    try:
        output = compile_element_module(
            node, api, PACK_ROOT, component, project_packs._node_env(), rendering_contract=CONTRACT.resolve(),
        )
        assert output.strip()
    finally:
        assert _source_inventory(PACK_ROOT) == before
        assert pack_digest(PACK_ROOT) == digest
        assert hashlib.sha256(CONTRACT.read_bytes()).hexdigest() == contract_before
    return output


@pytest.mark.parametrize("effect", sorted(EXPECTED_EFFECTS))
def test_each_real_element_compiles_and_parses(effect, actual_compiler, tmp_path):
    node, _ = actual_compiler
    output = _compile(effect, actual_compiler)
    module = tmp_path / f"{effect}.mjs"
    module.write_bytes(output)
    subprocess.run([str(node), "--check", str(module)], env=project_packs._node_env(), check=True, timeout=30)
    print(json.dumps({"effect": effect, "bytes": len(output), "sha256": hashlib.sha256(output).hexdigest()}))


def test_compiled_sprite_continuation_and_plate_capability(actual_compiler):
    node, api = actual_compiler
    # Modules stay outside the source tree and resolve the actual locked
    # React/Remotion packages. No replacement externals or runtime stubs.
    with tempfile.TemporaryDirectory(prefix="motion-proof-", dir=api.parents[2]) as temporary:
        root = Path(temporary)
        for effect in ("am-sprite", "am-snap-plate"):
            (root / f"{effect}.mjs").write_bytes(_compile(effect, actual_compiler))
        script = """
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {join} from 'node:path';
const dir = process.argv[1];
const sprite = (await import(pathToFileURL(join(dir, 'am-sprite.mjs')).href)).default;
const plate = (await import(pathToFileURL(join(dir, 'am-snap-plate.mjs')).href)).default;
const original = {
  src: '/sprite.png', enter: 'stamp', scale: 6, stepFrames: 2,
  frames: {frameWidth: 8, frameHeight: 8, count: 4, fps: 12},
  keyframes: [{frame: 2, x: 10, y: 4}],
};
const context = {fps: 24, width: 1920, height: 1080};
const initial = sprite.prepareSceneCapability({...context, clip: {params: original}});
assert.equal(initial.frame(1).presence, 'absent');
const continued = sprite.prepareSceneCapability({
  ...context, clip: {params: {...original, frameOffset: 4, sourceClock: {offsetFrames: 3, speed: 2}}},
});
assert.notEqual(continued.frame(1).presence, 'absent');
assert.deepEqual(continued.frame(0).bounds.rect, {x: 0, y: 0, width: 48, height: 48});
assert.deepEqual(continued.frame(1).bounds.rect, {x: 60, y: 24, width: 48, height: 48});
const surface = plate.prepareSceneCapability({...context, clip: {params: {fill: '#FAFAFA'}}});
assert.deepEqual(surface.frame(0), {
  presence: 'present', opaqueSupport: 'rect',
  bounds: {status: 'known', rect: {x: 0, y: 0, width: 1920, height: 1080}},
});
"""
        subprocess.run([str(node), "--input-type=module", "-e", script, str(root)],
                       env=project_packs._node_env(), check=True, timeout=30)


def test_real_pack_release_group_admission(tmp_path):
    # Exercise the canonical group transaction against this exact real Git
    # checkout. This is producer admission, not native installed delivery.
    # The caller must provide the full original checkout with an advertised
    # ref containing HEAD (no synthetic source commits or sibling pack tree).
    commit = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=REPO_ROOT, text=True).strip()
    assert len(commit) == 40
    assert subprocess.check_output(
        ["git", "status", "--porcelain", "--untracked-files=all", "--", "astrid_motion"],
        cwd=REPO_ROOT, text=True,
    ) == ""
    digest = pack_digest(PACK_ROOT)
    before = _source_inventory(PACK_ROOT)
    collection = tmp_path / "Astrid" / "packs"
    collection.parent.mkdir()
    manifest = {"packs": {"astrid_motion": {
        "repo": str(REPO_ROOT), "commit": commit, "digest_rule": "pack-tree-v1", "digest": digest,
    }}}
    # Obtain the genuine installed distribution version; don't fabricate a
    # package inventory or supply an editor-build toolchain for zero editors.
    packages = {"pillow": importlib.metadata.version("Pillow")}
    result = install_release_manifest(manifest=manifest, packs_root=collection, python_packages=packages)
    snapshot = read_group(collection)
    assert snapshot.revision == result.revision
    assert set(snapshot.paths) == {"astrid_motion"}
    selected = snapshot.paths["astrid_motion"]
    pin = read_pin(selected / "PIN")
    assert pin["commit"] == commit and pin["digest"] == digest and pin["origin"] == "default"
    assert pack_digest(selected) == digest
    assert {p: h for p, h in _source_inventory(selected).items() if p != "PIN"} == before
    assert _source_inventory(PACK_ROOT) == before
