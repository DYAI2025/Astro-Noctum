from __future__ import annotations

import argparse
import json
from pathlib import Path
from . import compute_horoscope, ComputeOptions

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True)
    ap.add_argument("--strict", action="store_true")
    ap.add_argument("--non-strict", dest="strict", action="store_false")
    ap.set_defaults(strict=True)
    args = ap.parse_args()

    payload = json.loads(Path(args.input).read_text(encoding="utf-8"))
    out = compute_horoscope(payload, options=ComputeOptions(strict_mode=args.strict))
    print(json.dumps(out, ensure_ascii=False, indent=2))
