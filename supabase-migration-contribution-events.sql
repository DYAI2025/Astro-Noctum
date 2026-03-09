create table if not exists public.contribution_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id),
  event_id text unique not null,
  module_id text not null,
  occurred_at timestamptz not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index idx_contribution_events_user_id on public.contribution_events(user_id);
create index idx_contribution_events_module_id on public.contribution_events(module_id);

-- Unique constraint for upsert (quiz retake replaces previous result)
CREATE UNIQUE INDEX IF NOT EXISTS uq_contribution_user_module
  ON public.contribution_events (user_id, module_id);

alter table public.contribution_events enable row level security;

create policy "users_read_own_events"
on public.contribution_events for select
to authenticated
using (user_id = auth.uid());

create policy "users_insert_own_events"
on public.contribution_events for insert
to authenticated
with check (user_id = auth.uid());

-- Delete own events (for quiz retake replacement)
create policy "users_delete_own_events"
on public.contribution_events for delete
to authenticated
using (user_id = auth.uid());

-- Anon-Insert: only allowed without user_id (prevents spoofing other users)
create policy "anon_insert_events"
on public.contribution_events for insert
to anon
with check (user_id IS NULL);

-- Update own events (required for upsert on quiz retake)
create policy "users_update_own_events"
on public.contribution_events for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
