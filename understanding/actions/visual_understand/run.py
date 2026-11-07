#!/usr/bin/env python3
"""Query OpenAI vision models against one image or a numbered frame sheet."""

from __future__ import annotations

from astrid.pack_api import guard_canonical_entrypoint

guard_canonical_entrypoint('understanding.visual_understand')

from .src.visual_understand import main


if __name__ == "__main__":
    raise SystemExit(main())
