-- Apply to the Humor Project Supabase database after the community schema exists.
-- This file adds no public bootstrap endpoint. Run the one-time promotion in README
-- with a privileged SQL Editor connection after signing in with Google once.
begin;

alter table public.profiles add column if not exists is_superadmin boolean not null default false;

-- Existing profile UPDATE/UPSERT policies may allow the owner to update any
-- column. Prevent a logged-in user from promoting themselves through those paths.
create or replace function public.protect_superadmin_flag()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      if new.is_superadmin then
        raise exception 'Admin status can only be changed by a database administrator' using errcode = '42501';
      end if;
    elsif tg_op = 'UPDATE' then
      if new.is_superadmin is distinct from old.is_superadmin then
        raise exception 'Admin status can only be changed by a database administrator' using errcode = '42501';
      end if;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists protect_superadmin_flag on public.profiles;
create trigger protect_superadmin_flag before insert or update on public.profiles
for each row execute function public.protect_superadmin_flag();
revoke all on function public.protect_superadmin_flag() from public, anon, authenticated;

-- The lookup needs owner privileges to avoid recursive RLS on profiles.
create schema if not exists admin_private;
revoke all on schema admin_private from public, anon, authenticated;
grant usage on schema admin_private to authenticated;
create or replace function admin_private.is_superadmin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select p.is_superadmin from public.profiles p where p.id = auth.uid()), false);
$$;
revoke all on function admin_private.is_superadmin() from public, anon, authenticated;
grant execute on function admin_private.is_superadmin() to authenticated;

alter table public.profiles enable row level security;
alter table public.generations enable row level security;
alter table public.captions enable row level security;
alter table public.caption_votes enable row level security;

grant select on public.profiles, public.generations, public.captions, public.caption_votes to authenticated;
grant insert (user_id, prompt, topic, source, provider, status),
  update (prompt, topic, provider, status, source), delete on public.generations to authenticated;
grant insert (generation_id, content), update (content), delete on public.captions to authenticated;

-- Allow the setup to be rerun if the initial deployment state is uncertain.
drop policy if exists admin_profiles_read on public.profiles;
drop policy if exists admin_generations_read on public.generations;
drop policy if exists admin_generations_insert on public.generations;
drop policy if exists admin_generations_update on public.generations;
drop policy if exists admin_generations_delete on public.generations;
drop policy if exists admin_captions_read on public.captions;
drop policy if exists admin_captions_insert on public.captions;
drop policy if exists admin_captions_update on public.captions;
drop policy if exists admin_captions_delete on public.captions;
drop policy if exists admin_votes_read on public.caption_votes;

create policy admin_profiles_read on public.profiles for select to authenticated
  using ((select admin_private.is_superadmin()));
create policy admin_generations_read on public.generations for select to authenticated
  using ((select admin_private.is_superadmin()));
create policy admin_generations_insert on public.generations for insert to authenticated
  with check ((select admin_private.is_superadmin()));
create policy admin_generations_update on public.generations for update to authenticated
  using ((select admin_private.is_superadmin())) with check ((select admin_private.is_superadmin()));
create policy admin_generations_delete on public.generations for delete to authenticated
  using ((select admin_private.is_superadmin()));
create policy admin_captions_read on public.captions for select to authenticated
  using ((select admin_private.is_superadmin()));
create policy admin_captions_insert on public.captions for insert to authenticated
  with check ((select admin_private.is_superadmin()));
create policy admin_captions_update on public.captions for update to authenticated
  using ((select admin_private.is_superadmin())) with check ((select admin_private.is_superadmin()));
create policy admin_captions_delete on public.captions for delete to authenticated
  using ((select admin_private.is_superadmin()));
create policy admin_votes_read on public.caption_votes for select to authenticated
  using ((select admin_private.is_superadmin()));

