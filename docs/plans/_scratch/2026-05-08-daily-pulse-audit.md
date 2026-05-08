# Daily Pulse Placeholder Audit — Pre-fix Snapshot (2026-05-08)

> Read-only audit. Captures the *as-is* state of the placeholder problem before
> any code change. Sister-of plan `docs/plans/2026-05-08-dashboard-launch-blockers.md`,
> Phase 1, Task 1.1.

## TL;DR

Der "Platzhalter" ist **kein literal String** in `DailyChartHero.tsx`. Die Component ist
sauber: wenn `impulsText` leer ist, rendert sie nichts (`hasImpuls`-Gate). Der Platzhalter
sind die generischen Synthese-Texte aus **`buildFallbackDaily()` in `useFirstRunDaily.ts:77-110`**,
die im **catch-Block des Fetch-Effects (Zeile 209-218)** als `dailyData` gesetzt werden,
sobald der FuFirE-Fetch fehlschlägt. Die Texte fließen dann ohne Markierung durch
`dailyData.fusion.synthesis` in `Dashboard.tsx:385`'s `impulsText`-Prop und werden in
DailyChartHero gerendert, **als wären sie echte FuFirE-Antwort**.

## Zentrale Stellen

### 1. DailyChartHero ist sauber

`src/components/dashboard/DailyChartHero.tsx`

- Zeile 34: `loading: boolean;` — Prop existiert.
- Zeile 54: Kommentar im Code: *"preferred over rendering a meaningless placeholder"* — die Absicht ist seit Build-Zeit dokumentiert.
- Zeile 252: `if (loading) return <DailyChartHeroSkeleton />;` — Skeleton-Render bei loading.
- Zeile 263: `const hasImpuls = typeof impulsText === 'string' && impulsText.trim().length > 0;` — Gate.
- Zeile 396-454: ternary `{hasImpuls ? (echte Tagesimpuls-Card) : profileIncomplete ? (Profil-CTA) : null}`.

→ Wenn `impulsText` undefined/leer und nicht `profileIncomplete` → **gar kein Render**.

### 2. Der Fallback-Call ist im Hook

`src/hooks/useFirstRunDaily.ts`

- Zeile 77-110: `export function buildFallbackDaily(locale)` — die Fabrik. Liefert deterministische generische Texte:
  - DE pulse: *"Heute fließt deine Energie ruhig und gleichmäßig. Ein guter Tag, um innezuhalten und zu beobachten."*
  - DE trace: *"Die kosmischen Linien kreuzen sich heute — etwas bewegt sich. Sei aufmerksam für unerwartete Impulse."*
  - EN counterparts.
  - Returns `meta: { engine_version: 'v1-local-fallback' }` als Marker (wird aber nirgends im UI ausgewertet).
- Zeile 209-218: catch-Block:
  ```ts
  } catch (err) {
    console.warn('[useFirstRunDaily] Error occurred, using local fallback:', err);
    if (!cancelled) {
      const fallback = buildFallbackDaily();
      fallback.date = targetDate;
      setDailyData(fallback);
      // ...
    }
  }
  ```

→ Bei jedem Fetch-Fehler wird `dailyData` mit dem generischen Fallback gefüllt. UI weiß nichts davon.

### 3. Der Render-Pfad

`src/components/Dashboard.tsx:385`

```tsx
impulsText={dailyData?.fusion?.synthesis || dailyData?.fusion?.summary}
```

Genau eine Stelle in der gesamten Codebase, die `dailyData.fusion.synthesis` für den UI-Tagesimpuls nutzt. Wenn `dailyData` der Fallback ist, ist `synthesis` der generische DE-Text.

### 4. `useFirstRunDaily` wird auf Dashboard-Mount aufgerufen

`Dashboard.tsx:289-297`

```ts
const { dailyData, dayHarmonic, nightHarmonic, handleClose: handleDailyClose } = useFirstRunDaily(
  userId,
  profileMeta.birthInput,
  effectiveSoulprint,
  profileMeta.quizSectors,
  birthSign,
  skyMode === 'current' ? currentDate.toISOString().split('T')[0] : undefined,
  lang === 'en' ? 'en-US' : 'de-DE',
);
```

