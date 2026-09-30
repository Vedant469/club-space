begin;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  club_id uuid not null references public.clubs(id) on delete cascade,
  type text not null check (
    type in (
      'chat_message',
      'task_assigned',
      'event_created',
      'document_added'
    )
  ),
  title text not null,
  body text not null,
  link text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_created_idx
  on public.notifications(recipient_id, created_at desc);

create index if not exists notifications_unread_idx
  on public.notifications(recipient_id, created_at desc)
  where read_at is null;

create index if not exists notifications_club_idx
  on public.notifications(club_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own
  on public.notifications
  for select
  to authenticated
  using (recipient_id = (select auth.uid()));

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own
  on public.notifications
  for update
  to authenticated
  using (recipient_id = (select auth.uid()))
  with check (recipient_id = (select auth.uid()));

drop policy if exists notifications_delete_own on public.notifications;
create policy notifications_delete_own
  on public.notifications
  for delete
  to authenticated
  using (recipient_id = (select auth.uid()));

grant select, update, delete on public.notifications to authenticated;

create or replace function private.create_club_notification(
  _recipient_id uuid,
  _actor_id uuid,
  _club_id uuid,
  _type text,
  _title text,
  _body text,
  _link text,
  _entity_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $function$
begin
  if _recipient_id is null then
    return;
  end if;

  insert into public.notifications (
    recipient_id,
    actor_id,
    club_id,
    type,
    title,
    body,
    link,
    entity_id
  )
  values (
    _recipient_id,
    _actor_id,
    _club_id,
    _type,
    left(_title, 160),
    left(_body, 500),
    _link,
    _entity_id
  );
end;
$function$;

revoke all on function private.create_club_notification(
  uuid, uuid, uuid, text, text, text, text, uuid
) from public, anon, authenticated;

create or replace function private.notify_club_task_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if new.assigned_to is null then
    return new;
  end if;

  if tg_op = 'UPDATE'
     and new.assigned_to is not distinct from old.assigned_to then
    return new;
  end if;

  if new.assigned_to = new.created_by then
    return new;
  end if;

  perform private.create_club_notification(
    new.assigned_to,
    new.created_by,
    new.club_id,
    'task_assigned',
    'New task assigned to you',
    new.title,
    '/club-tasks',
    new.id
  );

  return new;
end;
$function$;

drop trigger if exists club_tasks_assignment_notification
  on public.club_tasks;

create trigger club_tasks_assignment_notification
after insert or update of assigned_to on public.club_tasks
for each row
execute function private.notify_club_task_assignment();

create or replace function private.notify_new_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  member_row record;
begin
  for member_row in
    select user_id
    from public.club_members
    where club_id = new.club_id
      and user_id <> new.created_by
  loop
    perform private.create_club_notification(
      member_row.user_id,
      new.created_by,
      new.club_id,
      'event_created',
      'New event: ' || new.name,
      coalesce(
        nullif(trim(new.description), ''),
        'A new club event was added.'
      ),
      '/memories/' || new.id::text,
      new.id
    );
  end loop;

  return new;
end;
$function$;

drop trigger if exists events_create_notification
  on public.events;

create trigger events_create_notification
after insert on public.events
for each row
execute function private.notify_new_event();

create or replace function private.notify_new_document()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  member_row record;
begin
  for member_row in
    select user_id
    from public.club_members
    where club_id = new.club_id
      and user_id <> new.uploaded_by
  loop
    perform private.create_club_notification(
      member_row.user_id,
      new.uploaded_by,
      new.club_id,
      'document_added',
      'New document added',
      new.file_name,
      '/documents',
      new.id
    );
  end loop;

  return new;
end;
$function$;

drop trigger if exists documents_create_notification
  on public.documents;

create trigger documents_create_notification
after insert on public.documents
for each row
execute function private.notify_new_document();

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    execute 'alter publication supabase_realtime add table public.notifications';
  end if;
end;
$$;

commit;
