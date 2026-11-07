"""Shared fixtures for the repo-level pack tests."""
import pytest


@pytest.fixture
def pack_test_root(tmp_path):
    """A fresh per-test root for installing packs (home, tmp and packs directories are created by the test)."""
    return tmp_path
