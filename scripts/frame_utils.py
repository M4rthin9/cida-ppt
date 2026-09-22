"""Shared checks for frame archives; no image transformations or extra dependencies."""

from contextlib import contextmanager
import re
import shutil
import struct
import uuid
import zlib

FRAME_NAMES = tuple(f"frame-{index:03d}.png" for index in range(1, 151))


@contextmanager
def staging_directory(parent, prefix):
    # Inherit the parent ACL: Python 3.13+ tempfile's 0700 Windows ACL can prevent
    # a restricted FFmpeg child process from accessing its parent's temp folder.
    parent = parent.resolve()
    staged = parent / (prefix + uuid.uuid4().hex)
    staged.mkdir()
    try:
        yield staged
    finally:
        if staged.resolve().parent != parent:
            raise ValueError("Refusing to clean up a staging path outside its parent")
        shutil.rmtree(staged)


def validate_png(data, name):
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError(f"Not a PNG: {name}")
    offset, dimensions, has_pixels = 8, None, False
    while offset + 12 <= len(data):
        length = struct.unpack_from(">I", data, offset)[0]
        kind = data[offset + 4 : offset + 8]
        end = offset + 8 + length
        if end + 4 > len(data):
            raise ValueError(f"Truncated PNG: {name}")
        expected_crc = struct.unpack_from(">I", data, end)[0]
        if zlib.crc32(data[offset + 4 : end]) != expected_crc:
            raise ValueError(f"Corrupt PNG chunk: {name}")
        if offset == 8:
            if kind != b"IHDR" or length != 13:
                raise ValueError(f"Invalid PNG header: {name}")
            width, height = struct.unpack_from(">II", data, offset + 8)
            if not (0 < width <= 10000 and 0 < height <= 10000) or width * height > 40000000:
                raise ValueError(f"Invalid dimensions: {name}")
            dimensions = (width, height)
        has_pixels = has_pixels or kind == b"IDAT"
        if kind == b"IEND" and length == 0 and has_pixels:
            return dimensions
        offset = end + 4
    raise ValueError(f"Incomplete PNG: {name}")


SIGNATURES = {b"\x89PNG\r\n\x1a\n": "png", b"\xff\xd8\xff": "jpg"}

FRAME_EXTENSIONS = {".png": "png", ".jpg": "jpg", ".jpeg": "jpg"}


def frame_name(index, pad, extension):
    """One-based, matching src/lib/vocational/sequence.ts."""
    return f"frame-{index:0{pad}d}.{extension}"


def frame_pattern(pad, extension):
    return f"frame-%0{pad}d.{extension}"


def natural_key(name):
    """Order frame-9 before frame-10 whatever the exporter named them."""
    parts = re.split(r"(\d+)", name.lower())
    return [int(part) if part.isdigit() else part for part in parts]


def even_sample(total, wanted):
    """Evenly spaced indices across the source set, keeping both end frames."""
    if wanted >= total:
        return list(range(total))
    if wanted == 1:
        return [0]
    return sorted({round(index * (total - 1) / (wanted - 1)) for index in range(wanted)})


def validate_jpeg(data, name):
    if data[:3] != b"\xff\xd8\xff":
        raise ValueError(f"Not a JPEG: {name}")
    offset = 2
    while offset + 4 <= len(data):
        if data[offset] != 0xFF:
            raise ValueError(f"Corrupt JPEG marker: {name}")
        marker = data[offset + 1]
        if marker in (0xD8, 0x01) or 0xD0 <= marker <= 0xD7:
            offset += 2
            continue
        if marker == 0xD9:
            break
        length = struct.unpack_from(">H", data, offset + 2)[0]
        if length < 2 or offset + 2 + length > len(data):
            raise ValueError(f"Truncated JPEG: {name}")
        # Any start-of-frame marker but the arithmetic-coding and reserved ones.
        if marker in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
            height, width = struct.unpack_from(">HH", data, offset + 5)
            if not (0 < width <= 10000 and 0 < height <= 10000) or width * height > 40000000:
                raise ValueError(f"Invalid dimensions: {name}")
            return (width, height)
        if marker == 0xDA:
            break
        offset += 2 + length
    raise ValueError(f"No JPEG frame header: {name}")


def validate_frame(data, name):
    """Dispatch on the real signature, not on the file name."""
    for signature, kind in SIGNATURES.items():
        if data[: len(signature)] == signature:
            return (validate_png if kind == "png" else validate_jpeg)(data, name), kind
    raise ValueError(f"Not a PNG or JPEG: {name}")
