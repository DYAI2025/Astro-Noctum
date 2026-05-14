# REQ-SEC-auth-session-storage: Auth session tokens use Supabase defaults; localStorage requires recorded XSS-mitigation rationale

**Type**: Security

**Status**: Approved

**Priority**: Must-have

**Source**: [CON-gdpr-applies](../constraints/CON-gdpr-applies.md)

**Source stakeholder**: [STK-user-free](../stakeholders.md)

## Description

Authentication session tokens are managed by Supabase Auth using its default storage mechanism. The preferred default is httpOnly cookies for SSR contexts; where Supabase Auth defaults the SPA client to localStorage, the team accepts that default only when XSS-mitigation controls are in force: Content-Security-Policy with no `unsafe-inline` for scripts, no `dangerouslySetInnerHTML` calls without explicit sanitization (DOMPurify or equivalent), and dependency audits gating XSS-vector packages. The chosen storage mode is recorded as a `DEC-*` decision so the rationale and mitigations are auditable.

## Acceptance Criteria

- Given the deployed application is inspected, when the auth session is observed, then it is stored using Supabase Auth's documented default (httpOnly cookies preferred) and the storage choice is recorded in a `DEC-*` decision file.
- Given the CSP header, when reviewed, then `script-src` does not include `'unsafe-inline'` (or, if it does for a documented framework reason, the mitigation is recorded in the same `DEC-*`).
- Given the codebase is grepped for `dangerouslySetInnerHTML`, when found, then each occurrence has an adjacent sanitization call or an inline comment explaining why the input is provably safe.
- Given a dependency PR introduces a package with known XSS history, when reviewed, then the PR includes mitigation documentation or is rejected.
- Given the session token is observed by a malicious script injected via XSS in a test environment, when the test runs, then the XSS-mitigation controls block exfiltration (e.g., CSP report-only logs the violation, or httpOnly cookies prevent JS access).

## Related Constraints

- [CON-gdpr-applies](../constraints/CON-gdpr-applies.md)
