-- migration: fix automatic origin change from AI_full to AI_edited
-- purpose: update flashcards_before_update trigger to automatically change origin
--          from 'AI_full' to 'AI_edited' when front_text or back_text is modified
-- affected objects:
--   - function: public.flashcards_before_update()
--   - trigger: flashcards_bu_enforce_invariants (already exists, no change needed)

begin;

-- update the trigger function to automatically change origin when content is edited
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

  -- automatic origin transition: AI_full → AI_edited when content changes
  if old.origin = 'AI_full' and 
     (new.front_text is distinct from old.front_text or new.back_text is distinct from old.back_text) then
    new.origin := 'AI_edited';
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

commit;

