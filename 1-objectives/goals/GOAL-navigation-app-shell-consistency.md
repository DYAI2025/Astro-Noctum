# GOAL-navigation-app-shell-consistency: Navigation & App-Shell Konsistenz

**Description**: Die App-Shell (Header-Navigation, Mode-Toggle, Routing) soll auf jeder Seite klar, konsistent und selbsterklärend sein. Der User muss jederzeit wissen wo er ist, wie er zum Dashboard kommt, und was jeder Button tut. Der Planetarium-Mode-Toggle darf nicht mit Navigation verwechselt werden. Die aktive Route muss visuell hervorgehoben sein.

**Status**: Draft

**Priority**: Must-have

**Source stakeholder**: [STK-end-user](../stakeholders.md), [STK-product-owner](../stakeholders.md)

## Success Criteria

- [ ] Jede Seite zeigt einen klaren "Dashboard"/"Tageschart" Link der zuverlässig zu `/` navigiert.
- [ ] Der aktive Nav-Tab ist visuell hervorgehoben und nicht klickbar wenn man sich bereits auf der Seite befindet.
- [ ] Der Mode-Toggle (Planetarium/Solar System) ist klar als Theme-Wechsel erkennbar, nicht als Navigations-Link.
- [ ] Mode-Toggle im Settings-Menü: Icons allein (Moon/Sun) ohne redundanten Text.
- [ ] Astro-Agents Nav-Button zeigt beide Agents (Levi + Eve), nicht nur einen.
- [ ] Navigation ist auf allen Seiten identisch in Struktur und Verhalten (Dashboard, Signatur, Sky, Wu-Xing, Wissen).

## Related Artifacts

- Constraints: [CON-mobile-first-readability](../constraints/CON-mobile-first-readability.md)
- QA Findings: QA-6, QA-16, QA-19, QA-20, QA-21, QA-22
