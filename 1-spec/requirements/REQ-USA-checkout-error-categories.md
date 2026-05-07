# REQ-USA-checkout-error-categories: Checkout failure paths show distinct user messages per error class

**Type**: Usability

**Status**: Approved

**Priority**: Must-have

**Source**: [GOAL-clean-upgrade-funnel](../goals/GOAL-clean-upgrade-funnel.md)

**Source stakeholder**: [STK-ben](../stakeholders.md)

## Description

When a `POST /api/checkout` request fails or returns an unusable response, the user must see a distinct, actionable error message per error class. Generic failure copy ("Something went wrong") is not acceptable — it leaves the user without a recovery path and erodes trust at the moment of conversion. The error classes and their canonical user-facing copy (German baseline, English equivalents permitted):

| Error class | Trigger | User-facing copy (DE) |
|------------|---------|------------------------|
| Not logged in | Local check before request | „Bitte zuerst anmelden." |
| 401 / no token | HTTP 401 response | „Sitzung abgelaufen. Bitte neu anmelden." |
| 403 | HTTP 403 response | „Kein Zugriff. Wende dich an den Support." |
| 503 / Stripe env missing | HTTP 503 or Stripe configuration error | „Zahlung derzeit nicht verfügbar. Versuche es später." |
| 200 without url | HTTP 200, body missing `url` | „Unerwartete Antwort. Bitte Seite neu laden." |
| Network error | Fetch rejection, no HTTP status | „Verbindungsproblem. Bitte Netzwerk prüfen." |

Each error path also fires a non-blocking analytics event `checkout_failed` with an `error_type` property identifying the class.

## Acceptance Criteria

- Given each error class above is triggered (in unit/integration tests), when the error handler runs, then the corresponding user-facing copy is displayed and the button is re-enabled.
- Given the locale is English, when the error renders, then the English equivalent copy is used (translations defined alongside the German baseline).
- Given any error class fires, when the analytics event is observed, then `checkout_failed` is dispatched with `error_type` matching the class, fire-and-forget (no blocking on analytics).
- Given the error message is shown, when the user reads it, then it tells them what went wrong (cause) and what to do next (action) — generic "error" / "failed" copy is forbidden.
- Tests cover all six error classes.
