-- Extend the protected overview with photo meme counts and reactions.
-- Photo memes are published captions whose generation has an image_path.
begin;

create or replace function public.admin_overview()
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare result jsonb;
begin
  if not admin_private.is_superadmin() then raise exception 'Not authorized' using errcode = '42501'; end if;
  select jsonb_build_object(
    'users', (select count(*) from public.profiles),
    'media', (select count(*) from public.captions),
    'text_media', (select count(*) from public.captions c join public.generations g on g.id = c.generation_id where g.image_path is null),
    'photo_media', (select count(*) from public.captions c join public.generations g on g.id = c.generation_id where g.image_path is not null),
    'queued', (select count(*) from public.generations where status = 'queued'),
    'upvotes', (select count(*) from public.caption_votes where value = 1),
    'downvotes', (select count(*) from public.caption_votes where value = -1),
    'photo_upvotes', (select count(*) from public.caption_votes cv join public.captions c on c.id = cv.caption_id join public.generations g on g.id = c.generation_id where g.image_path is not null and cv.value = 1),
    'photo_downvotes', (select count(*) from public.caption_votes cv join public.captions c on c.id = cv.caption_id join public.generations g on g.id = c.generation_id where g.image_path is not null and cv.value = -1),
    'topics', (select coalesce(jsonb_agg(jsonb_build_object('topic', t.topic, 'count', t.n, 'photos', t.photos) order by t.n desc), '[]'::jsonb)
      from (select g.topic, count(*) n, count(*) filter (where g.image_path is not null) photos
        from public.captions c join public.generations g on g.id = c.generation_id group by g.topic) t),
    'daily', (select coalesce(jsonb_agg(jsonb_build_object('day', d.day, 'media', coalesce(m.n, 0),
      'text', coalesce(m.text_posts, 0), 'photos', coalesce(m.photo_posts, 0), 'votes', coalesce(v.n, 0)) order by d.day), '[]'::jsonb)
      from generate_series((current_date - 6)::date, current_date, interval '1 day') d(day)
      left join lateral (select count(*) n, count(*) filter (where g.image_path is null) text_posts,
        count(*) filter (where g.image_path is not null) photo_posts
        from public.captions c join public.generations g on g.id = c.generation_id
        where c.created_at >= d.day and c.created_at < d.day + interval '1 day') m on true
      left join lateral (select count(*) n from public.caption_votes cv
        where cv.created_at >= d.day and cv.created_at < d.day + interval '1 day') v on true),
    'leaders', (select coalesce(jsonb_agg(jsonb_build_object('id', z.id, 'content', z.content, 'topic', z.topic,
      'is_photo', z.is_photo, 'score', z.score, 'upvotes', z.upvotes, 'downvotes', z.downvotes)
      order by z.score desc, z.created_at desc), '[]'::jsonb)
      from (select c.id, c.content, g.topic, g.image_path is not null is_photo, c.created_at,
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

revoke all on function public.admin_overview() from public, anon, authenticated;
grant execute on function public.admin_overview() to authenticated;

commit;
