# SDLC-fix Handoff: birthform-inline-validation

## Summary
`BirthForm.tsx` uses `alert()` calls for validation errors, producing browser-native modal dialogs that break the dark luxury aesthetic, are inaccessible, and interrupt flow. Validation errors must be shown inline at the field level.

## Observed Behavior
When a user submits the birth data form with invalid or missing input, a browser-native `alert()` dialog appears. The dialog is visually disconnected from the form, cannot be styled, and produces a hard flow interruption that degrades the onboarding experience.

## Expected Behavior
Validation errors must appear inline directly below the relevant form field. Each field with an error shows a concise German-language error message styled according to the design system (no alert dialogs). The submit button may optionally disable until the form is valid.

## Reproduction
1. Open `/onboarding` (or `BirthForm`)
2. Leave required fields empty or enter invalid data
3. Submit the form
4. Observe browser-native `alert()` dialog instead of inline field errors

## Suspected Area
- `src/components/BirthForm.tsx` — validation logic and `alert()` calls

## Linked Artifacts
- [CON-dark-luxury-aesthetic](../../1-objectives/constraints/CON-dark-luxury-aesthetic.md)
- [REQ-F-cosmic-encounter-onboarding](../../1-objectives/requirements/REQ-F-cosmic-encounter-onboarding.md)
- [REQ-USA-mobile-first-readability](../../1-objectives/requirements/REQ-USA-mobile-first-readability.md)

## Notes
Track A — Priority: fix before any onboarding design polish work. Inline errors should be visible and styled, not just hidden `aria-` attributes. German error copy required. Do not introduce a form library unless the change is minimal — a simple `errors` state object per field is sufficient.
