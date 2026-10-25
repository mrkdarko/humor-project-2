-- Run after admin_setup.sql in the Humor Project SQL Editor.
-- Existing generations are the generation-request records; captions are AI media.
begin;

-- Keep direct Data API access aligned with the Google-only admin route guard.
create or replace function admin_private.is_superadmin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    join auth.users u on u.id = p.id
    where p.id = auth.uid() and p.is_superadmin = true
      and u.raw_app_meta_data->>'provider' = 'google'
  );
$$;
revoke all on function admin_private.is_superadmin() from public, anon, authenticated;
grant execute on function admin_private.is_superadmin() to authenticated;

create table public.prompt_chains (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  description text,
  created_at timestamptz not null default now()
);
create table public.prompt_chain_steps (
  id uuid primary key default gen_random_uuid(),
  chain_id uuid not null references public.prompt_chains(id) on delete cascade,
  position integer not null check (position > 0),
  role text not null check (role in ('system', 'user', 'assistant')),
  template text not null,
  created_at timestamptz not null default now(),
  unique (chain_id, position)
);
create table public.prompt_chain_mix (
  id uuid primary key default gen_random_uuid(),
  chain_id uuid not null unique references public.prompt_chains(id) on delete cascade,
  weight numeric(6,2) not null default 1 check (weight >= 0 and weight <= 100),
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);
create table public.terms (
  id uuid primary key default gen_random_uuid(),
  term text not null unique check (char_length(btrim(term)) between 1 and 120),
  meaning text not null check (char_length(btrim(meaning)) between 1 and 2000),
  category text,
  created_at timestamptz not null default now()
);
create table public.ai_generation_examples (
  id uuid primary key default gen_random_uuid(),
  prompt text not null check (char_length(btrim(prompt)) between 1 and 2000),
  response text not null check (char_length(btrim(response)) between 1 and 4000),
  topic text,
  created_at timestamptz not null default now()
);
create table public.llm_providers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(btrim(name)) between 1 and 120),
  api_identifier text not null unique check (char_length(btrim(api_identifier)) between 1 and 120),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.llm_models (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.llm_providers(id) on delete restrict,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  model_identifier text not null check (char_length(btrim(model_identifier)) between 1 and 160),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (provider_id, model_identifier)
);
create table public.llm_responses (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references public.generations(id) on delete cascade,
  model_id uuid references public.llm_models(id) on delete set null,
  response text not null,
  status text not null default 'ready',
  created_at timestamptz not null default now()
);
create table public.allowed_signup_domains (
  id uuid primary key default gen_random_uuid(),
  domain text not null unique check (domain = lower(domain) and domain !~ '@' and char_length(domain) between 3 and 253),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.whitelisted_email_addresses (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email) and email like '%@%' and char_length(email) <= 254),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.images (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  alt_text text not null default '' check (char_length(alt_text) <= 500),
  uploaded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index prompt_chain_steps_order_idx on public.prompt_chain_steps(chain_id, position);
create index llm_responses_generation_idx on public.llm_responses(generation_id, created_at desc);
create index images_created_idx on public.images(created_at desc);

-- Every new public table is inaccessible without a current superadmin flag.
do $$ declare table_name text; begin
  foreach table_name in array array[
    'prompt_chains','prompt_chain_steps','prompt_chain_mix','terms',
    'ai_generation_examples','llm_providers','llm_models','llm_responses',
    'allowed_signup_domains','whitelisted_email_addresses','images'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on public.%I from public, anon, authenticated', table_name);
    execute format('grant all on public.%I to service_role', table_name);
    execute format('grant select on public.%I to authenticated', table_name);
    execute format('create policy admin_read on public.%I for select to authenticated using ((select admin_private.is_superadmin()))', table_name);
  end loop;
  foreach table_name in array array[
    'prompt_chain_mix','terms','ai_generation_examples','llm_providers',
    'llm_models','allowed_signup_domains','whitelisted_email_addresses','images'
  ] loop
    execute format('grant insert, update, delete on public.%I to authenticated', table_name);
    execute format('create policy admin_insert on public.%I for insert to authenticated with check ((select admin_private.is_superadmin()))', table_name);
    execute format('create policy admin_update on public.%I for update to authenticated using ((select admin_private.is_superadmin())) with check ((select admin_private.is_superadmin()))', table_name);
    execute format('create policy admin_delete on public.%I for delete to authenticated using ((select admin_private.is_superadmin()))', table_name);
  end loop;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('admin-images', 'admin-images', false, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;
create policy admin_images_read on storage.objects for select to authenticated
  using (bucket_id = 'admin-images' and (select admin_private.is_superadmin()));
create policy admin_images_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'admin-images' and (select admin_private.is_superadmin()));
create policy admin_images_update on storage.objects for update to authenticated
  using (bucket_id = 'admin-images' and (select admin_private.is_superadmin()))
  with check (bucket_id = 'admin-images' and (select admin_private.is_superadmin()));
create policy admin_images_delete on storage.objects for delete to authenticated
  using (bucket_id = 'admin-images' and (select admin_private.is_superadmin()));

commit;
