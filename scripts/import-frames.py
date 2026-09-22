#!/usr/bin/env python3
"""Import the original 150 PNG frames, publishing the manifest only after validation."""

import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import zipfile

from frame_utils import FRAME_NAMES, staging_directory, validate_png


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", nargs="?", help="ZIP path (default: public/frames/_150.zip)")
    parser.add_argument("--output", default="public/frames", help="Output directory")
    args = parser.parse_args()
    archive, output = Path(args.archive or "public/frames/_150.zip"), Path(args.output)
    # Preserve the older README/SETUP workflow while preferring the new path.
    legacy_archive = Path("public/frames_150.zip")
    if args.archive is None and not archive.is_file() and legacy_archive.is_file():
        archive = legacy_archive
    if not archive.is_file():
        parser.error(f"Archive missing: {archive}. See docs/SCROLL-SEQUENCE.md to create it.")

    output.parent.mkdir(parents=True, exist_ok=True)
    try:
        with zipfile.ZipFile(archive) as source, staging_directory(
            output.parent, ".frames-import-"
        ) as staged:
            entries = {}
            for entry in source.infolist():
                path = PurePosixPath(entry.filename.replace("\\", "/"))
                if path.is_absolute() or ".." in path.parts or (path.parts and ":" in path.parts[0]):
                    raise ValueError("Unsafe archive path rejected")
                if entry.is_dir() or path.name.startswith(".") or "__MACOSX" in path.parts:
                    continue
                if path.name not in FRAME_NAMES:
                    if path.name.startswith("frame-") and path.suffix.lower() == ".png":
                        raise ValueError(f"Unexpected frame: {path.name}; expected 001 through 150")
                    continue
                if path.name in entries:
                    raise ValueError(f"Duplicate frame: {path.name}")
                if entry.file_size > 20 * 1024 * 1024:
                    raise ValueError(f"Frame exceeds 20 MB: {path.name}")
                entries[path.name] = entry
            missing = set(FRAME_NAMES) - entries.keys()
            if missing:
                raise ValueError("Missing frames: " + ", ".join(sorted(missing)))
            if sum(entry.file_size for entry in entries.values()) > 500 * 1024 * 1024:
                raise ValueError("Archive exceeds 500 MB uncompressed")

            dimensions = None
            digest = hashlib.sha256()
            for name in FRAME_NAMES:
                data = source.read(entries[name])
                size = validate_png(data, name)
                if dimensions is not None and size != dimensions:
                    raise ValueError(f"Mismatched dimensions in {name}: {size}, expected {dimensions}")
                dimensions = size
                digest.update(data)
                (staged / name).write_bytes(data)
            manifest = {
                "count": 150,
                "pattern": "frame-%03d.png",
                "source": archive.name,
                "width": dimensions[0],
                "height": dimensions[1],
                "version": digest.hexdigest()[:16],
            }
            (staged / "manifest.json").write_text(
                json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
            )
            output.mkdir(parents=True, exist_ok=True)
            # An invalid archive leaves an existing valid sequence untouched.
            # Publish the replacement marker only when every file is in place.
            (output / "manifest.json").unlink(missing_ok=True)
            for name in FRAME_NAMES:
                (staged / name).replace(output / name)
            (staged / "manifest.json").replace(output / "manifest.json")
    except (ValueError, OSError, RuntimeError, zipfile.BadZipFile) as error:
        parser.error(str(error))
    print(f"Imported 150 original PNG frames ({dimensions[0]}x{dimensions[1]}) to {output}.")
    print("Frame files and manifest are ready. See docs/SCROLL-SEQUENCE.md for hero integration.")


if __name__ == "__main__":
    main()
