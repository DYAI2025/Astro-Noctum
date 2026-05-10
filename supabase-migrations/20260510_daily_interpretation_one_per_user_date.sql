-- Tagespuls: enforce one interpretation decision per user/Kalendertag.
--
-- PR #336 review follow-up: the application pre-check scans all pulse ids
-- for a date, but two concurrent locale-switch requests can both observe no
-- row and then insert against different daily_pulse_id values. A UNIQUE
-- (daily_pulse_id) backstop does not catch that race because daily_pulses are
-- keyed by (user_id, date, locale). This migration adds write-time scope
-- columns populated from daily_pulses and an atomic UNIQUE (user_id, pulse_date)
-- constraint so the database enforces "first decision wins per Kalendertag".

ALTER TABLE daily_interpretations
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS pulse_date DATE;

CREATE OR REPLACE FUNCTION set_daily_interpretation_scope()
RETURNS TRIGGER AS $$
BEGIN
  SELECT dp.user_id, dp.date
    INTO NEW.user_id, NEW.pulse_date
  FROM daily_pulses dp
  WHERE dp.id = NEW.daily_pulse_id;

  IF NEW.user_id IS NULL OR NEW.pulse_date IS NULL THEN
    RAISE EXCEPTION 'daily_pulse_id % does not exist', NEW.daily_pulse_id
      USING ERRCODE = '23503';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_daily_interpretations_scope ON daily_interpretations;
CREATE TRIGGER trg_daily_interpretations_scope
  BEFORE INSERT OR UPDATE OF daily_pulse_id ON daily_interpretations
  FOR EACH ROW
  EXECUTE FUNCTION set_daily_interpretation_scope();

UPDATE daily_interpretations di
SET user_id = dp.user_id,
    pulse_date = dp.date
FROM daily_pulses dp
WHERE dp.id = di.daily_pulse_id
  AND (di.user_id IS NULL OR di.pulse_date IS NULL);

-- If the locale loophole already produced multiple rows for one user/date,
-- keep the earliest decision and delete later siblings before adding the
-- one-per-day constraint. This matches the server's "first decision wins"
-- ordering and prevents the migration from failing on historical data.
WITH ranked AS (
  SELECT
    di.id,
    row_number() OVER (
      PARTITION BY di.user_id, di.pulse_date
      ORDER BY di.created_at ASC, di.id ASC
    ) AS rn
  FROM daily_interpretations di
)
DELETE FROM daily_interpretations di
USING ranked r
WHERE di.id = r.id
  AND r.rn > 1;

ALTER TABLE daily_interpretations
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN pulse_date SET NOT NULL;

-- Keep the per-pulse uniqueness as a narrower invariant, but add the real
-- date-scoped backstop needed for locale-switch concurrency.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'daily_interpretations'::regclass
      AND conname = 'daily_interpretations_one_per_user_date'
  ) THEN
    ALTER TABLE daily_interpretations
      ADD CONSTRAINT daily_interpretations_one_per_user_date UNIQUE (user_id, pulse_date);
  END IF;
END $$;
