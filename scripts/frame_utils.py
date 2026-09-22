"""Shared checks for frame archives; no image transformations or extra dependencies."""

from contextlib import contextmanager
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
