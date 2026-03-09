-- ⚠️  DESTRUCTIVE — Löscht ALLE User und deren Daten
-- Nur für Test/Dev verwenden, NIEMALS in Produktion!
-- Ausführen im Supabase Dashboard → SQL Editor

-- 1. App-Daten löschen (abhängig von auth.users via FK CASCADE)
TRUNCATE public.contribution_events;
TRUNCATE public.agent_conversations;
TRUNCATE public.natal_charts;
TRUNCATE public.birth_data;
TRUNCATE public.astro_profiles;
TRUNCATE public.profiles CASCADE;

-- 2. Auth-User löschen (Supabase interne Tabelle)
DELETE FROM auth.users;

-- Verify:
-- SELECT count(*) FROM auth.users;           -- should be 0
-- SELECT count(*) FROM public.profiles;      -- should be 0
-- SELECT count(*) FROM public.astro_profiles; -- should be 0
