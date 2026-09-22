#!/usr/bin/env python3
"""Import a scroll sequence from a folder or ZIP of original frames, publishing the manifest last."""

import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import zipfile

from frame_utils import (
    FRAME_EXTENSIONS,
    even_sample,
    frame_name,
    frame_pattern,
    natural_key,
    staging_directory,
    validate_frame,
)

# Mirrors MIN_FRAMES / MAX_FRAMES in src/lib/vocational/sequence.ts.
MIN_FRAMES = 8
MAX_FRAMES = 600
# The hero sequence is 150 frames; a longer source set is sampled down to it.
DEFAULT_MAX = 150
SETS = ("hero", "reveal")
FILE_LIMIT = 20 * 1024 * 1024
TOTAL_LIMIT = 900 * 1024 * 1024


def safe_path(name):
    path = PurePosixPath(name.replace("\\", "/"))
    if path.is_absolute() or ".." in path.parts or (path.parts and ":" in path.parts[0]):
        raise ValueError("Unsafe archive path rejected")
    return path


def collect_zip(archive):
    """Every frame-like entry in the archive, in natural order."""
    found = {}
    with zipfile.ZipFile(archive) as source:
        for entry in source.infolist():
            path = safe_path(entry.filename)
            if entry.is_dir() or path.name.startswith(".") or "__MACOSX" in path.parts:
                continue
            if path.suffix.lower() not in FRAME_EXTENSIONS:
                continue
            if path.name in found:
                raise ValueError(f"Duplicate frame name: {path.name}")
            if entry.file_size > FILE_LIMIT:
                raise ValueError(f"Frame exceeds 20 MB: {path.name}")
            found[path.name] = entry
        if sum(entry.file_size for entry in found.values()) > TOTAL_LIMIT:
            raise ValueError("Frames exceed 900 MB uncompressed")
        order = sorted(found, key=natural_key)
        # Read inside the open archive; the caller only sees names and bytes.
        return [(name, source.read(found[name])) for name in order]


def collect_directory(directory):
    found = {}
    for entry in directory.iterdir():
        if not entry.is_file() or entry.name.startswith("."):
            continue
        if entry.suffix.lower() not in FRAME_EXTENSIONS:
            continue
        if entry.stat().st_size > FILE_LIMIT:
            raise ValueError(f"Frame exceeds 20 MB: {entry.name}")
        found[entry.name] = entry
    if sum(entry.stat().st_size for entry in found.values()) > TOTAL_LIMIT:
        raise ValueError("Frames exceed 900 MB")
    return [(name, found[name].read_bytes()) for name in sorted(found, key=natural_key)]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", nargs="?", help="Folder or ZIP of frames (default: public/frames/_150.zip)")
    parser.add_argument("--set", choices=SETS, dest="name", help="Named sequence: hero or reveal")
    parser.add_argument("--output", help="Output directory (default: public/frames[/<set>])")
    parser.add_argument(
        "--max",
        type=int,
        default=DEFAULT_MAX,
        help=f"Frame ceiling; longer sets are sampled evenly (default: {DEFAULT_MAX})",
    )
    args = parser.parse_args()
    if not MIN_FRAMES <= args.max <= MAX_FRAMES:
        parser.error(f"--max must be between {MIN_FRAMES} and {MAX_FRAMES}")

    source = Path(args.source) if args.source else Path("public/frames/_150.zip")
    # Preserve the older README/SETUP workflow while preferring the new path.
    legacy = Path("public/frames_150.zip")
    if args.source is None and not source.exists() and legacy.is_file():
        source = legacy
    if not source.exists():
        parser.error(f"Frames missing: {source}. See docs/SCROLL-SEQUENCE.md.")

    output = Path(args.output) if args.output else Path("public/frames") / (args.name or "")

    try:
        frames = collect_zip(source) if source.is_file() else collect_directory(source)
        if len(frames) < MIN_FRAMES:
            raise ValueError(f"Found {len(frames)} frames in {source}; at least {MIN_FRAMES} needed")
        kept = [frames[index] for index in even_sample(len(frames), args.max)]
        count = len(kept)
        pad = 3 if count < 1000 else 4

        output.mkdir(parents=True, exist_ok=True)
        with staging_directory(output.parent, ".frames-import-") as staged:
            dimensions = None
            extension = None
            digest = hashlib.sha256()
            written = []
            for index, (original, data) in enumerate(kept, start=1):
                size, kind = validate_frame(data, original)
                if dimensions is not None and size != dimensions:
                    raise ValueError(
                        f"Mismatched dimensions in {original}: {size}, expected {dimensions}"
                    )
                if extension is not None and kind != extension:
                    raise ValueError(f"Mixed formats: {original} is {kind}, expected {extension}")
                dimensions, extension = size, kind
                name = frame_name(index, pad, kind)
                digest.update(data)
                (staged / name).write_bytes(data)
                written.append(name)

            manifest = {
                "count": count,
                "pattern": frame_pattern(pad, extension),
                "source": source.name,
                "sampledFrom": len(frames),
                "width": dimensions[0],
                "height": dimensions[1],
                "version": digest.hexdigest()[:16],
            }
            (staged / "manifest.json").write_text(
                json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
            )
            # A rejected import leaves the previous sequence untouched, and the
            # manifest — the marker the site reads — is published last.
            (output / "manifest.json").unlink(missing_ok=True)
            keep = set(written)
            for stale in output.glob("frame-*"):
                if stale.is_file() and stale.name not in keep:
                    stale.unlink()
            for name in written:
                (staged / name).replace(output / name)
            (staged / "manifest.json").replace(output / "manifest.json")
    except (ValueError, OSError, RuntimeError, zipfile.BadZipFile) as error:
        parser.error(str(error))

    sampled = "" if count == len(frames) else f" sampled from {len(frames)}"
    print(f"Imported {count} original frames{sampled} ({dimensions[0]}x{dimensions[1]}) to {output}.")
    print("Frames and manifest are ready. See docs/SCROLL-SEQUENCE.md.")


if __name__ == "__main__":
    main()
