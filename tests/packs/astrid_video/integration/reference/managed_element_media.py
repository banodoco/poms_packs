"""Reference host-side projection for a proposed Astrid managed-media slot contract.

Not installed into Astrid. Invoke only after canonical revision/pack/schema selection
and Runtime media custody checks; `registry` contains *already verified, resolved*
entries of the exact frozen render registry. This function does not grant access.
"""
from collections.abc import Mapping
import math
import re

SLOTS = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.-]{0,95}$")
RESERVED = {"__proto__", "prototype", "constructor"}


def project_media(params: Mapping, schema: Mapping, registry: Mapping, *, source_field: str = "file") -> dict:
    if "__astridMedia" in params:
        raise ValueError("Host-derived __astridMedia cannot be authored")
    result = dict(params)
    if "mediaBindings" not in params:
        return result
    properties = schema.get("properties", {})
    if not isinstance(properties, Mapping) or "mediaBindings" not in properties:
        raise ValueError("Selected element does not declare mediaBindings")
    bindings = params["mediaBindings"]
    if not isinstance(bindings, Mapping) or len(bindings) > 128:
        raise ValueError("mediaBindings must be a bounded object")
    resolved = {}
    for slot, key in bindings.items():
        if not isinstance(slot, str) or not SLOTS.fullmatch(slot) or slot in RESERVED:
            raise ValueError("Invalid media slot")
        if not isinstance(key, str) or not key.strip() or len(key) > 256 or key in RESERVED:
            raise ValueError("Invalid registry key")
        entry = registry.get(key)
        if not isinstance(entry, Mapping):
            raise ValueError(f"Unresolved media slot {slot}")
        src = entry.get(source_field)
        kind = str(entry.get("type", "")).split("/", 1)[0]
        if not isinstance(src, str) or not src.strip() or kind not in {"image", "video"}:
            raise ValueError(f"Unresolved or unsupported visual media slot {slot}")
        row = {"src": src, "kind": kind}
        if kind == "video":
            duration = entry.get("duration")
            if isinstance(duration, bool) or not isinstance(duration, (int, float)) or not math.isfinite(duration) or duration <= 0:
                raise ValueError(f"Missing verified video duration for {slot}")
            row["duration"] = duration
        resolved[slot] = row
    result["__astridMedia"] = resolved
    return result
