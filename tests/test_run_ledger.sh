#!/usr/bin/env bash
# Verifies that resume-point follows the mandatory canonical gate contract.
# It must not choose gates by first-seen ledger row order.

set -euo pipefail

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
LEDGER_TOOL="$ROOT_DIR/plumbline_run_ledger.py"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/plumbline-ledger.XXXXXX")"
trap 'rm -rf "$TMP_DIR"' EXIT

assert_resume_point() {
  local ledger_path="$1"
  local expected="$2"
  local actual

  actual="$(python3 "$LEDGER_TOOL" resume-point "$ledger_path")"
  if [[ "$actual" != "$expected" ]]; then
    printf 'expected resume point %s, got %s\n' "$expected" "$actual" >&2
    return 1
  fi
}

# Missing/empty/corrupt ledgers fail closed to the first canonical gate.
assert_resume_point "$TMP_DIR/missing.csv" "phase0"
: > "$TMP_DIR/empty.csv"
assert_resume_point "$TMP_DIR/empty.csv" "phase0"
printf 'timestamp,gate\n2026-06-04T00:00:00Z,phase0\n' > "$TMP_DIR/corrupt.csv"
assert_resume_point "$TMP_DIR/corrupt.csv" "phase0"

# Contract drift guard: a non-canonical row recorded before an absent canonical
# gate must not become the resume point.
cat > "$TMP_DIR/drift.csv" <<'CSV'
timestamp,gate,status
2026-06-04T00:00:00Z,phase0,CLEARED
2026-06-04T00:01:00Z,gateA_verification,PENDING
CSV
assert_resume_point "$TMP_DIR/drift.csv" "phase0_5_spec_sanity"

# Latest row wins per gate while canonical order chooses the resume point.
cat > "$TMP_DIR/latest.csv" <<'CSV'
timestamp,gate,status
2026-06-04T00:00:00Z,phase0,PENDING
2026-06-04T00:01:00Z,phase0,CLEARED
2026-06-04T00:02:00Z,phase0_5_spec_sanity,PENDING
CSV
assert_resume_point "$TMP_DIR/latest.csv" "phase0_5_spec_sanity"

# Explicit completion sentinel remains authoritative.
cat > "$TMP_DIR/complete.csv" <<'CSV'
timestamp,gate,status
2026-06-04T00:00:00Z,__RUN_COMPLETE__,CLEARED
CSV
assert_resume_point "$TMP_DIR/complete.csv" "__RUN_COMPLETE__"

printf 'test_run_ledger.sh: ok\n'
