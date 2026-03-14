# Partner Match Quiz — Iteration 3: PartnerMatchSeriesQuiz.tsx

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create the full PartnerMatchSeriesQuiz component adapted from KinkySeriesQuiz.

**Key diffs from Kinky:**
- Accent color: #9B3A6A / #C45B8F (rose/mauve instead of red)
- 3 quizzes (not 4), imports partner_match_01/02/03 JSON
- Uses partnerMatchSeriesQuizToEvent
- Profile structure: allies: string[], challenge: string (not compatibility object)
- Stats value: number (0.88) not string → render as percentage
- Icon: heart/resonance instead of fire
- Loading text: resonance-themed

**File:** `src/components/quizzes/PartnerMatch/PartnerMatchSeriesQuiz.tsx`
