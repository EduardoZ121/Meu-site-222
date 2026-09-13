-- PROPOSAL ONLY — do not apply without review.
-- Additive hardening for kocc_submit_beta_feedback (migration 0035).
--
-- Scope:
--   - Truncate page_path server-side (defense in depth; client already sanitizes).
-- Out of scope:
--   - Founder RLS (see 0043 — blocked on Founder approval)
--   - Ticket status / UPDATE policies / resolution workflow
--   - Writing arbitrary metadata (privacy/retention decision)

/*
create or replace function public.kocc_submit_beta_feedback(
  p_kind text,
  p_body text,
  p_page_path text default null
)
returns public.beta_feedback
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_row public.beta_feedback;
  v_path text;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;
  if p_kind is null or p_kind not in ('feedback', 'bug') then
    raise exception 'kind must be feedback or bug';
  end if;
  if p_body is null or char_length(trim(p_body)) < 3 then
    raise exception 'body too short';
  end if;
  if char_length(trim(p_body)) > 4000 then
    raise exception 'body too long';
  end if;

  v_path := nullif(trim(p_page_path), '');
  if v_path is not null and char_length(v_path) > 500 then
    v_path := left(v_path, 500);
  end if;

  insert into public.beta_feedback (kind, body, page_path, actor_id)
  values (p_kind, trim(p_body), v_path, v_actor)
  returning * into v_row;

  perform public.kocc_track_feature('beta.feedback', 'Feedback Beta');

  return v_row;
end;
$$;

revoke all on function public.kocc_submit_beta_feedback(text, text, text) from public;
grant execute on function public.kocc_submit_beta_feedback(text, text, text) to authenticated;
*/
