-- Club Space initial schema for Supabase CT1
create extension if not exists pgcrypto;

create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9._-]{3,32}$'),
  display_name text not null check (char_length(trim(display_name)) between 1 and 80),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.club_members (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('member','admin')),
  created_at timestamptz not null default now(),
  unique (club_id, user_id)
);

create table if not exists public.personal_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 200),
  description text,
  status text not null default 'pending' check (status in ('pending','completed')),
  priority text check (priority in ('low','medium','high')),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 160),
  description text,
  event_date date,
  cover_photo text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.club_tasks (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  assigned_to uuid references public.profiles(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,
  title text not null check (char_length(trim(title)) between 1 and 200),
  description text,
  status text not null default 'todo' check (status in ('todo','in_progress','completed')),
  priority text check (priority in ('low','medium','high')),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id),
  storage_path text not null,
  caption text,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id),
  file_name text not null,
  storage_path text not null,
  mime_type text,
  file_size bigint,
  event_id uuid references public.events(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  reply_to uuid references public.chat_messages(id) on delete set null,
  attachment_path text,
  attachment_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint chat_message_has_content check (nullif(trim(coalesce(message,'')), '') is not null or attachment_path is not null)
);

insert into public.clubs (id, name, description)
values ('00000000-0000-0000-0000-000000000001', 'Club Space', 'Creative club workspace')
on conflict (id) do nothing;

create schema if not exists private;

create or replace function private.is_club_member(_club_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.club_members where club_id = _club_id and user_id = (select auth.uid())); $$;
grant usage on schema private to authenticated;
grant execute on function private.is_club_member(uuid) to authenticated;

create or replace function public.get_email_for_username(_username text)
returns text language sql stable security definer set search_path = public
as $$ select u.email from public.profiles p join auth.users u on u.id = p.id where lower(p.username)=lower(trim(_username)) limit 1; $$;
revoke all on function public.get_email_for_username(text) from public, authenticated;
grant execute on function public.get_email_for_username(text) to anon;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare v_username text; v_display_name text;
begin
  v_username := lower(coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)));
  v_display_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), v_username);
  insert into public.profiles (id, username, display_name) values (new.id, v_username, v_display_name)
    on conflict (id) do update set username=excluded.username, display_name=excluded.display_name, updated_at=now();
  insert into public.club_members (club_id,user_id,role) values ('00000000-0000-0000-0000-000000000001',new.id,'member') on conflict (club_id,user_id) do nothing;
  return new;
end; $$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public
as $$ begin new.updated_at=now(); return new; end; $$;

drop trigger if exists profiles_set_updated_at on public.profiles; create trigger profiles_set_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
drop trigger if exists personal_tasks_set_updated_at on public.personal_tasks; create trigger personal_tasks_set_updated_at before update on public.personal_tasks for each row execute procedure public.set_updated_at();
drop trigger if exists club_tasks_set_updated_at on public.club_tasks; create trigger club_tasks_set_updated_at before update on public.club_tasks for each row execute procedure public.set_updated_at();
drop trigger if exists events_set_updated_at on public.events; create trigger events_set_updated_at before update on public.events for each row execute procedure public.set_updated_at();
drop trigger if exists documents_set_updated_at on public.documents; create trigger documents_set_updated_at before update on public.documents for each row execute procedure public.set_updated_at();
drop trigger if exists chat_messages_set_updated_at on public.chat_messages; create trigger chat_messages_set_updated_at before update on public.chat_messages for each row execute procedure public.set_updated_at();

create index if not exists club_members_user_idx on public.club_members(user_id);
create index if not exists personal_tasks_user_status_idx on public.personal_tasks(user_id,status);
create index if not exists club_tasks_club_status_idx on public.club_tasks(club_id,status);
create index if not exists club_tasks_assigned_idx on public.club_tasks(assigned_to);
create index if not exists club_tasks_created_by_idx on public.club_tasks(created_by);
create index if not exists club_tasks_event_idx on public.club_tasks(event_id);
create index if not exists events_club_date_idx on public.events(club_id,event_date desc);
create index if not exists events_created_by_idx on public.events(created_by);
create index if not exists event_photos_event_idx on public.event_photos(event_id,created_at desc);
create index if not exists event_photos_uploaded_by_idx on public.event_photos(uploaded_by);
create index if not exists documents_club_created_idx on public.documents(club_id,created_at desc);
create index if not exists documents_event_idx on public.documents(event_id);
create index if not exists documents_uploaded_by_idx on public.documents(uploaded_by);
create index if not exists chat_messages_club_created_idx on public.chat_messages(club_id,created_at);
create index if not exists chat_messages_reply_to_idx on public.chat_messages(reply_to);
create index if not exists chat_messages_sender_idx on public.chat_messages(sender_id);

alter table public.profiles enable row level security;
alter table public.clubs enable row level security;
alter table public.club_members enable row level security;
alter table public.personal_tasks enable row level security;
alter table public.events enable row level security;
alter table public.club_tasks enable row level security;
alter table public.event_photos enable row level security;
alter table public.documents enable row level security;
alter table public.chat_messages enable row level security;

