# REQ-F-navigation-shell: Navigation Shell

**Type**: Functional

**Status**: Draft

**Priority**: Must-have

**Source**: [DEC-navigation-shell](../../2-design/decisions/DEC-navigation-shell.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## Description

The web app must have a single horizontal top navigation bar containing exactly three primary items (Astro-Agents, Planetarium, Signatur) and a Settings entry point. All utility actions (language switch, theme toggle, profile, subscription, logout, legal links, Sky app link) are accessible from Settings. The top bar must be fully functional on mobile-responsive web viewports — primary items must not be hidden or require a hamburger-only interaction to discover.

## Acceptance Criteria

- Given the web app is loaded, when the top navigation bar is rendered, then exactly three primary items are visible: Astro-Agents, Planetarium, Signatur
- Given the top bar is rendered, when a Settings entry point is present, then tapping/clicking it reveals all utility items: DE/EN switch, Dark/Bright mode, User Profile, Subscription, Logout, AGB, Datenschutz, sky.bazodiac.space link
- Given the app is on a mobile-responsive viewport, when the top bar is rendered, then all three primary items and the Settings entry point are visible without requiring a hamburger toggle or horizontal scroll
- Given the Settings menu is open, when the DE/EN switch is toggled, then the UI language switches accordingly without a full page reload
- Given the Settings menu is open, when the Dark/Bright mode is toggled, then the theme switches immediately using the existing theme token system
- Given the Settings menu is open, when Logout is tapped, then the user session is terminated and the user is navigated to the auth screen
- Given the Settings menu is open, when sky.bazodiac.space is tapped, then the link opens the Sky companion app in a new tab/window
- Given the top bar is rendered on any viewport size, when any primary item is tapped, then the touch/click target is ≥ 44px (per DEC-design-system-v2)

## Related Constraints

- [CON-dark-luxury-aesthetic](../constraints/CON-dark-luxury-aesthetic.md)
- [CON-mobile-first-readability](../constraints/CON-mobile-first-readability.md)

## Related Artifacts

- [REQ-F-depth-navigation](REQ-F-depth-navigation.md)
- [REQ-USA-wcag-contrast](REQ-USA-wcag-contrast.md)
