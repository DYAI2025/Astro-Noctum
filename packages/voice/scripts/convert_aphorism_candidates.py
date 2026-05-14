#!/usr/bin/env python3
"""
Convert operator-supplied aphorism candidate file into 33 schema-valid
markdown files for the prod review/ folder.

Mapping rules: see docs/plans/2026-05-14-aphorism-batch-extension-aph-0089-0121.md
in the scaffold repo (sections 'Value-Mapping Table' and 'Schema').

Usage:
    python3 convert_aphorism_candidates.py <input_md> <output_dir>
"""
import sys
import re
from pathlib import Path

# ---- Mapping tables (must mirror the plan exactly) -------------------------

ALLOWED_ELEMENTS = {"wasser", "feuer", "erde", "holz", "metall"}

ATTR_STATUS_MAP = {
    "verified": "verified",
    "attributed_needs_source_check": "disputed",
    "needs_source_check": "disputed",
    "unverified_not_recommended": "apocryphal",
    "unverified_attribution_conflict": "disputed",
    "misattributed_or_unverified": "apocryphal",
    "apocryphal_not_verified": "apocryphal",
    "known_source_excerpt": "verified",
    "known_film_quote_needs_exact_check": "disputed",
    "known_film_scene_needs_exact_check": "disputed",
    "curator_original_or_unattributed": "folkloric",
}

# Per-ID copyright + original_language (from the plan's value-mapping table)
PER_ID = {
    "aph-0089": ("Zitatrecht", "unknown"),
    "aph-0090": ("Zitatrecht", "unknown"),
    "aph-0091": ("Zitatrecht", "unknown"),
    "aph-0092": ("Zitatrecht", "unknown"),
    "aph-0093": ("Zitatrecht", "unknown"),
    "aph-0094": ("Zitatrecht", "unknown"),
    "aph-0095": ("Zitatrecht", "unknown"),
    "aph-0096": ("Zitatrecht", "en"),
    "aph-0097": ("Zitatrecht", "en"),
    "aph-0098": ("Zitatrecht", "en"),
    "aph-0099": ("Zitatrecht", "en"),
    "aph-0100": ("Zitatrecht", "en"),
    "aph-0101": ("Zitatrecht", "unknown"),
    "aph-0102": ("Zitatrecht", "en"),
    "aph-0103": ("Zitatrecht", "en"),
    "aph-0104": ("Zitatrecht", "en"),
    "aph-0105": ("PD", "en"),
    "aph-0106": ("PD", "en"),
    "aph-0107": ("eigene-Übersetzung", "de"),
    "aph-0108": ("PD", "en"),
    "aph-0109": ("PD", "unknown"),
    "aph-0110": ("Zitatrecht", "en"),
    "aph-0111": ("PD", "en"),
    "aph-0112": ("PD", "en"),
    "aph-0113": ("Zitatrecht", "en"),
    "aph-0114": ("Zitatrecht", "de"),
    "aph-0115": ("Zitatrecht", "de"),
    "aph-0116": ("Zitatrecht", "de"),
    "aph-0117": ("Zitatrecht", "en"),
    "aph-0118": ("Zitatrecht", "en"),
    "aph-0119": ("Zitatrecht", "en"),
    "aph-0120": ("Zitatrecht", "en"),
    "aph-0121": ("Zitatrecht", "en"),
}

DEFAULTS = {
    "translator_de": "",
    "translator_en": "",
    "figure_affinity": "[]",
    "season_affinity": "[]",
    "quality_rating": 4,
    "first_used": "null",
    "cooldown_days": 30,
}

# ---- Helpers ---------------------------------------------------------------

def word_count(text):
    text = text.replace("—", " ").replace("–", " ")
    return len([t for t in re.split(r"\s+", text.strip()) if t])


def parse_candidate(block):
    fm_match = re.search(r"---\s*\n(.*?)\n---", block, re.S)
    if not fm_match:
        return None
    fm_lines = fm_match.group(1).splitlines()
    fm = {}
    for line in fm_lines:
        if ":" not in line:
            continue
        k, v = line.split(":", 1)
        fm[k.strip()] = v.strip().strip('"').strip("'")
    if "id" not in fm:
        return None

    body_after_fm = block[fm_match.end():]

    def grab_quote(label):
        m = re.search(rf"\*\*{re.escape(label)}\*\*\s*\n>\s*(.+?)(?=\n\s*\n|\n\*\*|\Z)", body_after_fm, re.S)
        if not m:
            return ""
        raw = m.group(1)
        lines = []
        for line in raw.splitlines():
            line = line.strip()
            if line.startswith(">"):
                line = line[1:].strip()
            lines.append(line)
        return " ".join(l for l in lines if l).strip()

    de = grab_quote("DE")
    en = grab_quote("EN")

    slot2_de = ""
    m = re.search(r"\*\*Slot-2-Kandidaten DE\*\*\s*\n-\s*(.+?)(?=\n\s*\n|\n\*\*|\Z)", body_after_fm, re.S)
    if m:
        slot2_de = m.group(1).strip().splitlines()[0].strip()

    editor_ctx = ""
    m = re.search(r"\*\*Editor-Kontext\*\*\s*\n(.+?)(?=\n\s*\n|\n\*\*|\n##|\Z)", body_after_fm, re.S)
    if m:
        editor_ctx = " ".join(line.strip() for line in m.group(1).splitlines() if line.strip())

    fm["_de"] = de
    fm["_en"] = en
    fm["_slot2_de"] = slot2_de
    fm["_editor_ctx"] = editor_ctx
    return fm


