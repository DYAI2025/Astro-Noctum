#!/usr/bin/env python3
"""5-second timeout wrapper around claude_code_post_tool.py.

Settings.json points PostToolUse here instead of the unwrapped hook so a
runaway hook (regex blow-up, filesystem lock, oversized tool output) can't
tax every Bash call. SIGALRM-based; POSIX-only (macOS + Linux). On
timeout the hook exits cleanly with status 0 — a missing learning entry
is far better than a stalled developer loop.
"""
import os
import signal
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
TARGET = os.path.join(HERE, "claude_code_post_tool.py")
TIMEOUT_SECONDS = 5


def _bail(signum, frame):
    sys.stderr.write(
        f"[post-tool hook] timed out after {TIMEOUT_SECONDS}s — exiting silently\n"
    )
    os._exit(0)


signal.signal(signal.SIGALRM, _bail)
signal.alarm(TIMEOUT_SECONDS)

with open(TARGET) as f:
    code = compile(f.read(), TARGET, "exec")
exec(code, {"__name__": "__main__", "__file__": TARGET})