Der Hook returned `loading` (Interface Zeile 29) — Dashboard.tsx **destructured es nicht**. Stattdessen Zeile 377: `loading={(metaLoading || transitLoading) && impactHarmonyIndex == null}` — das ist `useActiveImpacts`-Loading, nicht das echte daily-pulse Loading.

## Cache-Key-Strategie (Stand jetzt)

`useFirstRunDaily.ts:38-44` — `todayKey()` returnt `YYYY-MM-DD` der **lokalen Kalenderdatum** (Mitternacht-Boundary). Es gibt **keinen** 06:00-Boundary. Cache ist 24h gebunden an Kalenderdatum.

→ Plan-Tasks 1.4-1.6 ersetzen das durch `dailyCacheKey()` mit 06:00-Boundary.

## Re-Fetch-Guard

`useFirstRunDaily.ts:126, 143-144` — `lastFetchedDateRef` verhindert, dass der gleiche Date-Key zweimal gefetched wird.

→ Plan-Task 1.8 muss `lastFetchedDateRef.current = null` setzen, wenn der 06:00-Listener feuert, sonst greift der Guard und der Re-Fetch wird unterdrückt.

## buildFallbackDaily — Test-Konsumenten (heads-up für Task 1.12)

`buildFallbackDaily` wird in zwei Test-Files direkt importiert + getestet:

- `src/__tests__/daily-fallback.test.ts` (Zeile 2, 4, 6, 13, 17, 23, 24, 31)
- `src/__tests__/daily-inline-rendering.test.ts` (Zeile 2, 12, 13, 35)

Plan-Task 1.12 entfernt nur die **catch-Block-Substitution** im Hook, behält aber den `buildFallbackDaily`-Export mit Deprecation-Hinweis. Diese Tests bleiben grün, weil sie die Funktion direkt aufrufen, nicht den Hook-Pfad.

## Was Phase 1 als Ganzes liefern muss

1. **Real-Fetch reliable on dashboard mount** (Tasks 1.2-1.3): Test, dass `fetchDailyExperience` einmal pro Mount mit komplettem Profil aufgerufen wird. Ist wahrscheinlich schon der Fall — Test wird Regression-Armor.
2. **06:00-Boundary für Cache + Auto-Refetch** (Tasks 1.4-1.8): neuen `dailyCacheKey()` einführen, Cache-Lookups auf den Key umstellen, Listener für 06:00-Crossing einbauen. Listener muss `lastFetchedDateRef.current = null` setzen.
3. **"Unavailable" State im UI** (Tasks 1.9-1.11): DailyChartHero kriegt einen dritten Branch in der Tagesimpuls-Section — `data-testid="daily-pulse-unavailable"` — der zeigt "Tagespuls heute nicht verfügbar — bitte neu laden", wenn `impulsText` leer ist und `profileIncomplete` false. Loading-Skeleton existiert bereits.
4. **Fallback-Substitution killen** (Task 1.12): catch-Block in `useFirstRunDaily` setzt `dailyData = null` statt `buildFallbackDaily()`. Damit greift der unavailable-Branch ab Zeile 3.
5. **Manueller Smoke-Test** (Task 1.13).

## Snapshot-Tests, die brechen können

- `daily-fallback.test.ts` und `daily-inline-rendering.test.ts` testen `buildFallbackDaily` direkt → **bleiben grün** (Funktion wird nicht entfernt).
- Snapshot-Tests von `DailyChartHero` könnten brechen, falls einer den unavailable-Branch durchläuft (vorher hätte er `null` gerendert, jetzt eine Section mit Text). Manuell prüfen, nicht auto-update.

## Status

Phase 1 / Task 1.1: **erledigt**. Audit ist Snapshot des Pre-fix-Zustands. Kein Code geändert.

**Nächster Schritt:** Task 1.2 — failing test schreiben, dass `fetchDailyExperience` auf Dashboard-Mount mit komplettem Profil getriggert wird.
