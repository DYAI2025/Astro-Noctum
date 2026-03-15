"""
bazodiac_engine/master_signal.py
=================================
Master Signal Engine — Bazodiac v1.0

ARCHITECTURE
  Three independent signal layers → Cross-Reference Engine → Master Signal

  ┌─────────────────────────────────────────────────────────────────────┐
  │  Natal Signal (N)         Individual birth chart                    │
  │  Quiz Signal  (Q)         Current self-report                       │
  │  GCB          (G)         Generational context baseline             │
  │                                                                     │
  │  ↓ All three normalized to shared cluster dimensions                │
  │  ↓ (passion / stability / future / connection / autonomy)           │
  │                                                                     │
  │  Cross-Reference Engine                                             │
  │    alignment(N, Q)  — how consistent is self-report with birth?     │
  │    alignment(N, G)  — how typical is this chart for its cohort?     │
  │    alignment(Q, G)  — how much does self-report deviate from norm?  │
  │                                                                     │
  │    coherence_score     — overall consistency across all 3 signals   │
  │    individuation_score — how much N+Q stand out from G              │
  │                                                                     │
  │  Fusion Engine                                                      │
  │    Weighted blend → Master Signal Vector                            │
  │    Default weights: N=0.35, Q=0.30, G=0.20, alignment_boost=0.15   │
  │                                                                     │
  │  Narrative Engine                                                   │
  │    core_summary        (N + Q)                                      │
  │    context_summary     (G)                                          │
  │    integration_summary (all three + alignment)                      │
  └─────────────────────────────────────────────────────────────────────┘

DESIGN DECISIONS
  • Cross-Reference is the FUSION MECHANISM, not an additive signal.
  • alignment_boost modulates confidence, not additional signal mass.
  • GCB always carries evidence_mode="heuristic_v1" in output.
  • MasterSignal has a transparency_notes field that surfaces all caveats.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import date
from typing import Any, Dict, List, Optional, Tuple

from gcb_engine import GCBModel, GCBVector, CLUSTER_DIMS

# ── Dimension space ────────────────────────────────────────────────────────────

# Shared dimensions for all three signal layers
DIM_KEYS = CLUSTER_DIMS  # ["passion", "stability", "future", "connection", "autonomy"]


# ── Signal container types ────────────────────────────────────────────────────

@dataclass
class NatalSignalInput:
    """
    Normalized natal signal vector.
    Derived from FuFirE: Western chart + Bazi pillars + WuXing vector,
    then projected onto the 5 shared cluster dimensions.

    The projection mapping is defined in natal_projection.py (separate module).
    For now this accepts a pre-computed dict from the caller.
    """
    source: str                          # e.g. "fufireé_v1.0.0-rc0"
    birth_date_iso: str
    vector: Dict[str, float]             # must cover all DIM_KEYS, normalized

    # Optional raw signals for transparency
    western_sun_sign: Optional[str] = None
    bazi_year_stem: Optional[str] = None
    wuxing_dominant: Optional[str] = None
    evidence_mode: str = "computed"

    def validate(self) -> bool:
        return all(k in self.vector for k in DIM_KEYS)


@dataclass
class QuizSignalInput:
    """
    Normalized quiz signal vector.
    Derived from QuizzMe Engine v3.0 ScoringResult.cluster_weights,
    then projected onto the 5 shared cluster dimensions.
    """
    quiz_ids: List[str]                  # which quizzes contributed
    vector: Dict[str, float]             # normalized cluster weights
    primary_type: Optional[str] = None   # winning type from type_model
    evidence_mode: str = "quiz_self_report"

    def validate(self) -> bool:
        return all(k in self.vector for k in DIM_KEYS)


# ── Cross-Reference Engine ─────────────────────────────────────────────────────

@dataclass
class AlignmentScore:
    """Cosine similarity between two signal vectors. Range: 0.0–1.0"""
    signal_a: str
    signal_b: str
    score: float          # 0.0 = orthogonal, 1.0 = identical
    delta_vector: Dict[str, float]   # per-dimension difference (A - B)

    @property
    def label(self) -> str:
        if self.score >= 0.85:
            return "high_alignment"
        elif self.score >= 0.65:
            return "moderate_alignment"
        elif self.score >= 0.45:
            return "partial_alignment"
        else:
            return "divergent"


@dataclass
class CrossReferenceResult:
    """Output of the Cross-Reference Engine."""
    natal_quiz_alignment: AlignmentScore
    natal_gcb_alignment: AlignmentScore
    quiz_gcb_alignment: AlignmentScore

    # Aggregate scores
    coherence_score: float      # mean of all three alignments: 0.0–1.0
    individuation_score: float  # how much N+Q deviate from G: 0.0–1.0

    # Narrative signals for downstream use
    alignment_narrative: Dict[str, str]   # {"de-DE": ..., "en-US": ...}


def _cosine_similarity(a: Dict[str, float], b: Dict[str, float]) -> float:
    """Compute cosine similarity between two dimension vectors."""
    dims = DIM_KEYS
    dot = sum(a.get(k, 0) * b.get(k, 0) for k in dims)
    mag_a = math.sqrt(sum(a.get(k, 0) ** 2 for k in dims))
    mag_b = math.sqrt(sum(b.get(k, 0) ** 2 for k in dims))
    if mag_a < 1e-9 or mag_b < 1e-9:
        return 0.0
    return max(0.0, min(1.0, dot / (mag_a * mag_b)))


def _delta_vector(a: Dict[str, float], b: Dict[str, float]) -> Dict[str, float]:
    return {k: round(a.get(k, 0) - b.get(k, 0), 4) for k in DIM_KEYS}


def _individuation_score(
    natal: Dict[str, float],
    quiz: Dict[str, float],
    gcb: Dict[str, float],
) -> float:
    """
    How much do the individual signals (N, Q) collectively deviate from GCB?
    High individuation → this person's chart+behavior stands out from cohort context.
    """
    # Average of N and Q, then distance from G
    avg_nq = {k: (natal.get(k, 0) + quiz.get(k, 0)) / 2 for k in DIM_KEYS}
    # L2 distance, then normalize to 0–1 (max possible L2 ≈ sqrt(2) for normalized vectors)
    l2 = math.sqrt(sum((avg_nq.get(k, 0) - gcb.get(k, 0)) ** 2 for k in DIM_KEYS))
    return min(1.0, l2 / math.sqrt(2))


def _alignment_narrative(
    nq: AlignmentScore,
    ng: AlignmentScore,
    qg: AlignmentScore,
    individuation: float,
) -> Dict[str, str]:
    """Build localized narrative for the cross-reference result."""
    # Determine narrative tone based on alignment levels
    if nq.score >= 0.75:
        nq_de = "Dein Geburtshoroskop und deine aktuellen Antworten zeigen ein hohes Maß an Konsistenz."
        nq_en = "Your birth chart and current quiz answers show a high degree of consistency."
    elif nq.score >= 0.50:
        nq_de = "Dein Geburtshoroskop und deine Selbstauskunft zeigen eine moderate Übereinstimmung — mit interessanten Abweichungen."
        nq_en = "Your birth chart and self-report show moderate alignment — with interesting divergences."
    else:
        nq_de = "Zwischen deinem Geburtshoroskop und deiner aktuellen Selbstauskunft besteht ein spannungsreiches Verhältnis."
        nq_en = "Your birth chart and current self-report are in productive tension with each other."

    if individuation >= 0.6:
        ind_de = "Du weichst deutlich von den Mustern deiner Generation ab — das ist ein Zeichen für starke Eigenentwicklung."
        ind_en = "You diverge significantly from your generational patterns — a marker of strong individual development."
    elif individuation >= 0.3:
        ind_de = "Du bewegst dich teilweise im Rahmen deiner Generation, trägst aber klare individuelle Züge."
        ind_en = "You operate partly within your generational context, but carry distinct individual traits."
    else:
        ind_de = "Dein Profil zeigt eine enge Resonanz mit dem Kontext deiner Generation."
        ind_en = "Your profile resonates closely with your generational context."

    return {
        "de-DE": f"{nq_de} {ind_de}",
        "en-US": f"{nq_en} {ind_en}",
    }


def compute_cross_reference(
    natal_v: Dict[str, float],
    quiz_v: Dict[str, float],
    gcb_v: Dict[str, float],
) -> CrossReferenceResult:
    """Compute full cross-reference between all three signal vectors."""
    nq_sim = _cosine_similarity(natal_v, quiz_v)
    ng_sim = _cosine_similarity(natal_v, gcb_v)
    qg_sim = _cosine_similarity(quiz_v, gcb_v)

    nq = AlignmentScore("natal", "quiz",       nq_sim, _delta_vector(natal_v, quiz_v))
    ng = AlignmentScore("natal", "gcb",        ng_sim, _delta_vector(natal_v, gcb_v))
    qg = AlignmentScore("quiz",  "gcb",        qg_sim, _delta_vector(quiz_v, gcb_v))

    coherence = round((nq_sim + ng_sim + qg_sim) / 3, 4)
    individuation = round(_individuation_score(natal_v, quiz_v, gcb_v), 4)
    narrative = _alignment_narrative(nq, ng, qg, individuation)

    return CrossReferenceResult(
        natal_quiz_alignment=nq,
        natal_gcb_alignment=ng,
        quiz_gcb_alignment=qg,
        coherence_score=coherence,
        individuation_score=individuation,
        alignment_narrative=narrative,
    )


# ── Fusion Engine ──────────────────────────────────────────────────────────────

@dataclass
class FusionWeights:
    natal: float = 0.35
    quiz:  float = 0.30
    gcb:   float = 0.20
    # alignment_boost distributes among N and Q proportionally based on coherence
    alignment_boost: float = 0.15

    def validate(self):
        total = self.natal + self.quiz + self.gcb + self.alignment_boost
        assert abs(total - 1.0) < 1e-6, f"FusionWeights must sum to 1.0, got {total}"


DEFAULT_WEIGHTS = FusionWeights()


def fuse_signals(
    natal_v: Dict[str, float],
    quiz_v: Dict[str, float],
    gcb_v: Dict[str, float],
    cross_ref: CrossReferenceResult,
    weights: FusionWeights = DEFAULT_WEIGHTS,
) -> Dict[str, float]:
    """
    Weighted fusion of three signal vectors.

    alignment_boost is distributed between N and Q based on coherence:
    - high coherence (>= 0.75): boost goes equally to N and Q
    - low coherence: boost weighted toward the signal with better cross-alignment
    """
    coherence = cross_ref.coherence_score

    # Distribute alignment boost between N and Q
    nq_alignment = cross_ref.natal_quiz_alignment.score
    if nq_alignment >= 0.75:
        n_boost = weights.alignment_boost * 0.5
        q_boost = weights.alignment_boost * 0.5
    else:
        # More boost to whichever is more aligned with GCB
        ng = cross_ref.natal_gcb_alignment.score
        qg = cross_ref.quiz_gcb_alignment.score
        total_cross = ng + qg + 1e-9
        n_boost = weights.alignment_boost * (ng / total_cross)
        q_boost = weights.alignment_boost * (qg / total_cross)

    effective_natal = weights.natal + n_boost
    effective_quiz  = weights.quiz  + q_boost
    effective_gcb   = weights.gcb

    # Weighted blend
    result = {}
    for k in DIM_KEYS:
        n_val = natal_v.get(k, 0.0)
        q_val = quiz_v.get(k,  0.0)
        g_val = gcb_v.get(k,   0.0)
        result[k] = (
            effective_natal * n_val +
            effective_quiz  * q_val +
            effective_gcb   * g_val
        )

    # Normalize
    total = sum(result.values())
    if total > 1e-9:
        result = {k: round(v / total, 5) for k, v in result.items()}

    return result


# ── Narrative Engine ───────────────────────────────────────────────────────────

@dataclass
class NarrativeOutput:
    """
    Three narrative components of the Master Signal.

    core_summary      — Based on Natal + Quiz: who this person is
    context_summary   — Based on GCB: the generational frame they grew up in
    integration_summary — All three + alignment: how individual story fits context
    """
    core_summary: Dict[str, str]         # {"de-DE": ..., "en-US": ...}
    context_summary: Dict[str, str]
    integration_summary: Dict[str, str]


def _dominant_dim_label(vector: Dict[str, float]) -> Tuple[str, str]:
    """Returns (label_de, label_en) for the dominant dimension."""
    dominant = max(vector, key=vector.get)
    labels = {
        "passion":    ("Leidenschaft & Initiative",  "passion & initiative"),
        "stability":  ("Stabilität & Kontinuität",   "stability & continuity"),
        "future":     ("Zukunftsorientierung",        "future-orientation"),
        "connection": ("Verbundenheit",               "connection & belonging"),
        "autonomy":   ("Eigenständigkeit",            "autonomy & self-direction"),
    }
    de, en = labels.get(dominant, (dominant, dominant))
    return de, en


def build_narrative(
    natal_input: NatalSignalInput,
    quiz_input: QuizSignalInput,
    gcb: GCBModel,
    master_vector: Dict[str, float],
    cross_ref: CrossReferenceResult,
) -> NarrativeOutput:
    """Generate the three narrative components of the Master Signal."""

    # Core summary: Natal + Quiz
    nq_avg = {k: (natal_input.vector.get(k, 0) + quiz_input.vector.get(k, 0)) / 2 for k in DIM_KEYS}
    nq_dom_de, nq_dom_en = _dominant_dim_label(nq_avg)

    nq_align = cross_ref.natal_quiz_alignment

    if nq_align.score >= 0.75:
        core_de = (
            f"Dein Geburtshoroskop und deine Selbstauskunft zeigen ein klares Bild: "
            f"Du lebst aus einem Kern von **{nq_dom_de}**. "
            f"Dein inneres Erleben und dein äußeres Handeln sind weitgehend im Einklang."
        )
        core_en = (
            f"Your birth chart and self-report paint a coherent picture: "
            f"You operate from a core of **{nq_dom_en}**. "
            f"Your inner experience and outer behavior are largely aligned."
        )
    else:
        # Find where they diverge
        max_delta_k = max(nq_align.delta_vector, key=lambda k: abs(nq_align.delta_vector[k]))
        delta_labels = {
            "passion":    ("Leidenschaft",    "passion"),
            "stability":  ("Stabilität",      "stability"),
            "future":     ("Zukunft",         "future-orientation"),
            "connection": ("Verbundenheit",   "connection"),
            "autonomy":   ("Eigenständigkeit","autonomy"),
        }
        delta_de, delta_en = delta_labels.get(max_delta_k, (max_delta_k, max_delta_k))
        core_de = (
            f"Dein Geburtshoroskop und deine aktuellen Antworten zeigen eine komplexe Spannung: "
            f"Während dein Kern auf **{nq_dom_de}** ausgerichtet ist, "
            f"zeigt deine Selbstauskunft die stärkste Abweichung im Bereich **{delta_de}**. "
            f"Das ist keine Inkonsistenz — es ist ein Hinweis auf aktive Entwicklung."
        )
        core_en = (
            f"Your birth chart and current answers reveal a productive complexity: "
            f"While your core orients toward **{nq_dom_en}**, "
            f"your self-report shows its strongest divergence in **{delta_en}**. "
            f"This isn't inconsistency — it's a sign of active development."
        )

    # Context summary: GCB
    gcb_dom_de, gcb_dom_en = _dominant_dim_label(gcb.baseline_vector.to_dict())
    context_de = (
        f"Du bist {gcb.generation_label_de} ({gcb.cohort_5y}) — "
        f"{gcb.baseline_explanation_de.split('.')[0]}. "
        f"Die kontextuelle Prägung deiner Lebensphase '{gcb.life_stage_label_de}' "
        f"legt einen Hintergrund von **{gcb_dom_de}** nahe. "
        f"[evidence_mode: {gcb.evidence_mode}]"
    )
    context_en = (
        f"You are {gcb.generation_label} ({gcb.cohort_5y}) — "
        f"{gcb.baseline_explanation_en.split('.')[0]}. "
        f"The contextual shaping of your life stage '{gcb.life_stage_label_en}' "
        f"suggests a background of **{gcb_dom_en}**. "
        f"[evidence_mode: {gcb.evidence_mode}]"
    )

    # Integration summary: all three + cross-reference
    master_dom_de, master_dom_en = _dominant_dim_label(master_vector)
    coherence_label_de = (
        "hoher Konsistenz" if cross_ref.coherence_score >= 0.75
        else "mittlerer Konsistenz" if cross_ref.coherence_score >= 0.50
        else "produktiver Spannung"
    )
    coherence_label_en = (
        "high coherence" if cross_ref.coherence_score >= 0.75
        else "moderate coherence" if cross_ref.coherence_score >= 0.50
        else "productive tension"
    )
    individuation_label_de = (
        "stark individuell" if cross_ref.individuation_score >= 0.6
        else "eigenständig" if cross_ref.individuation_score >= 0.3
        else "generationstypisch"
    )
    individuation_label_en = (
        "strongly individual" if cross_ref.individuation_score >= 0.6
        else "distinctly personal" if cross_ref.individuation_score >= 0.3
        else "generationally resonant"
    )

    integration_de = (
        f"Dein Master Signal zeigt eine Ausrichtung auf **{master_dom_de}** — "
        f"entstanden aus {coherence_label_de} zwischen deinem Geburtskern, "
        f"deiner aktuellen Selbstauskunft und dem Kontext deiner Generation. "
        f"Dein Profil ist {individuation_label_de} (Individuationsindex: {cross_ref.individuation_score:.0%})."
    )
    integration_en = (
        f"Your Master Signal points toward **{master_dom_en}** — "
        f"emerging from {coherence_label_en} between your birth core, "
        f"your current self-report, and your generational context. "
        f"Your profile is {individuation_label_en} (individuation index: {cross_ref.individuation_score:.0%})."
    )

    return NarrativeOutput(
        core_summary={        "de-DE": core_de,        "en-US": core_en},
        context_summary={     "de-DE": context_de,     "en-US": context_en},
        integration_summary={ "de-DE": integration_de, "en-US": integration_en},
    )


# ── Master Signal ──────────────────────────────────────────────────────────────

@dataclass
class MasterSignal:
    """
    The fully resolved Bazodiac Master Signal.

    Contains three clean signal layers + cross-reference results + narrative.
    """
    # Input signals (for transparency)
    natal_vector:  Dict[str, float]
    quiz_vector:   Dict[str, float]
    gcb_vector:    Dict[str, float]

    # Cross-reference results
    cross_reference: CrossReferenceResult

    # Fused output
    master_vector:   Dict[str, float]
    dominant_dimension: str

    # Fusion weights used
    weights_used: Dict[str, float]

    # Narratives
    narrative: NarrativeOutput

    # Transparency
    transparency_notes: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "master_vector":      self.master_vector,
            "dominant_dimension": self.dominant_dimension,
            "signals": {
                "natal": {
                    "vector": self.natal_vector,
                    "weight": self.weights_used.get("natal"),
                },
                "quiz": {
                    "vector": self.quiz_vector,
                    "weight": self.weights_used.get("quiz"),
                },
                "gcb": {
                    "vector": self.gcb_vector,
                    "weight": self.weights_used.get("gcb"),
                    "evidence_mode": "heuristic_v1",
                },
            },
            "cross_reference": {
                "natal_quiz_alignment": {
                    "score": self.cross_reference.natal_quiz_alignment.score,
                    "label": self.cross_reference.natal_quiz_alignment.label,
                },
                "natal_gcb_alignment": {
                    "score": self.cross_reference.natal_gcb_alignment.score,
                    "label": self.cross_reference.natal_gcb_alignment.label,
                },
                "quiz_gcb_alignment": {
                    "score": self.cross_reference.quiz_gcb_alignment.score,
                    "label": self.cross_reference.quiz_gcb_alignment.label,
                },
                "coherence_score":    self.cross_reference.coherence_score,
                "individuation_score": self.cross_reference.individuation_score,
                "alignment_narrative": self.cross_reference.alignment_narrative,
            },
            "narrative": {
                "core_summary":        self.narrative.core_summary,
                "context_summary":     self.narrative.context_summary,
                "integration_summary": self.narrative.integration_summary,
            },
            "transparency_notes": self.transparency_notes,
        }


def compute_master_signal(
    natal_input: NatalSignalInput,
    quiz_input: QuizSignalInput,
    gcb: GCBModel,
    weights: FusionWeights = DEFAULT_WEIGHTS,
) -> MasterSignal:
    """
    Full pipeline: three signals → cross-reference → fusion → narrative → MasterSignal.

    Args:
        natal_input: Normalized natal signal (from FuFirE projection)
        quiz_input:  Normalized quiz signal (from QuizzMe scoring)
        gcb:         GCBModel (from gcb_engine.derive_gcb)
        weights:     FusionWeights (defaults: N=0.35, Q=0.30, G=0.20, boost=0.15)

    Returns:
        MasterSignal — complete result with all sub-outputs and transparency data
    """
    weights.validate()

    natal_v = natal_input.vector
    quiz_v  = quiz_input.vector
    gcb_v   = gcb.baseline_vector.to_dict()

    # Validate input coverage
    transparency = []
    missing_natal = [k for k in DIM_KEYS if k not in natal_v]
    missing_quiz  = [k for k in DIM_KEYS if k not in quiz_v]
    if missing_natal:
        transparency.append(f"Natal signal missing dimensions: {missing_natal} — filled with 0")
        natal_v = {k: natal_v.get(k, 0.0) for k in DIM_KEYS}
    if missing_quiz:
        transparency.append(f"Quiz signal missing dimensions: {missing_quiz} — filled with 0")
        quiz_v = {k: quiz_v.get(k, 0.0) for k in DIM_KEYS}

    # GCB is always heuristic
    transparency.append(f"GCB evidence_mode: {gcb.evidence_mode} — not empirically validated")

    # Cross-reference
    cross_ref = compute_cross_reference(natal_v, quiz_v, gcb_v)

    # Fusion
    master_v = fuse_signals(natal_v, quiz_v, gcb_v, cross_ref, weights)
    dominant = max(master_v, key=master_v.get)

    # Narrative
    narrative = build_narrative(natal_input, quiz_input, gcb, master_v, cross_ref)

    # Effective weights (after alignment boost distribution)
    effective_weights = {
        "natal": weights.natal,
        "quiz":  weights.quiz,
        "gcb":   weights.gcb,
        "alignment_boost": weights.alignment_boost,
    }

    return MasterSignal(
        natal_vector=natal_v,
        quiz_vector=quiz_v,
        gcb_vector=gcb_v,
        cross_reference=cross_ref,
        master_vector=master_v,
        dominant_dimension=dominant,
        weights_used=effective_weights,
        narrative=narrative,
        transparency_notes=transparency,
    )
