# DEC-aphorism-batch-approval-bp-2026-05-14

**Status**: Active
**Date**: 2026-05-14
**Supersedes**: CON-aphorisms-human-approved (constraint)

## Trigger

When the operator (Ben) wants to add a batch of aphorisms to the production pool without flipping `status: draft → approved` for each file individually.

## Context

The original constraint `CON-aphorisms-human-approved` required Ben to manually edit each aphorism markdown file to flip `status: draft → approved`. This was rationally driven by the credibility and legal risks of mis-attribution (see CON-aphorisms-human-approved §Rationale).

In practice, the bottleneck became the per-file edit step, not the verification step itself. Ben verifies content before handing it to the agent (out of band — primary-source check, attribution review, rights review). The per-file `draft → approved` edit then adds friction without adding verification.

## Decision

Ben may grant **batch approval** by directing the agent to set `status: approved` for a specific, enumerated list of IDs in an implementation plan. The plan file is the approval artifact. The agent reads the plan, applies `status: approved` to exactly the enumerated IDs (no others), and the audit trail is the plan file + commit history.

## Enforcement

- The agent MAY set `status: approved` only for IDs explicitly listed in a plan that Ben authored or explicitly directed.
- The agent MAY NOT auto-flip any other aphorism's status.
- LLM-generated or LLM-proposed aphorisms still require explicit operator instruction; no implicit approval pathway exists.
- The plan's "approval scope" section MUST enumerate every ID in scope. Wildcard or pattern-based approval is prohibited.
- The `attribution_status` field must reflect the actual source quality (e.g., `apocryphal` for known misattributions), independent of the `status: approved` flip. Approving a file does not certify its attribution — it certifies that Ben accepts the file for inclusion in the daily-pulse pool as-labeled.

## Related Artifacts

- Supersedes: [CON-aphorisms-human-approved](../1-spec/constraints/CON-aphorisms-human-approved.md)
- Plan invoking this: [2026-05-14-aphorism-batch-extension-aph-0089-0121.md](../docs/plans/2026-05-14-aphorism-batch-extension-aph-0089-0121.md)
- Component: [tagespuls-package](../3-code/tagespuls-package/CLAUDE.component.md)
