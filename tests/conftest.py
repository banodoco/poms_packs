"""Persistent, project-local isolation for external pack installation tests."""
from pathlib import Path
import os
import tempfile

import pytest


@pytest.fixture
def pack_test_root():
    root = Path(os.environ.get(
        "ASTRID_PACK_TEST_TMP",
        "/mnt/work/ai/apps/astrid-work/.otto/runs/astrid-continuation-2026-11-05/tmp/b5h",
    )).resolve()
    root.mkdir(parents=True, exist_ok=True)
    return Path(tempfile.mkdtemp(prefix="install-", dir=root))