-- One RPC call = one transaction for the two-table media record.
create or replace function public.admin_create_media(
  p_user_id uuid, p_prompt text, p_topic text, p_content text, p_provider text
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_generation uuid; v_caption uuid;
begin
  if not admin_private.is_superadmin() then raise exception 'Not authorized' using errcode = '42501'; end if;
  insert into public.generations (user_id, prompt, topic, source, provider, status)
    values (p_user_id, btrim(p_prompt), p_topic, 'external_ai', btrim(p_provider), 'ready')
    returning id into v_generation;
  insert into public.captions (generation_id, content)
    values (v_generation, btrim(p_content)) returning id into v_caption;
  return v_caption;
end $$;

create or replace function public.admin_update_media(
  p_caption_id uuid, p_prompt text, p_topic text, p_content text, p_provider text
) returns void language plpgsql security invoker set search_path = '' as $$
declare v_generation uuid;
begin
  if not admin_private.is_superadmin() then raise exception 'Not authorized' using errcode = '42501'; end if;
  select generation_id into v_generation from public.captions where id = p_caption_id;
  if v_generation is null then raise exception 'Media not found' using errcode = 'P0002'; end if;
  update public.generations set prompt = btrim(p_prompt), topic = p_topic, provider = btrim(p_provider)
    where id = v_generation;
  update public.captions set content = btrim(p_content) where id = p_caption_id;
end $$;

create or replace function public.admin_delete_media(p_caption_id uuid)
returns void language plpgsql security invoker set search_path = '' as $$
declare v_generation uuid;
begin
  if not admin_private.is_superadmin() then raise exception 'Not authorized' using errcode = '42501'; end if;
  select generation_id into v_generation from public.captions where id = p_caption_id;
  if v_generation is null then raise exception 'Media not found' using errcode = 'P0002'; end if;
  delete from public.generations where id = v_generation;
end $$;

-- Exact aggregate statistics. No limit on vote rows; only aggregate data is returned.
create or replace function public.admin_overview()
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare result jsonb;
begin
  if not admin_private.is_superadmin() then raise exception 'Not authorized' using errcode = '42501'; end if;
  select jsonb_build_object(
    'users', (select count(*) from public.profiles),
    'media', (select count(*) from public.captions),
    'queued', (select count(*) from public.generations where status = 'queued'),
    'upvotes', (select count(*) from public.caption_votes where value = 1),
    'downvotes', (select count(*) from public.caption_votes where value = -1),
    'topics', (select coalesce(jsonb_agg(jsonb_build_object('topic', t.topic, 'count', t.n) order by t.n desc), '[]'::jsonb)
      from (select g.topic, count(*) n from public.captions c join public.generations g on g.id = c.generation_id group by g.topic) t),
    'daily', (select coalesce(jsonb_agg(jsonb_build_object('day', d.day, 'media', coalesce(m.n, 0), 'votes', coalesce(v.n, 0)) order by d.day), '[]'::jsonb)
      from generate_series((current_date - 6)::date, current_date, interval '1 day') d(day)
      left join lateral (select count(*) n from public.captions c where c.created_at >= d.day and c.created_at < d.day + interval '1 day') m on true
      left join lateral (select count(*) n from public.caption_votes cv where cv.created_at >= d.day and cv.created_at < d.day + interval '1 day') v on true),
    'leaders', (select coalesce(jsonb_agg(jsonb_build_object('id', z.id, 'content', z.content, 'topic', z.topic,
      'score', z.score, 'upvotes', z.upvotes, 'downvotes', z.downvotes) order by z.score desc, z.created_at desc), '[]'::jsonb)
      from (select c.id, c.content, g.topic, c.created_at,
        count(cv.id) filter (where cv.value = 1) upvotes,
        count(cv.id) filter (where cv.value = -1) downvotes,
        coalesce(sum(cv.value), 0) score
        from public.captions c join public.generations g on g.id = c.generation_id
        left join public.caption_votes cv on cv.caption_id = c.id
        group by c.id, g.id having count(cv.id) > 0
        order by score desc, c.created_at desc limit 5) z)
  ) into result;
  return result;
end $$;

revoke all on function public.admin_create_media(uuid,text,text,text,text),
  public.admin_update_media(uuid,text,text,text,text), public.admin_delete_media(uuid),
  public.admin_overview() from public, anon, authenticated;
grant execute on function public.admin_create_media(uuid,text,text,text,text),
  public.admin_update_media(uuid,text,text,text,text), public.admin_delete_media(uuid),
  public.admin_overview() to authenticated;

commit;
