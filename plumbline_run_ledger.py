#!/usr/bin/env python3
"""Plumbline run ledger helpers.

The ledger is an append-only CSV of gate status rows. ``resume-point`` evaluates
progress against the mandatory canonical gate sequence below, not against the
order in which gates first appeared in a ledger. The command returns the first
canonical gate whose latest ledger row is missing or whose latest status is not
``CLEARED``.

The command intentionally fails closed: missing, empty, unreadable, or malformed
ledgers are treated as having no cleared gates, so the resume point is the first
canonical gate. An explicit ``__RUN_COMPLETE__`` row with status ``CLEARED`` is
preserved as an override and reports the run as complete.
"""

from __future__ import annotations

import argparse
import csv
from pathlib import Path
from typing import Iterable

CLEARED = "CLEARED"
RUN_COMPLETE_GATE = "__RUN_COMPLETE__"

# Mandatory gates are evaluated in this contract order. Keep this list explicit
# so resume decisions cannot drift with arbitrary first-seen ledger row order.
CANONICAL_MANDATORY_GATES: tuple[str, ...] = (
    "phase0",
    "phase0_5_spec_sanity",
    "gateA_verification",
)

GATE_FIELD_CANDIDATES = ("gate", "gate_id", "name", "id")
STATUS_FIELD_CANDIDATES = ("status", "state", "result")


def _first_present(row: dict[str, str], names: Iterable[str]) -> str | None:
    for name in names:
        value = row.get(name)
        if value is not None and value.strip():
            return value.strip()
    return None


def _latest_statuses_from_dict_rows(rows: Iterable[dict[str, str]]) -> dict[str, str] | None:
    latest: dict[str, str] = {}
    for row in rows:
        gate = _first_present(row, GATE_FIELD_CANDIDATES)
        status = _first_present(row, STATUS_FIELD_CANDIDATES)
        if gate is None or status is None:
            return None
        latest[gate] = status
    return latest


def _latest_statuses_from_positional_rows(rows: Iterable[list[str]]) -> dict[str, str] | None:
    latest: dict[str, str] = {}
    for row in rows:
        fields = [field.strip() for field in row]
        if len(fields) < 2 or not fields[0] or not fields[1]:
            return None
        latest[fields[0]] = fields[1]
    return latest


def read_latest_statuses(ledger_path: Path) -> dict[str, str]:
    """Return the latest status per gate, or an empty map on fail-closed input."""

    try:
        content = ledger_path.read_text(encoding="utf-8")
    except (OSError, UnicodeError):
        return {}

    if not content.strip():
        return {}

    try:
        sample = content[:2048]
        has_header = csv.Sniffer().has_header(sample)
    except csv.Error:
        has_header = False

    try:
        if has_header:
            reader = csv.DictReader(content.splitlines())
            if not reader.fieldnames:
                return {}
            lowered = {field.strip().lower(): field for field in reader.fieldnames if field}
            if not any(name in lowered for name in GATE_FIELD_CANDIDATES):
                return {}
            if not any(name in lowered for name in STATUS_FIELD_CANDIDATES):
                return {}
            normalized_rows = (
                {key.strip().lower(): value for key, value in row.items() if key is not None}
                for row in reader
            )
            latest = _latest_statuses_from_dict_rows(normalized_rows)
        else:
            latest = _latest_statuses_from_positional_rows(csv.reader(content.splitlines()))
    except (csv.Error, UnicodeError):
        return {}

    return latest or {}


def resume_point(latest_statuses: dict[str, str]) -> str:
    """Return the next canonical gate to run, or ``__RUN_COMPLETE__``."""

    if latest_statuses.get(RUN_COMPLETE_GATE) == CLEARED:
        return RUN_COMPLETE_GATE

    for gate in CANONICAL_MANDATORY_GATES:
        if latest_statuses.get(gate) != CLEARED:
            return gate

    return RUN_COMPLETE_GATE


def cmd_resume_point(args: argparse.Namespace) -> int:
    print(resume_point(read_latest_statuses(Path(args.ledger))))
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Inspect a Plumbline run ledger.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    resume_parser = subparsers.add_parser(
        "resume-point",
        help="print the first missing or non-CLEARED mandatory canonical gate",
    )
    resume_parser.add_argument("ledger", help="path to the run ledger CSV")
    resume_parser.set_defaults(func=cmd_resume_point)

    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
