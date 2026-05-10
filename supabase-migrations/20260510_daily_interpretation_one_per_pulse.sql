-- Tagespuls: enforce one decision per daily_pulse_id at the DB layer.
-- Per 2026-05-09 product audit C-3 — spec says "Es geht nur einmal am Tag".
-- Application-level pre-check (server.mjs) returns 409 ALREADY_DECIDED;
-- this constraint backs it up at the DB layer so concurrent inserts
-- can't slip past the check.

-- Drop the previous 3-column unique constraint (named explicitly in
-- 20260509_tagespuls_tables.sql as
-- daily_interpretations_unique_pulse_archetype_locale).
ALTER TABLE daily_interpretations
  DROP CONSTRAINT IF EXISTS daily_interpretations_unique_pulse_archetype_locale;

-- Defensive: also drop any auto-named 3-column UNIQUE that might exist
-- from earlier migrations / manual edits.
DO $$
DECLARE
  old_constraint text;
BEGIN
  SELECT conname INTO old_constraint
  FROM pg_constraint
  WHERE conrelid = 'daily_interpretations'::regclass
    AND contype = 'u'
    AND array_length(conkey, 1) = 3;

  IF old_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE daily_interpretations DROP CONSTRAINT %I', old_constraint);
  END IF;
END $$;

-- Existing installs may already have multiple interpretations for one pulse
-- because the old rule only prevented duplicate (pulse, archetype, locale)
-- triples. Keep the earliest recorded decision for each daily_pulse_id and
-- remove later picks before adding the stricter one-row-per-pulse constraint.
WITH ranked_interpretations AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY daily_pulse_id
      ORDER BY created_at ASC, id ASC
    ) AS decision_rank
  FROM daily_interpretations
)
DELETE FROM daily_interpretations AS daily_interpretation
USING ranked_interpretations
WHERE daily_interpretation.id = ranked_interpretations.id
  AND ranked_interpretations.decision_rank > 1;

-- Add the new constraint: at most one interpretation per daily_pulse_id.
ALTER TABLE daily_interpretations
  ADD CONSTRAINT daily_interpretations_one_per_pulse UNIQUE (daily_pulse_id);
