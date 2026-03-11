# Partner Match Quiz — Iteration 2: Quiz JSON Files

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create all 3 quiz JSON files with full bilingual content (9 questions × 4 options, 3 profiles each).

**Architecture:** Mirror kinky_quiz_0N.json schema exactly. All 3 quizzes share the same cluster_domain_map and cluster_keyword_map (passion→love/passionate, stability→emotion/anchor, future→freedom/growth). Scoring templates are the same per quiz — the axis_key changes per quiz (closeness, alignment, tension).

**Tech Stack:** JSON schema 3.0.0, quizzme-quiz-engine, output_mode full_v2

---

## Task 1: partner_match_01_chemie_ausdruck.json
File: `src/components/quizzes/PartnerMatch/partner_match_01_chemie_ausdruck.json`
- types: spark_seeker, soft_magnet, playful_current
- axis_key: closeness

## Task 2: partner_match_02_alltag_eigenarten.json
File: `src/components/quizzes/PartnerMatch/partner_match_02_alltag_eigenarten.json`
- types: ritual_keeper, easy_cozy, reliable_teammate
- axis_key: alignment

## Task 3: partner_match_03_vorlieben_lebensstil.json
File: `src/components/quizzes/PartnerMatch/partner_match_03_vorlieben_lebensstil.json`
- types: adventure_companion, curious_builder, vision_match
- axis_key: tension
- series_complete: true

## Verification
Run: `npx tsc --noEmit 2>&1 | head -5`
Expected: same pre-existing PixiFuRing error only
