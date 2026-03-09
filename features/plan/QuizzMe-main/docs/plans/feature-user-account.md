# Feature: User Account System

## Übersicht

Implementierung eines Email-basierten Benutzerkonto-Systems, das es Nutzern ermöglicht, sich anzumelden und ihre Quiz-Ergebnisse dauerhaft zu speichern.

---

## Anforderungen

### Authentifizierung

- [ ] Email-basierte Anmeldung (Magic Link oder Passwort)
- [ ] Supabase Auth Integration
- [ ] Session-Management mit SSR-Support
- [ ] Logout-Funktionalität

### Benutzerfluss

- [ ] Registrierung mit Email-Verifizierung
- [ ] Login-Seite (`/auth/login`)
- [ ] Registrierungs-Seite (`/auth/register`)
- [ ] Passwort-Zurücksetzen (`/auth/reset-password`)
- [ ] Nach Login: Redirect zur Profil-Seite (`/character`)

### Privates Benutzerprofil

- [ ] Jeder User erhält eigenen privaten Account
- [ ] Profil-Daten werden in Supabase gespeichert
- [ ] RLS-Policies für Datenschutz (nur eigene Daten sichtbar)

### Quiz-Speicherung

- [ ] Nicht angemeldete Nutzer können Quizze durchführen (Ergebnis nur temporär)
- [ ] Angemeldete Nutzer: Quiz-Ergebnis wird im Profil gespeichert
- [ ] Hinweis bei Quiz-Ende: "Melde dich an, um dein Ergebnis zu speichern"

---

## Technische Umsetzung

### Neue Dateien

```
src/
├── app/
│   └── auth/
│       ├── login/page.tsx
│       ├── register/page.tsx
│       ├── reset-password/page.tsx
│       └── callback/route.ts
├── components/
│   └── auth/
│       ├── LoginForm.tsx
│       ├── RegisterForm.tsx
│       └── AuthGuard.tsx
└── lib/
    └── auth/
        ├── client.ts
        └── middleware.ts
```

### Supabase-Schema

```sql
-- Users table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);
```

### API-Endpunkte

- `POST /api/auth/register` – Registrierung
- `POST /api/auth/login` – Login
- `POST /api/auth/logout` – Logout
- `GET /api/auth/session` – Session prüfen

---

## Akzeptanzkriterien

1. User kann sich mit Email registrieren
2. User kann sich einloggen und wird zur Profil-Seite weitergeleitet
3. Quiz-Ergebnisse werden nur für eingeloggte User gespeichert
4. Nicht-eingeloggte User sehen Hinweis zur Anmeldung
5. Session bleibt über Browser-Reload erhalten

---

## Abhängigkeiten

- Supabase Auth
- `@supabase/ssr`

## Priorität

**Hoch** – Grundlage für alle personalisierten Features

## Geschätzter Aufwand

3-5 Tage
