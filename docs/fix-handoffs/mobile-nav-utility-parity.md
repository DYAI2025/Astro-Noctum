# SDLC-fix Handoff: mobile-nav-utility-parity

## Summary
The web app mobile-responsive view and the native mobile app are missing utility actions that must be accessible per DEC-navigation-shell. The Settings menu (DE/EN switch, Dark/Bright, User Profile, Subscription, Logout, AGB, Datenschutz, sky.bazodiac.space link) must be reachable on all viewports without a hamburger-only hidden pattern.

## Observed Behavior
On narrow viewports and in the native mobile app, utility actions (language toggle, theme toggle, profile, subscription, logout, legal links, Sky link) are not consistently accessible.

## Expected Behavior
Per DEC-navigation-shell: the top bar must show 3 primary items (Astro-Agents, Planetarium, Signatur) and a Settings entry point on all viewport sizes. All utility items must be reachable within Settings within 2 taps. Touch targets ≥ 44px.

## Utility Items Required in Settings

| Item | Function |
|------|----------|
| DE / EN | Language toggle |
| Dark / Bright | Theme toggle |
| User Profile | Profile view / edit |
| Subscription | Premium status + upgrade / manage |
| Logout | Sign out |
| AGB | Terms of service (link) |
| Datenschutz | Privacy policy (link) |
| sky.bazodiac.space | External link (new tab) |

## Reproduction
1. Open the web app on a mobile viewport (< 640px wide)
2. Attempt to access language switch, theme toggle, account, or subscription
3. Confirm all items are discoverable without a hamburger-only interaction
4. Repeat on native mobile app (`apps/mobile/`)

## Suspected Area
- `src/` — top bar component, Settings menu (may not exist yet — needs creation)
- `apps/mobile/src/navigation/RootNavigator.tsx` — tab + stack navigation config
- `src/components/PremiumGate.tsx` / `src/hooks/usePremium.ts` — subscription entry point
- `src/contexts/LanguageContext.tsx` — language toggle wiring
- Theme toggle wiring — confirm dark/bright mode switch is exposed in Settings

## Linked Artifacts
- [REQ-F-navigation-shell](../../1-objectives/requirements/REQ-F-navigation-shell.md)
- [DEC-navigation-shell](../../2-design/decisions/DEC-navigation-shell.md)
- [REQ-USA-mobile-first-readability](../../1-objectives/requirements/REQ-USA-mobile-first-readability.md)
- [CON-mobile-first-readability](../../1-objectives/constraints/CON-mobile-first-readability.md)

## Notes
Track D — Priority: medium. The navigation architecture is now defined in DEC-navigation-shell — implement against that spec. Do not create a separate side nav or hamburger-only hidden pattern.
