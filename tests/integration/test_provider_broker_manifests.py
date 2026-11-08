"""The host-managed TCP broker descriptor on every provider network policy declared by the moved packs.

This is the Agent's enforceable-host-broker predicate (tests/test_provider_manifest_readiness.py), applied to the
manifests that live in this repository. UDP and QUIC policies are exempt because they are not ready for grant.
"""
from __future__ import annotations

from pathlib import Path

import pytest
import yaml

REPO = Path(__file__).resolve().parents[2]
PROVIDER_PACKS = (
    "capture", "discord_local", "editorial", "fal", "media", "seedance_local",
    "understanding", "video_editing", "youtube",
)


def _network_policies(pack_id):
    data = yaml.safe_load((REPO / pack_id / "pack.yaml").read_text())

    def walk(node):
        if isinstance(node, dict):
            for key, value in node.items():
                if key == "network_policy":
                    yield value
                yield from walk(value)
        elif isinstance(node, list):
            for value in node:
                yield from walk(value)

    return list(walk(data))


def test_nine_packs_declare_eighteen_network_policies():
    assert sum(len(_network_policies(pack)) for pack in PROVIDER_PACKS) == 18


@pytest.mark.parametrize("pack_id", PROVIDER_PACKS)
def test_every_tcp_policy_declares_an_enforceable_host_broker(pack_id):
    for policy in _network_policies(pack_id):
        assert isinstance(policy, dict), f"{pack_id}: network_policy is not declared"
        protocols = {str(value).lower() for value in policy["allowed_protocols"]}
        if protocols & {"udp", "quic"}:
            continue
        broker = policy.get("broker")
        assert isinstance(broker, dict), f"{pack_id}: broker descriptor missing"
        assert broker["host_managed"] is True
        assert broker["kind"] == "broker"
        assert broker["enforced"] is True
        assert broker["observable"] is True
        assert broker["route"]
        assert broker["wrapper"]
        descendant = policy.get("descendant_enforcement")
        assert isinstance(descendant, dict), f"{pack_id}: descendant_enforcement missing"
        assert descendant["kind"] == "broker"
        assert descendant["validated"] is True
        assert descendant["observable"] is True
        assert descendant["route"]
        assert descendant["wrapper"]
