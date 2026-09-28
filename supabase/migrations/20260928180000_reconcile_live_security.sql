-- Reconcile the original Club Space baseline with the currently deployed CT1 schema.
-- This migration removes the legacy username lookup RPC and restores the
-- security-sensitive functions, view, and owner/admin RLS policies.

begin;

-- ============================================================
-- 2. Admin membership helper
-- ============================================================

create schema if not exists private;

create or replace function private.is_club_admin(_club_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $function$
  select exists (
    select 1
    from public.club_members
    where club_id = _club_id
      and user_id = (select auth.uid())
      and role = 'admin'
  );
$function$;

revoke all on function private.is_club_admin(uuid)
from public;

grant usage on schema private
to authenticated;

grant execute on function private.is_club_admin(uuid)
to authenticated;

-- ============================================================
-- 1. Remove legacy username -> email lookup
-- ============================================================

drop function if exists public.get_email_for_username(text);


-- ============================================================
-- 2. Username availability check used during signup
-- ============================================================

create or replace function public.is_username_available(_username text)
returns boolean
language sql
stable
set search_path = public
as $function$
  select not exists (
    select 1
    from public.profiles
    where username = lower(trim(_username))
  );
$function$;

revoke all on function public.is_username_available(text)
from public;

grant execute on function public.is_username_available(text)
to anon;


-- ============================================================
-- 3. Secure club member directory RPC
-- ============================================================

create or replace function public.list_club_members(_club_id uuid)
returns table(
  id uuid,
  club_id uuid,
  user_id uuid,
  role text,
  created_at timestamptz,
  username text,
  display_name text,
  avatar_url text,
  email_verified boolean
)
language sql
stable
security definer
set search_path = public, auth
as $function$
  select
    cm.id,
    cm.club_id,
    cm.user_id,
    cm.role,
    cm.created_at,
    p.username,
    p.display_name,
    p.avatar_url,
    (u.email_confirmed_at is not null) as email_verified
  from public.club_members cm
  join public.profiles p
    on p.id = cm.user_id
  join auth.users u
    on u.id = cm.user_id
  where cm.club_id = _club_id
    and exists (
      select 1
      from public.club_members viewer
      where viewer.club_id = _club_id
        and viewer.user_id = (select auth.uid())
    )
  order by
    case when cm.role = 'admin' then 0 else 1 end,
    lower(p.display_name),
    lower(p.username);
$function$;

revoke all on function public.list_club_members(uuid)
from public;

grant execute on function public.list_club_members(uuid)
to authenticated;


-- ============================================================
-- 4. Secure admin role management
-- ============================================================

create or replace function public.set_club_member_role(
  _club_id uuid,
  _user_id uuid,
  _role text
)
returns public.club_members
language plpgsql
security definer
set search_path = public
as $function$
declare
  result_member public.club_members;
  target_member public.club_members;
  admin_count integer;
begin

  if _role not in ('member', 'admin') then
    raise exception 'Invalid member role';
  end if;

  if not private.is_club_admin(_club_id) then
    raise exception 'Only club admins can change member roles';
  end if;

  select *
  into target_member
  from public.club_members
  where club_id = _club_id
    and user_id = _user_id
  for update;

  if target_member.id is null then
    raise exception 'Club member not found';
  end if;

  if target_member.role = 'admin'
     and _role = 'member' then

    select count(*)
    into admin_count
    from public.club_members
    where club_id = _club_id
      and role = 'admin';

    if admin_count <= 1 then
      raise exception 'A club must have at least one admin';
    end if;

  end if;

  update public.club_members
  set role = _role
  where id = target_member.id
  returning *
  into result_member;

  return result_member;
end;
$function$;

revoke all on function public.set_club_member_role(uuid, uuid, text)
from public;

grant execute on function public.set_club_member_role(uuid, uuid, text)
to authenticated;


-- ============================================================
-- 5. Assigned club task status RPC
-- ============================================================

create or replace function public.update_assigned_club_task_status(
  _task_id uuid,
  _status text
)
returns public.club_tasks
language plpgsql
security definer
set search_path = public
as $function$
declare
  result_task public.club_tasks;
begin

  if _status not in ('todo', 'in_progress', 'completed') then
    raise exception 'Invalid task status';
  end if;

  update public.club_tasks
  set
    status = _status,
    updated_at = now()
  where id = _task_id
    and assigned_to = (select auth.uid())
  returning *
  into result_task;

  if result_task.id is null then
    raise exception 'Task not found or not assigned to current user';
  end if;

  return result_task;
end;
$function$;

revoke all on function public.update_assigned_club_task_status(uuid, text)
from public;

grant execute on function public.update_assigned_club_task_status(uuid, text)
to authenticated;


-- ============================================================
-- 6. Secure club task RLS
-- ============================================================

drop policy if exists club_tasks_update_member
on public.club_tasks;

drop policy if exists club_tasks_delete_member
on public.club_tasks;

drop policy if exists club_tasks_update_owner_or_admin
on public.club_tasks;

drop policy if exists club_tasks_delete_owner_or_admin
on public.club_tasks;

create policy club_tasks_update_owner_or_admin
on public.club_tasks
for update
to authenticated
using (
  created_by = (select auth.uid())
  or private.is_club_admin(club_id)
)
with check (
  created_by = (select auth.uid())
  or private.is_club_admin(club_id)
);

create policy club_tasks_delete_owner_or_admin
on public.club_tasks
for delete
to authenticated
using (
  created_by = (select auth.uid())
  or private.is_club_admin(club_id)
);


-- ============================================================
-- 7. Secure documents RLS
-- ============================================================

drop policy if exists documents_update_member
on public.documents;

drop policy if exists documents_delete_member
on public.documents;

drop policy if exists documents_update_owner_or_admin
on public.documents;

drop policy if exists documents_delete_owner_or_admin
on public.documents;

create policy documents_update_owner_or_admin
on public.documents
for update
to authenticated
using (
  uploaded_by = (select auth.uid())
  or private.is_club_admin(club_id)
)
with check (
  uploaded_by = (select auth.uid())
  or private.is_club_admin(club_id)
);

create policy documents_delete_owner_or_admin
on public.documents
for delete
to authenticated
using (
  uploaded_by = (select auth.uid())
  or private.is_club_admin(club_id)
);


-- ============================================================
-- 8. Secure event RLS
-- ============================================================

drop policy if exists events_update_member
on public.events;

drop policy if exists events_delete_member
on public.events;

drop policy if exists events_update_owner_or_admin
on public.events;

drop policy if exists events_delete_owner_or_admin
on public.events;

create policy events_update_owner_or_admin
on public.events
for update
to authenticated
using (
  created_by = (select auth.uid())
  or private.is_club_admin(club_id)
)
with check (
  created_by = (select auth.uid())
  or private.is_club_admin(club_id)
);

create policy events_delete_owner_or_admin
on public.events
for delete
to authenticated
using (
  created_by = (select auth.uid())
  or private.is_club_admin(club_id)
);


-- ============================================================
-- 9. Secure member directory view
-- ============================================================

create or replace view public.club_members_directory
with (security_invoker = true)
as
select
  cm.id,
  cm.club_id,
  cm.user_id,
  p.username,
  p.display_name,
  p.avatar_url,
  cm.role,
  cm.created_at
from public.club_members cm
join public.profiles p
  on p.id = cm.user_id;

revoke all on table public.club_members_directory
from public;

grant select on table public.club_members_directory
to authenticated;

commit;