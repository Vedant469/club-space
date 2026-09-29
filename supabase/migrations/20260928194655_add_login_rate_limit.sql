create schema if not exists private;

create table if not exists private.login_rate_limits (
  bucket_key text primary key,
  window_started_at timestamptz not null,
  attempts integer not null default 0 check (attempts >= 0),
  updated_at timestamptz not null default now()
);

revoke all on table private.login_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on table private.login_rate_limits to service_role;

create or replace function public.check_login_rate_limit(
  _bucket_key text,
  _max_attempts integer default 30,
  _window_seconds integer default 600
)
returns table (
  allowed boolean,
  retry_after_seconds integer
)
language plpgsql
set search_path = ''
as $function$
declare
  v_now timestamptz := clock_timestamp();
  v_window_start timestamptz;
  v_attempts integer;
  v_window_end timestamptz;
  v_retry integer;
begin
  if _bucket_key is null or length(_bucket_key) < 1 or length(_bucket_key) > 128 then
    raise exception 'Invalid rate-limit bucket';
  end if;

  if _max_attempts < 1 or _max_attempts > 1000 then
    raise exception 'Invalid rate-limit threshold';
  end if;

  if _window_seconds < 1 or _window_seconds > 86400 then
    raise exception 'Invalid rate-limit window';
  end if;

  insert into private.login_rate_limits (
    bucket_key,
    window_started_at,
    attempts,
    updated_at
  )
  values (
    _bucket_key,
    v_now,
    1,
    v_now
  )
  on conflict (bucket_key) do update
  set
    window_started_at = case
      when v_now >= private.login_rate_limits.window_started_at
        + make_interval(secs => _window_seconds)
      then v_now
      else private.login_rate_limits.window_started_at
    end,
    attempts = case
      when v_now >= private.login_rate_limits.window_started_at
        + make_interval(secs => _window_seconds)
      then 1
      else private.login_rate_limits.attempts + 1
    end,
    updated_at = v_now
  returning
    private.login_rate_limits.window_started_at,
    private.login_rate_limits.attempts
  into v_window_start, v_attempts;

  v_window_end := v_window_start + make_interval(secs => _window_seconds);
  v_retry := greatest(1, ceil(extract(epoch from (v_window_end - v_now)))::integer);

  allowed := v_attempts <= _max_attempts;
  retry_after_seconds := case when allowed then 0 else v_retry end;
  return next;
end;
$function$;

revoke execute on function public.check_login_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.check_login_rate_limit(text, integer, integer)
  to service_role;

create index if not exists login_rate_limits_updated_at_idx
  on private.login_rate_limits (updated_at);