def render_file(fm):
    aid = fm["id"]
    if aid not in PER_ID:
        raise ValueError(f"no PER_ID mapping for {aid}")
    copyright_val, original_lang = PER_ID[aid]

    cand_attr = fm.get("attribution_status", "needs_source_check")
    attr_status = ATTR_STATUS_MAP.get(cand_attr, "disputed")

    attribution_note = ""
    if attr_status != "verified":
        attribution_note = fm.get("_editor_ctx") or f"Zuschreibung markiert als '{cand_attr}' — siehe editor_notes."
        attribution_note = attribution_note.replace('"', "'").replace("\n", " ").strip()

    de = fm["_de"]
    en = fm["_en"]
    wc_de = word_count(de)
    wc_en = word_count(en)

    fields = [
        f'id: "{aid}"',
        'status: "approved"',
        f'author: "{fm.get("author", "uncertain")}"',
        f'work: "{fm.get("work", "")}"',
    ]
    year_val = fm.get("year", "null")
    if year_val in ("", "null", None):
        fields.append("year: null")
    elif re.fullmatch(r"-?\d+", str(year_val)):
        fields.append(f"year: {year_val}")
    else:
        fields.append(f'year: "{year_val}"')
    # Validator's parse_scalar mangles non-ASCII chars inside double quotes
    # (it runs unicode_escape on the unquoted bytes). Emit copyright values
    # containing non-ASCII unquoted so YAML keeps the raw bytes intact.
    if any(ord(c) > 127 for c in copyright_val):
        copyright_field = f"copyright: {copyright_val}"
    else:
        copyright_field = f'copyright: "{copyright_val}"'
    fields += [
        f'original_language: "{original_lang}"',
        f'translator_de: "{DEFAULTS["translator_de"]}"',
        f'translator_en: "{DEFAULTS["translator_en"]}"',
        copyright_field,
        f'attribution_status: "{attr_status}"',
    ]
    if attribution_note:
        fields.append(f'attribution_note: "{attribution_note}"')
    # Filter element_affinity to only include validator-allowed Wu-Xing
    # elements. The candidate input occasionally uses "luft" (German for air),
    # which is not part of the BaZi five-element schema accepted by the
    # validator — drop such values rather than fail validation.
    raw_elements = fm.get("element_affinity", "[]")
    elements_match = re.fullmatch(r"\[(.*)\]", raw_elements.strip())
    if elements_match:
        items = [x.strip().strip('"').strip("'") for x in elements_match.group(1).split(",") if x.strip()]
        kept = [x for x in items if x in ALLOWED_ELEMENTS]
        element_field_val = "[" + ", ".join(kept) + "]"
    else:
        element_field_val = "[]"
    fields += [
        f'mode_tags: {fm.get("mode_tags", "[pulse]")}',
        f'tone_tags: {fm.get("tone_tags", "[weisheitlich]")}',
        f'element_affinity: {element_field_val}',
        f'figure_affinity: {DEFAULTS["figure_affinity"]}',
        f'season_affinity: {DEFAULTS["season_affinity"]}',
        f"word_count_de: {wc_de}",
        f"word_count_en: {wc_en}",
        f'quality_rating: {DEFAULTS["quality_rating"]}',
        f'first_used: {DEFAULTS["first_used"]}',
        f'cooldown_days: {DEFAULTS["cooldown_days"]}',
    ]
    editor_note = fm.get("_editor_ctx", "").replace('"', "'").replace("\n", " ").strip()
    if editor_note:
        fields.append(f'editor_notes: "{editor_note}"')

    fm_block = "---\n" + "\n".join(fields) + "\n---\n"

    body = f"\n## DE\n\n> {de}\n\n## EN\n\n> {en}\n"
    if fm["_slot2_de"]:
        body += f"\n## Slot-2-Kandidaten DE\n\n- {fm['_slot2_de']}\n"
    body += "\n## Slot-2-Candidates EN\n\n-\n"
    if fm["_editor_ctx"]:
        body += f"\n## Editor-Kontext\n\n{fm['_editor_ctx']}\n"
    body += "\n## Verwandt\n\n-\n"

    return fm_block + body


def main():
    if len(sys.argv) != 3:
        print("usage: convert_aphorism_candidates.py <input_md> <output_dir>", file=sys.stderr)
        return 2
    src = Path(sys.argv[1])
    out_dir = Path(sys.argv[2])
    out_dir.mkdir(parents=True, exist_ok=True)

    raw = src.read_text(encoding="utf-8")
    blocks = re.split(r"\n(?=## aph-\d{4})", raw)
    count = 0
    for block in blocks:
        if not block.lstrip().startswith("## aph-"):
            continue
        parsed = parse_candidate(block)
        if not parsed:
            continue
        aid = parsed["id"]
        if aid not in PER_ID:
            print(f"WARN: skipping {aid} — no PER_ID mapping", file=sys.stderr)
            continue
        rendered = render_file(parsed)
        out_path = out_dir / f"{aid}.md"
        out_path.write_text(rendered, encoding="utf-8")
        count += 1

    print(f"wrote {count} aphorism files to {out_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
