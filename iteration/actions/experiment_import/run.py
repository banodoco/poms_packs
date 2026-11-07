#!/usr/bin/env python3
"""experiment_import — Import unmanaged/legacy run roots into an experiment.

Walks an unmanaged run root (for example the Discord-command POC directory of
timestamped subdirectories), synthesizes a universal manifest per submission,
and emits an ``experiment.json`` plus an ``import.report.json``.

Rules honoured (see the architecture plan, Phase 4):

- Never rewrite historical directories. Source evidence is read-only; media
  is materialized as independent copy-on-write clones when supported, never
  writable hardlinks or eager large-media copies. No absolute source path
  is ever persisted — only the portable source subdirectory name survives.
- Associate prompts using exact run evidence first (the ``/gen prompt:`` text
  recovered from ``responsePreview``); mark ambiguous instead of guessing.
- Screenshot-only submissions remain ``unknown`` (status ``draft``) unless a
  terminal provider response is recovered.
- Deduplicate recovery fetches by response message id and content hash.
- Manual mappings take precedence over derived ones and are recorded as such.
- Idempotent and byte-stable: rerunning over the same source produces
  byte-identical artifacts.
- Signed provider URLs are never persisted; only non-secret counts survive.
"""

from __future__ import annotations

from astrid.pack_api import guard_canonical_entrypoint

guard_canonical_entrypoint('iteration.experiment_import')

from .src.experiment_import import main


if __name__ == "__main__":
    raise SystemExit(main())
