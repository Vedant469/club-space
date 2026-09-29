begin;

-- ============================================================
-- P4: REMOVE UNUSED USERNAME AVAILABILITY RPC
-- ============================================================

drop function if exists public.is_username_available(text);

commit;