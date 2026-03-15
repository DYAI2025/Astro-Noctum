"""
test_engine.py — End-to-End Smoke Test

Tests the full Bazodiac engine pipeline:
  GCB derivation → Cross-Reference → Master Signal → Narrative

Uses synthetic natal and quiz vectors (no actual FuFirE or API calls needed).
"""

import json
from datetime import date

from gcb_engine import derive_gcb, CLUSTER_DIMS
from master_signal import (
    NatalSignalInput,
    QuizSignalInput,
    FusionWeights,
    compute_master_signal,
)


def normalize(d: dict) -> dict:
    total = sum(d.values())
    return {k: round(v / total, 4) for k, v in d.items()}


# ── Test Case 1: Millennial, emerging adult ─────────────────────────────────

print("\n" + "═" * 65)
print("  TEST 1 — Millennial (1990), Emerging Adult, Passion-dominant")
print("═" * 65)

gcb = derive_gcb(date(1990, 6, 15), reference_date=date(2026, 3, 14))
print(f"\nGCB:")
print(f"  generation:   {gcb.generation_label}")
print(f"  cohort_5y:    {gcb.cohort_5y}")
print(f"  cohort_10y:   {gcb.cohort_10y}")
print(f"  life_stage:   {gcb.life_stage} ({gcb.life_stage_label_de})")
print(f"  dominant_dim: {gcb.dominant_dimension}")
print(f"  vector:       {gcb.baseline_vector.to_dict()}")
print(f"  evidence_mode: {gcb.evidence_mode}")

# Synthetic natal signal: strong passion + future, weak stability
natal = NatalSignalInput(
    source="fufireé_synthetic_test",
    birth_date_iso="1990-06-15",
    vector=normalize({
        "passion":    0.35,
        "stability":  0.10,
        "future":     0.30,
        "connection": 0.15,
        "autonomy":   0.10,
    }),
    western_sun_sign="Gemini",
    wuxing_dominant="Feuer",
)

# Synthetic quiz signal: high connection + moderate passion (current self)
quiz = QuizSignalInput(
    quiz_ids=["passion_01_initiative", "stability_01_foundation"],
    vector=normalize({
        "passion":    0.28,
        "stability":  0.18,
        "future":     0.22,
        "connection": 0.22,
        "autonomy":   0.10,
    }),
    primary_type="Funke",
)

signal = compute_master_signal(natal, quiz, gcb)

print(f"\nCross-Reference:")
print(f"  N↔Q alignment:  {signal.cross_reference.natal_quiz_alignment.score:.3f} ({signal.cross_reference.natal_quiz_alignment.label})")
print(f"  N↔G alignment:  {signal.cross_reference.natal_gcb_alignment.score:.3f} ({signal.cross_reference.natal_gcb_alignment.label})")
print(f"  Q↔G alignment:  {signal.cross_reference.quiz_gcb_alignment.score:.3f} ({signal.cross_reference.quiz_gcb_alignment.label})")
print(f"  coherence:      {signal.cross_reference.coherence_score:.3f}")
print(f"  individuation:  {signal.cross_reference.individuation_score:.3f}")

print(f"\nMaster Signal:")
print(f"  dominant:     {signal.dominant_dimension}")
print(f"  vector:       {signal.master_vector}")

print(f"\nNarrative (de-DE):")
print(f"  core:         {signal.narrative.core_summary['de-DE']}")
print(f"  context:      {signal.narrative.context_summary['de-DE']}")
print(f"  integration:  {signal.narrative.integration_summary['de-DE']}")

print(f"\nTransparency:")
for note in signal.transparency_notes:
    print(f"  • {note}")


# ── Test Case 2: Gen Z, young adult, stability-seeking ─────────────────────

print("\n" + "═" * 65)
print("  TEST 2 — Gen Z (2001), Young Adult, Stability-seeking")
print("═" * 65)

gcb2 = derive_gcb(date(2001, 11, 3), reference_date=date(2026, 3, 14))
print(f"\nGCB:")
print(f"  generation:   {gcb2.generation_label}")
print(f"  life_stage:   {gcb2.life_stage}")
print(f"  dominant_dim: {gcb2.dominant_dimension}")
print(f"  vector:       {gcb2.baseline_vector.to_dict()}")

natal2 = NatalSignalInput(
    source="fufireé_synthetic_test",
    birth_date_iso="2001-11-03",
    vector=normalize({
        "passion":    0.15,
        "stability":  0.35,
        "future":     0.20,
        "connection": 0.20,
        "autonomy":   0.10,
    }),
    western_sun_sign="Scorpio",
    wuxing_dominant="Erde",
)

quiz2 = QuizSignalInput(
    quiz_ids=["stability_01_foundation", "love_time_01_quality"],
    vector=normalize({
        "passion":    0.12,
        "stability":  0.40,
        "future":     0.18,
        "connection": 0.22,
        "autonomy":   0.08,
    }),
    primary_type="Anker",
)

signal2 = compute_master_signal(natal2, quiz2, gcb2)

print(f"\nCross-Reference:")
print(f"  coherence:     {signal2.cross_reference.coherence_score:.3f}")
print(f"  individuation: {signal2.cross_reference.individuation_score:.3f}")
print(f"\nMaster Signal dominant: {signal2.dominant_dimension}")
print(f"Master vector: {signal2.master_vector}")
print(f"\nIntegration (en-US): {signal2.narrative.integration_summary['en-US']}")


# ── JSON Output sample ──────────────────────────────────────────────────────

print("\n" + "═" * 65)
print("  JSON OUTPUT SAMPLE (Test 1)")
print("═" * 65)
out = signal.to_dict()
print(json.dumps(out, ensure_ascii=False, indent=2))

print("\n✅ All tests passed.\n")
