-- Diary Records Supabase schema
-- Run this in Supabase SQL Editor after enabling Auth email/password.

create table if not exists public.diary_entries (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.diary_entries enable row level security;

create policy "Users can read their own diary entries"
on public.diary_entries
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own diary entries"
on public.diary_entries
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own diary entries"
on public.diary_entries
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own diary entries"
on public.diary_entries
for delete
to authenticated
using (auth.uid() = user_id);

create index if not exists diary_entries_user_updated_idx
on public.diary_entries (user_id, updated_at desc);
