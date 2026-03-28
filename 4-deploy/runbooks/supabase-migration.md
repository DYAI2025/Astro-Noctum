# Runbook: Supabase Migration

## Overview

Apply versioned SQL migrations to the Bazodiac Supabase project via the SQL Editor. Migrations are manual -- there is no automated runner. All migration files live in `supabase-migrations/` with the naming convention `YYYYMMDD_description.sql`.

## Prerequisites

- Supabase Dashboard access for the Bazodiac project
- Project URL: value of `VITE_SUPABASE_URL` in `.env.local`
- Service role key available (for migrations that reference `auth.users` or need elevated privileges)
- The migration SQL file committed to `supabase-migrations/`

## Pre-Migration Checklist

1. **Review the SQL file.** Read the full migration before pasting it anywhere. Confirm:
   - `IF NOT EXISTS` / `IF EXISTS` guards are present on all `CREATE TABLE`, `ALTER TABLE ADD COLUMN`, and `CREATE INDEX` statements.
   - RLS is enabled on every new table (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
   - At least one RLS policy exists for every new table (typically `auth.uid() = user_id`).
   - `ON DELETE CASCADE` is set on foreign keys referencing `auth.users(id)`.
   - Data-modifying statements (`UPDATE`, `DELETE`) have a `WHERE` clause.

2. **Check for destructive operations.** Flag any `DROP TABLE`, `DROP COLUMN`, `TRUNCATE`, or `ALTER TYPE` statements. These require extra care (see Rollback Patterns below).

3. **Back up affected tables.** In the SQL Editor, run:
   ```sql
   -- Example: back up profiles before altering it
   CREATE TABLE IF NOT EXISTS _backup_profiles_20260328 AS
     SELECT * FROM profiles;
   ```
   Adjust the table name and date. Delete the backup table after verifying the migration.

4. **Verify current schema state.** Confirm the migration has not already been applied:
   ```sql
   -- For ADD COLUMN migrations, check if column exists
   SELECT column_name FROM information_schema.columns
     WHERE table_name = 'profiles' AND column_name = 'new_column_name';

   -- For CREATE TABLE migrations, check if table exists
   SELECT tablename FROM pg_tables
     WHERE schemaname = 'public' AND tablename = 'new_table_name';
   ```

## Apply Migration Procedure

### Step 1: Open the SQL Editor

Navigate to your Supabase project dashboard > **SQL Editor** (left sidebar).

### Step 2: Paste the migration

Copy the full contents of the migration file from `supabase-migrations/YYYYMMDD_description.sql` and paste into the editor.

### Step 3: Run in a transaction (recommended)

Wrap the migration in a transaction so it rolls back atomically on error:

```sql
BEGIN;

-- <paste migration SQL here>

COMMIT;
```

If any statement fails, the entire migration is rolled back. You will see the error in the output panel.

### Step 4: Verify execution

The SQL Editor output should show `Success. No rows returned.` (for DDL) or the affected row count (for DML). If you see an error, the transaction has already rolled back -- fix the issue and re-run.

### Step 5: Record the migration

After successful execution, note the migration filename and date in the project log or commit message. There is no migrations table -- the source of truth is the `supabase-migrations/` directory combined with the live schema.

## Verify Migration

### Check table structure

```sql
-- List columns of a table
SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
  WHERE table_name = 'TABLE_NAME'
  ORDER BY ordinal_position;
```

### Check RLS policies

```sql
SELECT policyname, cmd, qual, with_check
  FROM pg_policies
  WHERE tablename = 'TABLE_NAME';
```

### Check indexes

```sql
SELECT indexname, indexdef
  FROM pg_indexes
  WHERE tablename = 'TABLE_NAME';
```

### Smoke test from the app

1. Start the dev server (`npm run dev`).
2. Trigger the feature that depends on the new schema.
3. Confirm no Supabase errors in the browser console or Network tab.

## Rollback Patterns

### Safe rollbacks (additive migrations)

Most Bazodiac migrations are additive (`ADD COLUMN`, `CREATE TABLE`). These are safe to reverse:

```sql
-- Drop a column added by mistake
ALTER TABLE profiles DROP COLUMN IF EXISTS new_column_name;

-- Drop a table added by mistake
DROP TABLE IF EXISTS new_table_name;

-- Drop an index
DROP INDEX IF EXISTS idx_name;

-- Drop an RLS policy
DROP POLICY IF EXISTS "policy_name" ON table_name;
```

### Unsafe rollbacks (data-modifying migrations)

If the migration included `UPDATE` or `DELETE` statements (e.g., `20260326_daily_modal_seen_date.sql` migrates boolean values to dates), restoring previous state requires the backup table:

```sql
-- Restore from backup
UPDATE profiles SET daily_modal_seen_date = NULL;
-- Or restore full rows from backup:
-- DELETE FROM profiles; INSERT INTO profiles SELECT * FROM _backup_profiles_20260328;
```

### When NOT to roll back

- The column is already being read/written by deployed code. Coordinate a code rollback first.
- Other migrations depend on the schema change. Roll back in reverse order.
- The table has live user data with no backup. Accept the change and fix forward.

## Naming Convention

```
supabase-migrations/YYYYMMDD_description.sql
```

- Date is the day the migration is authored (not applied).
- Description uses `snake_case`, describes the change concisely.
- Multiple migrations on the same day are allowed (they sort by filename).

Examples from the codebase:
- `20260316_experience_tables.sql` -- new tables + column additions
- `20260321_first_time_experience.sql` -- column additions to profiles
- `20260324_dissonance_state.sql` -- columns + index + comments on astro_profiles
- `20260324_stripe_subscription_columns.sql` -- columns + comments on profiles
- `20260326_daily_modal_seen_date.sql` -- column addition + data migration

## Common Pitfalls

**Missing RLS policy.** Every new table must have `ENABLE ROW LEVEL SECURITY` and at least one policy. Without a policy, RLS-enabled tables block all access from the client SDK (anon/authenticated roles). The standard pattern:

```sql
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own rows" ON new_table
    FOR ALL USING (auth.uid() = user_id);
```

**Forgetting `IF NOT EXISTS` / `IF EXISTS`.** Migrations may be re-run accidentally. All DDL should be idempotent. Use `ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`.

**Column default not set.** When adding a `NOT NULL` column to a table with existing rows, you must provide a `DEFAULT` value. Otherwise the `ALTER TABLE` fails.

```sql
-- Wrong: fails if profiles has rows
ALTER TABLE profiles ADD COLUMN language TEXT NOT NULL;

-- Right
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'de';
```

**Trigger conflicts.** Supabase auto-creates a trigger for `profiles` via the auth signup hook. If you create additional triggers on `profiles`, ensure they do not conflict (e.g., two `BEFORE INSERT` triggers racing on the same column).

**CHECK constraints on existing data.** Adding a `CHECK` constraint to a column with existing data that violates the constraint will fail. Migrate the data first, then add the constraint.

**RLS policy not updated after schema change.** If you add a new table that should be accessible only to authenticated users but reference a different column than `user_id`, update the policy's `USING` clause accordingly.

**JSONB column without default.** New JSONB columns should default to `'{}'::JSONB` or `'[]'::JSONB` rather than `NULL`, unless `NULL` has explicit semantic meaning (e.g., "not yet computed" vs. "empty").

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `relation "table" already exists` | Migration was already applied | Verify with `pg_tables` query; skip if schema matches |
| `column "x" of relation "y" already exists` | Column already added | Use `ADD COLUMN IF NOT EXISTS` |
| `new row violates row-level security` | Missing or wrong RLS policy | Check `pg_policies`; add/fix policy |
| `null value in column "x" violates not-null constraint` | Existing rows lack default for new NOT NULL column | Add a DEFAULT or backfill data first |
| `permission denied for table x` | Running as anon role instead of postgres | Use SQL Editor (runs as postgres), not the client SDK |
| App shows empty data after migration | RLS enabled but no SELECT policy | Add a SELECT or ALL policy for authenticated role |
