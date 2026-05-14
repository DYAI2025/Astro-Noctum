# DEC-rtbf-grace-window-24h: Trail

> Companion to `DEC-rtbf-grace-window-24h.md`.
> AI agents read this only when evaluating whether the decision is still
> valid or when proposing a change or supersession.

## Alternatives considered

### Option A: 24 hours (chosen)

- Pros: gives users a sensible reversal window after a clicked-confirmation event; well within Art. 17 "without undue delay" expectation; easy to communicate in UI / email copy ("within 24 hours of confirming"); scheduler can run on a 5–60-minute cadence with acceptable precision.
- Cons: 24 hours of user-perceived limbo before the data is actually gone.

### Option B: Immediate (0 hours, no grace window)

- Pros: aligns most strictly with Art. 17 spirit; clearest user signal that "delete means delete".
- Cons: no protection against accidental confirmation; a misclicked confirmation link is unrecoverable; user trust may erode if a regretful user has no recourse.

### Option C: 7 days

- Pros: maximum reversal protection; matches the cancellation cadence of some adjacent services (e.g., GitHub).
- Cons: feels evasive of Art. 17 timing expectations; supervisory authority might scrutinize; user signal weakens ("did the delete actually take effect or not?").

## Reasoning

The two-factor confirmation flow (auth + email click) already filters out accidental triggers. The grace window is for *after-confirmation regret*, not for accidental clicks. 24 hours balances reversal protection (overnight buffer for "I shouldn't have done that") against Art. 17 promptness expectations.

The full Art. 17 30-day target window remains unchanged — the 24-hour grace fits inside it cleanly, leaving 29 days of execution-and-backup-propagation budget. The grace window is therefore not a relaxation of the regulatory clock; it is a contained user-protection feature within it.

Trade-off accepted: 24 hours of user-perceived uncertainty before deletion executes.

Invalidating conditions: a supervisory authority publishes guidance requiring shorter (e.g., immediate) action on Art. 17 requests; user feedback shows the 24-hour window causes confusion or regret rather than safety.

## Human involvement

**Type**: ai-proposed/human-approved

**Notes**: Ben approved during the Design completeness assessment follow-up on 2026-05-13. The 24-hour value was originally proposed during the REQ-SEC elicitation phase and accepted along with other rate-limit defaults; this decision formalizes it.

## Changelog

| Date | Change | Involvement |
|------|--------|-------------|
| 2026-05-13 | Initial decision | ai-proposed/human-approved |
