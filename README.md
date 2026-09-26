# Club Space

Dreamy, star-themed creative club workspace built with React, TypeScript, Vite and Supabase.

## Local setup

1. Copy `.env.example` to `.env`.
2. Put the CT1 Supabase publishable/anon key in `VITE\_SUPABASE\_ANON\_KEY`.
3. Keep `VITE\_CLUB\_ID=00000000-0000-0000-0000-000000000001`.
4. Run `npm install`.
5. Run `npm run dev`.

## Backend

The initial CT1 schema is stored at `supabase/migrations/001\_club\_space.sql`. The CT1 project has already been initialized with the matching tables, RLS policies, Storage buckets and Realtime configuration.

## Security

Never commit `.env`, service-role keys, or other secrets. `.gitignore` already excludes `.env`, `node\_modules`, and `dist`.

## Features

* Supabase email/password authentication with username-or-email login
* Personalized time-based greeting
* Personal tasks
* Shared club tasks
* Private document storage
* Event memories/photo galleries
* Realtime club chat
* Star-based responsive navigation
* Desktop, tablet/iPad and mobile layouts

