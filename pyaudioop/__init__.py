"""
Lightweight pure-Python shim for the CPython audioop module.

This provides a minimal subset of audioop functions used by pydub
so that environments without the C audioop extension can still run
simple audio operations.

This is intentionally small and not optimized. It supports sample
widths of 1, 2 and 4 bytes for basic operations: rms, max, mul, add,
and lin2lin. If you need full parity, prefer installing a proper
Python runtime with the audioop C module or use a wheel providing
`pyaudioop`.
"""
from __future__ import annotations
import struct
from typing import Tuple


def _unpack_samples(fragment: bytes, width: int) -> Tuple[int, ...]:
    if width == 1:
        fmt = f"{len(fragment)}B"
        return struct.unpack(fmt, fragment)
    elif width == 2:
        fmt = f"<{len(fragment)//2}h"
        return struct.unpack(fmt, fragment)
    elif width == 4:
        fmt = f"<{len(fragment)//4}i"
        return struct.unpack(fmt, fragment)
    else:
        raise ValueError("Unsupported sample width")


def _pack_samples(samples: Tuple[int, ...], width: int) -> bytes:
    if width == 1:
        fmt = f"{len(samples)}B"
        return struct.pack(fmt, *samples)
    elif width == 2:
        fmt = f"<{len(samples)}h"
        return struct.pack(fmt, *samples)
    elif width == 4:
        fmt = f"<{len(samples)}i"
        return struct.pack(fmt, *samples)
    else:
        raise ValueError("Unsupported sample width")


def rms(fragment: bytes, width: int) -> int:
    """Return RMS of audio fragment (like audioop.rms)."""
    if not fragment:
        return 0
    samples = _unpack_samples(fragment, width)
    s = 0
    for v in samples:
        s += v * v
    mean_sq = s // len(samples)
    import math

    return int(math.sqrt(mean_sq))


def max(fragment: bytes, width: int) -> int:
    """Return max absolute sample value (like audioop.max)."""
    if not fragment:
        return 0
    samples = _unpack_samples(fragment, width)
    return max(abs(v) for v in samples)


def mul(fragment: bytes, width: int, factor: float) -> bytes:
    """Multiply samples by factor (like audioop.mul)."""
    if not fragment:
        return b""
    samples = _unpack_samples(fragment, width)
    out = []
    # clamp values depending on width
    if width == 1:
        lo, hi = 0, 255
    elif width == 2:
        lo, hi = -32768, 32767
    elif width == 4:
        lo, hi = -2147483648, 2147483647
    else:
        raise ValueError("Unsupported sample width")
    for v in samples:
        nv = int(v * factor)
        if nv < lo:
            nv = lo
        if nv > hi:
            nv = hi
        out.append(nv)
    return _pack_samples(tuple(out), width)


def add(fragment1: bytes, fragment2: bytes, width: int) -> bytes:
    """Add two fragments (like audioop.add)."""
    if not fragment1:
        return fragment2
    if not fragment2:
        return fragment1
    s1 = _unpack_samples(fragment1, width)
    s2 = _unpack_samples(fragment2, width)
    n = min(len(s1), len(s2))
    out = []
    if width == 1:
        lo, hi = 0, 255
    elif width == 2:
        lo, hi = -32768, 32767
    elif width == 4:
        lo, hi = -2147483648, 2147483647
    else:
        raise ValueError("Unsupported sample width")
    for i in range(n):
        v = s1[i] + s2[i]
        if v < lo:
            v = lo
        if v > hi:
            v = hi
        out.append(v)
    return _pack_samples(tuple(out), width)


def lin2lin(fragment: bytes, width: int, new_width: int) -> bytes:
    """Convert sample width (like audioop.lin2lin)."""
    if width == new_width:
        return fragment
    samples = _unpack_samples(fragment, width)
    return _pack_samples(samples, new_width)
