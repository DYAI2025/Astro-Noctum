-- One-time backfill: populate sun_sign and moon_sign from astro_json
-- for existing rows where these columns are NULL but the data exists in the JSON.
--
-- astro_json.western.zodiac_sign -> sun_sign (e.g. "Cancer")
-- astro_json.western.moon_sign   -> moon_sign (e.g. "Scorpio")
--
-- Safe to re-run: WHERE clauses ensure only NULL rows are touched.

UPDATE astro_profiles
SET sun_sign = astro_json->'western'->>'zodiac_sign'
WHERE sun_sign IS NULL
  AND astro_json->'western'->>'zodiac_sign' IS NOT NULL;

UPDATE astro_profiles
SET moon_sign = astro_json->'western'->>'moon_sign'
WHERE moon_sign IS NULL
  AND astro_json->'western'->>'moon_sign' IS NOT NULL;
