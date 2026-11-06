# poms_packs

This repository contains optional Astrid packs. Each pack lives in one
top-level directory named for its pack id:

```text
poms_packs/
├── <pack-id>/
│   ├── pack.yaml
│   ├── actions/
│   ├── shared/
│   ├── resources/       # when needed
│   └── tests/           # pack-owned tests
└── .github/workflows/   # repository CI
```

The folder basename and `pack.yaml`'s `id` must match. The Python import
identity is `astrid.packs.<pack-id>`; packs are not installed as separate
Python distributions. A pack imports its own modules through that identity,
uses public Astrid APIs, and declares other pack dependencies in
`dependencies.packs`. Keep pack-specific tests and fixtures in the pack;
cross-pack integration tests belong under repository-level
`tests/integration/`.

## PIN

The installer writes a root-level `PIN` in each installed copy containing one
newline-terminated JSON object. Source packs in this repository do not commit PIN files. It records install provenance and is distinct from the Git tree id.
The `digest` is the `pack-tree-v1` source digest; the root `PIN` itself is
excluded from that digest. Never put credentials or other secrets in a PIN.

```json
{"version":1,"source":"https://github.com/banodoco/poms_packs.git#<pack-id>","commit":"<full-40-character-git-commit>","digest_rule":"pack-tree-v1","digest":"<full-lowercase-sha256>","origin":"user"}
```

`origin` is one of `default`, `user`, `folder`, or `personal`. Repository
release pins use a full resolved commit and digest. Folder and personal
installs use a local file URI and null `commit` and `digest`; they remain
visibly unpinned. These fields describe the source/install; they are not a
runtime source-integrity gate. The installer owns PIN creation and updates.

## Personal packs

The `personal` pack is per-user data at `~/Astrid/packs/personal`. It is
created locally and is never stored or published in this repository. Do not
add personal code, effects, or user data here. A pack named `personal` is
reserved for that local directory.

## CI

The workflow in `.github/workflows/ci.yml` establishes the PR/push check
entry point. It is intentionally a placeholder while the pack folders and
their focused checks are being moved here. Add each pack's focused tests and
the shared manifest/import checks as those checks become available; do not
replace them with a full-suite run.

## Installation proof

The integration test uses the real `astrid packs add` transaction against this
repository's committed HEAD in an isolated home and selected collection root.
Run it with `ASTRID_AGENT_BIN` pointing to the Agent executable and
`ASTRID_AGENT_PYTHON` to the Python environment with its locked dependencies.
The Agent must no longer ship the moved packs, and the host must provision the
required locked dependencies. For example:

```sh
ASTRID_POMS_ROOT="$PWD" ASTRID_AGENT_BIN=/path/to/astrid \
ASTRID_AGENT_PYTHON=/path/to/python /path/to/python -m pytest -q \
  tests/integration/test_install_each_pack.py
```

This source-checkout smoke is separate from the final installed-wheel journey.
Missing packs, dependencies, or pack-owned tests fail the corresponding case.
