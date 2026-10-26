# Humor Project Control Room

A private admin app for the Humor Project Supabase database. It reads profiles, AI workflow records, and reactions; manages catalog data and images; shows live community statistics; and creates, edits, and deletes AI generated captions. Text and photo memes are both published captions; photo memes have a `generations.image_path`.

## Setup

1. Run `npm ci`.
2. Copy `.env.example` to `.env.local` and set the **Humor Project** Supabase URL and publishable key. For AI publishing in the protected Player Mode, also set `GEMINI_API_KEY`. Do not add a Supabase secret or service role key to this app.
3. Apply [`supabase/admin_setup.sql`](supabase/admin_setup.sql), [`supabase/admin_catalog.sql`](supabase/admin_catalog.sql), then [`supabase/admin_photo_stats.sql`](supabase/admin_photo_stats.sql) in that project's Supabase SQL Editor. Their prerequisite is the existing `profiles`, `generations`, `captions`, and `caption_votes` schema; photo statistics also require `generations.image_path`. The catalog script creates the new tables, row policies, and private `admin-images` bucket.
4. Add `http://localhost:3000/auth/callback` and your deployed `https://<admin-domain>/auth/callback` to Supabase Auth allowed redirect URLs. Google OAuth must already be enabled for that Supabase project.
5. Run `npm run dev` and sign in with Google.

For Vercel, add the same two `NEXT_PUBLIC_SUPABASE_*` variables as Config values in Project Settings → Environment Variables, and add `GEMINI_API_KEY` as a server-only Secret if you want AI publishing in Player Mode. Redeploy after changing variables. The main Humor Project website and this admin website use the same Supabase project and the same Google account, but each domain has its own sign-in session.

Every `/admin` route rechecks the Google user and `profiles.is_superadmin`. Every server action does the same. RLS also checks the database flag on every data query or mutation; the app has no service role key. The SQL prevents users from editing their own admin flag through an existing profile update policy.

## Grant the first administrator

The initial promotion must happen **outside the public app** using a privileged Supabase SQL Editor connection. First sign in with the intended Google account once, so its `auth.users` and `profiles` rows exist. Verify the exact account and provider:

```sql
select id, email, raw_app_meta_data->>'provider' as provider
from auth.users
where lower(email) = lower('you@example.com');
```

Then promote only that account:

```sql
update public.profiles
set is_superadmin = true
where id = (
  select id from auth.users
  where lower(email) = lower('you@example.com')
    and raw_app_meta_data->>'provider' = 'google'
)
returning id, firstname, lastname, is_superadmin;
```

Check that exactly one row is returned. Refresh the admin app and sign in again. Future promotions and revocations should likewise happen through privileged SQL or a separately approved owner workflow; there is intentionally no self promotion route.

## Features

- Overview: member count, separate text and photo meme counts, queued generations, reaction totals, photo reactions, seven day publishing trend by format, topic mix, recent photo previews, and top rated media.
- People: read and search profiles with pagination.
- AI media: create, read, update, and delete published captions with their prompt, topic, provider, and owner profile. Existing photo memes are labeled in the archive and their images appear on the detail page. Database functions make multi table changes atomic.
- Reactions: read and filter individual upvotes and downvotes with pagination.
- Player Mode: the superadmin can browse the regular caption feed, save private drafts, publish AI captions with the same RPC as regular users, and upvote/downvote captions other than their own.
- My Profile: update the same name and avatar used by the regular website. The protected admin flag is not editable here.
- AI workflow: read prompt chains and steps, read and update chain mix, read generation requests and LLM responses.
- Catalog: create, read, update, and delete terms, AI generation examples, LLM providers, LLM models, allowed signup domains, and whitelisted email addresses.
- Images: upload, view, replace, rename, and delete images in a private storage bucket. The admin app uses signed preview URLs.

The app reads live data; it contains no sample records. Deleting media also deletes its generation and associated votes through existing foreign key cascades.

The signup domain and email tables are management records. They do not restrict Supabase Auth signups by themselves; connect them to an Auth hook or your signup policy before relying on them as an allowlist.

## Verification

Run `npm run lint` and `npm run build`. After applying the SQL, test with two Google accounts: one promoted and one ordinary member. The member must get `/denied` and must be unable to call the admin RPCs directly; the promoted account must be able to read each section and create, edit, and delete a test caption. Revoke the flag and confirm the former admin loses access on the next request.

The `admin_catalog` migration was applied to Humor Project project `afcxmphlvlvanwtsrpaz` on 2026-10-25. It created 11 RLS-protected tables and the private image bucket. The new catalog tables start empty; generation requests continue to read existing `generations` rows.

The `admin_photo_stats` migration was applied to the same project on 2026-10-26. It only updates the existing, superadmin-checked `admin_overview` function.
