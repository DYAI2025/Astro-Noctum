Entwicklungsauftrag: Login + Horoskop-Onboarding + AstroSheet Initialisierung (Supabase + Cosmic Engine 3.5)
0) Zielbild in einem Satz
Ein User meldet sich mit E-Mail an → Supabase legt ein User-Profil an → User gibt Geburtsdaten + Ort ein → klickt „Horoskop berechnen“ → Daten werden in Supabase gespeichert → Cosmic Engine 3.5 berechnet → Ergebnis wird gespeichert → AstroSheet zeigt initiale Daten (West: Sonne/Mond/AC/Häuser + China: Jahrzeichen etc.).

1) UX Flow (klickbar, ganz konkret)
Screen A: /login
User tippt E-Mail ein.

Klick „Link schicken“.

User öffnet Mail, klickt Magic Link.

Redirect zurück zur App (z.B. /auth/callback), Session ist aktiv.

Ergebnis: User ist authentifiziert (Supabase auth.users).

Screen B: /onboarding/astro
UI Felder (minimal, aber vollständig):

Geburtsdatum (Date Picker)

Geburtszeit (Time Picker)

Geburtsort (Search + Auswahl, z.B. „Berlin“)

Nach Auswahl werden lat/lon + IANA Timezone automatisch gesetzt (ohne User-Fragen)

Button: „Horoskop berechnen“

Beim Klick:

App speichert Birth-Input in Supabase astro_profiles (Upsert).

App ruft Compute auf (POST /api/astro/compute oder Edge Function).

Bei Erfolg: Redirect zu /astrosheet.

AstroSheet lädt astro_profiles.astro_json + Anchors (sunSign/moonSign/asc/houses + chinese) und zeigt sie an.

Screen C: /astrosheet (Dashboard)
Zeigt sofort:

Westlich: Sonne/Mond/AC + Häuser

Chinesisch: Jahreszeichen/Element/YinYang (optional später: BaZi Säulen)

Wenn Compute läuft: Spinner + Status

Wenn Compute fail-closed: klare Message + „Zurück zur Eingabe“

2) Was triggert was? (System-Trigger & Reihenfolge)
2.1 Trigger 1: User wird angelegt (Supabase Auth)
Auslöser: User klickt Magic Link, Session entsteht → Supabase auth.users existiert.

DB Trigger (Postgres)

AFTER INSERT ON auth.users → erzeugt einen Eintrag in profiles (User-Profil Tabelle).

Warum: Das ist euer „Supabase User-Profile“-Trigger.

Wichtig: astro_profiles wird nicht beim User-Creation-Trigger angelegt, weil dort Pflichtfelder fehlen würden. astro_profiles wird erst im Onboarding geschrieben.

2.2 Trigger 2: Horoskopdaten werden gespeichert (Onboarding)
Auslöser: User klickt „Horoskop berechnen“.

Aktion: upsert in astro_profiles:

user_id = auth.uid()

birth_date, birth_time_local, birth_lat, birth_lng, iana_time_zone

input_status = "ready"

2.3 Trigger 3: Berechnung
Auslöser: nach erfolgreichem Upsert → Compute call.

Aktion: Cosmic Engine 3.5 rechnet und schreibt zurück:

astro_compute_hash (idempotent)

astro_computed_at

astro_validation_status (ok|warn|error)

astro_json (jsonb: komplette strukturierte Ausgabe)

astro_meta_json (engine/meta)

sun_sign, moon_sign, asc_sign (Anchors für UI/Check)

3) Supabase Datenbank: Tabellen & Policies
3.1 Tabelle profiles (neu oder prüfen)
Zweck: Minimal-Profil nach Login (rein für “User existiert sauber” + evtl. Flags)

Schema (Vorschlag)

id uuid primary key references auth.users(id) on delete cascade

email text

created_at timestamptz default now()

onboarding_status text default 'new' (optional: new|astro_pending|astro_done)

RLS

USING (auth.uid() = id)

DB Trigger

handle_new_user() → Insert in profiles.

3.2 Tabelle astro_profiles (bestehend, erweitern falls nötig)
Zweck: 1:1 “Birth Input + Computed Output” pro User.

Pflichtfelder (für robusten Flow)

user_id uuid pk references auth.users(id)

birth_date date not null

birth_time_local time not null

birth_lat double precision not null

birth_lng double precision not null

iana_time_zone text not null

Zusätzliche Felder (empfohlen)

input_status text not null default 'ready' (ready|computing|computed|error)

fold smallint null (nur bei DST-Ambiguität nötig)

astro_compute_hash text

astro_computed_at timestamptz

astro_validation_status text (ok|warn|error)

astro_json jsonb

astro_meta_json jsonb

astro_validation_json jsonb

sun_sign text, moon_sign text, asc_sign text

RLS

Read/Write nur eigener User:

USING (auth.uid() = user_id)

WITH CHECK (auth.uid() = user_id)

4) Backend: Empfohlene Implementationsvariante (robust + simpel)
Ihr habt 2 saubere Varianten. Ich empfehle B, wenn ihr das Frontend statisch hosten wollt; sonst A.

