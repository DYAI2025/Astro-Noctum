# Offene Punkte / Restfehler

## 1) Supabase-Anbindung fehlt vollständig
- Im aktuellen Repository existiert keine Supabase-Client-Initialisierung, kein Auth-Flow, keine Persistenz-Layer und keine Nutzung von Supabase-Tabellen in den Runtime-Pfaden.
- Das ist kein partieller Defekt, sondern eine fehlende Implementierung.

**Auswirkung:**
- Keine Speicherung von Onboarding-Daten, Charts oder Dashboard-Zuständen in einer Datenbank.
- Keine serverseitige Nachvollziehbarkeit oder Benutzerzustands-Persistenz.

**Empfohlene nachhaltige Lösung:**
1. `@supabase/supabase-js` integrieren und dedizierten `src/services/supabase.ts` Client aufbauen.
2. Datenmodell definieren (z. B. `profiles`, `birth_charts`, `interpretations`).
3. Onboarding-Submit persistent speichern und Dashboard-Ladevorgang auf DB + Cache umstellen.
4. Fehler- und Retry-Strategie für DB-Schreib-/Leseoperationen ergänzen.

## 2) Live-Verifikation des externen BAFE-Endpunktes in dieser Laufumgebung nicht möglich
- Ein direkter Laufzeit-Check gegen `https://bafe-production.up.railway.app` war aus der aktuellen Umgebung wegen Netzwerkfehler (`ENETUNREACH`) nicht möglich.
- Die Endpoint-Schema-Prüfung wurde daher statisch anhand der Request-Payloads im Code durchgeführt und korrigiert.

**Auswirkung:**
- Die konkrete Serverantwort (inkl. möglicher Schema-Änderungen auf Serverseite) konnte nicht gegen die aktuelle Produktion validiert werden.

**Empfohlene nachhaltige Lösung:**
1. CI-Contract-Tests gegen eine erreichbare Staging-Instanz ergänzen.
2. OpenAPI/JSON-Schema des BAFE-Backends versioniert einbinden und gegen Requests/Responses validieren.
