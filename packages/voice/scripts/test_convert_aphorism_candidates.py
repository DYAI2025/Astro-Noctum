"""
Test for convert_aphorism_candidates.py — TDD red phase.

Asserts that converting the operator-supplied candidate input produces 33
schema-valid markdown files that all pass validate_aphorisms.validate_file().
"""
import sys
import subprocess
from pathlib import Path

HERE = Path(__file__).parent
SCAFFOLD = HERE.parent.parent.parent.parent / "Astro-Noctum"
INPUT_FILE = SCAFFOLD / "docs/inputs/2026-05-14-aphorism-candidates-aph-0089-0121.md"

sys.path.insert(0, str(HERE))
from validate_aphorisms import validate_file  # noqa: E402

EXPECTED_IDS = [f"aph-{i:04d}" for i in range(89, 122)]  # 0089..0121 inclusive = 33 IDs
EXPECTED_OUTPUT_COUNT = 33


def test_input_file_exists():
    assert INPUT_FILE.exists(), f"missing input file: {INPUT_FILE}"


def test_conversion_produces_33_files(tmp_path):
    script = HERE / "convert_aphorism_candidates.py"
    result = subprocess.run(
        [sys.executable, str(script), str(INPUT_FILE), str(tmp_path)],
        capture_output=True, text=True,
    )
    assert result.returncode == 0, f"script failed: stderr={result.stderr}"
    produced = sorted(p.name for p in tmp_path.glob("aph-*.md"))
    assert len(produced) == EXPECTED_OUTPUT_COUNT, (
        f"expected {EXPECTED_OUTPUT_COUNT} files, got {len(produced)}: {produced}"
    )


def test_all_produced_files_pass_validator(tmp_path):
    script = HERE / "convert_aphorism_candidates.py"
    subprocess.run(
        [sys.executable, str(script), str(INPUT_FILE), str(tmp_path)],
        check=True,
    )
    errors = []
    for p in sorted(tmp_path.glob("aph-*.md")):
        file_errors = validate_file(p)
        errors.extend(file_errors)
    assert not errors, "validator errors:\n" + "\n".join(errors)


def test_all_produced_files_are_approved(tmp_path):
    script = HERE / "convert_aphorism_candidates.py"
    subprocess.run(
        [sys.executable, str(script), str(INPUT_FILE), str(tmp_path)],
        check=True,
    )
    import re
    for p in sorted(tmp_path.glob("aph-*.md")):
        text = p.read_text(encoding="utf-8")
        m = re.search(r'^status:\s*"?(\w+)"?', text, re.M)
        assert m, f"no status in {p.name}"
        assert m.group(1) == "approved", f"{p.name} status is {m.group(1)}, expected approved"


def test_expected_ids_present(tmp_path):
    script = HERE / "convert_aphorism_candidates.py"
    subprocess.run(
        [sys.executable, str(script), str(INPUT_FILE), str(tmp_path)],
        check=True,
    )
    produced_ids = sorted(p.stem for p in tmp_path.glob("aph-*.md"))
    expected = sorted(EXPECTED_IDS)
    assert produced_ids == expected, (
        f"produced {produced_ids}, expected {expected}"
    )
