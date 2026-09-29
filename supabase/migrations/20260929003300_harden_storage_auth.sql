begin;

-- ============================================================
-- P1: STORAGE OBJECT OWNERSHIP
-- ============================================================

drop policy if exists club_documents_update on storage.objects;
drop policy if exists club_documents_update_owner_or_admin on storage.objects;

drop policy if exists club_documents_delete on storage.objects;
drop policy if exists club_documents_delete_owner_or_admin on storage.objects;

drop policy if exists club_photos_delete on storage.objects;
drop policy if exists club_photos_delete_owner_or_admin on storage.objects;

drop policy if exists club_chat_delete on storage.objects;
drop policy if exists club_chat_delete_owner_or_admin on storage.objects;


-- Documents: uploader OR club admin can update.
create policy club_documents_update_owner_or_admin
on storage.objects
for update
to authenticated
using (
  bucket_id = 'club-documents'
  and (
    owner_id = (select auth.uid())::text
    or private.is_club_admin(
      ((storage.foldername(name))[1])::uuid
    )
  )
)
with check (
  bucket_id = 'club-documents'
  and (
    owner_id = (select auth.uid())::text
    or private.is_club_admin(
      ((storage.foldername(name))[1])::uuid
    )
  )
);


-- Documents: uploader OR club admin can delete.
create policy club_documents_delete_owner_or_admin
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'club-documents'
  and (
    owner_id = (select auth.uid())::text
    or private.is_club_admin(
      ((storage.foldername(name))[1])::uuid
    )
  )
);


-- Event photos: uploader OR club admin can delete.
create policy club_photos_delete_owner_or_admin
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'club-photos'
  and (
    owner_id = (select auth.uid())::text
    or private.is_club_admin(
      ((storage.foldername(name))[1])::uuid
    )
  )
);


-- Chat attachments: uploader OR club admin can delete.
create policy club_chat_delete_owner_or_admin
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'club-chat'
  and (
    owner_id = (select auth.uid())::text
    or private.is_club_admin(
      ((storage.foldername(name))[1])::uuid
    )
  )
);

commit;