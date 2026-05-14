# REQ-SEC-llm-gateway-hardening: LLM gateway rate-limits, sanitizes, and redacts

**Type**: Security

**Status**: Approved

**Priority**: Must-have

**Source**: [REQ-COMP-llm-purpose-consent](REQ-COMP-llm-purpose-consent.md)

**Source stakeholder**: [STK-ben](../stakeholders.md)

## Description

The LLM gateway (central call site for Gemini / FuFirE or any future provider, used by the Daily Pulse Engine and any future LLM-driven surface) hardens three attack surfaces: (i) rate-abuse via per-user limits, (ii) prompt injection via input escaping of user-controlled segments, (iii) log exposure via short-lived, access-controlled prompt logs. Baseline limit: ≤50 LLM calls / hour / user across all purposes combined. User-controlled inputs (birth-data fields, free-text if any) are escaped or templated into prompts using delimiters that the model is instructed to treat as data, not instructions. Logs containing user prompts are retained ≤7 days, access-restricted, and never moved to long-term storage.

## Acceptance Criteria

- Given an authenticated user issues >50 LLM-backed requests in a rolling 60-minute window, when the 51st arrives, then the gateway returns 429 to the caller (the Daily Pulse Engine surfaces this as a fallback per the degraded-state pattern).
- Given user-controlled input is incorporated into an LLM prompt, when the prompt is constructed, then the input is wrapped in delimiters and a system-level instruction tells the model to treat the wrapped content as data; raw concatenation is forbidden.
- Given LLM-call logs are written, when retention is applied, then logs older than 7 days are purged automatically and access to undeleted logs is restricted to Ben + on-call operators.
- Given an LLM call is logged, when audited, then the log contains a pseudonymous user identifier (consistent with [REQ-COMP-analytics-pii-free](REQ-COMP-analytics-pii-free.md)), not raw `user_id` or email.
- Given a prompt-injection regression-test suite, when run, then known-bad inputs (instruction overrides, embedded directives, system-prompt impersonation attempts) do not change the model's behavior beyond the templated purpose.

## Related Constraints

- [CON-gdpr-applies](../constraints/CON-gdpr-applies.md)
