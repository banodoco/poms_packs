"""Rebuild a temporary local distribution and run the focused offline pack checks.
No native Astrid build or admission is implied by these checks.
"""
from pathlib import Path
import shutil,subprocess,tempfile
HERE=Path(__file__).resolve().parent
REPO=HERE.parents[2]
with tempfile.TemporaryDirectory(prefix="astrid-video-") as tmp:
    root=Path(tmp)
    shutil.copytree(REPO/"astrid_video",root/"astrid_video")
    for name in ("preview","tools","integration"):
        shutil.copytree(HERE/name,root/name)
    def run(*argv): subprocess.run(argv,cwd=root,check=True)
    run("tsc","--target","es2020","--module","commonjs","--strict","--rootDir","astrid_video","--outDir","preview","astrid_video/shared/timeline/model.ts","astrid_video/shared/activity/model.ts","astrid_video/shared/mink/model.ts","astrid_video/shared/media.ts","astrid_video/shared/composition/engine.ts","astrid_video/extensions/recipes.ts","astrid_video/shared/deck/living-motion.ts","astrid_video/shared/visuals.ts","astrid_video/rendering/elements/effects/pixel-arm-display/preset.ts")
    for name in ("motion","living","composition","timeline","activity"):
        run("node",f"preview/test-{name}.cjs")
    run("python","preview/validate_pack.py")
    run("node","preview/check-source.cjs")
    run("python","tools/source_closure.py")
    run("python","tools/test_mink_assets.py")
    run("python","tools/test_native_integration.py")
    run("python","integration/reference/test_reference.py")
