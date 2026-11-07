"""Download YouTube media through the host-managed yt-dlp boundary."""

from __future__ import annotations

from astrid.pack_api import guard_canonical_entrypoint

guard_canonical_entrypoint("youtube.youtube_audio")

from .src.youtube_audio import main  # noqa: E402


if __name__ == "__main__":
    raise SystemExit(main())
