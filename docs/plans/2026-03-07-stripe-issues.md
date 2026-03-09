# Stripe Integration — Known Issues

**Stand:** 2026-03-07
**Status:** Dokumentiert, Fix #1 implementiert, Rest offen für Tester-Phase

---

## Issue 1: Kein Stripe Customer Reuse (FIXED)

**Severity:** Medium — Stripe Dashboard Clutter, keine Kundenhistorie
**Datei:** `server.mjs` → `/api/checkout`

**Problem:** Jeder Checkout-Klick erstellt über `customer_email` einen neuen Stripe-Customer. Wenn ein User abbricht und erneut klickt, entstehen Duplikate. Der gespeicherte `stripe_customer_id` in `profiles` wird nie wiederverwendet.

**Fix:** Vor dem Checkout prüfen ob `profiles.stripe_customer_id` existiert. Wenn ja, diesen Customer wiederverwenden. Wenn nein, Stripe Customer explizit erstellen und ID sofort in DB speichern.

---

## Issue 2: Kein Auth auf `/api/checkout` Endpoint

**Severity:** Hoch — Session-Spoofing möglich
**Datei:** `server.mjs` → `/api/checkout`
**Status:** Offen — Fix in Tester-Phase

**Problem:** `/api/checkout` prüft nicht ob der Anfragende wirklich der User ist. Jeder kann `POST /api/checkout` mit einer beliebigen `userId` senden. Kein realistisches Angriffsszenario (warum für andere zahlen?), aber unsauber.

**Geplanter Fix:** Supabase JWT aus Authorization-Header verifizieren. User-ID aus dem Token extrahieren statt aus dem Request Body.

```javascript
// Pseudocode:
const { data: { user }, error } = await supabaseServer.auth.getUser(token);
if (error || !user) return res.status(401).json({ error: "Unauthorized" });
// userId = user.id statt req.body.userId
```

---

## Issue 3: Abgebrochene Checkouts werden nicht getrackt

**Severity:** Niedrig — kein Bug, verpasste Analytics
**Datei:** `server.mjs` → Webhook Handler
**Status:** Offen — Fix in Tester-Phase

**Problem:** Nur `checkout.session.completed` wird behandelt. `checkout.session.expired` wird ignoriert. Kein Tracking von "fast gekauft"-Usern.

**Geplanter Fix:** `checkout.session.expired` Event handlen, Analytics-Event loggen.

---

## Issue 4: Kein Feedback bei Checkout-Fehler

**Severity:** Niedrig — UX
**Datei:** `src/components/PremiumGate.tsx`
**Status:** Offen — Fix in Tester-Phase

**Problem:** Wenn `/api/checkout` fehlschlägt, wird der Button nur zurückgesetzt. Keine Fehlermeldung für den User.

**Geplanter Fix:** Error-State + Toast/Inline-Meldung: "Zahlung konnte nicht gestartet werden. Bitte versuche es erneut."
