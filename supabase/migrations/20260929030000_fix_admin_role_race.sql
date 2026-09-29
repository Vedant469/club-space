begin;

-- ============================================================
-- P5: PREVENT CONCURRENT LAST-ADMIN DEMOTION
-- ============================================================

create or replace function public.set_club_member_role(
  _club_id uuid,
  _user_id uuid,
  _role text
)
returns public.club_members
language plpgsql
security definer
set search_path = ''
as $function$
declare
  result_member public.club_members;
  target_member public.club_members;
  admin_lock public.club_members;
  admin_count integer;
begin

  if _role not in ('member', 'admin') then
    raise exception 'Invalid member role';
  end if;

  if not private.is_club_admin(_club_id) then
    raise exception 'Only club admins can change member roles';
  end if;

  -- Lock every current admin for this club before checking
  -- the admin count. This serializes concurrent role changes.
  for admin_lock in
    select *
    from public.club_members
    where club_id = _club_id
      and role = 'admin'
    order by id
    for update
  loop
    null;
  end loop;

  -- Lock and fetch the target member.
  select *
  into target_member
  from public.club_members
  where club_id = _club_id
    and user_id = _user_id
  for update;

  if target_member.id is null then
    raise exception 'Club member not found';
  end if;

  -- Never allow the last remaining admin to be demoted.
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

commit;