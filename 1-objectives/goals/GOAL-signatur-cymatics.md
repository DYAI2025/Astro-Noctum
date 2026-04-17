# GOAL-signatur-cymatics: Cymatics als neue Signatur-Visualisierung

**Description**: Die Signatur-Visualisierung soll durch eine mathematisch fundierte Cymatics/Chladni-Engine ersetzt oder ergänzt werden. Jedes Geburtshoroskop erzeugt eine einzigartige Chladni-Figur aus BaZi-Stammindizes (→ ganzzahlige Knotenlinien m,n) und dem Wu-Xing-Harmonie-Index (→ Amplitudenkoeffizienten α,β). Das Muster ist deterministisch, physikalisch plausibel und visuell einmalig pro Geburtsmoment — im Gegensatz zur aktuellen Spirograph-Engine, die über ein kontinuierliches Schwingungsmodell animiert wird. Die Cymatics-Figur ist kein generisches "schönes Muster", sondern eine mathematische Beschreibung der kosmischen Schwingungsstruktur eines Menschen.

**Status**: Approved

**Priority**: Must-have

**Source stakeholder**: [STK-product-owner](../stakeholders.md), [STK-end-user](../stakeholders.md)

## Hintergrund & Wissenschaft

### Hans Cousto — Kosmische Oktave (1978)
Hans Cousto berechnete, dass Planetenumlaufzeiten durch Oktavierung in den hörbaren/sichtbaren Frequenzbereich transponiert werden können. Venus schwingt bei 221,23 Hz, Mars bei 144,72 Hz — jeder Planet erzeugt geometrisch unterschiedliche Chladni-Muster, wenn er eine schwingende Membran anregt.

### Chladni-Figuren (1787)
Ernst F.F. Chladni zeigte: Sand auf einer schwingenden Metallplatte ordnet sich an den **Knotenlinien** — den Stellen minimaler Amplitude. Die Gleichung:

```
f(x,y) = α · sin(π·n·x) · sin(π·m·y) + β · sin(π·m·x) · sin(π·n·y)
```

Ganzahlige Parameter m,n erzeugen stabile Resonanzmuster. Verschiedene m,n → komplett verschiedene Geometrien.

### BaZi → Chladni-Mapping
Die Vier Säulen des BaZi enthalten 4 Himmlische Stämme (Stamm-Indizes 0..9). Ihre Kombination ergibt eine einzigartige `numeric_signature` pro Geburtsmoment, aus der m (2..6) und n (2..6) deterministisch abgeleitet werden. Der Wu-Xing-Harmonie-Index (0..1) bestimmt α und β.

**Ergebnis**: Jedes Geburtshoroskop → mathematisch einzigartiges Chladni-Muster → sichtbare Schwingungsidentität.

## Success Criteria

- [ ] Der Signatur-Screen zeigt eine animierte Chladni-Partikelkarte, bei der 16.000 Partikel stochastisch zu den Knotenlinien der geburtsspezifischen Gleichung wandern.
- [ ] Die Parameter m, n sind deterministisch aus den BaZi-Stammindizes des Nutzers abgeleitet — zwei verschiedene Geburtskarten produzieren mit statistisch hoher Wahrscheinlichkeit verschiedene Figuren.
- [ ] Die Farbe der Partikel reflektiert das dominante Wu-Xing-Element des Nutzers.
- [ ] Auf dem "Frequenzen"-Tab sind die Cousto-Frequenzen aller 10 Planeten mit ihrer Wu-Xing-Zuordnung und dem aktuellen Gewicht sichtbar.
- [ ] Wenn ein Quiz abgeschlossen und ein Cluster vervollständigt wird, morphen die Chladni-Parameter sanft (smooth interpolation, nicht abrupter Schnitt).
- [ ] Die Engine degradiert sauber zu einem CSS/SVG-Fallback ohne Fehlermeldung wenn Canvas2D nicht verfügbar ist.
- [ ] Die Cymatics-Engine ist hinter einem Feature-Flag (`signature_engine_cymatics`) schaltbar; bestehende V1/V2 bleiben erhalten.

## Related Artifacts

- Requirements: [REQ-F-signatur-cymatics](../requirements/REQ-F-signatur-cymatics.md)
- Decisions: [DEC-cymatics-renderer](../../2-design/decisions/DEC-cymatics-renderer.md)
- Source prototype: `Cymantics/` directory (parallel Bazodiac prototype)
- Existing engine: [DEC-dissonance-model](../../2-design/decisions/DEC-dissonance-model.md) (compatible — dissonance modulation layered on top)
- Data source: `apiData.bazi` (AppLayoutContext), `signalData.baseSignals` (useFusionSignal), `apiData.wuxing` (AppLayoutContext)
