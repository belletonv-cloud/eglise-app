"""
Pure-Python shim for the CPython audioop module. This module proxies
to the bundled pyaudioop implementation when the C extension is
unavailable. It provides a minimal subset of functions used by
pydub/gradio in this project so the Python service can start.

Note: This is a compatibility shim for development and CI. For
production audio processing, prefer installing a Python runtime with
the native audioop C extension or a proper optimized package.
"""
from pyaudioop import *  # noqa: F401,F403 - re-export everything from shim

__all__ = [
    name for name in dir() if not name.startswith("_")
]