Variante A (wenn Next als Server läuft): Next Route Handler
Frontend call: POST /api/astro/compute

Der Handler:

prüft Session (supabase.auth.getUser())

lädt astro_profiles

berechnet (Cosmic Engine 3.5)

schreibt Ergebnis zurück

liefert JSON an Frontend zurück

Pro: sehr einfach im Repo zu entwickeln
Contra: braucht Server-Deployment

Variante B (empfohlen bei Static Hosting): Supabase Edge Function + optional Compute Service
Frontend call: POST https://<supabase>/functions/v1/astro-compute

Edge Function:

validiert JWT (User ist eindeutig)

liest astro_profiles

ruft Compute (Cosmic Engine 3.5) entweder:

direkt, wenn engine kompatibel ist,

oder via internen HTTP-Service (Compute Container)

schreibt Ergebnis zurück in Supabase

liefert Response

Pro: Frontend kann statisch bleiben, sauberer “Backend of record”
Contra: Engine muss in Edge/Service verfügbar sein

5) Exakte API Steps (Developer-Checklist)
Step 1 — Login: Magic Link
Client (Login Page)

supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: "<app>/auth/callback" } })

Callback Route

liest auth code/session

setzt Cookies (Supabase SSR helper)

redirect → /onboarding/astro (wenn kein astro_profiles existiert) sonst /astrosheet

Step 2 — Onboarding Save: astro_profiles upsert
Client

Ort wird gewählt → App hat:

lat/lon

iana_time_zone (automatisch)

schreibt:

birth_date

birth_time_local

birth_lat/birth_lng

iana_time_zone

DB

upsert astro_profiles (user_id=auth.uid())

Step 3 — Compute: Horoskop berechnen
Client

POST compute (A: Next API, B: Edge Function)

Body: { "force": false } (optional)

Backend Compute

SELECT astro_profiles WHERE user_id=auth.uid()

Input validieren (alle Pflichtfelder)

Zeitzonen-/DST-Offset automatisch bestimmen:

anhand iana_time_zone + Datum + Uhrzeit

keine userseitige DST-Frage im Normalfall

Sonderfall: DST ambige Zeit (kommt nur beim Zurückstellen vor)

Backend erkennt Ambiguität → Response 409 AMBIGUOUS_LOCAL_TIME mit 2 Optionen

UI zeigt 2 Buttons:

„Vor Zeitumstellung“

„Nach Zeitumstellung“

User klickt eins → speichert fold → Compute erneut

(Das ist die einzige Stelle, wo man den User wirklich braucht – selten, aber robust.)

Cosmic Engine 3.5 compute

UPDATE astro_profiles SET astro_json, astro_meta_json, astro_validation_json, anchors…

Step 4 — AstroSheet Rendering
Client

SELECT astro_profiles (oder call GET /api/astro/profile)

UI mappt:

sun_sign, moon_sign, asc_sign, houses + chinese

Wenn astro_validation_status != ok:

zeigt „Daten prüfen“ + führt zurück zu Onboarding

6) Konkrete Akzeptanzkriterien (Definition of Done)
Login
 User kann per Email Magic Link einloggen

 Nach Login existiert profiles row automatisch

 RLS verhindert Zugriff auf fremde Daten

Onboarding
 Onboarding speichert astro_profiles vollständig (date/time/lat/lon/iana)

 Kein User muss “Sommerzeit” verstehen oder angeben

Compute
 Klick „Horoskop berechnen“ führt in <N Sekunden zur Anzeige im AstroSheet

 Ergebnis ist in astro_profiles.astro_json persistiert

 Anchors (sun_sign, asc_sign, chinese_year) sind gesetzt

 Ambige DST-Zeit führt nicht zu falschen Ergebnissen, sondern zu 409 + UI-Auswahl

Dashboard
 AstroSheet zeigt initial: West + China Werte

 Re-Login lädt Daten aus Supabase erneut ohne Neuberechnung (via computeHash / cached)

7) Testplan (minimal, aber praxisnah)
Normalfall: 1991-02-04 09:42, Paris → Compute ok, AstroSheet zeigt Werte.

DST Start (nicht existent): lokale Zeit im “Sprung” (z.B. 02:30 am DST-start) → 422 NONEXISTENT_LOCAL_TIME → UI bittet um neue Zeit.

DST End (ambig): lokale Zeit, die doppelt vorkommt → 409 → UI fold Auswahl → ok.

Fehlende Daten: keine Uhrzeit → Button disabled + server 422 falls doch.

Security: User A darf nicht astro_profiles von User B lesen.

8) Wichtiges Korrektiv zur Sommerzeit-Aussage (ohne User zu belasten)
„Ab 1980 = Sommerzeit“ ist nicht korrekt genug, weil Sommerzeit nicht das ganze Jahr gilt und die Regeln historisch variieren.
Damit es robust und ohne User-Fragen funktioniert, nehmt ihr IANA Timezone + Datum + Uhrzeit und berechnet daraus automatisch Offset/DST. Das ist genau das, was die Timezone-Datenbank zuverlässig kann.

(Und nur im seltenen Ambiguitäts-Fall fragt ihr minimalistisch nach “vor/nach Umstellung”.)