#!/usr/bin/env python3
"""Sample a real video into exactly 150 PNG frames and package a ZIP for import."""

import argparse
import json
import math
from pathlib import Path
import shutil
import subprocess
import zipfile

from frame_utils import FRAME_NAMES, staging_directory, validate_png


def executable(value, label):
    resolved = shutil.which(value)
    if resolved:
        return resolved
    raise ValueError(f"{label} not found: {value}. Add FFmpeg to PATH or use --{label.lower()}.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("video", help="Original video (MP4, MOV or other FFmpeg-supported file)")
    parser.add_argument("--start", type=float, default=0, help="Start time in seconds (default: 0)")
    parser.add_argument("--duration", type=float, default=8, help="Selected duration in seconds (default: 8)")
    parser.add_argument("--width", type=int, default=1280, help="Maximum output width (default: 1280)")
    parser.add_argument("--output", default="public/frames/_150.zip", help="Destination ZIP")
    parser.add_argument("--ffmpeg", default="ffmpeg", help="FFmpeg executable or full path")
    parser.add_argument("--ffprobe", help="FFprobe executable (defaults to FFmpeg sibling or PATH)")
    parser.add_argument("--overwrite", action="store_true", help="Replace an existing output ZIP")
    args = parser.parse_args()
    video, output = Path(args.video).resolve(), Path(args.output).resolve()
    if not video.is_file():
        parser.error(f"Video missing: {video}")
    if output == video:
        parser.error("Output ZIP must differ from the source video")
    if not math.isfinite(args.start) or args.start < 0:
        parser.error("--start must be a finite number at or above 0")
    if not math.isfinite(args.duration) or not 0 < args.duration <= 60:
        parser.error("--duration must be between 0 and 60 seconds (6-10 recommended)")
    if not 64 <= args.width <= 3840:
        parser.error("--width must be between 64 and 3840")
    if output.exists() and not args.overwrite:
        parser.error(f"Output exists: {output}. Use --overwrite only to replace this ZIP.")

    try:
        ffmpeg = executable(args.ffmpeg, "FFmpeg")
        sibling = Path(ffmpeg).with_name("ffprobe.exe" if Path(ffmpeg).suffix == ".exe" else "ffprobe")
        ffprobe = executable(args.ffprobe or (str(sibling) if sibling.is_file() else "ffprobe"), "FFprobe")
        probe = subprocess.run(
            [ffprobe, "-v", "error", "-select_streams", "v:0", "-show_entries",
             "stream=duration:format=duration", "-of", "json", str(video)],
            check=True, capture_output=True, text=True,
        )
        metadata = json.loads(probe.stdout)
        if not metadata.get("streams"):
            raise ValueError("Source contains no video stream")
        raw_duration = metadata["streams"][0].get("duration")
        if raw_duration in (None, "N/A"):
            raw_duration = metadata.get("format", {}).get("duration")
        duration = float(raw_duration)
        if not math.isfinite(duration) or args.start + args.duration > duration + 0.05:
            raise ValueError(f"Selected range exceeds the video duration ({duration:.2f}s). Reduce --duration or --start.")

        output.parent.mkdir(parents=True, exist_ok=True)
        with staging_directory(output.parent, ".frames-make-") as work:
            # FPS resamples only this selected clip; the web player remains scroll-driven.
            filters = (
                f"trim=duration={args.duration},setpts=PTS-STARTPTS,"
                f"fps=fps={150 / args.duration:.12f}:start_time=0:round=near:eof_action=pass,"
                f"scale=w='min({args.width},iw)':h=-2:flags=lanczos,setsar=1"
            )
            subprocess.run(
                [ffmpeg, "-hide_banner", "-loglevel", "error", "-nostdin", "-ss", str(args.start),
                 "-i", str(video), "-map", "0:v:0", "-an", "-vf", filters, "-frames:v", "150",
                 "-fps_mode", "passthrough", "-start_number", "1", "-compression_level", "6",
                 str(work / "frame-%03d.png")],
                check=True,
            )
            if sorted(path.name for path in work.glob("*.png")) != list(FRAME_NAMES):
                raise ValueError("The selected clip did not produce 150 frames. Choose a complete 6-10 second clip.")
            dimensions, total_bytes = None, 0
            zip_path = work / "_150.zip"
            with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_STORED) as archive:
                for name in FRAME_NAMES:
                    data = (work / name).read_bytes()
                    size = validate_png(data, name)
                    if dimensions is not None and size != dimensions:
                        raise ValueError(f"Frame dimensions changed: {name}")
                    if len(data) > 20 * 1024 * 1024:
                        raise ValueError("A frame exceeds 20 MB. Reduce --width.")
                    dimensions = size
                    total_bytes += len(data)
                    archive.writestr(name, data)
            if total_bytes > 500 * 1024 * 1024:
                raise ValueError("Frames exceed 500 MB. Reduce --width.")
            zip_path.replace(output)
    except (ValueError, TypeError, OSError, subprocess.CalledProcessError) as error:
        parser.error(str(error))
    print(f"Created {output}")
    print(f"150 PNG frames, {dimensions[0]}x{dimensions[1]}, {total_bytes / 1024 / 1024:.1f} MB.")
    print("Source video preserved. Next: pnpm frames:import")


if __name__ == "__main__":
    main()
