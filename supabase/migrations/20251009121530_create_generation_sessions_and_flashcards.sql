-- migration: create generation_sessions and flashcards with rls, policies, constraints, triggers, and indexes
-- purpose:
--   - introduce enum type flashcard_origin and two tables: generation_sessions, flashcards
--   - enforce data integrity (checks, fks), invariants, and immutability via triggers
--   - enable rls with per-role granular policies (anon, authenticated) for select/insert/update/delete
--   - add pg_trgm for ilike search and appropriate btree/gin indexes
-- affected objects:
--   - type: flashcard_origin ('AI_full','AI_edited','manual')
--   - tables: public.generation_sessions, public.flashcards
--   - fks: generation_sessions.user_id → auth.users(id) on delete cascade
--           flashcards.user_id → auth.users(id) on delete cascade
--           flashcards.generation_session_id → public.generation_sessions(id) on delete restrict
--   - rls: enabled on both tables with policies per role/op
--   - triggers: set user_id default from auth.uid() on insert; updated_at; immutability; invariant validation
-- special notes:
--   - all sql keywords are lowercase; string/enum labels preserve case as defined in product plan
--   - service_role bypasses rls in supabase; anon policies still exist but will evaluate to false when auth.uid() is null

begin;

-- ensure required extensions exist (safe, idempotent)
-- pg_trgm is used for trigram-based ilike search indexes
create extension if not exists pg_trgm;
-- gen_random_uuid() lives in pgcrypto (commonly enabled in supabase, but we ensure it here)
create extension if not exists pgcrypto;

-- create enum type for flashcard origin
-- use do/exception to keep migration idempotent if type already exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t WHERE t.typname = 'flashcard_origin') THEN
    create type flashcard_origin as enum ('AI_full','AI_edited','manual');
  END IF;
END
$$;

-- generation_sessions table: per-generation telemetry without storing raw inputs
create table if not exists public.generation_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  proposals_count smallint not null check (proposals_count between 0 and 20),
  accepted_count smallint not null check (accepted_count between 0 and proposals_count),
  acceptance_rate numeric(5,4) generated always as (
    accepted_count::numeric / nullif(proposals_count, 0)
  ) stored,
  generate_duration integer check (generate_duration >= 0),
  source_text_length smallint not null check (source_text_length between 100 and 10000),
  source_text_hash text not null check (char_length(source_text_hash) = 64),
  created_at timestamptz not null default now()
);

-- indexes for generation_sessions
-- list user sessions by recency
create index if not exists generation_sessions_user_created_at_idx
  on public.generation_sessions using btree (user_id, created_at desc);
-- quick lookup by source_text_hash
create index if not exists generation_sessions_source_text_hash_idx
  on public.generation_sessions using btree (source_text_hash);

-- flashcards table: user cards possibly originating from an ai generation session
create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  front_text text not null check (char_length(front_text) between 1 and 1000),
  back_text text not null check (char_length(back_text) between 1 and 1000),
  origin flashcard_origin not null,
  generation_session_id uuid references public.generation_sessions(id) on delete restrict,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- enforce origin ↔ generation_session_id consistency at the database level
  constraint flashcards_origin_session_consistency_chk
    check (
      (origin in ('AI_full','AI_edited') and generation_session_id is not null)
      or (origin = 'manual' and generation_session_id is null)
    )
);

-- indexes for flashcards
create index if not exists flashcards_user_id_idx
  on public.flashcards using btree (user_id);
create index if not exists flashcards_user_created_at_idx
  on public.flashcards using btree (user_id, created_at desc);
create index if not exists flashcards_user_reviewed_created_idx
  on public.flashcards using btree (user_id, last_reviewed_at, created_at);
create index if not exists flashcards_user_origin_idx
  on public.flashcards using btree (user_id, origin);
-- trigram gin indexes for ilike search on lower(text)
create index if not exists flashcards_front_text_trgm_idx
  on public.flashcards using gin (lower(front_text) gin_trgm_ops);
create index if not exists flashcards_back_text_trgm_idx
  on public.flashcards using gin (lower(back_text) gin_trgm_ops);

-- rls: must be enabled on new tables
alter table public.generation_sessions enable row level security;
alter table public.flashcards enable row level security;

