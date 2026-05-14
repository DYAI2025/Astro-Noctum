"""
Regression test for parse_scalar UTF-8 handling.
Asserts that quoted YAML scalars preserve non-ASCII characters end-to-end.
"""
import sys
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))
from validate_aphorisms import parse_scalar


def test_quoted_ascii_unchanged():
    assert parse_scalar('"hello"') == "hello"


def test_quoted_polish_l_with_stroke():
    # "Stanisław" contains 'ł' (U+0142). Must round-trip cleanly.
    assert parse_scalar('"Stanisław Jerzy Lec"') == "Stanisław Jerzy Lec"


def test_quoted_german_umlauts():
    assert parse_scalar('"über schöne grüße"') == "über schöne grüße"


def test_quoted_german_sharp_s():
    assert parse_scalar('"Straße"') == "Straße"


def test_single_quoted_unicode():
    # Single quotes should already work — confirms symmetric behavior.
    assert parse_scalar("'Stanisław'") == "Stanisław"


def test_unquoted_unicode():
    # No quotes: returned verbatim.
    assert parse_scalar("Stanisław") == "Stanisław"


def test_quoted_with_apostrophe_inside():
    # Editor-notes sometimes contain apostrophes — must not break.
    assert parse_scalar("\"That's it\"") == "That's it"


def test_quoted_null_string_returns_null_word():
    # Bare 'null' returns None; '"null"' (quoted) returns the string "null".
    assert parse_scalar('"null"') == "null"