create policy profiles_select_authenticated on public.profiles for select to authenticated using (true);
create policy profiles_update_self on public.profiles for update to authenticated using (id=(select auth.uid())) with check (id=(select auth.uid()));
create policy clubs_select_member on public.clubs for select to authenticated using (private.is_club_member(id));
create policy club_members_select_member on public.club_members for select to authenticated using (private.is_club_member(club_id));
create policy personal_tasks_all_self on public.personal_tasks for all to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy events_select_member on public.events for select to authenticated using (private.is_club_member(club_id));
create policy events_insert_member on public.events for insert to authenticated with check (private.is_club_member(club_id) and created_by=(select auth.uid()));
create policy events_update_member on public.events for update to authenticated using (private.is_club_member(club_id)) with check (private.is_club_member(club_id));
create policy events_delete_member on public.events for delete to authenticated using (private.is_club_member(club_id));
create policy club_tasks_select_member on public.club_tasks for select to authenticated using (private.is_club_member(club_id));
create policy club_tasks_insert_member on public.club_tasks for insert to authenticated with check (private.is_club_member(club_id) and created_by=(select auth.uid()));
create policy club_tasks_update_member on public.club_tasks for update to authenticated using (private.is_club_member(club_id)) with check (private.is_club_member(club_id));
create policy club_tasks_delete_member on public.club_tasks for delete to authenticated using (private.is_club_member(club_id));
create policy event_photos_select_member on public.event_photos for select to authenticated using (exists(select 1 from public.events e where e.id=event_id and private.is_club_member(e.club_id)));
create policy event_photos_insert_member on public.event_photos for insert to authenticated with check (uploaded_by=(select auth.uid()) and exists(select 1 from public.events e where e.id=event_id and private.is_club_member(e.club_id)));
create policy event_photos_delete_member on public.event_photos for delete to authenticated using (uploaded_by=(select auth.uid()) or exists(select 1 from public.events e join public.club_members cm on cm.club_id=e.club_id where e.id=event_id and cm.user_id=(select auth.uid()) and cm.role='admin'));
create policy documents_select_member on public.documents for select to authenticated using (private.is_club_member(club_id));
create policy documents_insert_member on public.documents for insert to authenticated with check (private.is_club_member(club_id) and uploaded_by=(select auth.uid()));
create policy documents_update_member on public.documents for update to authenticated using (private.is_club_member(club_id)) with check (private.is_club_member(club_id));
create policy documents_delete_member on public.documents for delete to authenticated using (private.is_club_member(club_id));
create policy chat_select_member on public.chat_messages for select to authenticated using (private.is_club_member(club_id));
create policy chat_insert_member on public.chat_messages for insert to authenticated with check (private.is_club_member(club_id) and sender_id=(select auth.uid()));
create policy chat_update_own on public.chat_messages for update to authenticated using (sender_id=(select auth.uid())) with check (sender_id=(select auth.uid()));
create policy chat_delete_own on public.chat_messages for delete to authenticated using (sender_id=(select auth.uid()));

insert into storage.buckets (id,name,public) values
 ('club-documents','club-documents',false),('club-photos','club-photos',false),('club-chat','club-chat',false),('avatars','avatars',true)
on conflict (id) do update set public=excluded.public;

create policy club_documents_select on storage.objects for select to authenticated using (bucket_id='club-documents' and private.is_club_member((storage.foldername(name))[1]::uuid));
create policy club_documents_insert on storage.objects for insert to authenticated with check (bucket_id='club-documents' and private.is_club_member((storage.foldername(name))[1]::uuid));
create policy club_documents_update on storage.objects for update to authenticated using (bucket_id='club-documents' and private.is_club_member((storage.foldername(name))[1]::uuid)) with check (bucket_id='club-documents' and private.is_club_member((storage.foldername(name))[1]::uuid));
create policy club_documents_delete on storage.objects for delete to authenticated using (bucket_id='club-documents' and private.is_club_member((storage.foldername(name))[1]::uuid));
create policy club_photos_select on storage.objects for select to authenticated using (bucket_id='club-photos' and private.is_club_member((storage.foldername(name))[1]::uuid));
create policy club_photos_insert on storage.objects for insert to authenticated with check (bucket_id='club-photos' and private.is_club_member((storage.foldername(name))[1]::uuid));
create policy club_photos_delete on storage.objects for delete to authenticated using (bucket_id='club-photos' and private.is_club_member((storage.foldername(name))[1]::uuid));
create policy club_chat_select on storage.objects for select to authenticated using (bucket_id='club-chat' and private.is_club_member((storage.foldername(name))[1]::uuid));
create policy club_chat_insert on storage.objects for insert to authenticated with check (bucket_id='club-chat' and private.is_club_member((storage.foldername(name))[1]::uuid));
create policy club_chat_delete on storage.objects for delete to authenticated using (bucket_id='club-chat' and private.is_club_member((storage.foldername(name))[1]::uuid));
create policy avatars_select on storage.objects for select to public using (bucket_id='avatars');
create policy avatars_insert_own on storage.objects for insert to authenticated with check (bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy avatars_update_own on storage.objects for update to authenticated using (bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text) with check (bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy avatars_delete_own on storage.objects for delete to authenticated using (bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);

alter publication supabase_realtime add table public.chat_messages;