-- optional: default user_id from auth.uid() on insert if client does not set it explicitly
create or replace function public.set_user_id_default() returns trigger
language plpgsql as $$
begin
  -- set user_id to auth.uid() only when not provided; otherwise honor explicit value
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  return new;
end;
$$;

-- attach defaulting trigger to both tables (before insert)
create trigger generation_sessions_bi_set_user_id
  before insert on public.generation_sessions
  for each row execute function public.set_user_id_default();

create trigger flashcards_bi_set_user_id
  before insert on public.flashcards
  for each row execute function public.set_user_id_default();

-- invariants and immutability for flashcards
-- 1) updated_at maintenance
-- 2) immutable fields: user_id, generation_session_id
-- 3) origin change allowed only: 'AI_full' → 'AI_edited'
create or replace function public.flashcards_before_update()
returns trigger language plpgsql as $$
begin
  -- immutability: user_id cannot change after insert
  if new.user_id is distinct from old.user_id then
    raise exception 'flashcards.user_id is immutable after insert';
  end if;

  -- immutability: generation_session_id cannot change after insert
  if new.generation_session_id is distinct from old.generation_session_id then
    raise exception 'flashcards.generation_session_id is immutable after insert';
  end if;

  -- origin transitions: only allow AI_full -> AI_edited; all others rejected
  if new.origin is distinct from old.origin then
    if not (old.origin = 'AI_full' and new.origin = 'AI_edited') then
      raise exception 'invalid origin change: only AI_full → AI_edited is allowed';
    end if;
  end if;

  -- touch updated_at on any update
  new.updated_at := now();
  return new;
end;
$$;

create trigger flashcards_bu_enforce_invariants
  before update on public.flashcards
  for each row execute function public.flashcards_before_update();

-- explicit validator for origin ↔ generation_session_id on insert/update (in addition to check)
create or replace function public.flashcards_validate_invariants()
returns trigger language plpgsql as $$
begin
  if (new.origin in ('AI_full','AI_edited') and new.generation_session_id is null)
     or (new.origin = 'manual' and new.generation_session_id is not null) then
    raise exception 'origin/generation_session_id invariant violated';
  end if;
  return new;
end;
$$;

create trigger flashcards_biu_validate
  before insert or update on public.flashcards
  for each row execute function public.flashcards_validate_invariants();

-- rls policies: granular per operation and role
-- generation_sessions policies
create policy generation_sessions_select_authenticated
  on public.generation_sessions for select
  to authenticated using (user_id = auth.uid());

create policy generation_sessions_select_anon
  on public.generation_sessions for select
  to anon using (user_id = auth.uid());

create policy generation_sessions_insert_authenticated
  on public.generation_sessions for insert
  to authenticated with check (user_id = auth.uid());

create policy generation_sessions_insert_anon
  on public.generation_sessions for insert
  to anon with check (user_id = auth.uid());

create policy generation_sessions_update_authenticated
  on public.generation_sessions for update
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy generation_sessions_update_anon
  on public.generation_sessions for update
  to anon using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy generation_sessions_delete_authenticated
  on public.generation_sessions for delete
  to authenticated using (user_id = auth.uid());

create policy generation_sessions_delete_anon
  on public.generation_sessions for delete
  to anon using (user_id = auth.uid());

-- flashcards policies
create policy flashcards_select_authenticated
  on public.flashcards for select
  to authenticated using (user_id = auth.uid());

create policy flashcards_select_anon
  on public.flashcards for select
  to anon using (user_id = auth.uid());

create policy flashcards_insert_authenticated
  on public.flashcards for insert
  to authenticated with check (user_id = auth.uid());

create policy flashcards_insert_anon
  on public.flashcards for insert
  to anon with check (user_id = auth.uid());

create policy flashcards_update_authenticated
  on public.flashcards for update
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy flashcards_update_anon
  on public.flashcards for update
  to anon using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy flashcards_delete_authenticated
  on public.flashcards for delete
  to authenticated using (user_id = auth.uid());

create policy flashcards_delete_anon
  on public.flashcards for delete
  to anon using (user_id = auth.uid());

commit;

